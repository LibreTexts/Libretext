const http = require('http');
const timestamp = require('console-timestamp');
const server = http.createServer(handler);
const io = require('socket.io')(server, {path: '/bot/ws'});
const cheerio = require('cheerio');
const nodeStatic = require('serve-static');
const finalhandler = require('finalhandler');
const fs = require('fs-extra');
const fetch = require('node-fetch');
const jsdiff = require('diff');
require('colors');
const async = require('async');
const LibreTexts = require('./reuse.js');
const tidy = require("tidy-html5").tidy_html5;
let port = 3006;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
fs.emptyDir('BotLogs/Working');
fs.ensureDir('BotLogs/Users');
fs.ensureDir('BotLogs/Completed');
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

async function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace('bot/', '');
	url = LibreTexts.clarifySubdomain(url);
	
	if (url.startsWith('/websocketclient')) {
		//Serve client socket.io Javascript file
		const staticFileServer = nodeStatic('node_modules/socket.io-client/dist', {fallthrough: false});
		request.url = 'socket.io.js';
		staticFileServer(request, response, finalhandler(request, response));
		} else if (!request.headers.origin || !request.headers.origin.endsWith('libretexts.org')) {
			responseError('Unauthorized', 401);
	}
	else if (url.startsWith('/Logs/')) {
		const staticFileServer = nodeStatic('BotLogs', {fallthrough: false});
		request.url = request.url.replace('Logs/', '');
		staticFileServer(request, response, finalhandler(request, response));
	}
	else {
		responseError('Action not found', 400);
	}
	
	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {'Content-Type': 'text/html'});
		response.write(('Bad Request\n' + (message ? message : url)));
		response.end();
	}
}

//Set up Websocket connection using Socket.io
io.on('connection', function (socket) {
	// console.log('an user connected');
	socket.emit('welcome', `Hello!`);
	
	//Define callback events;
	socket.on('findReplace', (data) => jobHandler('findReplace', data, socket));
	socket.on('deadLinks', (data) => jobHandler('deadLinks', data, socket));
	socket.on('headerFix', (data) => jobHandler('headerFix', data, socket));
	socket.on('foreignImage', (data) => jobHandler('foreignImage', data, socket));
	socket.on('convertContainers', (data) => jobHandler('convertContainers', data, socket));
	socket.on('multipreset', (data) => jobHandler('multipreset', data, socket));
	
	socket.on('revert', (data) => revert(data, socket));
});

async function jobHandler(jobType, input, socket) {
	function verifyParameters() {
		switch (jobType) {
			case 'findReplace':
				return input.root && input.user && input.find;
			case 'deadLinks':
			case 'headerFix':
			case 'foreignImage':
			case 'convertContainers':
				return input.root;
			case 'multipreset':
				return input.root && input.multi;
		}
	}
	
	function getParameters() {
		switch (jobType) {
			case 'findReplace':
				return {root: input.root, user: input.user, find: input.find};
			case 'deadLinks':
			case 'headerFix':
			case 'foreignImage':
			case 'convertContainers':
				return {root: input.root};
			case 'multipreset':
				return {root: input.root, multi: input.multi};
		}
	}
	
	function parallelCount() {
		switch (jobType) {
			case 'foreignImage':
				return 2;
			case 'findReplace':
			case 'deadLinks':
			case 'headerFix':
			case 'convertContainers':
			case 'multipreset':
				return 5;
		}
	}
	
	if (!verifyParameters()) {
		socket.emit('Body missing parameters');
		return;
	}
	input.root = input.root.replace(/\/$/, '');
	input.subdomain = LibreTexts.extractSubdomain(input.root);
	input.jobType = jobType;
	let ID = await logStart(input, input.findOnly);
	socket.emit('setState', {state: 'starting', ID: ID});
	console.log(`JOB [${ID}](${input.user}) ${jobType} ${jobType === 'findReplace' ? input.find : ''}`);
	
	let pages = await LibreTexts.getSubpages(input.root, input.user, {delay: true, socket: socket, flat: true});
	// pages = LibreTexts.addLinks(await pages);
	// console.log(pages);
	let index = 0;
	let percentage = 0;
	let log = [];
	let backlog = [];
	let pageSummaryCount = 0;
	let backlogClearer = setInterval(clearBacklog, 1000);
	let result = {
		user: input.user,
		subdomain: input.subdomain,
		ID: ID,
		jobType: input.jobType,
		params: getParameters(),
		pages: log,
	};
	
	async function clearBacklog() {
		if (backlog.length) {
			result = {
				user: input.user,
				subdomain: input.subdomain,
				ID: ID,
				jobType: input.jobType,
				params: getParameters(),
				pages: log,
			};
			await logProgress(result, input.findOnly);
			socket.emit('pages', backlog);
			backlog = [];
		}
	}
	
	await async.mapLimit(pages, parallelCount(), async (page) => {
		index++;
		let currentPercentage = Math.round(index / pages.length * 100);
		if (percentage < currentPercentage) {
			percentage = currentPercentage;
			socket.volatile.emit('setState', {state: 'processing', percentage: currentPercentage});
		}
		let path = page.replace(`https://${input.subdomain}.libretexts.org/`, '');
		if (!path)
			return false;
		let content = await LibreTexts.authenticatedFetch(path, 'contents?mode=edit&dream.out.format=json', input.subdomain, input.user);
		if (!content.ok) {
			console.error('Could not get content from ' + path);
			let error = await content.text();
			console.error(error);
			socket.emit('errorMessage', {
				noAlert: true,
				message: error,
			});
			return false;
		}
		content = await content.json();
		content = content.body;
		// content = LibreTexts.decodeHTML(content);
		// console.log(content);
		
		let result = content, comment, jobs = [{jobType: jobType, ...input}];
		
		if (jobType === 'multipreset' && input.multi) {
			jobs = input.multi.body;
			jobs = jobs.map((j) => {
				if (j.find) {
					j.regex = Boolean(j.find.match(/^\/[\s\S]*\/$/));
					j.jobType = 'findReplace';
				}
				return j;
				
			})
		}
		
		for (const job of jobs) {
			let lastResult = result;
			switch (job.jobType) {
				case 'findReplace':
					result = await findReplace(job, result);
					comment = `[BOT ${ID}] Replaced "${job.find}" with "${job.replace}"`;
					break;
				case 'deadLinks':
					[result, numLinks] = await deadLinks(job, result);
					comment = `[BOT ${ID}] Killed ${numLinks} Dead links`;
					break;
				case 'convertContainers':
					[result, numContainers] = await convertContainers(job, result);
					comment = `[BOT ${ID}] Upgraded ${numContainers} Containers`;
					break;
				case 'headerFix':
					result = await headerFix(job, result);
					comment = `[BOT ${ID}] Fixed Headers`;
					break;
				case 'foreignImage':
					[result, count] = await foreignImage(job, result, path);
					comment = `[BOT ${ID}] Imported ${count} Foreign Images`;
					// if (job.findOnly && count)
					//     result = 'findOnly';
					break;
				case 'clean':
					if (result !== content)
						result = tidy(result); //{indent:'auto','indent-spaces':4}
					break;
			}
			if (result && result !== lastResult)
				console.log(comment);
			result = result || lastResult;
		}
		
		if (jobType === 'multipreset')
			comment = `[BOT ${ID}] Performed Multipreset ${input.multi.name}`;
		
		//Page summaries
		if (input.summaries) {
			let summary = await LibreTexts.authenticatedFetch(path, 'properties/mindtouch.page%2523overview', input.subdomain, input.user);
			if (summary.ok) {
				summary = await summary.text();
				summary = LibreTexts.decodeHTML(summary);
				let summaryResult = summary.replaceAll(input.find, input.replace, input);
				// summaryResult = LibreTexts.encodeHTML(summaryResult);
				if (!input.findOnly)
					await LibreTexts.authenticatedFetch(path, 'properties/mindtouch.page%2523overview?dream.out.format=json&abort=never', input.subdomain, input.user, {
						method: 'PUT',
						body: summaryResult,
					});
				pageSummaryCount++;
			}
		}
		
		if (!result || result === content)
			return;
		
		// result = LibreTexts.encodeHTML(result);
		
		//send update
		if (input.findOnly) {
			let item = {path: path, url: page};
			backlog.unshift(item);
			log.push(item);
			return;
		}
		// result = LibreTexts.encodeHTML(result);
		let response = await LibreTexts.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&comment=${encodeURIComponent(comment)}`, input.subdomain, input.user, {
			method: 'POST',
			body: result,
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
	});
	
	clearInterval(backlogClearer);
	clearBacklog();
	result = {
		user: input.user,
		subdomain: input.subdomain,
		ID: ID,
		jobType: input.jobType,
		params: getParameters(),
		pages: log.reverse(),
	};
	await logCompleted(result, input.findOnly);
	if (pageSummaryCount)
		socket.emit('errorMessage', `${input.findOnly ? 'Found' : 'Changed'} ${pageSummaryCount} Summaries`);
	socket.emit('setState', {state: 'done', ID: input.findOnly ? null : ID, log: log});
}

async function revert(input, socket) {
	if (!input.ID || !input.user)
		socket.emit('Body missing parameters');
	console.log(`Revert [${input.ID}] from (${input.user})`);
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
	
	await async.mapLimit(job.pages, 50, async (page) => {
		let content = await LibreTexts.authenticatedFetch(page.path, 'info?dream.out.format=json', job.subdomain, input.user);
		if (!content.ok) {
			console.error('Could not get page info from ' + page.path);
			return false;
		}
		/*		content = await content.json();
			let currentRevision = content['@revision'];
			//send update
			const live = true;
			if (!live) {
			  return false;
			}
			page.revision && currentRevision === page.revision
			 if (true) { //unchanged */
		// let url = `https://${job.subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(page.path))}/revert?fromrevision=${page.revision - 1}&dream.out.format=json`;
		let response = await LibreTexts.authenticatedFetch(page.path, `revert?fromrevision=${page.revision - 1}&dream.out.format=json`, job.subdomain, input.user, {
			method: 'POST',
		});
		if (!response.ok) {
			let error = await response.text();
			socket.emit('errorMessage', error);
		}
		/*    }
			else { //Page Conflict
			  console.error(`Page Conflict ${page.path}`);
			}*/
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

//Operator Functions
async function findReplace(input, content) {
	// content = content.replace(/\\n/g, '\n');
	
	let result = content.replaceAll(input.find, input.replace, input);
	if (result !== content) {
		/*      const diff = jsdiff.diffWords(content, result);
			  console.log('----------------------------');
			  diff.forEach(function(part) {
				// green for additions, red for deletions
				// grey for common parts
				var color = part.added ? 'green' :
				  part.removed ? 'red' : 'grey';
				process.stderr.write(part.value[color]);
			  });*/
		return result;
	}
}

async function deadLinks(input, content) {
	let links = content.match(/<a.*?>.*?<\/a>/g);
	let result = content;
	let count = 0;
	await async.mapLimit(links, 10, async (link) => {
		let url = link.match(/(?<=<a.*?href=").*?(?=")/);
		if (url) {
			url = url[0];
			if (link.includes('Content Reuse Link:') || link === 'javascript:void(0);')
				return;
			if (!url.startsWith('http')) {
				url = `https://${input.subdomain}.libretexts.org${url.startsWith('/') ? '' : '/'}${url}`;
				// console.log(`Mod: ${url}`);
			}
			let response = '', failed;
			try {
				response = await new Promise(async (resolve, reject) => {
					let seconds = 15;
					let timeout = setTimeout(() => reject({
						response: 'none',
						status: `Timed Out ${seconds}s`,
					}), seconds * 1000);
					let result;
					try {
						result = await fetch(url, {method: 'HEAD'});
					} catch (e) {
						reject(e);
						// console.error(e);
					}
					clearTimeout(timeout);
					resolve(result);
				});
			} catch (e) {
				failed = true;
				response = e;
				// console.error(e);
			}
			if (!failed && response.ok && response.status < 400) {
				return;
			}
			if (response.code)
				console.log(`Dead ${response.code}! ${url}`);
			else if (response.status)
				console.log(`Dead ${response.status}! ${url}`);
			else
				console.log(`Dead ${response}! ${url}`);
			
			let replacement = link.match(/(?<=<a(| .*?)>).*?(?=<\/a>)/)[0];
			replacement = replacement.replace(/https?:\/\//, '');
			result = result.replace(link, replacement);
			count++;
		}
	});
	return [result, count];
}

async function headerFix(input, content) {
	let result = content;
	if (content.match(/<h1(?=(| .*?)>)/)) { //Header demote
		for (let i = 7; i >= 1; i--) {
			let previous = result;
			let regex = new RegExp(`<h${i}(?=(| .*?)>)`,
				'g');
			result = result.replace(regex, `<h${i + 1}`);
			regex = new RegExp(`</h${i}>`, 'g');
			result = result.replace(regex, `</h${i + 1}>`);
			if (result !== previous) {
				console.log(`${i} => ${i + 1}`);
			}
		}
	}
	else if (!content.includes('<h2') && content.match(/<h[1-9](?=(| .*?)>)/)) { //Header promote
		let current = 2;
		for (let i = 3; i <= 7; i++) {
			let previous = result;
			let regex = new RegExp(`<h${i}(?=(| .*?)>)`,
				'g');
			result = result.replace(regex, `<h${current}`);
			regex = new RegExp(`</h${i}>`, 'g');
			result = result.replace(regex, `</h${current}>`);
			if (result !== previous) {
				console.log(`${i} => ${current}`);
				current++;
			}
		}
	}
	return result;
}

async function foreignImage(input, content, path) {
	let images = content.match(/<img.*?>/g);
	let result = content;
	let count = 0;
	await async.mapLimit(images, 5, async (image) => {
		let url = image.match(/(?<=src=").*?(?=")/);
		let newImage = image;
		if (url) {
			url = url[0];
			if (!url.startsWith('http') || url.includes('libretexts.org'))
				return;
			
			
			let response = '', failed;
			try {
				response = await new Promise(async (resolve, reject) => {
					let seconds = 15;
					let timeout = setTimeout(() => reject({
						response: 'none',
						status: `Timed Out ${seconds}s`,
					}), seconds * 1000);
					let result;
					try {
						result = await fetch(url);
					} catch (e) {
						reject(e);
						// console.error(e);
					}
					clearTimeout(timeout);
					resolve(result);
				});
			} catch (e) {
				failed = true;
				response = e;
				// console.error(e);
			}
			if (!failed && response.ok && response.status < 400) {
				if (input.findOnly) {
					result = 'findOnly';
					count++;
					return;
				}
				//upload image
				let foreignImage = await response.blob();
				let filename = url.match(/(?<=\/)[^/]*?(?=$)/)[0];
				response = await LibreTexts.authenticatedFetch(path, `files/${filename}?dream.out.format=json`, input.subdomain, input.user, {
					method: 'PUT',
					body: foreignImage,
				});
				if (!response.ok) {
					response = await response.text();
					console.error(response);
					return;
				}
				response = await response.json();
				//change path to new image
				let newSRC = `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`;
				
				newImage = newImage.replace(/(?<=src=").*?(?=")/, newSRC);
				newImage = newImage.replace(/(?<=<img.*?)\/>/, `fileid="${response['@id']}" \/>`);
				result = result.replace(image, newImage);
				count++;
			}
			/*				else if (response.code)
					  console.log(`Dead ${response.code}! ${url}`);
					else if (response.status)
					  console.log(`Dead ${response.status}! ${url}`);
					else
					  console.log(`Dead ${response}! ${url}`);*/
		}
	});
	return [result, count];
}

async function convertContainers(input, content) {
	if (!content.includes('boxtitle') && !content.includes('note1'))
		return [false, 0];
	
	const $ = cheerio.load(content);
	
	let result = '';
	let count = 0;
	
	let old = ['skills', 'example', 'exercise', 'objectives', 'query', 'note1', 'procedure', 'definition', 'theorem', 'lemma', 'notation', 'proposition'];
	
	old.forEach(type => {
		$(`div.${type}`).each((i, elem) => {
			count++;
			let container = $(elem);
			let oldType = type;
			
			let title = container.find('.boxtitle'); //if title exists
			if (!title || !title.length) {
				if (oldType === 'note1')
					oldType = 'note2'
			}
			else {
				title = title[0];
				title.name = 'legend';
				title.attribs.class = 'boxlegend';
			}
			
			elem.tagName = `fieldset`;
			elem.attribs.class = `box${newType(oldType)}`;
			
		});
	});
	result = $.html();
	// console.log(result);
	await fs.writeFile('test.html', result);
	
	return [result, count];
	
	function newType(type) {
		switch (type) {
			case 'skills':
				return 'objectives';
			case 'note1':
				return 'notewithlegend';
			case 'note2':
				return 'notewithoutlegend';
			default:
				return type;
		}
	}
}

//Helper Logging functions
async function logStart(input, isDisabled) {
	let timestamp = new Date();
	input.timestamp = timestamp.toUTCString();
	let ID = '' + Math.random().toString(36).substr(2, 9);
	if (!isDisabled) {
		await fs.ensureDir(`BotLogs/Working/${input.user}`);
		await fs.writeJSON(`BotLogs/Working/${input.user}/${ID}.json`, input);
	}
	return ID;
}

async function logProgress(result, isDisabled) {
	if (isDisabled)
		return false;
	let timestamp = new Date();
	result.timestamp = timestamp.toUTCString();
	await fs.ensureDir(`BotLogs/Completed/${result.user}`);
	await fs.writeJSON(`BotLogs/Completed/${result.user}/${result.ID}.json`, result);
}

async function logCompleted(result, isDisabled) {
	if (isDisabled)
		return false;
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


String.prototype.replaceAll = function (search, replacement, input) {
	const target = this;
	let b4 = search, regex;
	
	if (input.regex)
		search = search.replace(/^\/|\/$/g, '');
	else
		search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	
	
	regex = new RegExp(search, 'gm');
	let temp = target.replace(regex, replacement);
	// console.log(b4, search);
	try {
		search = LibreTexts.encodeHTML(search);
		regex = new RegExp(search, 'gm');
		temp = temp.replace(regex, replacement);
	} catch (e) {
	
	}
	try {
		search = LibreTexts.encodeHTML(search);
		regex = new RegExp(search, 'gm');
		temp = temp.replace(regex, replacement);
	} catch (e) {
	
	}
	return temp;
	
	/*	if (input.newlines) {
		search = search.replace(/\\\\n/g, "\n"); //add newlines
		if (input.isWildcard) {
		  search = search.replace(/\\\?/g, "[\\s\\S]"); //wildcard single
		  search = search.replace(/\\\*!/g, "[\\s\\S]*?"); //wildcard multi
		}
	  }
	  else if (input.isWildcard) {
		search = search.replace(/\\\?/g, "."); //wildcard single
		search = search.replace(/\\\*!/g, ".*?"); //wildcard multi
	  }
	  let temp = target.replace(new RegExp(search, 'g'), replacement);*/
	
};