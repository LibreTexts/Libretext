const express = require('express');
const app = express();
const {resolve} = require('path');
const fetch = require("node-fetch");
// Copy the .env.example in the root into a .env file in this folder
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

app.get(basePath + '/', (req, res) => {
	const path = resolve(process.env.STATIC_DIR + '/index.html');
	res.sendFile(path);
});

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
		const discount = item.metadata.libreNet || true;
		const price = discount ? costCalcItem.total_cost_incl_tax : costCalcItem.total_cost_excl_discounts;
		console.log(price);
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

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));


async function LuluAPI(url, options) {
	const config = {
		client: {
			id: process.env.LULU_PUBLISHABLE_KEY,
			secret: process.env.LULU_SECRET_KEY,
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