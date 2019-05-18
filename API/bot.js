const http = require('http');
const timestamp = require("console-timestamp");
const server = http.createServer(handler);
const io = require('socket.io')(server, {path: '/bot/ws'});
const nodeStatic = require('node-static');
const staticFileServer = new nodeStatic.Server('./BotLogs');
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
		staticFileServer.serveFile('../node_modules/socket.io-client/dist/socket.io.js', 200, {}, request, response);
	}
	else if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
		responseError('Unauthorized', 401);
	}
	else if (url.startsWith('/Logs/')) {
		request.url = request.url.replace("bot/Logs/", "");
		staticFileServer.serve(request, response, function (error, res) {
			//on error
			if (error && error.status === 404) {//404 File not Found
				staticFileServer.serveFile("../public/404.html", 404, {}, request, response);
			}
		});
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
	if (result.pages)
		delete result.pages;
	await fs.appendFile(`BotLogs/Users/${result.user}.json`, JSON.stringify(result) + '\n');
}

async function findAndReplace(input, socket) {
	if (!input.root || !input.user || !input.find) {
		socket.emit('Body missing parameters');
		return;
	}
	input.root = input.root.replace(/\/$/, "");
	console.log(`Got ${input.root}  Find:${input.find} Replace:${input.replace}`);
	input.subdomain = LibreTexts.extractSubdomain(input.root);
	input.jobType = 'findAndReplace';
	let ID = await logStart(input);
	socket.emit('setState', {state: 'starting', ID: ID});
	
	let pages = await LibreTexts.getSubpages(input.root, input.user, {delay: true, socket: socket, flat: true});
	// pages = LibreTexts.addLinks(await pages);
	// console.log(pages);
	let count = 0;
	let index = 0;
	let percentage = 0;
	let log = [];
	let backlog = [];
	let backlogClearer = setInterval(clearBacklog, 1000);
	
	function clearBacklog() {
		if (backlog.length) { //not quite working yet
			socket.emit('pages', backlog);
			backlog = [];
		}
	}
	
	await mapLimit(pages, 50, async (page) => {
		index++;
		let currentPercentage = Math.round(index / pages.length * 100);
		if (percentage < currentPercentage) {
			percentage = currentPercentage;
			socket.volatile.emit('setState', {state: 'findReplace', percentage: currentPercentage});
		}
		let path = page.replace(`https://${input.subdomain}.libretexts.org/`, '');
		if (!path)
			return false;
		let content = await LibreTexts.authenticatedFetch(path, 'contents?mode=edit', input.subdomain, input.user);
		if (!content.ok) {
			console.error("Could not get content from " + path);
			let error = await content.text();
			console.error(error);
			socket.emit('errorMessage', {
				noAlert: true,
				message: error
			});
			return false;
		}
		content = await content.text();
		content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
		content = LibreTexts.decodeHTML(content);
		// console.log(content);
		let result = content.replaceAll(input.find, input.replace, input);
		
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
			if (input.findOnly) {
				backlog.unshift({path: path, url: page});
				return;
			}
			let token = LibreTexts.authenticate(input.user, input.subdomain);
			let url = `https://${input.subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?edittime=now&dream.out.format=json&comment=[BOT ${ID}] Replaced "${input.find}" with "${input.replace}"`;
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
				backlog.unshift(item);
				log.push(item);
			}
			else {
				let error = await response.text();
				console.error(error);
				socket.emit('errorMessage', error);
			}
		}
	});
	
	clearInterval(backlogClearer);
	clearBacklog();
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
	if (!input.findOnly)
		await logCompleted(result);
	socket.emit('setState', {state: 'done', ID: input.findOnly ? null : ID});
}

async function revert(input, socket) {
	if (!input.ID || !input.user)
		socket.emit('Body missing parameters');
	console.log(`Revert ${input.ID} from ${input.user}`);
	input.jobType = 'revert';
	let ID = await logStart(input);
	socket.emit('revertID', ID);
	let count = 0;
	if (!await fs.exists(`BotLogs/Completed/${input.user}/${input.ID}.json`)) {
		socket.emit('errorMessage', `JobID ${input.ID} is not valid for user ${input.user}.`);
		console.error(`JobID ${input.ID} is not valid for user ${input.user}.`);
		return false;
	}
	let job = await fs.readJSON(`BotLogs/Completed/${input.user}/${input.ID}.json`);
	if (job.jobType === 'revert') {
		socket.emit('errorMessage', 'Cannot revert a previous Reversion event');
		return false;
	}
	
	await mapLimit(job.pages, 50, async (page) => {
		let content = await LibreTexts.authenticatedFetch(page.path, 'info?dream.out.format=json', job.subdomain, input.user);
		if (!content.ok) {
			console.error("Could not get page info from " + page.path);
			return false;
		}
		content = await content.json();
		let currentRevision = content['@revision'];
		//send update
		const live = true;
		if (!live) {
			return false;
		}
		//page.revision && currentRevision === page.revision
		if (true) { //unchanged
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

String.prototype.replaceAll = function (search, replacement, input) {
	const target = this;
	let b4 = search;
	if (input.regex) {
		return target.replace(new RegExp(search, 'g'), replacement);
	}
	search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	
	if (input.newlines) {
		search = search.replace(/\\\\n/g, "\n"); //add newlines
		if (input.isWildcard) {
			search = search.replace(/\\\?/g, "[\\s\\S]"); //wildcard single
			search = search.replace(/\\\*/g, "[\\s\\S]*?"); //wildcard multi
		}
	}
	else if (input.isWildcard) {
		search = search.replace(/\\\?/g, "."); //wildcard single
		search = search.replace(/\\\*/g, ".*?"); //wildcard multi
	}
	let temp = target.replace(new RegExp(search, 'g'), replacement);
	search = LibreTexts.encodeHTML(search);
	// console.log(b4, search);
	return temp.replace(new RegExp(search, 'g'), replacement);
};