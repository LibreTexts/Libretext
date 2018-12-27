const http = require('http');
const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const server = http.createServer(handler);
let port = 3004;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));
console.log(now1.toString());
const fetch = require("node-fetch");

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("analytics/", "");

	if (url.startsWith("/receive")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "PUT",
					"Content-Type": " text/plain",
				});
				response.end();
			}
			else if (request.method === "PUT") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "PUT",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body).toString();
					console.log(body);
					try {
						let date = new Date();
						let event = JSON.parse(body);
						await fs.ensureDir(`./analyticsData/${date.getMonth()+1}-${date.getFullYear()}`);
						await fs.appendFile(`./analyticsData/${date.getMonth()+1}-${date.getFullYear()}/${event.username}.txt`, body + "\n");
					} catch (e) {
						console.error(e)
					}
					response.end();
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
		}
	}
	else if (url.startsWith("/ping")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": " text/plain",
				});
				response.end();
			}
			else if (request.method === "GET") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});
				response.end();
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
		}
	}

	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
}