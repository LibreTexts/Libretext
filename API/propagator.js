const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const fetch = require("node-fetch");
const LibreTexts = require("./reuse.js");
let port = 3002;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("propagator/", "");
	url = LibreTexts.clarifySubdomain(url);
	
	if (url.startsWith("/receive")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "PUT",
					"Content-Type": " text/plain",
				});
				response.end();
			}
			else if (request.method === "PUT") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "PUT",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body).toString();
					console.log(body);
					
					let input = JSON.parse(body);
					let {username, url} = input;
					const Ssubdomain = url.split("/")[2].split(".")[0];
					let path = url.split("/").slice(3).join("/");
					let {content, tags, properties} = await getContent();
					
					let otherArray = Object.values(LibreTexts.libraries);
					otherArray.splice(otherArray.indexOf(Ssubdomain), 1);
					
					//Propagate
					let promiseArray = [];
					for (let i = 0; i < otherArray.length; i++) {
						promiseArray.push(propagatePage(otherArray[i], path));
					}
					
					let values = await Promise.all(promiseArray);
					
					response.write(JSON.stringify(values));
					console.log(values);
					response.end();
					
					async function getContent() {
						const token = LibreTexts.authenticate(username, Ssubdomain);
						let content = await fetch(`https://${Ssubdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?mode=raw`,
							{headers: {'x-deki-token': token}});
						if (!content.ok) {
							throw "Could not get content from https://" + Ssubdomain + ".libretexts.org" + path;
						}
						content = await content.text();
						content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
						
						//get tags and properties
						let response = await fetch(`https://${Ssubdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/tags`,
							{headers: {'x-deki-token': token}});
						let tags = await response.text();
						response = await fetch(`https://${Ssubdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/properties?dream.out.format=json`,
							{headers: {'x-deki-token': token}});
						let properties = await response.json();
						return {content: decodeHTML(content), tags: tags, properties: parseProperties(properties)};
						
						function decodeHTML(content) {
							let ret = content.replace(/&gt;/g, '>');
							ret = ret.replace(/&lt;/g, '<');
							ret = ret.replace(/&quot;/g, '"');
							ret = ret.replace(/&apos;/g, "'");
							ret = ret.replace(/&amp;/g, '&');
							return ret;
						}
						
						function parseProperties(properties) {
							if (properties["@count"] !== "0") {
								if (properties.property) {
									if (properties.property.length) {
										properties = properties.property.map((property) => {
											return {name: property["@name"], value: property["contents"]["#text"]}
										});
									}
									else {
										properties = [{
											name: properties.property["@name"],
											value: properties.property["contents"]["#text"]
										}];
									}
								}
							}
							return properties
						}
					}
					
					async function propagatePage(subdomain, path) {
						const token = LibreTexts.authenticate(username, subdomain);
						let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?edittime=now`, {
							method: "POST",
							body: content,
							headers: {'x-deki-token': token}
						});
						
						if (response.ok) {
							//handle tags and properties
							for (let i = 0; i < properties.length; i++) {
								fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/properties?abort=never`, {
									method: "POST",
									body: properties[i].value,
									headers: {"Slug": properties[i].name, 'x-deki-token': token}
								}).then();
							}
							await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/tags`, {
								method: "PUT",
								body: tags,
								headers: {"Content-Type": "text/xml; charset=utf-8", 'x-deki-token': token},
							});
							return true;
						}
						else {
							return await response.text();
						}
					}
				});
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