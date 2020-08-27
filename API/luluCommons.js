const fetch = require("node-fetch");
const fs = require('fs-extra');
const {ClientCredentials, ResourceOwnerPassword, AuthorizationCode} = require('simple-oauth2');

// Set your secret key. Remember to switch to your live secret key in production!
require('dotenv').config({path: './.env'});
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Using Express
const app = require('express')();

// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require('body-parser');
fulfillOrder();
async function fulfillOrder(session = 'cs_test_ufiO6xaLMnmHA92erqThdYZoPjOa9TSwO6Vctio95UT6TkNbkUupts5v') {
	await fs.ensureDir('./bookstore/pending');
	await fs.ensureDir('./bookstore/complete');
	session = await stripe.checkout.sessions.retrieve(
		session,
		{
			expand: ['line_items', 'line_items.data.price.product', 'customer'],
		}
	);
	
	
	// TODO: fill me in
	// console.log("Fulfilling order", JSON.stringify(session, null, 2));
	let lineItems = session.line_items.data;
	let shippingSpeed = lineItems.pop();
	shippingSpeed = shippingSpeed.shippingSpeed || "MAIL";
	lineItems = lineItems.map(item=>{
		return {
			quantity: item.quantity,
			...item.price.product.metadata
		}
	})
	lineItems = lineItems.map((item) => {
		const line_item_PDF = `${process.env.PDF_ROOT}/${item.library}-${item.pageID}/Publication`; //web location of PDF files
		return {
			external_id: `${item.library}-${item.pageID}`,
			title: item.title.replace(/\n/g,' '),
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
		status: 'VERIFICATION'
	}, {spaces: '\t'});
	await fs.writeJSON(`lineItems.json`, lineItems, {spaces: '\t'});
	
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

app.post('/fullfillOrder', bodyParser.raw({type: 'application/json'}), (request, response) => {
	const payload = request.body;
	const sig = request.headers['stripe-signature'];
	
	let event;
	
	try {
		event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
	} catch (err) {
		return response.status(400).send(`Webhook Error: ${err.message}`);
	}
	
	// Handle the checkout.session.completed event
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		
		// Fulfill the purchase...
		fulfillOrder(session).then();
	}
	
	response.status(200);
});

app.listen(5000, () => console.log('Running on port 5000'));


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