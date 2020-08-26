const express = require('express');
const app = express();
const {resolve} = require('path');
const fetch = require("node-fetch");
// Copy the .env.example in the root into a .env file in this folder
require('dotenv').config({path: './.env'});
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {ClientCredentials, ResourceOwnerPassword, AuthorizationCode} = require('simple-oauth2');

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

app.get('/', (req, res) => {
	const path = resolve(process.env.STATIC_DIR + '/index.html');
	res.sendFile(path);
});

app.get('/stripeInitialize', async (req, res) => {
	res.send({
		publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
	});
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
	const {sessionId} = req.query;
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	res.send(session);
});

app.post('/create-lulu-checkout-session', async (req, res) => {
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
	})
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
				"city": "Washington",
				"country_code": "US",
				"postcode": "20540",
				"state_code": "DC",
				"street1": "101 Independence Ave SE"
			},
			"shipping_level": shippingSpeed
		})
	});
	costCalculation = await costCalculation.json();
	console.log(JSON.stringify(costCalculation, null, 2));
	
	//TODO: make lineItems dynamic
	lineItems = lineItems.map((item, index) => {
		let costCalcItem = costCalculation.line_item_costs[index];
		const discount = item.metadata.libreNet || false;
		const price = discount ? costCalcItem.total_cost_incl_tax : costCalcItem.total_cost_excl_discounts;
		console.log(price);
		return {
			price_data: {
				currency: 'usd',
				product_data: {
					name: 'CHEM 300 Beginning Chemistry',
					metadata: {
						library: item.metadata.subdomain,
						pageID: parseInt(item.metadata.id),
						hardcover: item.hardcover,
						color: item.color,
						libreNet: true,
						numPages: 589,
					},
					images: [`https://${item.metadata.subdomain}.libretexts.org/@api/deki/pages/${item.metadata.id}/files/=mindtouch.page%2523thumbnail`]
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
			},
			unit_amount:  Math.ceil(costCalculation.shipping_cost.total_cost_incl_tax * 100) //amount in cents
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
	
	res.send({
		sessionId: session.id,
	});
});

// Webhook handler for asynchronous events.
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
		// Extract the object from the event.
		data = event.data;
		eventType = event.type;
	}
	else {
		// Webhook signing is recommended, but if the secret is not configured in `config.js`,
		// retrieve the event data directly from the request body.
		data = req.body.data;
		eventType = req.body.type;
	}
	
	if (eventType === 'checkout.session.completed') {
		console.log(`🔔  Payment received!`);
	}
	
	res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));


async function LuluAPI(url, options) {
	const config = {
		client: {
			id: 'd0269cd6-e802-4f8a-905c-1204845dbb50',
			secret: '8ab040ff-97fc-4c9e-b1e8-f38bcdafa88e'
		},
		auth: {
			tokenHost: 'https://api.sandbox.lulu.com',
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