const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const authen = require('./authen.json');
const fetch = require("node-fetch");
const LibreTexts = require("./reuse.js");
let port = 3006;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("bot/", "");
	url = LibreTexts.clarifySubdomain(url);
	
	if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
		responseError('Unauthorized', 401);
	}
	else if (url.startsWith("/contents")) {
		if (request.headers.host === "computer.miniland1333.com" && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT",
			});
			response.end();
		}
		else if (request.method === "PUT") {
			response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT",
				"Content-Type": "application/json",
			} : {"Content-Type": "application/json"});
			let body = [];
			request.on('data', (chunk) => {
				body.push(chunk);
			}).on('end', async () => {
				body = Buffer.concat(body).toString();
				
				let input = JSON.parse(body);
				//Only get requests are acceptable
				let requests = await LibreTexts.authenticatedFetch(input.path, 'contents?mode=raw', 'Cross-Library', input.subdomain);
				if (requests.ok)
					response.write(await requests.text());
				else
					responseError(`${requests.statusText}\n${await requests.text()}`, 400);
				
				response.end();
			});
		}
		else {
			responseError(request.method + " Not Acceptable", 406)
		}
	}
	else {
		responseError('Action not found', 400);
	}
	
	
	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
}