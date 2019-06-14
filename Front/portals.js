const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const fetch = require("node-fetch");
const fs = require('fs-extra');
const authenBrowser = require('../keys/authenBrowser.json');
let port = 3001;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

function getInstitution(subdomain) {
	switch (subdomain) {
		case 'scc':
			return 'Sacramento Community College';
		case 'ucdavis':
			return 'University of California, Davis';
		case 'mcc':
			return 'Monroe Community College';
		default:
			return subdomain;
	}
}

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url.toLowerCase();
	
	let host = request.headers.host.toLowerCase();
	let subdomain = host.replace('.libretexts.org', '');
	let portals = await fetch('https://chem.libretexts.org/@api/deki/pages/151237/subpages?dream.out.format=json', {
		headers: {'x-deki-token': authenBrowser['chem'], 'x-requested-with': 'XMLHttpRequest'}
	});
	if (!portals.ok) {
		console.error(await portals.json());
		subdomain = false;
	}
	else {
		portals = await portals.json();
		portals = portals["page.subpage"].map(page => page.title.toLowerCase());
	}
	if (subdomain && portals.includes(subdomain.toLowerCase())) {
		console.log(subdomain);
		
		let contents = `<h1>Welcome ${getInstitution(subdomain)} to LibreTexts! This will eventually be the portal space for your institution.</h1>`;
		let importContent = await fetch(`https://chem.libretexts.org/@api/deki/pages/=Under_Construction%252FInstitution_Portals%252F${subdomain}/contents?dream.out.format=json`, {
			headers: {'x-deki-token': authenBrowser['chem'], 'x-requested-with': 'XMLHttpRequest'}
		});
		importContent = await importContent.json();
		
		response.writeHead(200);
		response.write(contents + importContent.body[0]);
		response.end();
	}
	else {
		response.writeHead(301, {'location': 'https://libretexts.org'});
		response.write(`Goodbye ${subdomain}!`);
		response.end();
	}
	
	
	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
}