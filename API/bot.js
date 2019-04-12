const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const fs = require('fs-extra');
const authen = require('./authen.json');
const fetch = require("node-fetch");
const jsdiff = require('diff');
require('colors');
const util = require('util');
const mapLimit = util.promisify(require("async/mapLimit"));
const LibreTexts = require("./reuse.js");
let port = 3006;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));
fs.ensureDir('BotLogs');

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("bot/", "");
	url = LibreTexts.clarifySubdomain(url);
	
	if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
		responseError('Unauthorized', 401);
	}
	else if (url.startsWith("/findandreplace")) {
		if (request.headers.host === "computer.miniland1333.com" && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "POST",
			});
			response.end();
		}
		else if (request.method === "POST") {
			response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "POST",
				"Content-Type": "application/json",
			} : {"Content-Type": "application/json"});
			let body = [];
			request.on('data', (chunk) => {
				body.push(chunk);
			}).on('end', async () => {
				body = Buffer.concat(body).toString();
				
				let input = JSON.parse(body);
				if (!input.root || !input.user)
					responseError(400, 'Body missing parameters');
				console.log(`Got ${input.root}`);
				let pages = LibreTexts.getSubpages(input.root, input.user);
				await fs.ensureDir(`BotLogs/${input.user}`);
				pages = LibreTexts.addLinks(await pages);
				// console.log(pages);
				let count = 0;
				
				await mapLimit(pages, 10, async (page) => {
					let subdomain = LibreTexts.extractSubdomain(page);
					let path = page.replace(`https://${subdomain}.libretexts.org/`, '');
					let content = await LibreTexts.authenticatedFetch(path, 'contents?mode=raw', input.user, subdomain);
					if (!content.ok) {
						console.error("Could not get content from " + path);
					}
					content = await content.text();
					content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
					content = LibreTexts.decodeHTML(content);
					let result = content.replaceAll(input.find, input.replace);
					if (result !== content) {
						count++;
						const diff = jsdiff.diffWords(content, result);
						console.log('----------------------------');
						diff.forEach(function (part) {
							// green for additions, red for deletions
							// grey for common parts
							var color = part.added ? 'green' :
								part.removed ? 'red' : 'grey';
							process.stderr.write(part.value[color]);
						});
					}
				});
				
				
				response.write(JSON.stringify(pages));
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

String.prototype.replaceAll = function (search, replacement) {
	const target = this;
	search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return target.replace(new RegExp(search, 'g'), replacement);
};