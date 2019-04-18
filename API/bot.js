const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const io = require('socket.io')(server, {path: '/bot/ws'});
const nodeStatic = require('node-static');
const staticFileServer = new nodeStatic.Server('./node_modules/socket.io-client/dist');
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
	
	if (url.startsWith('/websocketclient')) {
		staticFileServer.serveFile('./socket.io.js', 200, {}, request, response);
	}
	else if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
		responseError('Unauthorized', 401);
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

io.on('connection', function (socket) {
	console.log('an user connected');
	socket.volatile.emit('welcome', `Hello!`);
	
	socket.on('findandreplace', (data) => findAndReplace(data, socket));
});

async function findAndReplace(input, socket) {
	if (!input.root || !input.user || !input.find)
		socket.emit('Body missing parameters');
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
			socket.emit('page', `${count}/${path}`);
			
			//send update
			/*let token = LibreTexts.authenticate(input.user, subdomain);
			let url = `https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?edittime=now`;
			let response = await fetch(url, {
				method: 'POST',
				body: content,
				headers: {'x-deki-token': token}
			});
			if (response.ok) {
				let href = await response.text();
				href = href.match(/(?<=<uri.ui>).*?(?=<\/uri.ui>)/)[0];
				console.log(href);
			}
			else {
				let error = await response.text();
				// reportMessage(error, true);
			}*/
		}
	});
}

String.prototype.replaceAll = function (search, replacement) {
	const target = this;
	search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return target.replace(new RegExp(search, 'g'), replacement);
};