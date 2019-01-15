const http = require('http');
const timestamp = require("console-timestamp");
const filenamify = require('filenamify');
const server = http.createServer(handler);
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const fetch = require("node-fetch");
let port = 3005;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));
console.log(now1.toString());

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("endpoint/", "");

	if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
		responseError('Unauthorized', 401);
	}
	else if (url.startsWith("/getKey")) {
		if (request.headers.host === "computer.miniland1333.com" && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "GET",
			});
			response.end();
		}
		else if (request.method === "GET") {
			response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "GET",
				"Content-Type": "application/json",
			} : {"Content-Type": "application/json"});
			response.write(JSON.stringify(authenBrowser));
			response.end();
		}
		else {
			responseError(request.method + " Not Acceptable", 406)
		}
	}
	else if (url.startsWith("/redirect")) {
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
				let requests = await authenticatedFetch(input.path, input.api, input.username, input.subdomain);
				response.write(await requests.text());

				response.end();
			});
		}
		else {
			responseError(request.method + " Not Acceptable", 406)
		}
	}
	else if (url === "/subpages" && false) { //DISABLED
		if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT",
				"Content-Type": " application/json",
			});
			response.end();
		}
		else if (request.method === "PUT") {
			response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT",
				"Content-Type": " application/json",
			} : {"Content-Type": " application/json"});
			let body = [];
			request.on('data', (chunk) => {
				body.push(chunk);
			}).on('end', async () => {
				body = Buffer.concat(body).toString();

				let input = JSON.parse(body);
				const username = input.username;
				const rootURL = input.root;
				let origin = rootURL.split("/")[2].split(".");
				const subdomain = origin[0];

				origin = rootURL.split("/").splice(0, 3).join('/');
				let path = rootURL.split('/').splice(3).join('/');
				let pages = await authenticatedFetch(path, 'subpages', username, subdomain);
				pages = await pages.json();


				let info = await authenticatedFetch(path, 'info', username, subdomain);
				info = await info.json();
				let finalResult = {
					title: info.title,
					url: rootURL,
					children: await subpageCallback(pages)
				};
				console.log(`Subpages: ${rootURL}`);
				response.write(JSON.stringify(finalResult));
				response.end();

				async function subpageCallback(info) {
					const subpageArray = info["page.subpage"];
					const result = [];
					const promiseArray = [];

					async function subpage(subpage, index) {
						let url = subpage["uri.ui"];
						let path = subpage.path["#text"];
						const hasChildren = subpage["@subpages"] === "true";
						let children = hasChildren ? undefined : [];
						if (hasChildren) { //recurse down
							children = await authenticatedFetch(path, 'subpages', username, subdomain);
							children = await children.json();
							children = await subpageCallback(children, false);
						}
						result[index] = {
							title: subpage.title,
							url: url,
							children: children,
							id: subpage['@id'],
							relativePath: url.replace(rootURL, '')
						};
					}

					if (subpageArray && subpageArray.length) {
						for (let i = 0; i < subpageArray.length; i++) {
							promiseArray[i] = subpage(subpageArray[i], i);
						}

						await Promise.all(promiseArray);
						return result;
					}
					else {
						return [];
					}
				}
			});
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


async function authenticatedFetch(path, api, username, subdomain) {
	const user = "=" + username;
	const crypto = require('crypto');
	const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
	const epoch = Math.floor(Date.now() / 1000);
	hmac.update(`${authen[subdomain].key}${epoch}${user}`);
	const hash = hmac.digest('hex');
	let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
	if (subdomain)
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/${api}`,
			{headers: {'x-deki-token': token}});
	else
		console.error(`Invalid subdomain ${subdomain}`);
}