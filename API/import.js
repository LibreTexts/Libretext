const http = require('http');
const timestamp = require("console-timestamp");
const EPub = require("epub");
const filenamify = require('filenamify');
const server = http.createServer(handler);
const io = require('socket.io')(server, {path: '/import/ws'});
const fs = require('fs-extra');
const {performance} = require('perf_hooks');
const fetch = require("node-fetch");
const download = require('download');
const async = require('async');
const md5 = require('md5');
const util = require('util');
const Eta = require('node-eta');
const zipLocal = require('zip-local');
const convert = require('xml-js');

const LibreTexts = require("./reuse.js");
let port = 3003;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
fs.emptyDir('ImportFiles');
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));


function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = LibreTexts.clarifySubdomain(url);
	console.log(url);
	
	if (url.startsWith('/websocketclient')) {
		//Serve client socket.io Javascript file
		staticFileServer.serveFile('../node_modules/socket.io-client/dist/socket.io.js', 200, {}, request, response);
	}
	else if (url === "/import") {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " application/json",
				});
				response.end();
			}
			else if (request.method === "POST") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " application/json",
				} : {"Content-Type": " application/json"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body).toString();
					
					let input = JSON.parse(body);
					if (!(input.url && input.url.match(/^(http|https):\/\//))) {
						reportMessage('This source is not valid, please check your URL', true);
						response.end();
					}
					else {
						const subdomain = request.headers.origin.split("/")[2].split(".")[0];
						input.url = input.url.replace(/\/$/, "");
						console.log(input.url);
						processEPUB(input.url, subdomain, input.user).then();
					}
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
		}
	}
	else if (url.startsWith("/pretext")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " application/json",
				});
				response.end();
			}
			else if (request.method === "POST") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " application/json",
				} : {"Content-Type": " application/json"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body).toString();
					
					let input = JSON.parse(body);
					if (!(input.url && input.url.match(/^(http|https):\/\//))) {
						reportMessage('This source is not valid, please check your URL', true);
						response.end();
					}
					else {
						const subdomain = request.headers.origin.split("/")[2].split(".")[0];
						input.url = input.url.replace(/\/$/, "");
						console.log(input.url);
						processPretext(input.url, subdomain, input.user).then();
					}
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
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
	
	function reportMessage(message, isError) {
		if (isError) {
			console.error(message);
		}
		else {
			console.log(message);
		}
		let json = {
			message: message,
			isError: isError,
		};
		response.write(JSON.stringify(json) + "\r\n");
	}
	
	async function processEPUB(target, subdomain, user) {
		const start = performance.now();
		reportMessage('Downloading...This will take quite a while...');
		target = target.trim();
		let url = target;
		let checkURL = await fetch(url, {
			method: 'HEAD',
			headers: {'x-deki-token': LibreTexts.authenticate(user, subdomain)}
		});
		let isEpub = target.endsWith('.epub')
			|| checkURL.headers.get('content-type').includes('application/epub+zip')
			|| checkURL.headers.get('content-type').includes('application/octet-stream');
		console.log(checkURL.headers.get('content-type'));
		if (!checkURL.ok || !isEpub) {
			url = target + '/open/download?type=epub';
			checkURL = await fetch(url, {
				method: 'HEAD',
				headers: {'x-deki-token': LibreTexts.authenticate(user, subdomain)}
			});
			isEpub = checkURL.headers.get('content-type').includes('application/epub+zip');
			if (!checkURL.ok || !isEpub) {
				reportMessage('This source is not valid, please check your URL', true);
				response.end();
				return false;
			}
		}
		let epubName = `epubs/${filenamify(target)}${target.endsWith('.epub') ? 'epub' : '.epub'}`;
		if (!await fs.pathExists(epubName)) {
			let count = 0;
			let heartbeat = setInterval(() => reportMessage(`Downloading...This will take quite a while...\nTime elapsed: ${++count} seconds`), 1000);
			let data = await download(url);
			await fs.ensureDir('epubs');
			await fs.writeFile(epubName, data);
			clearInterval(heartbeat);
			reportMessage('EPUB download complete. Processing...');
		}
		else {
			reportMessage('Cached EPUB found. Processing...');
		}
		
		let epub = new EPub(epubName);
		epub.on("end", async function () {
			const title = epub.metadata.title;
			let filtered = [];
			let chapters = [];
			let whole = [];
			const toc = epub.flow;
			let chapterIndex = 0;
			let pageIndex = 1;
			
			for (let i = 0; i < toc.length; i++) {
				if (toc[i].level) {
					//front and back matter ignored
					let page = toc[i];
					let indexes = page.title.match(/^[0-9]+\.[0-9]/);
					if (indexes) {
						indexes = indexes[0];
						page.title = page.title.replace(indexes, indexes + ':');
					}
					else {
						page.title = `${chapterIndex}.${pageIndex}: ${page.title}`;
					}
					pageIndex++;
					filtered.push({title: page.title, id: page.id, href: page.href});
				}
				else if (toc[i].href.includes('-chapter-') || toc[i].href.includes('part-')) {
					chapters.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
					chapterIndex++;
					pageIndex = 1;
				}
				whole.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
			}
			
			let filteredChapters = [];
			for (let i = 0; i < chapters.length; i++) {
				let current = chapters[i];
				if (!current.title.includes('Summary')) {
					current.index = i;
					filteredChapters.push(current);
				}
			}
			
			let root = `https://${subdomain}.libretexts.org/Courses/Remixer_University/Importer/${title}`;
			let subroot = `/Courses/Remixer_University/Importer/${title}`;
			const isSimple = !filtered.length || !filteredChapters.length;
			if (await coverPage(subroot, isSimple)) {
				if (isSimple) { //falling back to simple import
					reportMessage('Warning: Cannot determine structure. Falling back to simple import.', true);
					await processPages(whole, root, subroot, null);
				}
				else {
					await processChapters(root, subroot, filteredChapters);
					await processPages(filtered, root, subroot, filteredChapters);
				}
				
				const end = performance.now();
				let time = end - start;
				time /= 100;
				time = Math.round(time);
				time /= 10;
				
				reportMessage(`Upload ${title} complete!`);
				reportMessage({
					messageType: "complete",
					timeTaken: time,
					resultURL: subroot,
				});
			}
			else {
				reportMessage('Page already exists!', true);
			}
			response.end()
		});
		epub.parse();
		
		async function coverPage(subroot, isSimple) {
			const token = LibreTexts.authenticate(user, subdomain);
			let content = isSimple ? '<p>{{template.ShowGuide()}}</p>' : '<p>{{template.ShowCategory()}}</p>';
			// TODO Reenable ?abort=exists
			let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(subroot))}/contents?edittime=now`, {
				method: "POST",
				body: content,
				headers: {'x-deki-token': token}
			});
			if (!response.ok) {
				let error = await response.text();
				reportMessage(error, true);
				return false;
			}
			let tags = `<tags><tag value="article:topic-${isSimple ? 'guide' : 'category'}"/><tag value="coverpage:yes"/></tags>`;
			let propertyArray = isSimple ? [putProperty("mindtouch.idf#guideDisplay", "single", subroot),
					putProperty('mindtouch.page#welcomeHidden', true, subroot),
					putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", subroot)]
				: [putProperty('mindtouch.page#welcomeHidden', true, subroot),
					putProperty('mindtouch.idf#subpageListing', 'simple', subroot)];
			
			propertyArray.push(fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(subroot))}/tags`, {
				method: "PUT",
				body: tags,
				headers: {"Content-Type": "text/xml; charset=utf-8", 'x-deki-token': token}
			}));
			
			await Promise.all(propertyArray);
			return true;
		}
		
		async function processChapters(root, subroot, chapters) {
			await async.mapLimit(chapters, 5, processChapter);
			
			async function processChapter(chapter) {
				const token = LibreTexts.authenticate(user, subdomain);
				let title = chapter.title;
				title = title.replace("Chapter ", "");
				let number = title.match(/[0-9]+(?= )/);
				if (number) {
					number = number[0];
				}
				else {
					number = chapter.index + 1;
					if (!title.startsWith(`${chapter.index + 1}:`))
						title = `${chapter.index + 1}: ${title}`;
				}
				let padded = title.replace(number, ("" + number).padStart(2, "0"));
				chapter.title = title;
				chapter.padded = padded;
				let location = `${subroot}/${title}`;
				let content = "<p>{{template.ShowGuide()}}</p>";
				let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(location))}/contents?edittime=now`, {
					method: "POST",
					body: content,
					headers: {'x-deki-token': token}
				});
				if (!response.ok) {
					let error = await response.text();
					reportMessage(error, true);
					return false;
				}
				else {
					let href = await response.text();
					href = href.match(/(?<=<uri.ui>).*?(?=<\/uri.ui>)/)[0];
					console.log('Chapter ' + href);
				}
				
				let tags = '<tags><tag value="article:topic-guide"/></tags>';
				if (padded !== title) {
					let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(location))}/move?title=${encodeURIComponent(title)}&name=${encodeURIComponent(padded)}`, {
						method: "POST",
						headers: {'x-deki-token': token}
					});
					if (!response.ok) {
						let error = await response.text();
						reportMessage(error, true);
					}
					else {
						// reportMessage(await response.text());
					}
				}
				
				await Promise.all(
					[putProperty("mindtouch.idf#guideDisplay", "single", location),
						putProperty('mindtouch.page#welcomeHidden', true, location),
						putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", location),
						fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(location))}/tags`, {
							method: "PUT",
							body: tags,
							headers: {"Content-Type": "text/xml; charset=utf-8", 'x-deki-token': token}
						})]);
				return true;
			}
		}
		
		async function processPages(splice, root, subroot, filteredChapters) {
			let completed = 0;
			let isSimple = filteredChapters === null;
			const eta = new Eta(splice.length, true);
			let untitled = 0;
			
			async function processPage(page) {
				const token = LibreTexts.authenticate(user, subdomain);
				epub.getChapterRaw = util.promisify(epub.getChapterRaw);
				epub.getImage = util.promisify(epub.getImage);
				epub.readFile = util.promisify(epub.readFile);
				let content = await epub.getChapterRaw(page.id);
				let pressBooksContent = content.match(/(?<=class="ugc.*>)[\s\S]*?(?=<\/div>\n+<\/div>\n*<\/body>)/m);
				if (pressBooksContent) {
					content = pressBooksContent[0];
				}
				
				let path = page.title || `Untitled Page ${++untitled}`;
				
				let chapterNumber = path.match(/.*?(?=\.)/);
				let padded;
				if (!isSimple && chapterNumber) {
					chapterNumber = parseInt(chapterNumber[0]);
					padded = chapterNumber < 10 ? "0" + path : false;
				}
				path = isSimple ? `${subroot}/${path}` : `${subroot}/${filteredChapters[chapterNumber - 1].padded}/${path}`;
				
				//remove extraneous link tags
				let containerTags = content.match(/<a>\n\s*?<img [\s\S]*?<\/a>/gm);
				if (containerTags) {
					for (let i = 0; i < containerTags.length; i++) {
						let toReplace = containerTags[i].match(/<img.*?"\/>/)[0];
						content = content.replace(containerTags[i], toReplace);
					}
				}
				
				//Rewrite image src url
				let images = content.match(/<img .*?src=".*?\/.*?>/g);
				let src = content.match(/(?<=<img .*?src=").*?(?=")/g);
				const atRoot = images === null;
				if (atRoot) {
					images = content.match(/<img .*?src=".*?>/g);
				}
				if (src) {
					for (let i = 0; i < src.length; i++) {
						if (!src[i].startsWith('http')) {
							const fileID = await uploadImage(src[i]);
							let toReplace;
							if (atRoot) { // at root url
								toReplace = images[i].replace(/(?<=<img .*?src=)"/, `"/@api/deki/files/${fileID}/`);
							}
							else {
								toReplace = images[i].replace(/(?<=<img .*?src=").*\//, `/@api/deki/files/${fileID}/`);
							}
							
							content = content.replace(images[i], toReplace);
							content = content.replace(/(?<=<img .*?alt=")[^\/"]*?\/(?=.*?")/, '');
						}
					}
				}
				await uploadContent();
				completed++;
				eta.iterate();
				reportMessage({
					messageType: "progress",
					percent: (Math.round(completed / splice.length * 1000) / 10),
					eta: eta.format("{{etah}}"),
					// count: count,
				});
				
				
				//Function Zone
				async function uploadContent() {
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
						reportMessage(error, true);
					}
					
					await putProperty('mindtouch.page#welcomeHidden', true, path);
					let tags = '<tags><tag value="article:topic"/></tags>';
					await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=` + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
						method: "PUT",
						body: tags,
						headers: {"Content-Type": "text/xml; charset=utf-8", 'x-deki-token': token}
					});
				}
				
				async function uploadImage(filename) {
					// filename = filename.replace('.svg', '.png');
					filename = decodeURIComponent(filename);
					let prefix = page.href.match(/.*\//);
					prefix = prefix ? prefix[0] : '';
					if (prefix && filename.startsWith('../')) {
						prefix = prefix.match(/.*\/(?=.*?\/$)/)[0];
						filename = filename.match(/(?<=\.\.\/).*/)[0];
					}
					
					let image = await epub.readFile(prefix + filename);
					
					
					if (!image) {
						reportMessage(filename, true);
						return false;
					}
					let shortname = filename.match(/(?<=\/)[^\/]*?$/);
					if (shortname) {
						filename = shortname[0];
					}
					let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${encodeURIComponent(encodeURIComponent(filename))}`, {
						method: 'PUT',
						body: image,
						headers: {'x-deki-token': token}
					});
					if (response.ok) {
						let fileID = await response.text();
						fileID = fileID.match(/(?<=<file id=").*?(?=")/)[0];
						return fileID;
					}
					else {
						let error = await response.text();
						reportMessage(error, true);
					}
				}
			}
			
			return await async.mapLimit(splice, 5, processPage);
		}
		
		async function putProperty(name, value, path) {
			const token = LibreTexts.authenticate(user, subdomain);
			await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/properties`, {
				method: "POST",
				body: value,
				headers: {"Slug": name, 'x-deki-token': token}
			})
		}
	}
}


//Set up Websocket connection using Socket.io
io.on('connection', function (socket) {
	// console.log('an user connected');
	socket.emit('welcome', `Hello!`);
	
	//Define callback events;
	socket.on('downloadFile', (data) => downloadFile(data, socket));
	socket.on('sendFile', (data, done) => sendFile(data, socket, done));
	socket.on('listFiles', (data) => listFiles(data, socket));
	socket.on('import', (data) => jobHandler(data, socket));
});

async function jobHandler(data, socket) {
	switch (data.type) {
		case "epub":
			return processEPUB(data, socket);
		case 'commoncartridge':
			return processCommonCartridge(data, socket);
		case "pdf":
			return null;
		case "pretext":
			return null;
		default:
			break;
	}
}

async function downloadFile(data, socket) {
	let response;
	if (!data.url.startsWith('http')) {
		socket.emit('setState', {state: 'downloadFail'});
		return;
	}
	
	if (data.url.includes('dropbox.com')) {
		response = await fetch(data.url + '?dl=1', {mode: "HEAD"});
		if (response.ok && response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('attachment'))
			data.url = data.url + '?dl=1';
	}
	else if (data.type === 'epub') {
		response = await fetch(data.url + '/open/download?type=epub', {mode: "HEAD"});
		if (response.ok && response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('.epub'))
			data.url = data.url + '/open/download?type=epub';
	}
	response = await fetch(data.url);
	
	// Step 2: get total length
	if (!response.ok || !response.headers.get('content-disposition')) {
		socket.emit('setState', {state: 'downloadFail'});
		return;
	}
	const contentLength = +response.headers.get('Content-Length');
	if (response.headers.get('content-disposition') && response.headers.get('content-disposition').match(/(?<=filename=").*?(?=")/))
		data.filename = response.headers.get('content-disposition').match(/(?<=filename=").*?(?=")/)[0];
	
	// Step 3: read the data
	let receivedLength = 0; // received that many bytes at the moment
	let chunks = []; // array of received binary chunks (comprises the body)
	await new Promise((resolve, reject) => {
		response.body.on('data', (value) => {
			chunks.push(value);
			receivedLength += value.length;
			socket.emit('progress', Math.round(receivedLength / contentLength * 1000) / 10);
		});
		response.body.on('end', resolve);
	});
	// Step 4: concatenate chunks into single Uint8Array
	let chunksAll = new Uint8Array(receivedLength);
	let position = 0;
	for (let chunk of chunks) {
		chunksAll.set(chunk, position);
		position += chunk.length;
	}
	data.filename = data.filename || data.url.match(/(?<=\/)[^\/]*?$/)[0];
	await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
	await fs.writeFile(`./ImportFiles/${data.user}/${data.type}/${data.filename}`, chunksAll);
	await listFiles(data, socket);
	socket.emit('setState', {state: 'downloadDone', filename: data.filename});
}

async function sendFile(data, socket, done) { //upload file to server for processing
	if (data.status === 'start') {
		await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
		socket.sendFile = {
			path: `./ImportFiles/${data.user}/${data.type}/${data.filename}`,
			buffer: [],
			length: data.length
		};
		
	}
	if (socket.sendFile) {
		socket.sendFile.buffer[data.index] = data.buffer;
		socket.emit('progress', Math.round(socket.sendFile.buffer.length / socket.sendFile.length * 1000) / 10);
		done(data.index);
	}
	
	if (socket.sendFile.buffer.length === socket.sendFile.length) {
		let complete = true;
		for (let i = 0; i < socket.sendFile.buffer.length; i++) {
			if (!socket.sendFile.buffer[i])
				complete = false;
		}
		let body = Buffer.concat(socket.sendFile.buffer);
		await fs.writeFile(socket.sendFile.path, body);
		await listFiles(data, socket);
		socket.emit('setState', {state: 'downloadDone', filename: data.filename});
	}
}

async function listFiles(data, socket) {
	await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
	let files = await fs.readdir(`./ImportFiles/${data.user}/${data.type}`, {withFileTypes: true});
	if (files) {
		files = files.filter(elem => elem.isFile());
		files = files.map(elem => elem.name);
		socket.emit('listFiles', files);
	}
}

/*processEUPB({
	path: './ImportFiles/hdagnew@ucdavis.edu/epub/Copy%20of%2088%20Open%20Essays.epub',
	user: 'hdagnew@ucdavis.edu',
	subdomain: 'chem'
}, {emit: (a, b) => console.error(b)});*/

async function processCommonCartridge(data, socket) {
	//ensure file exists
	console.log(`Processing ${data.filename}`);
	data.path = `./ImportFiles/${data.user}/${data.type}/${data.filename}`;
	data.socket = socket;
	if (!await fs.exists(data.path)) {
		socket.emit('errorMessage', 'File does not exist!');
		return;
	}
	
	try {
		zipLocal.unzip = util.promisify(zipLocal.unzip);
		let unzipped = await zipLocal.unzip(data.path);
		unzipped.save = util.promisify(unzipped.save);
		await fs.emptyDir(`${data.path}-Unzipped`);
		await unzipped.save(`${data.path}-Unzipped`);
		if (!await fs.exists(`${data.path}-Unzipped/imsmanifest.xml`)) {
			socket.emit('errorMessage', 'imsmanifest.xml is invalid');
			return;
		}
		
		let rootPath = `${data.path}-Unzipped`;
		let onlinePath = `Courses/Remixer_University/Username:_${data.user}`;
		const Working = {}; // since user and subdomain are unchanged for these calls
		Working.authenticatedFetch = async (path, api, options) => await LibreTexts.authenticatedFetch(path, api, data.subdomain, data.user, options);
		Working.putProperty = async (name, value, path) => await putProperty(name, value, path, data.subdomain, data.user);
		
		//go through html and upload
		//setup parent pages
		await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
			method: "POST",
			body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
		}, data.subdomain);
		onlinePath += `/${data.filename}`;
		await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
			method: "POST",
			body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a><a href=\"#\">coverpage:yes</a></p>",
		}, data.subdomain);
		await Working.putProperty('mindtouch.idf#subpageListing', 'simple', onlinePath);
		
		//parse imsmanifest.xml
		let manifest = await fs.readFile(rootPath + '/imsmanifest.xml');
		manifest = convert.xml2js(manifest);
		let [metadata, organization, resources] = manifest.elements[0].elements;
		if (!resources.elements || !organization.elements)
			return;
		let temp = {};
		let resourceTypes = {};
		resources.elements.forEach(elem => {
				let item = {
					name: elem.attributes.identifier,
					file: elem.elements.find(elem => elem.name === 'file').attributes.href,
					type: elem.attributes.type,
				};
				temp[elem.attributes.identifier] = item;
				
				if (!resourceTypes[elem.attributes.type]) {
					resourceTypes[elem.attributes.type] = [item];
				}
				else {
					resourceTypes[elem.attributes.type].push(item);
				}
				
			}
		);
		resources = temp;
		organization = organization.elements;
		while (organization.length === 1) {
			organization = organization[0].elements;
			if (organization[0].name === 'title')
				organization.shift();
		}
		// organization = organization.filter(elem => elem.elements.length > 1);
		let totalPages = 0;
		organization = organization.map((page) => digestPage(page, resources));
		
		//begin page uploads
		let firstEntry = {
			title: data.filename,
			type: 'Coverpage',
			url: `https://${data.subdomain}.libretexts.org/${onlinePath}`,
		};
		let log = [firstEntry];
		let backlog = [firstEntry];
		let eta = new Eta(totalPages, true);
		let backlogClearer = setInterval(clearBacklog, 1000);
		
		//process content pages
		for (let i = 0; i < organization.length; i++) {
			await processPage(organization[i], rootPath, onlinePath, i);
		}
		
		
		//process attachments and non-content pages
		let path = `${onlinePath}/Resources`;
		await Working.authenticatedFetch(path, "contents?abort=exists", {
			method: "POST",
			body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>",
		}, data.subdomain);
		await Promise.all(
			[Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
				Working.putProperty('mindtouch.page#welcomeHidden', true, path),
				Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
		for (const [key, value] of Object.entries(resourceTypes)) { //new page for each resource type
			socket.emit('progress', {
				percentage: key,
				pages: `Uploading ${value.length} items for ${key}`,
				eta: 'Waiting on Resource uploads',
			});
			await processAttachments(value, rootPath, `${onlinePath}/Resources/${key.replace(/\//g, '***')}`, socket);
			let entry = {
				title: key,
				type: 'resources',
				url: `https://${data.subdomain}.libretexts.org/${onlinePath}/Resources/${key.replace(/\//g, '_')}`,
			};
			backlog.push(entry);
			log.push(entry);
			console.log(key, value.length);
		}
		
		
		//finishing up
		socket.emit('setState', {
			state: 'done',
			log: log,
			url: `https://${data.subdomain}.libretexts.org/${onlinePath}`
		});
		clearInterval(backlogClearer);
		await clearBacklog();
		
		//Function Zone
		function digestPage(page, resources) {
			let result = {};
			result.title = page.elements.find(elem => elem.name === 'title');
			if (!result.title.elements)
				result.title = `Untitled Page ${totalPages}`;
			else result.title = result.title.elements[0].text;
			result.title = result.title.replace(/&/g, 'and');
			result.subpages = page.elements.filter(elem => elem.name === 'item');
			
			if (!result.subpages.length) {
				result.type = 'topic';
			}
			else {
				result.subpages = result.subpages.map(elem => digestPage(elem, resources));
				if (result.subpages[0].type === 'topic')
					result.type = 'guide';
				else
					result.type = 'category';
			}
			if (page.attributes && page.attributes.identifierref) {
				result.href = resources[page.attributes.identifierref];
				resources[page.attributes.identifierref].active = true;
			}
			totalPages++;
			return result;
		}
		
		async function processPage(page, rootPath, onlinePath, index) {
			let safeTitle = encodeURIComponent(page.title);
			let path = `${onlinePath}/${("" + index).padStart(2, "0")}: ${page.title.replace(/[?/&]/g, '_')}`;
			if (page.type === 'category') {
				await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
					method: "POST",
					body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
				}, data.subdomain);
				await Working.putProperty('mindtouch.idf#subpageListing', 'simple', path);
			}
			else if (page.type === 'guide') {
				await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
					method: "POST",
					body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>",
				}, data.subdomain);
				await Promise.all(
					[Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
						Working.putProperty('mindtouch.page#welcomeHidden', true, path),
						Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
				
			}
			else if (page.type === 'topic') {
				if (!page.href || !(page.href.file.endsWith('.html') || page.href.file.endsWith('.xml'))) {
					page.type = 'attachment';
					await processAttachments([page.href], rootPath, path);
				}
				else {
					let contents = await fs.readFile(`${rootPath}/${page.href.file}`, 'utf8');
					let currentPath = `${rootPath}/${page.href.file}`.match(/^.*\/(?=.*?$)/)[0];
					
					contents = await uploadImages(contents, path, imageProcessor, data);
					
					async function imageProcessor(imagePath) {
						let filename = decodeURIComponent(imagePath).replace('$IMS-CC-FILEBASE$', '');
						if (filename.startsWith('../')) {
							currentPath = currentPath.match(/.*\/(?=.*?\/$)/)[0];
							filename = filename.match(/(?<=\.\.\/).*/)[0];
						}
						let okay = filename && await fs.exists(currentPath + filename);
						return [filename, okay ? await fs.readFile(currentPath + filename) : false, currentPath + filename];
					}
					
					
					let response = await Working.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&title=${safeTitle}`, {
						method: 'POST',
						body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
					});
					if (!response.ok) {
						let error = await response.text();
						console.error(error);
						socket.emit('errorMessage', error);
					}
					await Working.putProperty('mindtouch.page#welcomeHidden', true, path);
				}
			}
			
			//report page upload
			console.log(page.type, page.title);
			let entry = {
				title: page.title,
				type: page.type,
				url: `https://${data.subdomain}.libretexts.org/${path}`,
			};
			backlog.push(entry);
			log.push(entry);
			eta.iterate();
			socket.emit('progress', {
				percentage: `${Math.round(log.length / totalPages * 1000) / 10}%`,
				pages: `${log.length} / ${totalPages} pages processed`,
				eta: eta.format("{{etah}}"),
			});
			
			//recurse down
			if (page.type !== 'topic') {
				for (let i = 0; i < page.subpages.length; i++) {
					await processPage(page.subpages[i], rootPath, path, i)
				}
			}
		}
		
		async function processAttachments(resources, rootPath, onlinePath, socket) {
			resources = resources.filter(elem => elem);
			if (!resources.length)
				return false;
			let entries = [];
			let title = onlinePath.match(/(?<=\/)[^\/]*?$/)[0].replace(/\*\*\*/g, '/');
			onlinePath = onlinePath.replace(/\*\*\*/g, '_');
			
			for (let i = 0; i < resources.length; i++) {
				try {
					let filename = decodeURIComponent(resources[i].file).replace('$IMS-CC-FILEBASE$', '');
					let currentPath = rootPath;
					if (filename.startsWith('../')) {
						currentPath = currentPath.match(/.*\/(?=.*?\/$)/)[0];
						filename = filename.match(/(?<=\.\.\/).*/)[0];
					}
					if (await fs.exists(currentPath + '/' + filename)) {
						let file = await fs.readFile(currentPath + '/' + filename);
						filename = filename.match(/(?<=\/)[^\/]*?$/)[0];
						let response = await Working.authenticatedFetch(onlinePath, `files/${encodeURIComponent(encodeURIComponent(filename))}?dream.out.format=json`, {
							method: 'PUT',
							body: file,
						});
						if (response.ok) {
							let fileID = await response.json();
							entries.push({title: filename, id: fileID['@id']});
						}
					}
					if (socket) {
						socket.emit('progress', {
							percentage: `${i} / ${resources.length} files`,
							pages: `Uploading ${resources[i].type}`,
							eta: `Waiting on attachments`,
						});
					}
					
				} catch (e) {
				
				}
			}
			if (!entries.length)
				return false;
			let contents = entries.map(elem => `<a href='/@api/deki/files/${elem.id}'>${elem.title}</a>`).join();
			
			
			let response = await Working.authenticatedFetch(onlinePath, `contents?edittime=now&title=${encodeURIComponent(title)}&dream.out.format=json`, {
				method: 'POST',
				body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
			});
			if (!response.ok) {
				let error = await response.text();
				console.error(error);
				socket.emit('errorMessage', error);
			}
		}
		
		async function clearBacklog() {
			if (backlog.length) {
				socket.emit('pages', backlog);
				backlog = [];
			}
		}
		
	} catch (e) {
		console.error(e);
		socket.emit('errorMessage', JSON.stringify(e));
	}
}

async function processEPUB(data, socket) {
	data.socket = socket;
	const Working = {}; // since user and subdomain are unchanged for these calls
	Working.authenticatedFetch = async (path, api, options) => await LibreTexts.authenticatedFetch(path, api, data.subdomain, data.user, options);
	Working.putProperty = async (name, value, path) => await putProperty(name, value, path, data.subdomain, data.user);
	
	data.path = `./ImportFiles/${data.user}/${data.type}/${data.filename}`;
	if (!await fs.exists(data.path)) {
		socket.emit('errorMessage', 'File does not exist!');
		return;
	}
	
	let epub = new EPub(data.path);
	epub.parse();
	await new Promise((resolve, reject) => {
		epub.on("end", resolve);
	});
	const title = epub.metadata.title;
	
	let filtered = [];
	let chapters = [];
	let whole = [];
	const toc = epub.flow;
	let chapterIndex = 0;
	let pageIndex = 1;
	
	for (let i = 0; i < toc.length; i++) {
		if (toc[i].level) {
			//front and back matter ignored
			let page = toc[i];
			let indexes = page.title.match(/^[0-9]+\.[0-9]/);
			if (indexes) {
				indexes = indexes[0];
				page.title = page.title.replace(indexes, indexes + ':');
			}
			else {
				page.title = `${chapterIndex}.${pageIndex}: ${page.title}`;
			}
			pageIndex++;
			filtered.push({title: page.title, id: page.id, href: page.href});
		}
		else if (toc[i].href.includes('-chapter-') || toc[i].href.includes('part-')) {
			chapters.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
			chapterIndex++;
			pageIndex = 1;
		}
		whole.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
	}
	
	let filteredChapters = [];
	for (let i = 0; i < chapters.length; i++) {
		let current = chapters[i];
		if (!current.title.includes('Summary')) {
			current.index = i;
			filteredChapters.push(current);
		}
	}
	
	let onlinePath = `Courses/Remixer_University/Username:_${data.user}`;
	await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
		method: "POST",
		body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
	}, data.subdomain);
	onlinePath += `/${data.filename}`;
	const isSimple = !filtered.length || !filteredChapters.length;
	//begin page uploads
	let firstEntry = {
		title: data.filename,
		type: 'Coverpage',
		url: `https://${data.subdomain}.libretexts.org/${onlinePath}`,
	};
	let log = [firstEntry];
	let backlog = [firstEntry];
	const eta = new Eta(whole.length, true);
	let backlogClearer = setInterval(clearBacklog, 1000);
	
	if (await coverPage(onlinePath, isSimple)) {
		if (isSimple) { //falling back to simple import
			socket.emit('errorMessage', 'Warning: Cannot determine structure. Falling back to simple import.');
			await processPages(whole, onlinePath, null);
		}
		else {
			await processChapters(onlinePath, filteredChapters);
			await processPages(filtered, onlinePath, filteredChapters);
		}
		
		//finishing up
		socket.emit('setState', {
			state: 'done',
			log: log,
			url: `https://${data.subdomain}.libretexts.org/${onlinePath}`
		});
		clearInterval(backlogClearer);
		await clearBacklog();
	}
	
	async function clearBacklog() {
		if (backlog.length) {
			socket.emit('pages', backlog);
			backlog = [];
		}
	}
	
	async function coverPage(path, isSimple) {
		let content = `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-${isSimple ? 'guide' : 'category'}</a><a href=\"#\">coverpage:yes</a></p>`;
		let response = await Working.authenticatedFetch(path, 'contents?edittime=now', {
			method: "POST",
			body: content,
		});
		if (!response.ok) {
			let error = await response.text();
			socket.emit('errorMessage', error);
			return false;
		}
		
		let propertyArray = isSimple ? [Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
				Working.putProperty('mindtouch.page#welcomeHidden', true, path),
				Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]
			: [Working.putProperty('mindtouch.page#welcomeHidden', true, path),
				Working.putProperty('mindtouch.idf#subpageListing', 'simple', path)];
		
		
		await Promise.all(propertyArray);
		return true;
	}
	
	async function processChapters(onlinePath, chapters) {
		await async.mapLimit(chapters, 2, processChapter);
		
		async function processChapter(chapter) {
			let title = chapter.title;
			title = title.replace("Chapter ", "");
			let number = title.match(/[0-9]+(?= )/);
			if (number) {
				number = number[0];
			}
			else {
				number = chapter.index + 1;
				if (!title.startsWith(`${chapter.index + 1}:`))
					title = `${chapter.index + 1}: ${title}`;
			}
			let padded = title.replace(number, ("" + number).padStart(2, "0"));
			chapter.title = title;
			chapter.padded = padded;
			let path = `${onlinePath}/${padded}`;
			let response = await Working.authenticatedFetch(path, `contents?edittime=now${padded !== title ? `&title=${encodeURIComponent(title)}` : ''}`, {
				method: "POST",
				body: `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>`,
			});
			if (!response.ok) {
				let error = await response.text();
				socket.emit('errorMessage', error);
				return false;
			}
			
			await Promise.all(
				[Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
					Working.putProperty('mindtouch.page#welcomeHidden', true, path),
					Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]
			);
			console.log('Chapter', title);
			let entry = {
				title: title,
				type: 'Chapter',
				url: `https://${data.subdomain}.libretexts.org/${path}`,
			};
			backlog.push(entry);
			log.push(entry);
			eta.iterate();
			socket.emit('progress', {
				percentage: Math.round(log.length / whole.length * 1000) / 10,
				pages: `${log.length} / ${whole.length}`,
				eta: eta.format("{{etah}}"),
			});
			return true;
			
		}
	}
	
	
	async function processPages(pageArray, onlinePath, filteredChapters) {
		let isSimple = filteredChapters === null;
		let untitled = 0;
		return await async.mapLimit(pageArray, 2, processPage);
		
		async function processPage(page) {
			epub.getChapterRaw = util.promisify(epub.getChapterRaw);
			epub.getImage = util.promisify(epub.getImage);
			epub.readFile = util.promisify(epub.readFile);
			let contents = await epub.getChapterRaw(page.id);
			let pressBooksContent = contents.match(/(?<=class="ugc.*>)[\s\S]*?(?=<\/div>\n+<\/div>\n*<\/body>)/m);
			if (pressBooksContent) {
				contents = pressBooksContent[0];
			}
			
			let title = page.title || `Untitled Page ${("" + ++untitled).padStart(2, "0")}`;
			let path = title;
			
			let chapterNumber = path.match(/.*?(?=\.)/);
			if (!isSimple && chapterNumber) { //adds padding if necessary
				chapterNumber = parseInt(chapterNumber[0]);
				path = chapterNumber < 10 ? "0" + path : path;
			}
			path = isSimple ? `${onlinePath}/${path}` : `${onlinePath}/${filteredChapters[chapterNumber - 1].padded}/${path}`;
			
			//remove extraneous link tags
			let containerTags = contents.match(/<a>\n\s*?<img [\s\S]*?<\/a>/gm);
			if (containerTags) {
				for (let i = 0; i < containerTags.length; i++) {
					let toReplace = containerTags[i].match(/<img.*?"\/>/)[0];
					contents = contents.replace(containerTags[i], toReplace);
				}
			}
			
			contents = await uploadImages(contents, path, imageProcessor, data);
			
			async function imageProcessor(imagePath) {
				let filename = decodeURIComponent(imagePath);
				let prefix = page.href.match(/.*\//);
				prefix = prefix ? prefix[0] : '';
				if (prefix && filename.startsWith('../')) {
					prefix = prefix.match(/.*\/(?=.*?\/$)/)[0];
					filename = filename.match(/(?<=\.\.\/).*/)[0];
				}
				return [filename, await epub.readFile(prefix + filename)];
			}
			
			let response = await Working.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&title=${encodeURIComponent(title)}`, {
				method: 'POST',
				body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
			});
			if (!response.ok) {
				let error = await response.text();
				console.error(error);
				socket.emit('errorMessage', error);
			}
			await Working.putProperty('mindtouch.page#welcomeHidden', true, path);
			
			//report page upload
			console.log('Topic', page.title || title);
			let entry = {
				title: page.title,
				type: 'Topic',
				url: `https://${data.subdomain}.libretexts.org/${path}`,
			};
			backlog.push(entry);
			log.push(entry);
			eta.iterate();
			socket.emit('progress', {
				percentage: `${Math.round(log.length / whole.length * 1000) / 10}%`,
				pages: `${log.length} / ${whole.length} pages uploaded`,
				eta: eta.format("{{etah}}"),
			});
		}
	}
}

async function putProperty(name, value, path, subdomain, username) {
	await LibreTexts.authenticatedFetch(path, "properties", subdomain, username, {
		method: "POST",
		body: value,
		headers: {
			"Slug": name
		}
	})
}

async function uploadImages(contents, path, imageProcessor, data) {
	//Rewrite image src url
	let images = contents.match(/<img .*?src=".*?\/.*?>/g);
	let src = contents.match(/(?<=<img .*?src=").*?(?=")/g);
	const atRoot = images === null;
	if (atRoot) {
		images = contents.match(/<img .*?src=".*?>/g);
	}
	if (src) {
		for (let i = 0; i < src.length; i++) {
			if (!src[i].startsWith('http')) {
				let [filename, image, filePath] = await imageProcessor(src[i]);
				if (!image) {
					console.error(`Could not find ${filePath}`);
					continue;
				}
				const fileID = await uploadImage(filename, path, image, data.subdomain, data.user, data.socket);
				let toReplace;
				if (atRoot) { // at root url
					toReplace = images[i].replace(/(?<=<img .*?src=)"/, `"/@api/deki/files/${fileID}/`);
				}
				else {
					toReplace = images[i].replace(/(?<=<img .*?src=").*\//, `/@api/deki/files/${fileID}/`);
				}
				
				contents = contents.replace(images[i], toReplace);
				contents = contents.replace(/(?<=<img .*?alt=")[^\/"]*?\/(?=.*?")/, '');
			}
		}
	}
	return contents;
	
	async function uploadImage(filename, path, image, subdomain, username, socket) {
		if (!image) {
			socket.emit('errorMessage', filename);
			return false;
		}
		let shortname = filename.match(/(?<=\/)[^\/]*?$/);
		if (shortname) {
			filename = shortname[0];
		}
		let response = await LibreTexts.authenticatedFetch(path, `files/${encodeURIComponent(encodeURIComponent(filename))}?dream.out.format=json`, subdomain, username, {
			method: 'PUT',
			body: image,
		});
		if (response.ok) {
			let fileID = await response.json();
			return fileID['@id'];
		}
		else {
			console.error(filename);
			socket.emit('errorMessage', filename);
			return false;
		}
	}
}
/*
async function processXHTML(text) {
	let title = getProperty("title");
	let copyright = getProperty("book-license");
	let author = getProperty("authors");
	let coverImage = getProperty("cover-image");
	let splice = text.match(/<div .*?\n^<\/div>/gm);
	let filtered = [];
	for (let i = 0; i < splice.length; i++) {
		if (splice[i].startsWith("<div class=\"chapter")) {
			//front and back matter ignored
			filtered.push(splice[i]);
		}
	}
	let root = `https://${subdomain}.libretexts.org/Under_Construction/Users/Henry/${title}`;
	let contentArray = await processPages(filtered, root);
	reportMessage(contentArray);
	function getProperty(property) {
		let regex = new RegExp(`(?<=<meta name="pb-${property}" content=).*(?=" \\/>)`);
		let result = text.match(regex);
		return result ? result[0] : null;
	}
	async function processPages(splice, root) {
		async function processPage(page) {
			let title = page.match(/(?<=<div class=".*?-title-wrap">.*?-title">).*?(?=<.*?<\/div>)/)[0];
			let content = page.match(/(?<=<div class=".*?-title-wrap">.*?<\/div><.*?>).*(?=<\/div)/)[0];
			let sourceImages = page.match(/(?<=<img .*src=").*?(?=")/g);
			let filenames = sourceImages.map((image) => {
				return image.match(/[^/]+(?=\/$|$)/)[0];
			});
			let path = "";
			for (let i = 0; i < content.length; i++) {
				let regex = new RegExp(`(?<=<img .*src=")${sourceImages[i]}(?=")`);
				content = content.replace(regex, `${root}${path}/${filenames[i]}`)
			}
			return {title: title, content: content, sourceImages: sourceImages, filenames};
		}
		return await mapLimit(splice, 10, processPage);
	}
}*/