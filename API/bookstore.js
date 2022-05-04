const express = require('express');
const app = express();
const {resolve} = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const fetch = require("node-fetch");
const readline = require('readline');
const {google} = require('googleapis');
const mailComposer = require('nodemailer/lib/mail-composer');
require('dotenv').config({path: './.env'});
const bookstoreConfig = require("./bookstoreConfig.json");
const stripe = require('stripe')(bookstoreConfig.STRIPE_SECRET_KEY);
stripe.beta = require('stripe')(bookstoreConfig.BETA.STRIPE_SECRET_KEY);
const taxMultiplier = parseFloat(bookstoreConfig.TAX_MULTIPLIER);
const {ClientCredentials} = require('simple-oauth2');
const basePath = '/bookstore';

const TOKEN_PATH = './bookstore/token.json';
let port = 3008;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
    port = parseInt(process.argv[2]);
}

app.use(express.static(bookstoreConfig.STATIC_DIR));
app.use(cors());
app.use(function (req, res, next) {
    if (req.url.includes('/beta/')) {
        console.log(req.url);
        req.url = req.url.replace('/beta/', '/');
        req.query.beta = true;
    }
    next();
})
app.use(
    express.json({
        // We need the raw body to verify webhook signatures.
        // Let's compute it only when hitting the Stripe webhook endpoint.
        verify: function (req, res, buf) {
            if (req.url.startsWith(basePath + '/publish-order')) {
                req.rawBody = buf.toString();
            }
        },
    })
);

//test html
app.get(basePath + '/', (req, res) => {
    const path = resolve(bookstoreConfig.STATIC_DIR + '/index.html');
    res.sendFile(path);
});

//send public key to client
app.get(basePath + '/stripeInitialize', async (req, res) => {
    res.send({
        publicKey: req.query.beta ? bookstoreConfig.BETA.STRIPE_PUBLISHABLE_KEY : bookstoreConfig.STRIPE_PUBLISHABLE_KEY,
    });
});

(async function updatePending() { //on reboot, check all pending orders
    let files = await fs.readdir('./bookstore/pending');
    files = files.map(item => {
        item = item.replace('.json', '');
        return updateOrder(item, true)
    });
    files = await Promise.all(files);
})()

//check and update the current order status from the Stripe and Lulu APIs
async function updateOrder(sessionId, forceUpdate = false, beta = false) {
    let result = {};
    let writePath;
    if (await fs.exists(`./bookstore/complete/${sessionId}.json`)) {
        writePath = `./bookstore/complete/${sessionId}.json`;
        result = await fs.readJSON(writePath);
    }
    else if (await fs.exists(`./bookstore/pending/${sessionId}.json`)) {
        writePath = `./bookstore/pending/${sessionId}.json`;
        result = await fs.readJSON(writePath);
        forceUpdate = true;
    }
    else return null //Not found
    
    //update Stripe information
    // const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    //update Lulu information
    if (forceUpdate) {
        if (result.luluID) { //fetch live lulu
            let luluResponse = await LuluAPI(`https://api.lulu.com/print-jobs/${result.luluID}/`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    },
                },
                result.beta || beta);
            if (luluResponse.ok) {
                luluResponse = await luluResponse.json();
                result.lulu = luluResponse;
                result.status = luluResponse.status.name;
                await fs.writeJSON(writePath, result, {spaces: '\t'});
            }
            else
                console.error(JSON.stringify(await luluResponse.json()));
        }
        
        
        //archive order if completed
        if (writePath.startsWith('./bookstore/pending') && ['SHIPPED', 'REJECTED', 'CANCELED'].includes(result.status)) {
            console.log(`[Archiving] ${sessionId}`);
            if (result.status === 'REJECTED')
                await sendRejectedEmail(result);
            else
                await sendShippingEmail(result);
            await fs.move(writePath, `./bookstore/complete/${sessionId}.json`);
        }
    }
    return result;
}

// Fetch the Checkout Session to display the JSON result on the success page
app.get(basePath + '/get-order', async (req, res) => {
    const {sessionId, forceUpdate} = req.query;
    let result = await updateOrder(sessionId, forceUpdate, req.query.beta);
    res.send(result);
});

//send LibreTexts info to Stripe and create a Stripe checkout session
app.post(basePath + '/create-lulu-checkout-session', async (req, res) => {
    const domainURL = bookstoreConfig.DOMAIN;
    const {shoppingCart, shippingSpeed, shippingLocation = 'US', shippingSurcharge = false} = req.body;
    const beta = req.query.beta;
    let totalQuantity = 0;
    const operatingCost = 0.08; // percent in decimal!!
    
    //turn items into lineItems
    let lineItems = shoppingCart;
    let costCalculation = lineItems.map((item) => {
        totalQuantity += item.quantity;
        return {
            "page_count": item.metadata.numPages,
            "pod_package_id": `0850X1100${item.color ? 'FC' : 'BW'}STD${item.hardcover ? 'CW' : 'PB'}060UW444MXX`,
            "quantity": item.quantity
        }
    });
    
    //calculate shipping cost using Lulu API
    let shipping;
    switch (shippingLocation) {
        default:
        case "US": //United States
            shipping = fetch(`https://api.lulu.com/print-shipping-options?iso_country_code=US&state_code=US-CA&quantity=${totalQuantity}&level=${shippingSpeed}&pod_package_id=0850X1100BWSTDCW060UW444MXX`, {
                headers: {
                    // 'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            });
            costCalculation = await LuluAPI('https://api.lulu.com/print-job-cost-calculations/', {
                method: 'POST',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "line_items": costCalculation,
                    "shipping_address": {
                        "city": "Davis",
                        "country_code": "US",
                        "postcode": "95616",
                        "state_code": "CA",
                        "street1": "One Shields Avenue"
                    },
                    "shipping_level": shippingSpeed
                })
            });
            break;
        case "CA": //Canada
            shipping = fetch(`https://api.lulu.com/print-shipping-options?iso_country_code=CA&quantity=${totalQuantity}&level=${shippingSpeed}&pod_package_id=0850X1100BWSTDCW060UW444MXX`, {
                headers: {
                    // 'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            });
            costCalculation = await LuluAPI('https://api.lulu.com/print-job-cost-calculations/', {
                method: 'POST',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "line_items": costCalculation,
                    "shipping_address": {
                        "city": "Athabasca",
                        "country_code": "CA",
                        "postcode": "T9S 3A3",
                        "state_code": "AB",
                        "street1": "1 University Dr, Athabasca"
                    },
                    "shipping_level": shippingSpeed
                })
            });
            break;
    }
    
    costCalculation = await costCalculation.json();
    if (beta)
        console.log(JSON.stringify(costCalculation, null, 2));
    
    //Format data for Checkout session
    let booksCost = 0;
    lineItems = lineItems.map((item, index) => {
        let costCalcItem = costCalculation.line_item_costs[index];
        const discount = false; //item.metadata.libreNet ||
        const price = (discount ? costCalcItem.total_cost_excl_tax : costCalcItem.total_cost_excl_discounts) * taxMultiplier;
        const unit_cost = Math.ceil(price * 100 / item.quantity); //amount in cents
        booksCost = (unit_cost * item.quantity);
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.metadata.title,
                    images: [`https://${item.metadata.subdomain}.libretexts.org/@api/deki/pages/${item.metadata.id}/files/=mindtouch.page%2523thumbnail`],
                    metadata: {
                        title: item.metadata.title,
                        library: item.metadata.subdomain,
                        pageID: item.metadata.id,
                        zipFilename: item.metadata.zipFilename,
                        hardcover: item.hardcover,
                        color: item.color,
                        libreNet: false,
                        numPages: item.metadata.numPages,
                    },
                },
                unit_amount: unit_cost
            },
            quantity: item.quantity,
            description: `${item.hardcover ? 'Hardcover' : 'Paperback'},  ${item.color ? 'Color' : 'Black&White'}${discount ? ',  LibreNet bulk discount on quantities >=30' : ''}`
        }
    })
    /* Process shipping */
    shipping = await (await shipping).json();
    shipping = shipping.results[0];
    lineItems.push({
        price_data: {
            currency: 'usd',
            product_data: {
                name: `Textbook Shipping [${shippingSpeed}]`,
                metadata: {shippingSpeed: shippingSpeed},
            },
            unit_amount: Math.ceil(costCalculation.shipping_cost.total_cost_excl_tax * 100 * taxMultiplier) + (shippingSurcharge ? shippingSurcharge.price * 100 : 0) //amount in cents
        },
        description: `Estimated arrival in ${shipping.total_days_min}-${shipping.total_days_max} days. ${shippingSurcharge ? `Includes ${shippingSurcharge.name} surcharge` : ''}`,
        quantity: 1,
    });
    /* Add Operating Cost */
    lineItems.push({
        price_data: {
            currency: 'usd',
            product_data: {
                name: 'Operating Cost'
            },
            unit_amount: Math.ceil(booksCost * operatingCost) // amount in cents
        },
        description: `${operatingCost * 100}%. This Operating Cost helps to offset the project's administrative overhead. Thank you for supporting LibreTexts.`,
        quantity: 1
    });

    
    // console.log(JSON.stringify(lineItems, null, 2));
    /*res.send({
        lineItems: lineItems,
    });
    return*/
    
    // Create new Checkout Session for the order
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    const session = await (beta ? stripe.beta : stripe).checkout.sessions.create({
        payment_method_types: bookstoreConfig.PAYMENT_METHODS.split(', '),
        mode: 'payment',
        line_items: lineItems,
        billing_address_collection: 'required',
        shipping_address_collection: {allowed_countries: [shippingLocation]},
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/Order_Success.html?order={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/Purchase_Canceled.html`,
        metadata: {
            sessionType: 'create-lulu-checkout-session'
        }
    });
    
    // console.log(session.id);
    res.send({ //send session.id back to the customer
        sessionId: session.id,
    });
});

/**
 * Receives orders from Stripe and then sends to Lulu
 */
app.post(basePath + '/publish-order/', async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (bookstoreConfig.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers['stripe-signature'];
        
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                req.query.beta ? bookstoreConfig.BETA.STRIPE_WEBHOOK_SECRET : bookstoreConfig.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        data = event.data
        eventType = event.type;
    }
    if (eventType && eventType === 'checkout.session.completed') {
        // console.log(`🔔  Payment received!`);
        const session = data.object;
        // console.log(session);
        
        // Fulfill the purchase...
        if (req.query.beta)
            console.log(`🔔 BETA Payment received! ${session.id}`);
        //else
        fulfillOrder(session.id, req.query.beta).then();
    }
    
    res.sendStatus(200);
});

//retries orders received from the Lulu Dashboard
app.post(basePath + '/retryOrder', express.urlencoded({ extended: true }), async (req, res) => {
    let auth = req.body.tokenField;
    if (!auth) {
        return res.sendStatus(401);
    }
    else if (auth !== bookstoreConfig.LIBRETEXTS_APU_KEY) {
        return res.sendStatus(403);
    }
    
    let orderID = req.body.orderID;
    if (!orderID) {
        return res.sendStatus(400);
    }
    
    fulfillOrder(orderID, req.query.beta).then();
    return res.sendStatus(200);
})

app.listen(port, () => console.log(`Restarted Bookstore on port ${port}`));

/**
 * Processes paid orders from Stripe to Lulu API for printing
 * @param {string} session - Stripe order session
 * @param {boolean} beta - using beta mode instead of production
 * @param {boolean} sendEmailOnly - only send receipt email
 * @returns {Promise<void>}
 */
async function fulfillOrder(session, beta = false, sendEmailOnly) { //sends live order to Lulu
    
    //sendEmailOnly is an optional luluID for resending receipts
    await fs.ensureDir('./bookstore/pending');
    await fs.ensureDir('./bookstore/complete');
    const logDestination = `./bookstore/pending/${session}.json`;
    session = await (beta ? stripe.beta : stripe).checkout.sessions.retrieve(
        session,
        {
            expand: ['line_items', 'line_items.data.price.product', 'customer'],
        }
    );
    
    // console.log("Fulfilling order", JSON.stringify(session, null, 2));
    let lineItems = session.line_items.data;
    
    //optional chaining for validity checking
    if (!lineItems?.[0]?.price?.product?.metadata?.numPages) {
        console.error(`[Invalid Lulu order] ${session.id}`);
        return;
    }
    
    let shippingSpeed = lineItems.pop();
    shippingSpeed = shippingSpeed.price.product.metadata.shippingSpeed || "MAIL";
    lineItems = lineItems.filter(item => item?.price?.product?.metadata?.pageID);
    lineItems = lineItems.map(item => {
        return {
            quantity: item.quantity,
            ...item.price.product.metadata
        }
    })
    lineItems = lineItems.map((item) => {
        const itemID = item.zipFilename || `${item.library}-${item.pageID}`;
        const line_item_PDF = `${bookstoreConfig.PDF_ROOT}/${itemID}/Publication`; //web location of PDF files
        return {
            external_id: itemID,
            title: item.title.replace(/\n/g, ' '),
            cover: `${line_item_PDF}/Cover_${item.hardcover === 'true' ? 'Casewrap' : 'PerfectBound'}.pdf`,
            interior: `${line_item_PDF}/Content.pdf`,
            pod_package_id: `0850X1100${item.color === 'true' ? 'FC' : 'BW'}STD${item.hardcover === 'true' ? 'CW' : 'PB'}060UW444MXX`,
            quantity: item.quantity,
        }
    });
    if (!sendEmailOnly)
        await fs.writeJSON(logDestination, {
            stripeID: session.id,
            luluID: null,
            beta: beta,
            status: 'VERIFIED',
            stripe: session,
            lulu: null,
        }, {spaces: '\t'});


//send request to the Lulu API
    if (session.shipping.address.country === "US") { //remove optional zip+4
        session.shipping.address.postal_code = session.shipping.address.postal_code.substring(0, 5);
    }
    
    const payload = {
        contact_email: bookstoreConfig.RECEIPT_EMAIL,
        external_id: session.id,
        production_delay: 120,
        line_items: lineItems,
        shipping_address: {
            "city": session.shipping.address.city,
            "country_code": session.shipping.address.country,
            "name": session.shipping.name?.slice(0, 35),
            // "phone_number": "844-212-0689",
            "email": session.customer.email,
            "postcode": session.shipping.address.postal_code,
            "state_code": session.shipping.address.state,
            "street1": session.shipping.address.line1?.slice(0, 30),
            "street2": session.shipping.address.line2?.slice(0, 30),
        },
        shipping_level: shippingSpeed,
    };
    
    let luluResponse;
    if (sendEmailOnly) {
        sendLuluReceiptEmail(payload, {id: sendEmailOnly});
        return;
    }
    
    luluResponse = await LuluAPI('https://api.lulu.com/print-jobs/', {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        },
        beta);
    if (luluResponse.ok) {
        luluResponse = await luluResponse.json();
        
        console.log(`[Fulfilling order] ${session.id}`);
        await fs.writeJSON(logDestination, {
            stripeID: session.id,
            luluID: luluResponse.id,
            beta: beta,
            status: luluResponse.status.name,
            stripe: session,
            lulu: luluResponse,
        }, {spaces: '\t'});
        await fs.remove(`./bookstore/completed/${session}.json`);
        
        sendLuluReceiptEmail(payload, luluResponse, beta);
    }
    else {
        try {
          luluResponse = await luluResponse.json();
          console.error(JSON.stringify(luluResponse));
          if (!luluResponse.shipping_address)
              luluResponse.shipping_address = {}
          luluResponse.shipping_address.email = session.customer.email;
          
          const result = {
              stripeID: session.id,
              luluID: luluResponse.id,
              beta: beta,
              lulu: luluResponse,
          }
          await sendRejectedEmail(result);
        } catch (e) {
          console.error(`[LULU API] INVALID RESPONSE FROM LULU. ORDER = ${payload.external_id}`);
        }
    }
}

/**
 * Helper function that authenticates REST requests to the Lulu API
 * @param {string} url
 * @param {object} options - options to be used for fetch()
 * @param {boolean} beta - using beta mode instead of production
 * @returns {Promise<*>} - Lulu fetch() response promise
 */
async function LuluAPI(url, options, beta) {
    const config = {
        client: {
            id: beta ? bookstoreConfig.BETA.LULU_PUBLISHABLE_KEY : bookstoreConfig.LULU_PUBLISHABLE_KEY,
            secret: beta ? bookstoreConfig.BETA.LULU_SECRET_KEY : bookstoreConfig.LULU_SECRET_KEY,
        },
        auth: {
            tokenHost: `https://api.${beta ? 'sandbox.' : ''}lulu.com`,
            tokenPath: '/auth/realms/glasstree/protocol/openid-connect/token'
        }
    };
    const client = new ClientCredentials(config);
    let accessToken;
    try {
        accessToken = await client.getToken();
    } catch (error) {
        console.log('Access Token error', error);
    }
    options.headers = options.headers || {};
    options.headers.Authorization = `Bearer ${accessToken.token.access_token}`;
    
    if (beta)
        url = url.replace('https://api.lulu.com', 'https://api.sandbox.lulu.com');
    return await fetch(url, options);
}

/**
 * Send emails to customers from bookstore@libretexts.org
 * @param {{shipping_level: (string|*|string), external_id: *, production_delay: number, line_items, shipping_address: {country_code, city, name: *, postcode, street1: *, street2: string | undefined, state_code, email}, contact_email: string}} payload
 * @param {object} luluResponse - Lulu fetch() response
 * @param {boolean} beta - using beta mode instead of production
 */
function sendLuluReceiptEmail(payload, luluResponse, beta = false) {
    const to = payload.shipping_address.email;
    const sub = `Thank you for your ${beta ? 'BETA ' : ''}order from the LibreTexts Bookstore!`;

// If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Load client secrets from a local file.
    fs.readFile('bookstoreConfig.json', async (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        
        if (!luluResponse?.estimated_shipping_dates?.arrival_min) {
            await sleep(600000); //10 minutes
            luluResponse = await LuluAPI(`https://api.lulu.com/print-jobs/${luluResponse.id}/`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            });
            if (luluResponse.ok) {
                luluResponse = await luluResponse.json();
            }
            else {
                console.error(await luluResponse.json());
            }
            
        }
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content).GMAIL, (auth) => {
            
            //creation of message from payload and line_items
            const message = `<h1>Thank you for your order from the LibreTexts bookstore!</h1>
<p>This email is confirmation that your payment has been approved and that the printer has received your order.</p>
<p> You can view the live status of your order on this page:
<a href="https://libretexts.org/bookstore/Order_Success.html?order=${payload.external_id}">https://libretexts.org/bookstore/Order_Success.html?order=${payload.external_id}</a></p>
<table class="items" style="width: 100%; border-spacing: 0; border-collapse: collapse;">
<thead><tr>
<th colspan="3" style="font-family: 'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif; background-color: #f8f8f8; border-radius: 0px 0px 0px 0px; border: solid 0px #eaecec; padding: 12px; color: #325f74; font-size: 18px; font-weight: bold; border-bottom: solid 2px #eaecec;">Products Ordered</th>
</tr></thead>
<tbody>
${payload.line_items.map(item => {
                const [lib, pageID] = item.external_id.split('-');
                return `<tr>
		<td>
		<img src="https://${lib}.libretexts.org/@api/deki/pages/${pageID}/files/=mindtouch.page%2523thumbnail" style="height: 150px; width: 150px; object-fit: contain"/>
		</td>
        <td>
        <p class="item-qty" style="margin-top: 0; margin-bottom: 0px;">QTY: ${item.quantity}</p>
        <h3 class="product-name-custom" style="margin-top: 0; margin-bottom: 0px; color: #0080ac; font-weight: bold;">${item.title}</h3>
        <p class="sku-custom" style="margin-top: 0; margin-bottom: 0px;"><em style="font-style: italic;">${item.external_id}</em></p>
        </td>
        <td style="text-align: right">
        <p>Shipping to <u>${payload.shipping_address.city}, ${payload.shipping_address.state_code}</u> via <i>${payload.shipping_level}</i></p>
        <p>Estimated arrival from <b>${luluResponse?.estimated_shipping_dates?.arrival_min}</b> to ${luluResponse?.estimated_shipping_dates?.arrival_max}</p>
        </td>
</tr>`
            })}
</tbody>
</table>

<br/>
<p>If you encounter any issues with your order, don't hesitate contact us at bookstore@libretexts.org.</p>
<p>Please remember to include your order identifier [${payload.external_id}].</p>
<p>Do note that orders are printed on-demand, and as such you order has already been finalized.</p>
<h3>Enjoy your purchase!</h3>
<img src="https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Bookstore/images/libretexts_section_complete_bookstore_header.png" alt="LibreTexts" class="linkIcon" title="LibreTexts Bookstore" width="350" height="124">`
            
            
            const email = new CreateMail(auth, to, sub, message);
            email.makeBody();
        });
    });
}

/**
 * Sends an error email to the customer and bookstore@libretexts.org when an error occurs
 * @param {object} payload - payload for the rejected order
 */
function sendRejectedEmail(payload) {
    const to = [payload.lulu.shipping_address.email, 'bookstore@libretexts.org'];
    const sub = `Your order from the ${payload.beta ? 'BETA ' : ''}LibreTexts Bookstore has encountered an error.`;

// If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Load client secrets from a local file.
    fs.readFile('bookstoreConfig.json', async (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content).GMAIL, (auth) => {
            
            //creation of message from payload and line_items
            const message = `<h1>Your order from the ${payload.beta ? 'BETA ' : ''} LibreTexts Bookstore has encountered an error.</h1>
<p>This email is an automated alert that your order has encountered an error.</p>
<table class="items" style="width: 100%; border-spacing: 0; border-collapse: collapse;">
<thead><tr>
<th colspan="3" style="font-family: 'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif; background-color: #f8f8f8; border-radius: 0px 0px 0px 0px; border: solid 0px #eaecec; padding: 12px; color: #325f74; font-size: 18px; font-weight: bold; border-bottom: solid 2px #eaecec;">Products Ordered</th>
</tr></thead>
<tbody>
${payload.lulu?.line_items?.map(item => {
                const [lib, pageID] = item.external_id.split('-');
                return `<tr>
		<td>
		<img src="https://${lib}.libretexts.org/@api/deki/pages/${pageID}/files/=mindtouch.page%2523thumbnail" style="height: 150px; width: 150px; object-fit: contain"/>
		</td>
        <td>
        <p class="item-qty" style="margin-top: 0; margin-bottom: 0px;">QTY: ${item.quantity}</p>
        <h3 class="product-name-custom" style="margin-top: 0; margin-bottom: 0px; color: #0080ac; font-weight: bold;">${item.title}</h3>
        <p class="sku-custom" style="margin-top: 0; margin-bottom: 0px;"><em style="font-style: italic;">${item.external_id}</em></p>
        </td>
        <td style="text-align: right">
        <p>Status:</p>
        <p>${item.status.name}</p>
        <p>${JSON.stringify(item.status.messages)}</p>
        </td>
</tr>`
            }) || "Error, cannot list items"}
</tbody>
</table>
<br/>
<p><b>This email is also being sent to bookstore@libretexts.org, who will respond to this issue as soon as possible.</b></p>
<p>${JSON.stringify(payload)}</p>
<img src="https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Bookstore/images/libretexts_section_complete_bookstore_header.png" alt="LibreTexts" class="linkIcon" title="LibreTexts Bookstore" width="350" height="124">`
            
            
            const email = new CreateMail(auth, to, sub, message);
            email.makeBody();
        });
    });
}

/**
 * Sends an email once an order reaches the SHIPPED status
 * @param {object} payload - payload for the current order
 */
function sendShippingEmail(payload) {
    const to = payload.lulu.shipping_address.email;
    const sub = 'Your order from the LibreTexts Bookstore has shipped.';

// If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Load client secrets from a local file.
    fs.readFile('bookstoreConfig.json', async (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content).GMAIL, (auth) => {
            
            //creation of message from payload and line_items
            const message = `<h1>Your order from the LibreTexts Bookstore has shipped.</h1>
<p>This email is confirmation that your order has been printed and shipped.</p>
<table class="items" style="width: 100%; border-spacing: 0; border-collapse: collapse;">
<thead><tr>
<th colspan="3" style="font-family: 'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif; background-color: #f8f8f8; border-radius: 0px 0px 0px 0px; border: solid 0px #eaecec; padding: 12px; color: #325f74; font-size: 18px; font-weight: bold; border-bottom: solid 2px #eaecec;">Products Ordered</th>
</tr></thead>
<tbody>
${payload.lulu?.line_items.map(item => {
                const [lib, pageID] = item.external_id.split('-');
                return `<tr>
		<td>
		<img src="https://${lib}.libretexts.org/@api/deki/pages/${pageID}/files/=mindtouch.page%2523thumbnail" style="height: 150px; width: 150px; object-fit: contain"/>
		</td>
        <td>
        <p class="item-qty" style="margin-top: 0; margin-bottom: 0px;">QTY: ${item.quantity}</p>
        <h3 class="product-name-custom" style="margin-top: 0; margin-bottom: 0px; color: #0080ac; font-weight: bold;">${item.title}</h3>
        <p class="sku-custom" style="margin-top: 0; margin-bottom: 0px;"><em style="font-style: italic;">${item.external_id}</em></p>
        </td>
        <td style="text-align: right">
        <p>Shipping to <u>${payload.lulu.shipping_address.city}, ${payload.lulu.shipping_address.state_code}</u> via <i>${payload.lulu.shipping_option_level}</i></p>
        <p>Estimated arrival from <b>${payload.lulu?.estimated_shipping_dates?.arrival_min}</b> to ${payload.lulu?.estimated_shipping_dates?.arrival_max}</p>
        <p>Tracking link for <a href=${item.tracking_urls?.[0]}>${item?.tracking_id}</a></p>
        </td>
</tr>`
            })}
</tbody>
</table>
<br/>
<p> You can also review the status of your order on this page:
<a href="https://libretexts.org/bookstore/Order_Success.html?order=${payload.stripeID}">https://libretexts.org/bookstore/Order_Success.html?order=${payload.stripeID}</a></p>
<br/>
<p>If you encounter any issues with your order, don't hesitate contact us at bookstore@libretexts.org.</p>
<p>Please remember to include your order identifier [${payload.stripeID}].</p>
<h3>Enjoy your purchase!</h3>
<img src="https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Bookstore/images/libretexts_section_complete_bookstore_header.png" alt="LibreTexts" class="linkIcon" title="LibreTexts Bookstore" width="350" height="124">`
            
            
            const email = new CreateMail(auth, to, sub, message);
            email.makeBody();
        });
    });
}

/**
 *
 * @param {object} credentials - OAuth secrets
 * @param {function} callback
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
    
    
    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getNewToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }
}

class CreateMail {
    constructor(auth, to, sub, body) {
        this.me = bookstoreConfig.RECEIPT_EMAIL;
        this.auth = auth;
        this.to = to;
        this.sub = sub;
        this.body = body;
        this.gmail = google.gmail({version: 'v1', auth});
        
    }
    
    //Creates the mail body and encodes it to base64 format.
    makeBody() {
        
        let mail;
        //Mail Body is created.
        mail = new mailComposer({
            to: this.to,
            from: 'LibreTexts Bookstore <bookstore@libretexts.org>',
            html: this.body,
            subject: this.sub,
            textEncoding: "base64"
        });
        
        //Compiles and encodes the mail.
        mail.compile().build((err, msg) => {
            if (err) {
                return console.log('Error compiling email ' + error);
            }
            
            const encodedMessage = Buffer.from(msg)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            
            this.sendMail(encodedMessage);
            console.log(`Sent ${this.to} ${this.sub}`);
        });
    }
    
    //Send the message to specified receiver.
    sendMail(encodedMessage) {
        this.gmail.users.messages.send({
            userId: this.me,
            resource: {
                raw: encodedMessage,
            }
        }, (err, result) => {
            if (err) {
                return console.log('NODEMAILER - The API returned an error: ' + err);
            }
            
            // console.log("NODEMAILER - Sending email reply from server:", result.data);
        });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
