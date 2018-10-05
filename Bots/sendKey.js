const http = require('http');
const nodeStatic = require('node-static');
const timestamp = require("console-timestamp");
const secrets = require("./credentials.json");


const server = http.createServer(handler);
const staticFileServer = new nodeStatic.Server('./public');
server.listen(80);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;

	if (url.startsWith("/getKey")) {
		if (request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host === "computer.miniland1333.com" && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "PUT",
				});
				response.end();
			}
			else if (request.method === "GET") {
				response.writeHead(200, request.headers['host'] === "computer.miniland1333.com" ? {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});

				const user = "=hdagnew@ucdavis.edu";
				const crypto = require('crypto');
				const hmac = crypto.createHmac('sha256', secrets.chem.secret);
				const epoch = Math.floor(Date.now() / 1000);
				hmac.update(`${secrets.chem.key}${epoch}${user}`);
				const hash = hmac.digest('hex');
				const token = `${secrets.chem.key}_${epoch}_${user}_${hash}`;
				response.write(token);
				response.end();
			}
			else {
				responseError(406, request.method + " Not Acceptable")
			}
		}
		else {
			responseError(403, "CORS Error " + request.headers.origin);
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