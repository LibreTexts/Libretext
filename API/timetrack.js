const http = require('http');
const nodeStatic = require('node-static');
const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const server = http.createServer(handler);
const staticFileServer = new nodeStatic.Server('./public');
server.listen(80);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));
const fetch = require("node-fetch");

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;

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
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', () => {
					body = Buffer.concat(body).toString();
					console.log(body);
					try {
						let event = JSON.parse(body);

						if (event.messageType === "Activity") {
							if (event.editorOpen) {

							}
							else {

							}
						}
						else {

						}
					} catch (e) {

					}


					response.end();
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
		}
	}

	else { //static server
		console.log(url);
		staticFileServer.serve(request, response, function (error, res) {
			//on error
			if (error) {//404 File not Found
				if (error.status === 404)
					staticFileServer.serveFile("404.html", 404, {}, request, response);
				else
					console.error(error);
			}
		});
	}

	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
}