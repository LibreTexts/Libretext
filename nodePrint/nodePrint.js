const http = require('http');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");
const colors = require("./colors");
const {performance} = require('perf_hooks');
const timestamp = require("console-timestamp");
const util = require('util');
const async = require("async");
const Eta = require('node-eta');
const md5 = require('md5');
const events = require('events');
const fetch = require('node-fetch');
const querystring = require('querystring');
const merge = util.promisify(require('./PDFMerger.js'));
const pdf = require('pdf-parse');
const findRemoveSync = require('find-remove');
const storage = require('node-persist');
const JSZip = require("jszip");
const he = require("he");
const deepMerge = require('deepmerge');
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');

var Gbrowser;
var Gserver;
var keys;

puppeteer.launch({
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox'
	],
	// headless: false,
	// devtools: true,
}).then(
	async (browser) => {
		const server = http.createServer(handler);
		const localServer = http.createServer(handler);
		const staticFileServer = new nodeStatic.Server('./public');
		let port = 3001;
		keys = await fetch('https://keys.libretexts.org/authenBrowser.json', {headers: {origin: 'print.libretexts.org'}});
		keys = await keys.json();
		server.listen(port);
		if (process.argv.length >= 3 && parseInt(process.argv[2])) {
			port = parseInt(process.argv[2]);
			localServer.listen(port);
		}
		const now1 = new Date();
		await storage.init();
		console.log("Restarted " + timestamp('MM/DD hh:mm', now1) + " Port:" + port);
		fs.ensureDir('./PDF/Letter/Margin');
		fs.ensureDir('./PDF/A4/Margin');
		
		
		let working = {};
		const eventEmitter = new events.EventEmitter();
		
		//Determine if in Kubernetes
		let kubernetesServiceHost = process.env.NODE_BALANCER_SERVICE_HOST;
		if (kubernetesServiceHost) {
			console.log(`In Kubernetes cluster: ${kubernetesServiceHost}`);
		}
		
		Gbrowser = browser;
		Gserver = server;
		
		async function handler(request, response) {
			let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
			ip = ip.padEnd(15);
			request.url = request.url.replace("print/", "");
			request.url = request.url.replace(/https?:\/([A-z].*?).libretexts.org/, "https://$1.libretexts.org/");
			let url = clarifySubdomain(request.url);
			
			let size = 'Letter';
			url = url.replace("Letter/", "");
			if (url.startsWith('/A4')) {
				url = url.split('/A4')[1];
				size = 'A4'
			}
			
			if (url.startsWith("/url=")) { //single page
				url = url.split('/url=')[1];
				
				//query string handling
				let isNoCache = false;
				let isOffload = false;
				let withMargin = false;
				if (url.includes("?nocache")) {
					isNoCache = true;
					url = url.replace("?nocache", "");
				}
				if (url.includes("?no-cache")) {
					isNoCache = true;
					url = url.replace("?no-cache", "");
				}
				if (url.includes("?offload") || url.includes("&offload")) {
					isOffload = true;
					url = url.replace("?offload", "");
					url = url.replace("&offload", "");
					ip = 'BatchOffload';
				}
				if (url.endsWith("?margin")) {
					url = url.slice(0, -7);
					withMargin = true;
				}
				if (url.includes('Grewal_and_Wakim'))
					withMargin = true;
				if (url.endsWith(".pdf")) {
					url = url.slice(0, -4);
				}
				
				if (!url.includes("libretexts.org")) {
					responseError();
					return;
				}
				const escapedURL = md5(url);
				
				// response.setHeader("Content-Disposition","attachment");
				
				getPDF(url, ip, isNoCache).then((result) => {
					if (result) {
						if (isOffload) {
							response.writeHead(200);
							response.write(JSON.stringify(result));
							response.end();
						}
						else if (withMargin)
							staticFileServer.serveFile(`../PDF/${size}/Margin/${escapedURL}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
						else if (result.filename === 'restricted') {
							responseError('This page is not publicly accessible.', 403)
						}
						else
							staticFileServer.serveFile(`../PDF/${size}/${escapedURL}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
					}
				}, (err) => responseError("Server \n" + err, 500));
				
			}
			else if (url.startsWith("/Libretext=")) {
				if ((request.headers.origin && request.headers.origin.endsWith("libretexts.org")) || request.headers.host === 'localhost') {
					if (request.method === "GET") {
						response.writeHead(200, {"Content-Type": " application/json"});
						url = url.split('/Libretext=')[1];
						let params = querystring.parse(url.split('?')[1]);
						url = url.split('?')[0];
						for (let param in params) {
							if (params[param] === "")
								params[param] = true;
						}
						params.ip = ip;
						console.log(`Received Libretext request ${ip}`);
						let finished = await getLibretext(url, response, params);
						let [subdomain, path] = parseURL(url);
						
						await fetch('https://api.libretexts.org/endpoint/refreshListAdd', {
							method: 'PUT',
							body: JSON.stringify({
								subdomain: subdomain,
								path: path.match(/^.*?(?=\/)/)[0],
								identifier: md5(keys[subdomain]),
								content: finished
							}),
							headers: {
								origin: 'print.libretexts.org'
							}
						});
						
						response.end();
					}
					else {
						responseError(request.method + " Not Acceptable", 406)
					}
				}
				else {
					responseError("CORS Error " + request.headers.origin, 403);
				}
			}
			else if (url === '/' || url.startsWith("/ping")) {
				if (request.headers.host && request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
					response.writeHead(200, {
						"Access-Control-Allow-Origin": request.headers.origin || null,
						"Access-Control-Allow-Methods": "GET",
						"Content-Type": " text/plain",
					});
					response.end();
				}
				else if (request.method === "GET") {
					response.writeHead(200, request.headers.host && request.headers.host.includes(".miniland1333.com") ? {
						"Access-Control-Allow-Origin": request.headers.origin || null,
						"Access-Control-Allow-Methods": "GET",
						"Content-Type": " text/plain",
					} : {"Content-Type": " text/plain"});
					response.end();
				}
				else {
					responseError(request.method + " Not Acceptable", 406)
				}
			}
			else if (url.startsWith('/toc=')) {
				url = url.split('/toc=')[1];
				if (url.endsWith(".pdf")) {
					url = url.slice(0, -4);
				}
				let file = await getTOC(url, null);
				staticFileServer.serveFile(`../PDF/${size}/TOC/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
			}
			else if (url.startsWith('/cover=')) {
				url = url.split('/cover=')[1];
				if (url.endsWith(".pdf")) {
					url = url.slice(0, -4);
				}
				let options = url.split('&options=');
				if (options[1]) {
					url = options[0];
					options = JSON.parse(decodeURIComponent(options[1]));
				}
				else
					options = {};
				
				let current = await getSubpages(url, {children: []});
				
				
				let file = await getCover(current, options.numPages, options);
				staticFileServer.serveFile(`../PDF/${size}/Cover/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
			}
			else if (url.startsWith('/testCover')) {
				let current = await getSubpages('https://socialsci.libretexts.org/Courses/University_of_Hawaii_Maui_College/UHMC%3A_PSY_212_-_Research_Methods_(Thornton)', {children: []});
				let options = url.split('?options=');
				if (options[1]) {
					options = JSON.parse(decodeURIComponent(options[1]));
				}
				else
					options = {hasExtraPadding: true};
				let file = await getCover(current, 216, options); //, url.includes('pad'), url.includes('hard')
				staticFileServer.serveFile(`../PDF/${size}/Cover/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
			}
			else if (url.startsWith('/tocHTML=')) {
				url = url.split('/tocHTML=')[1];
				if (url.endsWith(".pdf")) {
					url = url.slice(0, -4);
				}
				let file = await getTOC(url, null, true);
				response.write(file);
				response.end();
			}
			else if (url.startsWith('/Finished/')) {
				url = url.split('/Finished/')[1];
				url = decodeURIComponent(url);
				if (await fs.exists(`./PDF/${size}/Finished/${url}`)) {
					staticFileServer.serveFile(`../PDF/${size}/Finished/${url}`, 200, {
						'Content-Disposition': 'attachment',
						'cache-control': 'no-cache'
					}, request, response);
					let count = await storage.getItem('downloadCount') || 0;
					await storage.setItem('downloadCount', count + 1);
					let now2 = new Date();
					await fs.appendFile(`./public/StatsFull.txt`, `${timestamp('MM/DD hh:mm', now2)}: ${ip} ${url}\n`);
				}
				else {
					console.error(url);
					staticFileServer.serveFile("404.html", 404, {}, request, response);
				}
			}
			else if (url === '/Stats') {
				response.write("" + (await storage.getItem('downloadCount') || 0));
				response.end();
			}
			else if (url === '/StatsFull') {
				staticFileServer.serveFile(`./StatsFull.txt`, 404, {'cache-control': 'no-cache'}, request, response);
			}
			else if (url.startsWith('/Refresh=')) {
				//Remove all files older than 2 months.
				console.log(`Cleaning...`);
				let count = 0;
				let heartbeat = setInterval(() => {
					if (response)
						response.write(`${(++count)}s\r\n`.padStart(5, ' '))
				}, 1000);
				findRemoveSync('./PDF', {
					age: {seconds: 40 * 8.64e+4},
					dir: "*",
					files: "*.*",
				});
				if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
					responseError('Unauthorized', 401);
				}
				
				url = url.split('/Refresh=')[1];
				let isNoCache = false;
				if (url.endsWith('?no-cache')) {
					url = url.replace('?no-cache', '');
					isNoCache = true;
				}
				
				// try {
				let subdomains = url.split('/')[0];
				let paths;
				if (subdomains === 'all') {
					subdomains = ["bio", "biz", "chem", "eng", "espanol", "geo", "human", "math", "med", "phys", "socialsci", "stats", "workforce"];
					paths = ['Courses', 'Bookshelves'];
					console.log(`Starting All ${subdomains.join(', ')}`)
				}
				else {
					subdomains = subdomains.split(',');
					if (!url.includes('/')) {
						paths = ['Courses', 'Bookshelves'];
					}
					else {
						paths = url.split('/').slice(1).join('/');
						if (paths === 'all') {
							paths = ['Courses', 'Bookshelves'];
						}
						else {
							paths = paths.split(',');
						}
					}
				}
				console.log(subdomains, paths);
				
				for (let i = 0; i < subdomains.length; i++) {
					for (let j = 0; j < paths.length; j++) {
						let subdomain = subdomains[i];
						let path = subdomain === 'espanol' ? 'home' : paths[j];
						
						console.log(`Starting Refresh ${subdomain} ${path} ${ip}`);
						let all = await getSubpages(`https://${subdomain}.libretexts.org/${path}`, {delay: true});
						let texts = [];
						let standalone = [];
						let finished = [];
						sort(all);
						
						function sort(current) {
							for (let i = 0; i < current.children.length; i++) {
								let page = current.children[i];
								if (page.tags.includes('coverpage:yes')) {
									texts.push(page);
								}
								else {
									standalone.push(page.url);
									sort(page);
								}
							}
						}
						
						clearInterval(heartbeat);
						if (!response.finished)
							response.write(`Processing ${texts.length} LibreTexts`); // and ${standalone.length} standalone pages
						response.end();
						
						//process Texts
						console.log(`Processing ${texts.length} LibreTexts`);
						await async.mapLimit(texts, 2, async (current) => {
							finished.push(await getLibretext(current.url, null, {
								current: current,
								ip: ip,
								nocache: isNoCache,
								multiple: true,
							}));
						});
						
						/*
						console.log(`Processing ${standalone.length} standalone pages`);
						await async.mapLimit(standalone, kubernetesServiceHost ? 10 : 6, async (pageURL) => {
							if (kubernetesServiceHost) {
								let offloadURL = `http://${kubernetesServiceHost}/url=${pageURL}`;
								if (isNoCache)
									offloadURL += '?no-cache&offload';
								else
									offloadURL += '?offload';
								
								let offload = await fetch(offloadURL);
								await offload.json();
							}
							else {
								await getPDF(pageURL, ip, isNoCache);
							}
						});*/
						await fetch('https://api.libretexts.org/endpoint/refreshList', {
							method: 'PUT',
							body: JSON.stringify({
								subdomain: subdomain,
								path: path,
								identifier: md5(keys[subdomain]),
								content: finished
							}),
							headers: {
								origin: 'print.libretexts.org'
							}
						});
						console.log(`Finished Refresh ${subdomain} ${path} ${ip}`);
						if (subdomain === 'espanol')
							break; //Only processing home path
						
					}
				}
				
			}
			else { //static server
				// console.log(url);
				staticFileServer.serve(request, response, function (error, res) {
					//on error
					if (error && error.status === 404) {//404 File not Found
						staticFileServer.serveFile("404.html", 404, {}, request, response);
					}
				});
			}
			
			
			function responseError(message, status) {
				//else fall through to error
				if (!response.finished) {
					response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
					response.write(message ? message : "Bad Request\n" + url);
					response.end();
				}
			}
		}
		
		function addLinks(children) {
			let array = [];
			if (children && children.length) {
				children.forEach((child) => {
					if (child.title === 'Front Matter' || child.title === 'Back Matter')
						return;
					let result = [child];
					array = array.concat(result.concat(addLinks(child.children)));
				});
			}
			return array;
		}
		
		async function getLicense(url, subdomain) {
			let sourceArray = url.split("/");
			let path = sourceArray.slice(3, sourceArray.length).join("/");
			let tags = await authenticatedFetch(path, 'tags?dream.out.format=json', subdomain);
			if (!tags.ok) {
				let error = await tags.text();
				console.error(`getCC: ${error}`);
			}
			tags = await tags.text();
			if (tags) {
				tags = JSON.parse(tags);
				if (tags.tag) {
					if (tags.tag.length) {
						tags = tags.tag.map((tag) => tag["@value"]);
					}
					else {
						tags = tags.tag["@value"];
					}
				}
				
				for (let i = 0; i < tags.length; i++) {
					if (tags[i].includes("license")) {
						let tag = tags[i].split(":")[1];
						switch (tag) {
							case "publicdomain":
								return {label: "CC-PublicDomain", link: "#"};
							case "ccby":
								return {label: "CC-BY", link: "https://creativecommons.org/licenses/by/4.0/"};
							case "ccbysa":
								return {label: "CC-BY-SA", link: "https://creativecommons.org/licenses/by-sa/4.0/"};
							case "ccbyncsa":
								return {
									label: "CC-BY-NC-SA",
									link: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
								};
							case "ccbync":
								return {label: "CC-BY-NC", link: "https://creativecommons.org/licenses/by-nc/4.0/"};
							case "ccbynd":
								return {label: "CC-BY-ND", link: "https://creativecommons.org/licenses/by-nd/4.0/"};
							case "ccbyncnd":
								return {
									label: "CC-BY-NC-ND",
									link: "https://creativecommons.org/licenses/by-nc-nd/4.0/"
								};
							case "gnu":
								return {label: "GPL", link: "https://www.gnu.org/licenses/gpl-3.0.en.html"};
							case "gnudsl":
								return {
									label: "GNU Design Science License",
									link: "https://www.gnu.org/licenses/dsl.html"
								};
							case "gnufdl":
								return {
									label: "GNU Free Documentation License",
									link: "https://www.gnu.org/licenses/fdl-1.3.en.html"
								};
							case "arr":
								return {label: "© All Rights Reserved", link: ""};
						}
					}
				}
			}
			return null; //not found
		}
		
		async function checkTime(url) {
			const sourceArray = url.split("/");
			const domain = sourceArray.slice(0, 3).join("/");
			let path = sourceArray.slice(3, sourceArray.length).join("/");
			let origin = url.split("/")[2].split(".");
			const subdomain = origin[0];
			let response = await authenticatedFetch(path, 'revisions?dream.out.format=json', subdomain);
			if (response.ok) {
				response = await response.json();
				response = response.page;
				if (response.length) {
					response = response[response.length - 1]
				}
				return new Date(response['date.edited']);
			}
			else {
				let error = await response.text();
				// console.error(`checkTime: ${error}`);
				return 'restricted';
			}
		}
		
		async function getInformation(current) {
			for (let i = 0; i < current.tags.length; i++) {
				let tag = current.tags[i];
				let items;
				if (tag)
					tag = tag.replace(/\\\\/g, '\n');
				if (tag.startsWith('lulu@')) {
					items = tag.split('@');
				}
				else if (tag.startsWith('lulu|')) {
					items = tag.split('|');
				}
				else if (tag.startsWith('lulu,')) {
					items = tag.split(',');
				}
				if (items) {
					if (items[1])
						current.title = items[1];
					if (items[2])
						current.name = items[2];
					if (items[3])
						current.companyname = items[3];
					if (items[4])
						current.spineTitle = items[4];
				}
				else if (tag.startsWith('authorname:')) {
					current.authorTag = tag.replace('authorname:', '');
					
					if (!current.name) {
						if (typeof getInformation.libreAuthors === 'undefined') {
							let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${current.subdomain}`, {headers: {'origin': 'print.libretexts.org'}});
							getInformation.libreAuthors = await authors.json();
						}
						
						let information = getInformation.libreAuthors[current.authorTag];
						if (information) {
							Object.assign(current, information);
						}
					}
				}
			}
		}
		
		async function getCover(current, numPages, options = {}) {
			await fs.ensureDir(`./PDF/Letter/Cover`);
			await fs.ensureDir(`./PDF/A4/Cover`);
			let escapedURL = md5(current.url);
			const page = await browser.newPage();
			
			/*let origin = url.split("/")[2].split(".");
			const subdomain = origin[0];
			let path = url.split('/').splice(3).join('/');*/
			await getInformation(current);
			
			let overview = current.properties.find(prop => prop['@name'] === 'mindtouch.page#overview');
			let logo = current.tags.find(tag => tag.startsWith('luluCover@'));
			if (overview)
				overview = overview.contents['#text'];
			if (logo)
				logo = logo.split('luluCover@')[1];
			
			let style = `<link rel="stylesheet" type="text/css" href="http://localhost:${port}/print/cover.css"/><script src="http://localhost:${port}/print/qrcode.js"></script>
		<link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i" rel="stylesheet"><style>#frontContainer{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluFront' : 'NormalFront'}/${current.subdomain}.png")}#backContainer{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluBack' : 'NormalBack'}/${current.subdomain}.png")</style>`;
			let frontContent = `<div id="frontContainer"><div><div id="frontTitle">${current.title || ''}</div></div><div><div id="frontCite"><i>${current.name || ''}</i><br/>${current.companyname || ''}</div></div></div>`;
			let backContent = `<div id="backContainer"><div>${logo ? `<img id="backLogo" src="${logo}">` : ''}</div><div><div id="backOverview">${overview}</div><canvas id="canvas"></canvas></div></div></div>`;
			let spine = `<div id="spine"><div>${current.spineTitle || current.title || ''}</div><div id="spineCite"><b style="flex:1; text-align: center">${current.name || ''}</b><img src="http://localhost:${port}/print/header_logo_mini.png"/></div></div><style>#spine{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluSpine' : 'NormalSpine'}/${current.subdomain}.png")}></style>`;
			spine += `<style>#spine{ width: ${getSpine() / getWidth() * 100}%; font-size: ${getSpine() / getWidth() * 500}px}</style>`;
			
			let content = numPages ? `${style}${backContent}${(options.thin ? '' : spine)}${frontContent}` : `${style}${frontContent}`;
			if (options.hasExtraPadding) {
				content += `<style>#frontContainer, #backContainer {padding: 117px 50px;} #spine {padding: 117px 0;}</style>`;
			}
			let QRoptions = {errorCorrectionLevel: 'L', margin: 2, scale: 2, color: {dark: '#127bc4', light: '#fff'}};
			content += `<script>QRCode.toCanvas(document.getElementById('canvas'), '${current.url}', ${JSON.stringify(QRoptions)},  function (error) {if (error) console.error(error);console.log('success!');})</script>`;
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			
			try {
				await page.setContent(content,
					{waitUntil: ["load", "domcontentloaded", 'networkidle0']});
			} catch (e) {
			
			}
			await page.pdf({
				path: `./PDF/Letter/Cover/${escapedURL}.pdf`,
				printBackground: true,
				width: numPages ? `${getWidth()} in` : '8.5 in',
				height: numPages ?
					(options.isHardcover ? '12.75 in' : '11.25 in') : '11 in',
			});
			await page.addStyleTag({content: `#spine{ font-size: ${getSpine() / (getWidth() - 0.46) * 500}px}`});
			await page.pdf({
				path: `./PDF/A4/Cover/${escapedURL}.pdf`,
				printBackground: true,
				width: numPages ? `${getWidth() - 0.46} in` : '8.26 in',
				height: numPages ? (options.isHardcover ? '13.44 in' : '11.94 in') : '11.69 in',
			});
			
			// console.log(numPages ? getWidth() : '8.5 in', numPages ? (isHardcover ? '12.750 in' : '11.25 in') : '11 in');
			await page.close();
			return escapedURL;
			
			function getSpine() {
				let sizes = {
					'0': null,
					'24': .25,
					'84': .5,
					'140': .625,
					'169': .6875,
					'195': .75,
					'223': .8125,
					'251': .875,
					'279': .9375,
					'307': 1,
					'335': 1.0625,
					'361': 1.125,
					'389': 1.1875,
					'417': 1.25,
					'445': 1.3125,
					'473': 1.375,
					'501': 1.4375,
					'529': 1.5,
					'557': 1.5625,
					'583': 1.625,
					'611': 1.6875,
					'639': 1.75,
					'667': 1.8125,
					'695': 1.875,
					'723': 1.9375,
					'751': 2,
					'779': 2.0625,
					'800': 2.125,
				};
				if (options.thin) {
					return 0;
				}
				else if (!options.hasExtraPadding) { //Amazon size
					return numPages * 0.002252;
				}
				else if (options.isHardcover) {
					let result = '';
					for (let number in sizes) {
						if (numPages > parseInt(number)) {
							result = sizes[parseInt(number)];
						}
					}
					if (result) {
						return result;
					}
					
				}
				else {
					let width = (numPages / 444) + 0.06;
					width = Math.floor(width * 1000) / 1000;
					return width;
				}
			}
			
			function getWidth() {
				// return '20.125 in';
				let sizes = {
					'0': null,
					'24': .25,
					'84': .5,
					'140': .625,
					'169': .6875,
					'195': .75,
					'223': .8125,
					'251': .875,
					'279': .9375,
					'307': 1,
					'335': 1.0625,
					'361': 1.125,
					'389': 1.1875,
					'417': 1.25,
					'445': 1.3125,
					'473': 1.375,
					'501': 1.4375,
					'529': 1.5,
					'557': 1.5625,
					'583': 1.625,
					'611': 1.6875,
					'639': 1.75,
					'667': 1.8125,
					'695': 1.875,
					'723': 1.9375,
					'751': 2,
					'779': 2.0625,
					'800': 2.125,
				};
				if (options.thin) {
					return 17.25;
				}
				else if (!options.hasExtraPadding) { //Amazon size
					// console.log(numPages * 0.002252);
					return numPages * 0.002252 + 0.375 + 17;
				}
				else if (options.isHardcover) {
					let result = '';
					for (let number in sizes) {
						if (numPages > parseInt(number)) {
							result = sizes[parseInt(number)];
						}
					}
					if (result) {
						return result + 18.75;
					}
					
				}
				else {
					let width = (numPages / 444) + 0.06 + 17.25;
					width = Math.floor(width * 1000) / 1000;
					return width;
				}
			}
		}
		
		async function getTOC(url, subpages, isHTML) {
			await fs.ensureDir('./PDF/Letter/TOC');
			await fs.ensureDir('./PDF/Letter/Margin/TOC');
			await fs.ensureDir('./PDF/A4/TOC');
			await fs.ensureDir('./PDF/A4/Margin/TOC');
			let escapedURL = md5(url);
			console.log('Starting TOC');
			const start = performance.now();
			subpages = subpages || await getSubpages(url);
			const page = await browser.newPage();
			
			function safe(input) {
				if (input)
					return he.encode(input, {'useNamedReferences': true});
			}
			
			let origin = url.split('/')[2].split('.');
			const subdomain = origin[0];
			let path = url.split('/').splice(3).join('/');
			
			let properties = subpages.properties;
			properties = properties.find((prop) => prop['@name'] === 'mindtouch.page#overview' ? prop.contents['#text'] : false);
			properties = properties && properties.contents && properties.contents['#text'] ?
				safe(properties.contents['#text']) : '';
			let tags = subpages.tags;
			
			let content = `<div style="padding: 0 0 10px 0" class="summary">${properties}</div></div>${await getLevel(subpages)}`;
			if (tags.includes('coverpage:yes')) {
				await authenticatedFetch(`${path}/Front_Matter/10: Table of Contents`, `contents?title=Table of Contents&edittime=now&comment=[PrintBot] Weekly Batch ${timestamp('MM/DD', new Date())}`, subdomain, 'PrintBot', {
					method: 'POST',
					body: content + '<p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic</a></p>\n',
				});
			}
			content = `${tags.includes('coverpage:yes') ? '<h1>Table of Contents</h1>' : `<div class="nobreak"><a href="${subpages.url}"><h1>${subpages.title}</h1></a>`}` + content;
			content += '<script src=\'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML\' async></script>\n ' +
				'<style>a {text-decoration: none; color:#127bc4}' +
				'body>ul {list-style-type: none; color:black}' +
				'h2>a{color:#127bc4}' +
				'li {list-style-type:none}' +
				// '* {border: 1px solid blue}' +
				'ul {margin: 10px 0 0 0; padding: 0; column-gap: 30px}' +
				'.indent {margin-left: 10px;}' +
				'h2, h3, h4, h5, h, l {margin: 10px 0 0 0; font-weight: normal;}' +
				'li:first-child > div > h2 {margin: 0;}' +
				'h1, h2, h3, h4, h5, h {text-transform: uppercase; font-family:"Tahoma", Arial, serif}' +
				'.nobreak {page-break-inside: avoid;}' +
				'.summary {text-align: justify; text-justify: inter-word;}' +
				'body {font-size: 12px; font-family: \'Big Caslon\', \'Book Antiqua\', \'Palatino Linotype\', Georgia, serif}</style>' +
				'<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:r,b,i%7CSource+Code+Pro:r,b" media="all">';
			if (isHTML) {
				const end = performance.now();
				let time = end - start;
				time /= 100;
				time = Math.round(time);
				time /= 10;
				// console.log(`TOC HTML Created: ${time}s ${escapedURL}`);
				return content;
			}
			
			try {
				await page.setContent(content,
					{waitUntil: ["load", "domcontentloaded", 'networkidle0']});
			} catch (e) {
			
			}
			
			async function getLevel(subpages, level = 2, isSubTOC) {
				let result = '';
				if (subpages.children && subpages.children.length) {
					// subpages.children = subpages.children.filter(child=>child.title!=='Front Matter' && child.title!=='Back Matter');
					let twoColumn = tags.includes('columns:two') && tags.includes('coverpage:yes');
					
					if (level === 2 && tags.includes('article:topic-guide')) {
						isSubTOC = 'yes';
						level = 3;
					}
					
					let prefix = `h${level}`;
					
					let hasLower = false;
					let temp = [];
					for (let i = 0; i < subpages.children.length; i++) {
						hasLower = hasLower || subpages.children[i].children.length;
						temp.push(subpages.children[i]);
					}
					subpages.children = temp;
					if (!hasLower) { //at lowest level
						prefix = isSubTOC === 'yes' ? 'h' : 'l';
					}
					
					//Summary Handling
					let inner = await async.map(subpages.children, async (elem, callback) => {
						let summary = '';
						let isSubtopic = elem.title.match(/^[0-9.]+\.[0-9]+\.[A-Z]: /) && elem.tags.includes('article:topic') ? 'indent' : null;
						if (prefix !== 'l' && !isSubtopic) {
							let path = elem.url.split('/').splice(3).join('/');
							
							properties = elem.properties.find((prop) => prop['@name'] === 'mindtouch.page#overview' ? prop.contents['#text'] : false);
							let good = properties && properties.contents && properties.contents['#text'];
							if (good && (!elem.tags.includes('article:topic') || isSubTOC)) {
								summary = `<div style="padding-bottom:10px" class="summary">${safe(properties.contents['#text'])}</div>`;
							}
						}
						
						return `<li><div class="nobreak"><${prefix} class="${isSubtopic}"><a href="${elem.url}">${elem.title}</a></${prefix}>${summary}${twoColumn ? '' : '</div>'}${await getLevel(elem, level + 1, isSubTOC)}${twoColumn ? '</div>' : ''}</li>`
					});
					inner = inner.join('');
					
					result = `<ul ${twoColumn ? 'style="column-count: 2"' : ''}>${inner}</ul>`;
				}
				
				return result;
			}
			
			const topIMG = baseIMG[subdomain];
			const color = colors[subdomain];
			
			const cssb = [];
			cssb.push('<style>');
			cssb.push('#mainH {display:flex; margin: -1px 40px 0 40px; width: 100vw}');
			cssb.push(`#mainF {display:flex; margin: -1px 50px 0 50px; width: 100vw; font-size:7px; justify-content: center; background-color: ${color}; border-radius: 10px; padding:0px 8px;}`);
			cssb.push('#main {border: 1px solid blue;}');
			cssb.push(`#library {background-color: ${color}; flex:1; display:inline-flex; justify-content:flex-end; border-radius: 0 7px 7px 0; margin:5px 0}`);
			cssb.push('* { -webkit-print-color-adjust: exact}');
			cssb.push('.date, .pageNumber {display: inline-block}');
			cssb.push('.added {padding: 0px 4px}');
			cssb.push('a {text-decoration:none; color: white}');
			cssb.push(`.trapezoid{ position:relative; display:inline-block; border-bottom: 20px solid ${color}; border-right: 0px solid transparent; border-left: 8px solid transparent; width: 9px; top: -10px; left: 1px; }`);
			cssb.push(`.trapezoid:before{ content:\' \'; left:-8px; top:37px; position:absolute; background: ${color}; border-radius:80px 0px 0px 80px; width:17px; height:8px; }`);
			cssb.push(`.trapezoid:after { content:\' \'; left:-1px; top:15px; position:absolute; background: ${color}; border-radius:75px 0px 0px 80px; width:10px; height:19px; }`);
			cssb.push('</style>');
			const css = cssb.join('');
			const prefix = 'TOC.'; //TODO adjust for chapter guides
			
			const style1 = '<div id="mainH">' +
				'<a href="https://libretexts.org" style="display: inline-block"><img src="data:image/jpeg;base64,' + baseIMG["default"] + '" height="30" style="padding:5px; margin-right: 10px"/></a>' +
				'<div class="trapezoid"></div>' +
				`<div id="library"><a href="https://${subdomain}.libretexts.org" style="width: fit-content; background: ${color}; border-radius: 10px;"><img src="data:image/png;base64,${topIMG}" height="20" style="padding:5px;"/></a></div>` +
				'</div>';
			
			const style2 = `<div id="mainF">` +
				`<div style="flex:1; display:inline-flex; align-items: center; justify-content: flex-start; color:#F5F5F5;" class='added'></div>` +
				`<div style="background-color: white; border: 1px solid ${color}; color: ${color}; padding: 2px; border-radius: 10px; min-width: 10px; text-align: center; font-size: 8px">` + prefix + `<div class="pageNumber"></div></div>` +
				`<div style="flex:1; display:inline-flex; align-items: center;   justify-content: flex-end; color:#F5F5F5;">` +
				`<div>Updated <div class="date"/></div>` +
				'</div>';
			
			await page.pdf({ //Letter
				path: `./PDF/Letter/TOC/${escapedURL}.pdf`,
				displayHeaderFooter: true,
				headerTemplate: css + style1,
				footerTemplate: css + style2,
				printBackground: true,
				margin: {
					top: "90px",
					bottom: "60px",
					right: "0.75in",
					left: "0.75in",
				}
			});
			await page.pdf({ //A4
				path: `./PDF/A4/TOC/${escapedURL}.pdf`,
				displayHeaderFooter: true,
				headerTemplate: css + style1,
				footerTemplate: css + style2,
				printBackground: true,
				format: 'A4',
				margin: {
					top: "90px",
					bottom: "60px",
					right: "0.75in",
					left: "0.75in",
				}
			});
			await page.pdf({ //Lulu Letter
				path: `./PDF/Letter/Margin/TOC/${escapedURL}.pdf`,
				displayHeaderFooter: true,
				headerTemplate: css + style1 + '<style>div#mainH{margin-top:17px}</style>',
				footerTemplate: css + style2 + '<style>div#mainF{margin-bottom:15px}</style>',
				printBackground: true,
				margin: {
					top: "1in",
					bottom: ".75in",
					right: "0.75in",
					left: "0.75in",
				}
			});
			await page.pdf({ //Lulu A4
				path: `./PDF/A4/Margin/TOC/${escapedURL}.pdf`,
				displayHeaderFooter: true,
				headerTemplate: css + style1 + '<style>div#mainH{margin-top:17px}</style>',
				footerTemplate: css + style2 + '<style>div#mainF{margin-bottom:15px}</style>',
				printBackground: true,
				format: 'A4',
				margin: {
					top: "1in",
					bottom: ".75in",
					right: "0.75in",
					left: "0.75in",
				}
			});
			const end = performance.now();
			let time = end - start;
			time /= 100;
			time = Math.round(time);
			time /= 10;
			await page.close();
			console.log(`TOC Created: ${time}s ${escapedURL}`);
			return escapedURL;
		}
		
		async function getThinCC(current, destination) {
			const zip = new JSZip();
			let result;
			
			const {org, resources} = createXML(addChildren(current));
			
			function addChildren(current) {
				let subpages = current.children;
				let result = [];
				
				if (!subpages.length) //too shallow
					return {
						title: current.title,
						resources: [{
							title: subpages.title,
							url: subpages.url + "?contentOnly"
						}],
					};
				
				let hasLower = false;
				for (let i = 0; i < subpages.length; i++) {
					hasLower = hasLower || subpages[i].children.length;
				}
				if (hasLower) { //at least 2 levels
					let resourceArray = []; // for current
					let readyArray = []; // for children
					
					hasLower = false; //if children have children
					for (let i = 0; i < subpages.length; i++) {
						for (let j = 0; j < subpages[i].children.length; j++) {
							hasLower = hasLower || subpages[i].children[j].length;
						}
					}
					if (hasLower) { //go down a level
						for (let i = 0; i < subpages.length; i++) {
							readyArray.push(addChildren(subpages[i]));
						}
					}
					else { //just right
						for (let i = 0; i < subpages.length; i++) {
							resourceArray = subpages[i].children.map(child => {
								return {title: child.title, url: child.url + "?contentOnly"}
							});
							if (resourceArray.length) //remove empty
								result.push({title: subpages[i].title, resources: resourceArray});
						}
					}
					result = result.concat(readyArray);
				}
				else {
					result = subpages.map(child => {
						return { //too shallow
							title: child.title,
							resources: [{
								title: child.title,
								url: child.url + "?contentOnly"
							}],
						}
					});
				}
				
				return result;
			}
			
			function escapeTitle(unsafe) {
				return unsafe.replace(/[<>&'"]/g, function (c) {
					switch (c) {
						case '<':
							return '&lt;';
						case '>':
							return '&gt;';
						case '&':
							return '&amp;';
						case '\'':
							return '&apos;';
						case '"':
							return '&quot;';
					}
				});
			}
			
			function createXML(array) {
				if (!array || !array.length) {  // invalid CC
					return {org: false, resources: false};
				}
				let org = "";
				let resources = "";
				let counter = 1;
				
				function getIdentifier() {
					let result = "T_" + (counter.toString().padStart(6, "0"));
					counter++;
					return result;
				}
				
				array.forEach((item) => {
					if (item.hasOwnProperty("title") && item.hasOwnProperty("resources")) {
						org += "\n" +
							`            <item identifier=\"${getIdentifier()}\">\n` +
							`                <title>${escapeTitle(item.title)}</title>`;
						item.resources.forEach((resource) => {
							const identifier = getIdentifier();
							org += `
                <item identifier="${identifier}" identifierref="${identifier}_R">
                    <title>${escapeTitle(resource.title)}</title>
                </item>`;
							resources += `
        <resource identifier="${identifier}_R" type="imswl_xmlv1p1">
            <file href="${identifier}_F.xml"/>
        </resource>`;
							zip.file(`${identifier}_F.xml`,
								`<?xml version="1.0" encoding="UTF-8"?>
<webLink xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1" xmlns:xsi="http: //www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd">
	<title>${escapeTitle(resource.title)}</title>
	<url href="${resource.url.replace(/%3F/g, '%253F')}" target="_iframe"/>
</webLink>`);
						});
						org += "\n" +
							"            </item>";
					}
				});
				
				return {org: org, resources: resources};
			}
			
			const top = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
				"<manifest xmlns=\"http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1\" xmlns:lom=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource\" xmlns:lomimscc=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" identifier=\"cctd0015\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd\">\n" +
				"    <metadata>\n" +
				"        <schema>IMS Common Cartridge</schema>\n" +
				"        <schemaversion>1.1.0</schemaversion>\n" +
				"    <lomimscc:lom>\n" +
				"      <lomimscc:general>\n" +
				"        <lomimscc:title>\n" +
				`          <lomimscc:string language=\"en-US\">${escapeTitle(current.title)}</lomimscc:string>\n` +
				"        </lomimscc:title>\n" +
				"      </lomimscc:general>\n" +
				"    </lomimscc:lom>\n" +
				"    </metadata>\n" +
				"    <organizations>\n" +
				"        <organization identifier=\"T_1000\" structure=\"rooted-hierarchy\">\n" +
				"        <item identifier=\"T_00000\">";
			const middle = "\n" +
				"        </item>\n" +
				"        </organization>\n" +
				"    </organizations>\n" +
				"    <resources>";
			const end = "\n    </resources>\n" +
				"</manifest>";
			if (!org || !resources) { // invalid CC
				return false;
			}
			
			result = top + org + middle + resources + end;
			zip.file('imsmanifest.xml', result);
			result = await zip.generateAsync({type: "nodebuffer"});
			await fs.writeFile(destination, result);
		}
		
		async function getPDF(url, ip, isNoCache = false) {
			let escapedURL = md5(url);
			let stats, err;
			try {
				stats = await fs.stat(`./PDF/Letter/${escapedURL}.pdf`);
			} catch (e) {
				err = e;
			}
			
			if ((working[escapedURL] && Date.now() - working[escapedURL] > 60000)) {
				delete working[escapedURL];					//5 min timeout for DUPE
			}
			
			const daysCache = 35;
			const updateTime = await checkTime(url);
			let allExist = [fs.exists(`./PDF/Letter/Margin/${escapedURL}.pdf`),
				fs.exists(`./PDF/A4/${escapedURL}.pdf`),
				fs.exists(`./PDF/A4/Margin/${escapedURL}.pdf`)];
			allExist = await Promise.all(allExist);
			allExist = allExist.every((item) => item);
			
			if (updateTime === 'restricted') {
				console.error(`PRIVE  ${ip} ${url}`);
				return {filename: 'restricted'};
			}
			else if (!isNoCache && !err && stats.mtime > updateTime && Date.now() - stats.mtime < daysCache * 8.64e+7 && allExist) { //file is up to date
				// 8.64e+7 ms/day
				console.log(`CACHE  ${ip} ${url}`);
				return {filename: escapedURL + '.pdf'};
			}
			else if (working[escapedURL]) { //another thread is already working
				eventEmitter.on(escapedURL, () => {
					console.log(`DUPE   ${ip} ${url}`);
					// staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {'cache-control': 'no-cache'}, request, response);
				});
				return false;
			}
			
			const start = performance.now();
			console.log(`NEW    ${ip} ${url}`);
			
			const page = await browser.newPage();
			let timeout;
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			let failed = false;
			
			working[escapedURL] = Date.now();
			let PDFname = escapedURL;
			let title = '';
			
			try {
				let renderPDF = new Promise(async (resolve, reject) => {
					timeout = setTimeout(() => reject(new Error(`Render Timeout Reached  ${url}`)), 100000);
					try {
						page.on('dialog', async dialog => {
							await dialog.dismiss();
						});
						await page.goto(url + "?no-cache", {
							timeout: 50000,
							waitUntil: ["load", "domcontentloaded", 'networkidle0']
						});
					} catch (err) {
						console.error(`ERROR  Timeout Exceeded ${url}`);
					}
					
					const out = await page.evaluate(function (url) {
						let prefix = "";
						let title = document.getElementById("title");
						let innerText;
						
						if (title) {
							let color = window.getComputedStyle(title).color;
							innerText = title.textContent;
							if (innerText && innerText.includes(":")) {
								prefix = innerText.split(":")[0];
							}
							title.innerHTML = `<a style="color:${color}; text-decoration: none" href="${url}">${innerText}</a>`
						}
						let tags = document.getElementById('pageTagsHolder').innerText;
						
						//Mathjax link handling
						$("a[href^='#mjx-eqn-eq']").each(function (index) {
							// console.log(url + $(this).attr('href'));
							$(this).attr('href', url + $(this).attr('href'))
						});
						/*
						if (tags) {
							try {
								tags = tags.replace(/\\/, "");
								tags = JSON.parse(tags);
								if (!tags.length)
									tags = null;
								if (tags && tags.includes('hidetop:solutions')) {
									let h3 = $('h3');
									h3.wrap(doWrap);
									
									function doWrap(index) {
										if (this.id) {
											return `<a target="_blank" href="${url}#${this.id}"></a>`
										}
									}
								}
							} catch (e) {
								console.error(e.toString());
							}
						}*/
						
						return [prefix, innerText, tags];
					}, url);
					let prefix = out[0];
					title = out[1] || null;
					if (title) {
						title = title.trim();
					}
					let showHeaders = true;
					let tags = out[2] || null;
					if (tags) {
						tags = tags.replace(/'/g, "'");
						tags = tags.replace(/\\/g, "");
						try {
							tags = JSON.parse(tags);
						} catch (e) {
							console.error(e, tags);
						}
						
						if (tags.includes('hidetop:solutions'))
							await page.addStyleTag({content: 'dd, dl {display: none;} h3 {font-size: 160%}'});
						if (tags.includes('printoptions:no-header') || tags.includes('printoptions:no-header-title'))
							showHeaders = false;
					}
					
					const host = url.split("/")[2].split(".");
					const subdomain = host[0];
					const topIMG = baseIMG[subdomain];
					const color = colors[subdomain];
					prefix = prefix ? prefix + "." : "";
					const attribution = "";
					let license = getLicense(url, subdomain);
					
					const cssb = [];
					cssb.push('<style>');
					cssb.push('#mainH {display:flex; margin: -1px 40px 0 40px; width: 100vw}');
					cssb.push(`#mainF {display:flex; margin: -1px 50px 0 50px; width: 100vw; font-size:7px; justify-content: center; background-color: ${color}; border-radius: 10px; padding:0px 8px;}`);
					cssb.push('#main {border: 1px solid blue;}');
					cssb.push(`#library {background-color: ${color}; flex:1; display:inline-flex; justify-content:flex-end; border-radius: 0 7px 7px 0; margin:5px 0}`);
					cssb.push('* { -webkit-print-color-adjust: exact}');
					cssb.push('.date, .pageNumber {display: inline-block}');
					cssb.push('.added {padding: 0px 4px}');
					cssb.push('a {text-decoration:none; color: white}');
					cssb.push(`.trapezoid{ position:relative; display:inline-block; border-bottom: 20px solid ${color}; border-right: 0px solid transparent; border-left: 8px solid transparent; width: 9px; top: -10px; left: 1px; }`);
					cssb.push(`.trapezoid:before{ content:\' \'; left:-8px; top:37px; position:absolute; background: ${color}; border-radius:80px 0px 0px 80px; width:17px; height:8px; }`);
					cssb.push(`.trapezoid:after { content:\' \'; left:-1px; top:15px; position:absolute; background: ${color}; border-radius:75px 0px 0px 80px; width:10px; height:19px; }`);
					cssb.push('</style>');
					const css = cssb.join('');
					
					
					const style1 = '<div id="mainH">' +
						'<a href="https://libretexts.org" style="display: inline-block"><img src="data:image/png;base64,' + baseIMG["default"] + '" height="30" style="padding:5px; background-color: white; margin-right: 10px"/></a>' +
						'<div class="trapezoid"></div>' +
						`<div id="library"><a href="https://${subdomain}.libretexts.org" style="width: fit-content"><img src="data:image/png;base64,${topIMG}" height="20" style="padding:5px;"/></a></div>` +
						'</div>';
					
					license = await license;
					
					const style2 = `<div id="mainF">` +
						// `<div style="flex:1; display:inline-flex; align-items: center; justify-content: flex-start; color:#F5F5F5;">${attribution}</div>` +
						(license ? `<div style="flex:1; display:inline-flex; align-items: center; justify-content: flex-start; color:#F5F5F5;" class='added'><a href="${license.link}">${license.label}</a></div>`
							: `<div style="flex:1; display:inline-flex; align-items: center; justify-content: flex-start; color:#F5F5F5;">${attribution}</div>`) +
						`<div style="background-color: white; border: 1px solid ${color}; color: ${color}; padding: 2px; border-radius: 10px; min-width: 10px; text-align: center; font-size: 8px">` + prefix + `<div class="pageNumber"></div></div>` +
						`<div style="flex:1; display:inline-flex; align-items: center;   justify-content: flex-end; color:#F5F5F5;">` +
						(attribution ? "<div class='added'>Powered by LibretextsPDF:</div>" : "") + `<div>Updated <div class="date"/></div>` +
						'</div>';
					try {
						await page.pdf({ //Letter
							path: `./PDF/Letter/${PDFname}.pdf`,
							displayHeaderFooter: showHeaders,
							headerTemplate: css + style1,
							footerTemplate: css + style2,
							printBackground: true,
							margin: {
								top: "90px",
								bottom: "60px",
								right: "0.75in",
								left: "0.75in",
							}
						});
						await page.pdf({ //A4
							path: `./PDF/A4/${PDFname}.pdf`,
							displayHeaderFooter: showHeaders,
							headerTemplate: css + style1,
							footerTemplate: css + style2,
							printBackground: true,
							format: 'A4',
							margin: {
								top: "90px",
								bottom: "60px",
								right: "0.75in",
								left: "0.75in",
							}
						});
						await page.pdf({ //Letter Margin
							path: `./PDF/Letter/Margin/${PDFname}.pdf`,
							displayHeaderFooter: showHeaders,
							headerTemplate: css + style1 + '<style>div#mainH{margin-top:17px}</style>',
							footerTemplate: css + style2 + '<style>div#mainF{margin-bottom:15px}</style>',
							printBackground: true,
							margin: showHeaders ? {
								top: "1in",
								bottom: ".75in",
								right: "0.75in",
								left: "0.75in",
							} : {
								top: "0.5in",
								bottom: "0.5in",
								right: "0.75in",
								left: "0.75in",
							}
						});
						await page.pdf({ //A4 Margin
							path: `./PDF/A4/Margin/${PDFname}.pdf`,
							displayHeaderFooter: showHeaders,
							headerTemplate: css + style1 + '<style>div#mainH{margin-top:17px}</style>',
							footerTemplate: css + style2 + '<style>div#mainF{margin-bottom:15px}</style>',
							printBackground: true,
							format: 'A4',
							margin: showHeaders ? {
								top: "1in",
								bottom: ".75in",
								right: "0.75in",
								left: "0.75in",
							} : {
								top: "0.5in",
								bottom: "0.5in",
								right: "0.75in",
								left: "0.75in",
							}
						});
					} catch (e) {
						// console.error(e);
					}
					clearTimeout(timeout);
					resolve();
				});
				let thing = await renderPDF;
			} catch (err) {
				failed = err;
			}
			const end = performance.now();
			let time = end - start;
			time /= 100;
			time = Math.round(time);
			time /= 10;
			if (!page.isClosed())
				await page.close();
			let pages = await browser.pages();
			const now = new Date();
			
			eventEmitter.emit(escapedURL);
			delete working[escapedURL];
			if (failed) {
				console.error(`FAILED ${ip} [${pages.length}] ${time}s ${PDFname}`);
				console.error(failed);
				let exists = await fs.exists('./PDF/Letter' + PDFname + '.pdf');
				if (!exists)
					return {filename: 'restricted'};
				
				let stats, err;
				try {
					stats = await fs.stat('./PDF/Letter' + PDFname + '.pdf');
				} catch (e) {
					err = e;
				}
				
				if (err || Date.now() - stats.mtime > 120000) { //file not modified
					return {filename: 'restricted'};
					// throw failed;
				}
			}
			else {
				console.log(`RENDER ${ip} [${pages.length}] ${time}s ${PDFname}`);
				// console.log(pages);
			}
			return {filename: PDFname + '.pdf', title: title};
		}
		
		async function getLibretext(url, response, options) {
			let refreshOnly = options.refreshOnly;
			let isNoCache = options['no-cache'] || options.nocache;
			
			let current = options.current;
			if (!current) {
				let count = 0;
				let heartbeat = setInterval(() => {
					if (response)
						response.write(JSON.stringify({
							message: "subpages",
							percent: 0,
							eta: `Calculating number of pages...\nTime elapsed: ${++count} seconds`,
						}) + "\r\n")
				}, 1000);
				current = await getSubpages(url);
				clearInterval(heartbeat);
			}
			let link = url;
			
			//Merge up Text or Chapters
			let content;
			for (let i = 0; i < current.children.length; i++) {
				if (['Text', 'Chapters'].includes(current.children[i].title)) {
					content = current.children[i];
				}
			}
			if (content) {
				content.title = current.title;
				content.tags = current.tags.concat(content.tags);
				content.properties = current.properties.concat(content.properties);
				current = content;
			}
			await getInformation(current);
			
			if (!current.children || !current.children.length) {
				if (response)
					response.write(JSON.stringify({
						message: "error",
						text: `Error: No subpages found!`,
						percent: -1,
						eta: "Error: No subpages found!",
					}));
				return false;
			}
			console.log(`Getting LibreText ${current.title}`);
			const zipFilename = filenamify(`${current.subdomain}-${current.title}-${md5(current.url).slice(0, 16)}`);
			const thinName = md5(zipFilename).slice(0, 6);
			
			//Try to get special files
			let totalIndex = 1;
			let uploadedTOC = false;
			let frontArray = await getMatter('Front');
			let TOCIndex = ++totalIndex;
			
			
			async function getMatter(text) {
				let path = current.url.split('/').splice(3).join('/');
				let miniIndex = 1;
				let createMatter = await authenticatedFetch(`${path}/${text}_Matter`, 'contents?abort=exists&dream.out.format=json', current.subdomain, 'PrintBot', {
					method: "POST",
					body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>"
				});
				if (createMatter.ok) { //Add properties if it is new
					await Promise.all([putProperty("mindtouch.idf#guideDisplay", "single"),
						putProperty('mindtouch.page#welcomeHidden', true),
						putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]")]);
					
					async function putProperty(property, value) {
						await authenticatedFetch(`${path}/${text}_Matter`, 'properties?dream.out.format=json', current.subdomain, 'PrintBot', {
							method: "POST",
							body: value,
							headers: {"Slug": property}
						});
					}
				}
				let response = await authenticatedFetch(`${path}/${text}_Matter`, 'subpages?dream.out.format=json', current.subdomain);
				if (!response.ok) {
					// console.error(await response.text());
					return [];
				}
				response = (await response.json());
				if (!response["page.subpage"])
					return [];
				response = response["page.subpage"];
				if (!response.length)
					response = [response];
				
				response = response.map(subpage => {
					return {
						title: subpage.title,
						url: subpage['uri.ui'],
						subdomain: current.subdomain,
						id: subpage['@id'],
						matter: text,
						index: ++totalIndex,
						miniIndex: miniIndex++,
					}
				});
				response.forEach(subpage => {
					if ('Table of Contents' === subpage.title)
						uploadedTOC = current.url;
				});
				return response;
			}
			
			
			await fs.emptyDir(`./PDF/Letter/libretexts/${zipFilename}`);
			await fs.emptyDir(`./PDF/Letter/Finished/${zipFilename}`);
			await fs.ensureDir(`./PDF/Letter/Finished/${zipFilename}/Publication`);
			await fs.emptyDir(`./PDF/Letter/order/${thinName}/`);
			
			await fs.emptyDir(`./PDF/A4/libretexts/${zipFilename}`);
			await fs.emptyDir(`./PDF/A4/Finished/${zipFilename}`);
			await fs.ensureDir(`./PDF/A4/Finished/${zipFilename}/Publication`);
			await fs.emptyDir(`./PDF/A4/order/${thinName}/`);
			
			let urlArray = [current];
			urlArray = urlArray.concat(addLinks(current.children));
			urlArray = urlArray.map((item, index) => {
				item.index = index + totalIndex; //Have 10 open for beginning materials
				return item;
			});
			urlArray = frontArray.concat(urlArray);
			totalIndex = urlArray.length;
			
			urlArray = urlArray.concat(await getMatter('Back'));
			
			if (response)
				response.write(JSON.stringify({
					message: "start",
					percent: 0,
					eta: "Loading...",
				}) + "\r\n");
			
			let count = 0;
			const start = performance.now();
			const eta = new Eta(urlArray.length, true);
			
			
			try {
				let number = kubernetesServiceHost ? 10 : 6;
				if (options.multiple) {
					number /= 2;
					number = Math.floor(number); //integer check
				}
				await async.mapLimit(urlArray, number, async (page) => {
					let filename, title = page.title;
					let url = page.url;
					if (page.matter) {
						if (page.title === 'Table of Contents')
							filename = `TOC/${await getTOC(current.url, current)}.pdf`;
						else {
							let temp = await getPDF(url, options.ip, isNoCache);
							filename = temp.filename;
						}
						if (page.matter !== 'Back') {
							title = `00000:${String.fromCharCode(64 + page.index)} ${page.title}`;
						}
						else {
							title = `99999:${String.fromCharCode(64 + page.miniIndex)} ${page.title}`;
						}
						
					}
					else if (page.tags && (page.tags.includes('article:topic-category') || page.tags.includes('article:topic-guide'))) {
						filename = `TOC/${await getTOC(page.url, page)}.pdf`;
						
						if (page.tags.includes('coverpage:yes')) {//no Front Matter TOC
							if (uploadedTOC)
								return;
							page.index = TOCIndex;
							
							title = `00000:${String.fromCharCode(64 + page.index)} Table of Contents`;
						}
					}
					else if (kubernetesServiceHost) {
						let offloadURL = `http://${kubernetesServiceHost}/url=${url}`;
						if (isNoCache)
							offloadURL += '?no-cache&offload';
						else
							offloadURL += '?offload';
						
						let offload = await fetch(offloadURL);
						offload = await offload.json();
						filename = offload.filename;
					}
					else {
						let temp = await getPDF(url, options.ip, isNoCache);
						filename = temp.filename;
					}
					count++;
					eta.iterate();
					
					if (filename !== 'restricted' && !refreshOnly) {
						title = filenamify(title);
						
						await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/libretexts/${zipFilename}/${title}.pdf`);
						await fs.copy(`./PDF/Letter/Margin/${filename}`, `./PDF/Letter/order/${thinName}/${`${page.index}`.padStart(3, '0')}.pdf`);
						
						await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/libretexts/${zipFilename}/${title}.pdf`);
						await fs.copy(`./PDF/A4/Margin/${filename}`, `./PDF/A4/order/${thinName}/${`${page.index}`.padStart(3, '0')}.pdf`);
					}
					if (response)
						response.write(JSON.stringify({
							message: "progress",
							percent: (Math.round(count / urlArray.length * 1000) / 10),
							eta: eta.format("{{etah}}"),
							// count: count,
						}) + "\r\n");
				});
			} catch (err) {
				throw err;
			}
			let heartbeat;
			
			if (!refreshOnly) {
				//Overall cover
				let filename = `Cover/${await getCover(current)}.pdf`;
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/libretexts/${zipFilename}//${filenamify('00000:A Cover.pdf')}`);
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/order/${thinName}/${`0`.padStart(3, '0')}.pdf`);
				
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/libretexts/${zipFilename}//${filenamify('00000:A Cover.pdf')}`);
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/order/${thinName}/${`0`.padStart(3, '0')}.pdf`);
				
				
				await getThinCC(current, `./PDF/Letter/Finished/${zipFilename}/LibreText.imscc`);
				await fs.copy(`./PDF/Letter/Finished/${zipFilename}/LibreText.imscc`, `./PDF/A4/Finished/${zipFilename}/LibreText.imscc`);
				let files = (await fs.readdir(`./PDF/Letter/order/${thinName}`)).map((file) => `./PDF/Letter/order/${thinName}/${file}`);
				let filesA4 = (await fs.readdir(`./PDF/A4/order/${thinName}`)).map((file) => `./PDF/A4/order/${thinName}/${file}`);
				console.log('Merging');
				if (response) {
					let count = 0;
					heartbeat = setInterval(() => {
						if (response)
							response.write(JSON.stringify({
								message: "progress",
								percent: 100,
								eta: `Finishing...\nTime elapsed: ${++count} seconds`,
							}) + "\r\n")
					}, 1000);
				}
				if (files && files.length > 2) {
					await merge(files, `./PDF/Letter/Finished/${zipFilename}/Full.pdf`, {maxBuffer: 1024 * 10000000});
					await merge(filesA4, `./PDF/A4/Finished/${zipFilename}/Full.pdf`, {maxBuffer: 1024 * 10000000});
					files.shift();
					filesA4.shift();
					await merge(files, `./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`, {maxBuffer: 1024 * 10000000});
					await merge(filesA4, `./PDF/A4/Finished/${zipFilename}/Publication/Content.pdf`, {maxBuffer: 1024 * 10000000});
				}
				else {
					await fs.copy(files[0], `./PDF/Letter/Finished/${zipFilename}/Full.pdf`);
					await fs.copy(files[0], `./PDF/A4/Finished/${zipFilename}/Publication/Content.pdf`);
					await fs.copy(filesA4[0], `./PDF/Letter/Finished/${zipFilename}/Full.pdf`);
					await fs.copy(filesA4[0], `./PDF/A4/Finished/${zipFilename}/Publication/Content.pdf`);
				}
				console.log('Done Merging');
				
				//Publication covers
				let dataBuffer = await fs.readFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`);
				let lulu = await pdf(dataBuffer);
				console.log(`Got numpages ${lulu.numpages}`);
				filename = `Cover/${await getCover(current, lulu.numpages)}.pdf`;
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_Amazon.pdf`);
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/Finished/${zipFilename}/Publication/Cover_Amazon.pdf`);
				filename = `Cover/${await getCover(current, lulu.numpages, {hasExtraPadding: true})}.pdf`;
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_PerfectBound.pdf`);
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/Finished/${zipFilename}/Publication/Cover_PerfectBound.pdf`);
				filename = `Cover/${await getCover(current, lulu.numpages, {
					hasExtraPadding: true,
					isHardcover: true
				})}.pdf`;
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_Casewrap.pdf`);
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/Finished/${zipFilename}/Publication/Cover_Casewrap.pdf`);
				filename = `Cover/${await getCover(current, lulu.numpages, {hasExtraPadding: true, thin: true})}.pdf`;
				await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_CoilBound.pdf`);
				await fs.copy(`./PDF/A4/${filename}`, `./PDF/A4/Finished/${zipFilename}/Publication/Cover_CoilBound.pdf`);
				
				console.log('Zipping');
				let individualZIP = new JSZip();
				let individualZIPA4 = new JSZip();
				let PublicationZIP = new JSZip();
				let PublicationZIPA4 = new JSZip();
				files = await fs.readdir('./PDF/Letter/libretexts/' + zipFilename);
				filesA4 = await fs.readdir('./PDF/A4/libretexts/' + zipFilename);
				for (let i = 0; i < files.length; i++) {
					individualZIP.file(files[i], await fs.readFile(`./PDF/Letter/libretexts/${zipFilename}/${files[i]}`));
					individualZIPA4.file(filesA4[i], await fs.readFile(`./PDF/A4/libretexts/${zipFilename}/${filesA4[i]}`));
				}
				files = await fs.readdir(`./PDF/Letter/Finished/${zipFilename}/Publication`);
				filesA4 = await fs.readdir(`./PDF/A4/Finished/${zipFilename}/Publication`);
				for (let i = 0; i < files.length; i++) {
					PublicationZIP.file(files[i], await fs.readFile(`./PDF/Letter/Finished/${zipFilename}/Publication/${files[i]}`));
					PublicationZIPA4.file(filesA4[i], await fs.readFile(`./PDF/A4/Finished/${zipFilename}/Publication/${filesA4[i]}`));
				}
				
				
				await saveAs(individualZIP, `./PDF/Letter/Finished/${zipFilename}/Individual.zip`);
				await saveAs(individualZIPA4, `./PDF/A4/Finished/${zipFilename}/Individual.zip`);
				await saveAs(PublicationZIP, `./PDF/Letter/Finished/${zipFilename}/Publication.zip`);
				await saveAs(PublicationZIPA4, `./PDF/A4/Finished/${zipFilename}/Publication.zip`);
				
				async function saveAs(zip, destination) {
					let result = await zip.generateAsync({type: "nodebuffer"});
					await fs.writeFile(destination, result);
				}
				
			}
			const end = performance.now();
			let time = end - start;
			time /= 100;
			time = Math.round(time);
			time /= 10;
			console.log(zipFilename, time);
			if (response && heartbeat)
				clearInterval(heartbeat);
			if (response)
				response.write(JSON.stringify({
					message: "complete",
					filename: zipFilename,
					timeTaken: time
				}));
			// cleanup
			await fs.emptyDir(`./PDF/Letter/libretexts/${zipFilename}`);
			await fs.emptyDir(`./PDF/A4/libretexts/${zipFilename}`);
			await fs.remove(`./PDF/Letter/order/${thinName}`);
			await fs.remove(`./PDF/A4/order/${thinName}`);
			
			return {
				zipFilename: zipFilename,
				title: current.title,
				id: current.id,
				author: current.name,
				institution: current.companyname,
				link: link,
				tags: current.tags
			};
		}
	}
);

async function authenticatedFetch(path, api, subdomain, username, options = {}) {
	let isNumber;
	if (!path)
		path = 'home';
	if (path === 'home') {
		isNumber = true;
	}
	if (!isNaN(path)) {
		path = parseInt(path);
		isNumber = true;
	}
	if (!subdomain) {
		console.error(`Invalid subdomain ${subdomain}`);
		return false;
	}
	if (!username) {
		options = deepMerge({
			headers: {
				'X-Requested-With': 'XMLHttpRequest',
				'x-deki-token': authenBrowser[subdomain]
			}
		}, options);
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`, options);
	}
	else {
		const user = "=" + username;
		const crypto = require('crypto');
		const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
		const epoch = Math.floor(Date.now() / 1000);
		hmac.update(`${authen[subdomain].key}${epoch}${user}`);
		const hash = hmac.digest('hex');
		let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
		
		options = deepMerge({headers: {'x-deki-token': token}}, options);
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`, options);
	}
}

async function getSubpages(rootURL, options = {}) {
	let origin = rootURL.split("/")[2].split(".");
	const subdomain = origin[0];
	let path = rootURL.split('/').splice(3).join('/');
	options['depth'] = 0;
	
	let pages = await authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
	pages = await pages.json();
	
	
	let info = authenticatedFetch(path, 'info?dream.out.format=json', subdomain);
	let properties = authenticatedFetch(path, 'properties?dream.out.format=json', subdomain);
	let tags = authenticatedFetch(path, 'tags?dream.out.format=json', subdomain);
	info = await (await info).json();
	properties = await (await properties).json();
	tags = await (await tags).json();
	if (properties && properties['@count'] !== '0' && properties.property) {
		properties = properties.property.length ? properties.property : [properties.property]
	}
	else {
		properties = [];
	}
	if (tags && tags['@count'] !== '0' && tags.tag) {
		tags = tags.tag.length ? tags.tag : [tags.tag];
		tags = tags.map((elem) => elem.title);
	}
	else {
		tags = [];
	}
	
	return {
		title: info.title,
		url: rootURL,
		tags: tags,
		properties: properties,
		subdomain: subdomain,
		relativePath: '/',
		children: options.children || await subpageCallback(pages, options),
		id: info['@id'],
	};
	
	
	async function subpageCallback(info, options = {}) {
		let subpageArray = info["page.subpage"];
		const result = [];
		const promiseArray = [];
		
		async function subpage(subpage, index, options = {}) {
			let url = subpage["uri.ui"];
			let path = subpage.path["#text"];
			const hasChildren = subpage["@subpages"] === "true";
			let children = hasChildren ? undefined : [];
			let tags = authenticatedFetch(path, 'tags?dream.out.format=json', subdomain);
			let properties = authenticatedFetch(path, 'properties?dream.out.format=json', subdomain);
			tags = await (await tags).json();
			properties = await (await properties).json();
			if (properties['@count'] !== '0' && properties.property) {
				properties = properties.property.length ? properties.property : [properties.property]
			}
			else {
				properties = [];
			}
			if (tags.tag) {
				tags = tags.tag.length ? tags.tag : [tags.tag];
			}
			else {
				tags = []
			}
			tags = tags.map((elem) => elem.title);
			if (hasChildren) { //recurse down
				children = await authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
				children = await children.json();
				if (children && children['page.subpage'] && children['page.subpage'].length && subpage.title === 'Remixer University') { //Skip Remixer except for contruction guide
					children['page.subpage'] = children['page.subpage'].filter((item) => item.title === "Contruction Guide");
					if (!children['page.subpage'].length)
						delete children['page.subpage'];
				}
				children = await subpageCallback(children, !tags.includes('coverpage:yes') && options.delay ? {
					delay: options.delay,
					depth: options.depth
				} : {});
			}
			
			result[index] = {
				title: subpage.title,
				url: url,
				tags: tags,
				properties: properties,
				subdomain: subdomain,
				children: children,
				id: subpage['@id'],
				relativePath: encodeURIComponent(decodeURIComponent(url).replace(decodeURIComponent(rootURL) + '/', ''))
			};
		}
		
		if (subpageArray) {
			if (!subpageArray.length) {
				subpageArray = [subpageArray];
			}
			for (let i = 0; i < subpageArray.length; i++) {
				if (options.delay && options.depth < 3) {
					console.log(`Delay ${subpageArray[i]["uri.ui"]}`);
					await subpage(subpageArray[i], i, {delay: options.delay});
				}
				else {
					// console.log(subpageArray[i]["uri.ui"]);
					promiseArray[i] = subpage(subpageArray[i], i);
				}
			}
			
			await Promise.all(promiseArray);
			return result;
		}
		return {};
	}
}

function clarifySubdomain(url) {
	url = url.replace('https://espa%C3%B1ol.libretexts.org', 'https://espanol.libretexts.org');
	return url;
}

function parseURL(url) {
	if (url.match(/https?:\/\/.*?\.libretexts\.org/)) {
		return [url.match(/(?<=https?:\/\/).*?(?=\.)/)[0], url.match(/(?<=https?:\/\/.*?\/).*/)[0]]
	}
	else {
		return [];
	}
}

function stop() {
	Gserver.close();
	Gbrowser.close();
}

module.exports = stop;