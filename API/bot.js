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
fs.emptyDir('BotLogs/Working');
fs.ensureDir('BotLogs/Users');
fs.ensureDir('BotLogs/Completed');
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("bot/", "");
	url = LibreTexts.clarifySubdomain(url);
	
	if (url.startsWith('/websocketclient')) {
		//Serve client socket.io Javascript file
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

//Set up Websocket connection using Socket.io
io.on('connection', function (socket) {
	// console.log('an user connected');
	socket.volatile.emit('welcome', `Hello!`);
	
	//Define callback events;
	socket.on('findAndReplace', (data) => findAndReplace(data, socket));
	socket.on('revert', (data) => revert(data, socket));
});

async function logStart(input) {
	let timestamp = new Date();
	input.timestamp = timestamp.toUTCString();
	let ID = '' + Math.random().toString(36).substr(2, 9);
	await fs.ensureDir(`BotLogs/Working/${input.user}`);
	await fs.writeJSON(`BotLogs/Working/${input.user}/${ID}.json`, input);
	return ID;
}

async function logCompleted(result) {
	let timestamp = new Date();
	result.timestamp = timestamp.toUTCString();
	result.status = 'completed';
	await fs.ensureDir(`BotLogs/Completed/${result.user}`);
	await fs.writeJSON(`BotLogs/Completed/${result.user}/${result.ID}.json`, result);
	await fs.remove(`BotLogs/Working/${result.user}/${result.ID}.json`);
	await fs.appendFile(`BotLogs/Users/${result.user}.csv`, `${result.ID},`);
}

async function findAndReplace(input, socket) {
	if (!input.root || !input.user || !input.find)
		socket.emit('Body missing parameters');
	console.log(`Got ${input.root}  Find:${input.find} Replace:${input.replace}`);
	input.subdomain = LibreTexts.extractSubdomain(input.root);
	input.jobType = 'findAndReplace';
	let ID = await logStart(input);
	socket.emit('findReplaceID', ID);
	let pages = LibreTexts.getSubpages(input.root, input.user);
	pages = LibreTexts.addLinks(await pages);
	// console.log(pages);
	let count = 0;
	let log = [];
	
	await mapLimit(pages, 20, async (page) => {
		let path = page.replace(`https://${input.subdomain}.libretexts.org/`, '');
		let content = await LibreTexts.authenticatedFetch(path, 'contents?mode=edit', input.user, input.subdomain);
		if (!content.ok) {
			console.error("Could not get content from " + path);
			let error = await content.text();
			console.error(error);
			socket.emit('errorMessage', error);
			return false;
		}
		content = await content.text();
		content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
		content = LibreTexts.decodeHTML(content);
		// console.log(content);
		let result = content.replaceAll(input.find, input.replace);
		
		if (result !== content) {
			count++;
			/*			const diff = jsdiff.diffWords(content, result);
						console.log('----------------------------');
						diff.forEach(function (part) {
							// green for additions, red for deletions
							// grey for common parts
							var color = part.added ? 'green' :
								part.removed ? 'red' : 'grey';
							process.stderr.write(part.value[color]);
						});*/
			
			//send update
			const live = true;
			if (!live) {
				return false;
			}
			let token = LibreTexts.authenticate(input.user, input.subdomain);
			let url = `https://${input.subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?edittime=now&dream.out.format=json`;
			let response = await fetch(url, {
				method: 'POST',
				body: result,
				headers: {'x-deki-token': token}
			});
			if (response.ok) {
				let fetchResult = await response.json();
				let revision = fetchResult.page['@revision'];
				// console.log(path, revision);
				let item = {path: path, revision: revision, url: page};
				socket.emit('page', item);
				log.push(item);
			}
			else {
				let error = await response.text();
				console.error(error);
				socket.emit('errorMessage', error);
			}
		}
	});
	
	
	let result = {
		user: input.user,
		subdomain: input.subdomain,
		ID: ID,
		jobType: input.jobType,
		params: {
			root: input.root,
			find: input.find,
			replace: input.replace,
		},
		pages: log,
	};
	await logCompleted(result);
	socket.emit('findReplaceDone', ID);
	
}

async function revert(input, socket) {
	if (!input.ID || !input.user)
		socket.emit('Body missing parameters');
	console.log(`Revert ${input.ID} from ${input.user}`);
	input.jobType = 'revert';
	let ID = await logStart(input);
	socket.emit('revertID', ID);
	let count = 0;
	let job = await fs.readJSON(`BotLogs/Completed/${input.user}/${input.ID}.json`);
	if (job.jobType === 'revert') {
		socket.emit('errorMessage', 'Cannot revert a previous Reversion event');
		return false;
	}
	
	await mapLimit(job.pages, 20, async (page) => {
		let content = await LibreTexts.authenticatedFetch(page.path, 'info?dream.out.format=json', input.user, job.subdomain);
		if (!content.ok) {
			console.error("Could not get content from " + page.path);
			return false;
		}
		content = await content.json();
		let currentRevision = content['@revision'];
		//send update
		const live = true;
		if (!live) {
			return false;
		}
		if (page.revision && currentRevision === page.revision) { //unchanged
			let token = LibreTexts.authenticate(input.user, job.subdomain);
			let url = `https://${job.subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(page.path))}/revert?fromrevision=${page.revision - 1}&dream.out.format=json`;
			let response = await fetch(url, {
				method: 'POST',
				headers: {'x-deki-token': token}
			});
			if (!response.ok) {
				let error = await response.text();
				socket.emit('errorMessage', error);
			}
		}
		else { //Page Conflict
			console.error(`Page Conflict ${page.path}`);
		}
	});
	
	let timestamp = new Date();
	job.status = 'reverted';
	job.reverted = timestamp.toUTCString();
	await fs.writeJSON(`BotLogs/Completed/${input.user}/${input.ID}.json`, job);
	
	let result = {
		user: input.user,
		subdomain: job.subdomain,
		ID: ID,
		jobType: input.jobType,
		revertID: input.ID,
	};
	await logCompleted(result);
	socket.emit('revertDone', ID);
}

String.prototype.replaceAll = function (search, replacement) {
	const target = this;
	search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	search = search.replace(/\\\*/g, "."); //wildcard
	return target.replace(new RegExp(search, 'g'), replacement);
};