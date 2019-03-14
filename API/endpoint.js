const http = require('http');
const timestamp = require("console-timestamp");
const filenamify = require('filenamify');
const server = http.createServer(handler);
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const fetch = require("node-fetch");
const fs = require('fs-extra');
const md5 = require('md5');
let port = 3005;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("endpoint/", "");
	url = clarifySubdomain(url);
	
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
				let requests = await authenticatedFetch(input.path, 'contents?mode=raw', 'Cross-Library', input.subdomain);
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
	else if (url.startsWith("/refreshList")) {
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
				console.log(input);
				if (input && input.identifier && input.identifier === md5(authenBrowser[input.subdomain])
					&& ['Courses', 'Bookshelves', 'home'].includes(input.path)) {
					await fs.ensureDir(`./public/DownloadsCenter/${input.subdomain}`);
					await fs.writeJSON(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`, input.content);
				}
				else {
					responseError(`Bad Request\nRejected path ${input.path}`, 400)
				}
				
				response.end();
			});
		}
		else {
			responseError(request.method + " Not Acceptable", 406)
		}
	}
	else if (url === "/subpages" && false) { // disabled
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
				
				let finalResult = await getSubpages(rootURL, username);
				console.log(`Subpages: ${rootURL}`);
				response.write(JSON.stringify(finalResult));
				response.end();
			});
		}
	}
	else if (url.startsWith("/getAuthors/")) {
		if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "GET",
				"Content-Type": " application/json",
				"Cache-Control": "public, max-age=36000",
			});
			response.end();
		}
		else if (request.method === "GET") {
			response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT",
				"Content-Type": " application/json",
				"Cache-Control": "public, max-age=36000",
			} : {"Content-Type": " application/json", "Cache-Control": "public, max-age=36000",});
			
			let subdomain = url.split('/getAuthors/')[1];
			let contents = await authenticatedFetch('Template:Custom/Views/ContentHeader/LibrarySpecific', 'contents', authen["getAuthors"], subdomain);
			if (contents.ok) {
				contents = await contents.text();
				let match = contents.match(/^var authors = {[\s\S]*?^}/m);
				if (match) {
					contents = match[0];
					contents = contents.replace('var authors = ', '');
					contents = decodeHTML(contents);
					contents = decodeHTML(contents);
					response.write(contents);
				}
			}
			response.end();
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
	let isNumber;
	if (!isNaN(path)) {
		path = parseInt(path);
		isNumber = true;
	}
	if (!username) {
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`);
	}
	if (subdomain) {
		const user = "=" + username;
		const crypto = require('crypto');
		const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
		const epoch = Math.floor(Date.now() / 1000);
		hmac.update(`${authen[subdomain].key}${epoch}${user}`);
		const hash = hmac.digest('hex');
		let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
		
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`,
			{headers: {'x-deki-token': token}});
	}
	else
		console.error(`Invalid subdomain ${subdomain}`);
}

async function getSubpages(rootURL, username) {
	let origin = rootURL.split("/")[2].split(".");
	const subdomain = origin[0];
	
	origin = rootURL.split("/").splice(0, 3).join('/');
	let path = rootURL.split('/').splice(3).join('/');
	
	let pages = await authenticatedFetch(path, 'subpages?dream.out.format=json', username, subdomain);
	pages = await pages.json();
	
	
	let info = await authenticatedFetch(path, 'info?dream.out.format=json', username, subdomain);
	info = await info.json();
	return {
		title: info.title,
		url: rootURL,
		children: await subpageCallback(pages)
	};
	
	
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
				children = await authenticatedFetch(path, 'subpages?dream.out.format=json', username, subdomain);
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
}

function clarifySubdomain(url) {
	url = decodeURIComponent(url);
	url = url.replace('https://español.libretexts.org', 'https://espanol.libretexts.org');
	return url;
}

function decodeHTML(content) {
	let ret = content.replace(/&gt;/g, '>');
	ret = ret.replace(/&lt;/g, '<');
	ret = ret.replace(/&quot;/g, '"');
	ret = ret.replace(/&apos;/g, "'");
	ret = ret.replace(/&amp;/g, '&');
	return ret;
}