const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const fetch = require("node-fetch");
const fs = require('fs-extra');
let port = 3001;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url.toLowerCase();
	
	let host= request.headers.host.toLowerCase();
	let subdomain = host.replace('.libretexts.org','');
	if (subdomain && ['scc','ucdavis'].includes(subdomain)) {
		console.log(subdomain);
		response.writeHead(200);
		response.write(`Welcome to ${subdomain}!`);
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