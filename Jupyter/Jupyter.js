const http = require('http');
const nodeStatic = require('node-static');
const fs = require('fs');
const filenamify = require('filenamify');
const {performance} = require('perf_hooks');
const timestamp = require("console-timestamp");
const zipLocal = require('zip-local');
const mkdirp = require('mkdirp');
const copyDir = require('copy-dir');
const md5 = require('md5');


const server = http.createServer(handler);
const staticFileServer = new nodeStatic.Server('./public');
server.listen(80);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;

	if (url.startsWith("/url=")) {
		if (request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host === "home.miniland1333.com" && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin,
					"Access-Control-Allow-Methods": "PUT",
				});
				response.end();
			}
			else if (request.method === "PUT") {
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', () => {
					body = Buffer.concat(body).toString();
					const contents = JSON.parse(body);
					const repoName = md5(url);

					copyDir.sync('./.git/', "./public/" + repoName + "/.git/");


					response.writeHead(200, request.headers['host'] === "home.miniland1333.com" ? {
						"Access-Control-Allow-Origin": request.headers.origin,
						"Access-Control-Allow-Methods": "PUT",
						"Content-Type": " text/plain",
					} : {"Content-Type": " text/plain"});
					response.write(repoName);
					response.end();
				});
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