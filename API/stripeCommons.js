const express = require('express');
const app = express();
const {resolve} = require('path');
// Copy the .env.example in the root into a .env file in this folder
require('dotenv').config({path: './.env'});
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

app.get('/config', async (req, res) => {
	const price = await stripe.prices.retrieve(process.env.PRICE);
	
	res.send({
		publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
		unitAmount: price.unit_amount,
		currency: price.currency,
	});
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
	const {sessionId} = req.query;
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	res.send(session);
});

app.post('/create-checkout-session', async (req, res) => {
	const domainURL = process.env.DOMAIN;
	
	const {quantity, locale} = req.body;
	// Create new Checkout Session for the order
	// Other optional params include:
	// [billing_address_collection] - to display billing address details on the page
	// [customer] - if you have an existing Stripe Customer ID
	// [customer_email] - lets you prefill the email input in the Checkout page
	// For full details see https://stripe.com/docs/api/checkout/sessions/create
	const session = await stripe.checkout.sessions.create({
		payment_method_types: process.env.PAYMENT_METHODS.split(', '),
		mode: 'payment',
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: 'CHEM 300 Beginning Chemistry',
						metadata: {
							library: 'chem',
							pageID: 8787,
							hardcover: true,
							color: true,
							libreNet: true,
							numPages: 589,
						},
						images: ['https://chem.libretexts.org/@api/deki/pages/8787/files/=mindtouch.page%2523thumbnail']
					},
					unit_amount: 1936
				},
				quantity: quantity,
				description: 'Paperback,  Black&White'
			},
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: 'Textbook Shipping [Standard Mail]. Estimated arrival in 12-15 days',
					},
					unit_amount: 400
				},
				quantity: 1,
			},
		],
		shipping_address_collection: {allowed_countries:['US']},
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
