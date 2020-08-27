const express = require('express');
const app = express();
const {resolve} = require('path');
const fs = require('fs-extra');
const fetch = require("node-fetch");
require('dotenv').config({path: './.env'});
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {ClientCredentials} = require('simple-oauth2');
const basePath = '';

// const basePath = '/bookstore';

app.use(express.static(process.env.STATIC_DIR));
app.use(
	express.json({
		// We need the raw body to verify webhook signatures.
		// Let's compute it only when hitting the Stripe webhook endpoint.
		verify: function (req, res, buf) {
			if (req.originalUrl.startsWith('/webhook')) {
				req.rawBody = buf.toString();
			}
		},
	})
);

//test html
app.get(basePath + '/', (req, res) => {
	const path = resolve(process.env.STATIC_DIR + '/index.html');
	res.sendFile(path);
});

//send public key to client
app.get(basePath + '/stripeInitialize', async (req, res) => {
	res.send({
		publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
	});
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get(basePath + '/checkout-session', async (req, res) => {
	const {sessionId} = req.query;
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	res.send(session);
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get(basePath + '/get-order', async (req, res) => {
	const {sessionId} = req.query;
	let result = {}
	if (await fs.exists(`./bookstore/pending/${sessionId}.json`))
		result = {
			sessionId: sessionId,
			...(await fs.readJSON(`./bookstore/pending/${sessionId}.json`))
		}
	else if (await fs.exists(`./bookstore/complete/${sessionId}.json`))
		result = {
			sessionId: sessionId,
			...(await fs.readJSON(`./bookstore/complete/${sessionId}.json`))
		}
	res.send(result);
});

//send LibreTexts info to Stripe
app.post(basePath + '/create-lulu-checkout-session', async (req, res) => {
	const domainURL = process.env.DOMAIN;
	const {shoppingCart, shippingSpeed} = req.body;
	let totalQuantity = 0;
	
	//turn items into lineItems
	console.log('Hello!');
	let lineItems = shoppingCart;
	let costCalculation = lineItems.map((item) => {
		totalQuantity += item.quantity;
		return {
			"page_count": item.metadata.numPages,
			"pod_package_id": `0850X1100${item.color ? 'FC' : 'BW'}STD${item.hardcover ? 'CW' : 'PB'}060UW444MXX`,
			"quantity": item.quantity
		}
	});
	let shipping = fetch(`https://api.lulu.com/print-shipping-options?iso_country_code=US&state_code=US-CA&quantity=${totalQuantity}&level=${shippingSpeed}&pod_package_id=0850X1100BWSTDCW060UW444MXX`, {
		headers: {
			// 'Cache-Control': 'no-cache',
			'Content-Type': 'application/json'
		}
	});
	costCalculation = await LuluAPI('https://api.sandbox.lulu.com/print-job-cost-calculations/', {
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
	costCalculation = await costCalculation.json();
	// console.log(JSON.stringify(costCalculation, null, 2));
	
	lineItems = lineItems.map((item, index) => {
		let costCalcItem = costCalculation.line_item_costs[index];
		const discount = item.metadata.libreNet || true;
		const price = discount ? costCalcItem.total_cost_incl_tax : costCalcItem.total_cost_excl_discounts;
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
						hardcover: item.hardcover,
						color: item.color,
						libreNet: true,
						numPages: item.metadata.numPages,
					},
				},
				unit_amount: Math.ceil(price * 100 / item.quantity) //amount in cents
			},
			quantity: item.quantity,
			description: `${item.hardcover ? 'Hardcover' : 'Paperback'},  ${item.color ? 'Color' : 'Black&White'}${discount ? ',  LibreNet bulk discount on quantities >=30' : ''}`
		}
	})
	
	//process shipping
	shipping = await (await shipping).json();
	shipping = shipping.results[0];
	lineItems.push({
		price_data: {
			currency: 'usd',
			product_data: {
				name: `Textbook Shipping [${shippingSpeed}]`,
				metadata: {shippingSpeed: shippingSpeed},
			},
			unit_amount: Math.ceil(costCalculation.shipping_cost.total_cost_incl_tax * 100) //amount in cents
		},
		description: `Estimated arrival in ${shipping.total_days_min}-${shipping.total_days_max} days`,
		quantity: 1,
	});
	console.log(JSON.stringify(lineItems, null, 2));
	/*res.send({
		lineItems: lineItems,
	});
	return*/
	
	// Create new Checkout Session for the order
	// Other optional params include:
	// [billing_address_collection] - to display billing address details on the page
	// [customer] - if you have an existing Stripe Customer ID
	// [customer_email] - lets you prefill the email input in the Checkout page
	// For full details see https://stripe.com/docs/api/checkout/sessions/create
	const session = await stripe.checkout.sessions.create({
		payment_method_types: process.env.PAYMENT_METHODS.split(', '),
		mode: 'payment',
		line_items: lineItems,
		shipping_address_collection: {allowed_countries: ['US']},
		// ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
		success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${domainURL}/canceled.html`,
	});
	console.log(session.id);
	res.send({
		sessionId: session.id,
	});
});

app.post('/webhook', async (req, res) => {
	let data;
	let eventType;
	// Check if webhook signing is configured.
	if (process.env.STRIPE_WEBHOOK_SECRET) {
		// Retrieve the event by verifying the signature using the raw body and secret.
		let event;
		let signature = req.headers['stripe-signature'];
		
		try {
			event = stripe.webhooks.constructEvent(
				req.rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET
			);
		} catch (err) {
			console.log(`⚠️  Webhook signature verification failed.`);
			return res.sendStatus(400);
		}
		data = event.data
		eventType = event.type;
	}
	if (eventType && eventType === 'checkout.session.completed') {
		console.log(`🔔  Payment received!`);
		const session = data.object;
		// console.log(session);
		
		// Fulfill the purchase...
		fulfillOrder(session).then();
		
		async function fulfillOrder(session) {
			await fs.ensureDir('./bookstore/pending');
			await fs.ensureDir('./bookstore/complete');
			session = await stripe.checkout.sessions.retrieve(
				session.id,
				{
					expand: ['line_items', 'line_items.data.price.product', 'customer'],
				}
			);
			
			// console.log("Fulfilling order", JSON.stringify(session, null, 2));
			let lineItems = session.line_items.data;
			let shippingSpeed = lineItems.pop();
			shippingSpeed = shippingSpeed.shippingSpeed || "MAIL";
			lineItems = lineItems.map(item => {
				return {
					quantity: item.quantity,
					...item.price.product.metadata
				}
			})
			lineItems = lineItems.map((item) => {
				const line_item_PDF = `${process.env.PDF_ROOT}/${item.library}-${item.pageID}/Publication`; //web location of PDF files
				return {
					external_id: `${item.library}-${item.pageID}`,
					title: item.title.replace(/\n/g, ' '),
					cover: `${line_item_PDF}/Cover_${item.hardcover === 'true' ? 'Casewrap' : 'PerfectBound'}.pdf`,
					interior: `${line_item_PDF}/Content.pdf`,
					pod_package_id: `0850X1100${item.color === 'true' ? 'FC' : 'BW'}STD${item.hardcover === 'true' ? 'CW' : 'PB'}060UW444MXX`,
					page_count: parseInt(item.numPages),
					quantity: item.quantity,
				}
			});
			await fs.writeJSON(`./bookstore/pending/${session.id}.json`, {
				stripe: session,
				lulu: null,
				status: 'VERIFIED'
			}, {spaces: '\t'});
			
			//send request to the Lulu API
			const payload = {
				contact_email: process.env.DEVELOPER_EMAIL,
				external_id: session.id,
				production_delay: 120,
				line_items: lineItems,
				shipping_address: {
					"city": session.shipping.address.city,
					"country_code": session.shipping.address.country,
					"name": session.shipping.name,
					// "phone_number": "844-212-0689",
					"email": session.customer.email,
					"postcode": session.shipping.address.postal_code,
					"state_code": session.shipping.address.state,
					"street1": session.shipping.address.line1,
					"street2": session.shipping.address.line2,
				},
				shipping_level: shippingSpeed,
			}
			let response = await LuluAPI('https://api.sandbox.lulu.com/print-jobs/', {
				method: 'POST',
				headers: {
					'Cache-Control': 'no-cache',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			response = await response.json();
			console.log("Fulfilling order", JSON.stringify(response, null, 2));
			await fs.writeJSON(`./bookstore/pending/lulu.json`, {
				stripe: session,
				lulu: response,
				status: response.status.name
			}, {spaces: '\t'});
		}
	}
	
	res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));


async function LuluAPI(url, options) {
	const config = {
		client: {
			id: process.env.LULU_PUBLISHABLE_KEY,
			secret: process.env.LULU_SECRET_KEY,
		},
		auth: {
			tokenHost: 'https://api.sandbox.lulu.com', //TODO: Change to production!
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
	return await fetch(url, options);
}