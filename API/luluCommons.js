const fetch = require("node-fetch");
const {ClientCredentials, ResourceOwnerPassword, AuthorizationCode} = require('simple-oauth2');


(async () => {
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
	// for (let i = 100; i < 400; i+=100) {
	const numpages = 456;
	let response = await fetch('https://api.sandbox.lulu.com/print-job-cost-calculations/', {
		method: 'POST',
		headers: {
			'Cache-Control': 'no-cache',
			'Authorization': `Bearer ${accessToken.token.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"line_items": [
				{
					"page_count": numpages,
					"pod_package_id": "0850X1100BWSTDPB060UW444MXX",
					"quantity": 30
				}
			],
			"shipping_address": {
				"city": "Washington",
				"country_code": "US",
				"postcode": "20540",
				"state_code": "DC",
				"street1": "101 Independence Ave SE"
			},
			"shipping_level": "MAIL"
		})
	});
	response = await response.json();
	console.log(JSON.stringify(response,null,2));
	
	// response = response.line_item_costs.map(item=>item.cost_excl_discounts);
	// console.log(response);
	// }
	
	let shipping = await fetch('https://api.lulu.com/print-shipping-options?iso_country_code=US&state_code=US-CA&quantity=1&pod_package_id=0850X1100BWSTDCW060UW444MXX',{headers: {
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/json'
		}});
	shipping = await shipping.json()
	console.log(JSON.stringify(shipping,null,2));
})()
