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

function getConfig(contents) {
	let config = contents.match(/(?<=var configObject = ){[\S\s]*?}(?=;)/);
	if (!config)
		return {};
	config = config[0];
	config = decodeHTML(config);
	config = config.replace(/\\/g, "\\\\");
	config = config.replace(/\\"/g, "\"");
	try{
		config = JSON.parse(config)
	}catch (e) {
		return {}
	}
	return config;
}

function decodeHTML(content) {
	let ret = content.replace(/&gt;/g, '>');
	ret = ret.replace(/&lt;/g, '<');
	ret = ret.replace(/&quot;/g, '"');
	ret = ret.replace(/&apos;/g, "'");
	ret = ret.replace(/&amp;/g, '&');
	return ret;
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
		
		let contents = await fetch(`https://chem.libretexts.org/@api/deki/pages/=Under_Construction%252FInstitution_Portals%252F${subdomain}/contents?dream.out.format=json`, {
			headers: {'x-deki-token': authenBrowser['chem'], 'x-requested-with': 'XMLHttpRequest'}
		});
		contents = await contents.json();
		contents = contents.body[0];
		
		let configObject = getConfig(contents);
		
		contents = `<title>${configObject.thinName || subdomain} Portal</title><h1>Welcome ${configObject.fullName || subdomain} to LibreTexts! This will eventually be the portal space for your institution.</h1>${contents}`;
		
		response.writeHead(200);
		response.write(contents);
		response.end();
	}
	else {
		response.writeHead(301, {'location': 'https://libretexts.org'});
		response.write(`Goodbye ${subdomain}!`);
		response.end();
	}
	
	
	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status || 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message || url)));
		response.end();
	}
}