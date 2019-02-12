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
const mapLimit = util.promisify(require("async/mapLimit"));
const map = util.promisify(require("async/map"));
const zipLocal = require('zip-local');
const Eta = require('node-eta');
const md5 = require('md5');
const events = require('events');
const fetch = require('node-fetch');
const querystring = require('querystring');
const merge = util.promisify(require('easy-pdf-merge'));
const pdf = require('pdf-parse');


var Gbrowser;
var Gserver;

puppeteer.launch({
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox'
	],
	// headless: false
}).then((browser) => {
	const server = http.createServer(handler);
	const localServer = http.createServer(handler);
	const staticFileServer = new nodeStatic.Server('./public');
	let port = 3001;
	server.listen(port);
	if (process.argv.length >= 3 && parseInt(process.argv[2])) {
		port = parseInt(process.argv[2]);
		localServer.listen(port);
	}
	const now1 = new Date();
	console.log("Restarted " + timestamp('MM/DD hh:mm', now1) + " Port:" + port);
	fs.ensureDir('./PDF');
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
		let url = request.url;
		
		if (url.startsWith("/url=") && url.includes("libretexts.org")) { //single page
			let isNoCache = false;
			let isOffload = false;
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
			url = url.split('/url=')[1];
			if (url.endsWith(".pdf")) {
				url = url.slice(0, -4);
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
					else if (result.filename === 'restricted') {
						responseError('This page is not publicly accessible.', 403)
					}
					else
						staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
				}
			}, (err) => responseError("Server \n" + err, 500));
			
		}
		else if (url.startsWith("/Libretext=")) {
			if (request.headers.origin.endsWith("libretexts.org")) {
				if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
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
						// "Transfer-Encoding": "chunked",
						"Content-Type": " application/json",
					} : {"Content-Type": " application/json"});
					url = url.split('/Libretext=')[1];
					let params = querystring.parse(url.split('?')[1]);
					url = url.split('?')[0];
					for (let param in params) {
						if (params[param] === "")
							params[param] = true;
					}
					params.ip = ip;
					await getLibretext(url, response, params);
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
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
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
			staticFileServer.serveFile(`../PDF/TOC/${file}.pdf`, 200, {}, request, response);
		}
		else if (url === '/cover') {
			let current = {
				url: 'And others ',
				title: 'SCC: CHEM 300 - Beginning Chemistry (Alviar-Agnew)',
				subdomain: 'chem',
				tags: ['authorname:openstax']
			};
			let file = await getCover(current, 12);
			staticFileServer.serveFile(`../PDF/Cover/${file}.pdf`, 200, {}, request, response);
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
			if (await fs.exists(`./PDF/Finished/${url}`))
				staticFileServer.serveFile(`../PDF/Finished/${url}`, 200, {'Content-Disposition': 'attachment'}, request, response);
			else
				console.error(url);
		}
		else { //static server
			console.log(url);
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
				let result = [child];
				array = array.concat(result.concat(addLinks(child.children)));
			});
		}
		return array;
	}
	
	async function getCC(url, subdomain) {
		let sourceArray = url.split("/");
		let path = sourceArray.slice(3, sourceArray.length).join("/");
		let tags = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/tags?dream.out.format=json`);
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
		let response = await fetch(`${domain}/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/revisions?dream.out.format=json`);
		if (response.ok) {
			response = await response.json();
			response = response.page;
			if (response.length) {
				response = response[response.length - 1]
			}
			return new Date(response['date.edited']);
		}
		else {
			// let error = await response.text();
			// console.error(`checkTime: ${error}`);
			return 'restricted';
		}
	}
	
	async function getCover(current, numPages, isHardcover) {
		await fs.ensureDir('./PDF/Cover');
		let escapedURL = md5(current.url);
		const start = performance.now();
		const page = await browser.newPage();
		
		/*let origin = url.split("/")[2].split(".");
		const subdomain = origin[0];
		let path = url.split('/').splice(3).join('/');*/
		let author = {};
		for (let i = 0; i < current.tags.length; i++) {
			let tag = current.tags[i];
			if (tag.startsWith('lulu,')) {
				let items = tag.split(',');
				if (items[1])
					current.title = items[1];
				if (items[2])
					author.name = items[2];
				if (items[3])
					author.companyname = items[3];
				break;
			}
			if (tag.startsWith('authorname:')) {
				author = tag.replace('authorname:', '');
			}
		}
		
		if (author) {
			let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${current.subdomain}`, {headers: {'origin': 'print.libretexts.org'}});
			authors = await authors.json();
			author = authors[author] || author;
		}
		
		let style = `<link rel="stylesheet" type="text/css" href="http://localhost:${port}/print/cover.css"/>
		<link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i" rel="stylesheet">`;
		let frontContent = `<div id="frontContainer"><div><div id="frontTitle">${current.title}</div></div><div><div id="frontCite"><i>${author.name}</i><br/>${author.companyname}</div></div></div>`;
		let backContent = `<div id="backContainer"><div>${numPages}</div></div>`;
		let spine = `<div id="spine"></div><style>body {padding: 80px}</style>`;
		// <img src="http://localhost:${port}/print/header_logo_mini.png"/>
		let content = numPages ? `${style}${backContent}${spine}${frontContent}` : `${style}${frontContent}`;
		
		try {
			await page.setContent(content,
				{waitUntil: ["load", "domcontentloaded", 'networkidle0']});
		} catch (e) {
		
		}
		
		await page.pdf({
			path: `./PDF/Cover/${escapedURL}.pdf`,
			printBackground: true,
			width: numPages ? getWidth() : '',
			height: numPages ? '12.750 in' : '',
		});
		const end = performance.now();
		let time = end - start;
		time /= 100;
		time = Math.round(time);
		time /= 10;
		await page.close();
		// console.log(`Cover Created: ${time}s ${escapedURL}`);
		return escapedURL;
		
		function getWidth(){
			return '20.125 in';
			if (isHardcover){
			
			}
			else {
			
			}
		}
	}
	
	async function getTOC(url, subpages, isHTML) {
		await fs.ensureDir('./PDF/TOC');
		let escapedURL = md5(url);
		console.log('Starting TOC');
		const start = performance.now();
		subpages = subpages || await getSubpages(url);
		const page = await browser.newPage();
		
		
		let origin = url.split("/")[2].split(".");
		const subdomain = origin[0];
		let path = url.split('/').splice(3).join('/');
		
		let properties = subpages.properties;
		properties = properties.find((prop) => prop['@name'] === 'mindtouch.page#overview' ? prop.contents['#text'] : undefined);
		properties = properties && properties.contents && properties.contents['#text'] ?
			properties.contents['#text'] : '';
		let tags = subpages.tags;
		
		let content = `${!tags.includes('coverpage:yes') ? `<div class="nobreak"><a href="${subpages.url}"><h2>${subpages.title}</h2></a>` : '<h1>Table of Contents</h1>'}
<div style="padding: 0 0 10px 0" class="summary">${properties}</div></div>${await getLevel(subpages)}`;
		content += '<script src=\'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML\' async></script>\n ' +
			'<style>a {text-decoration: none; color:#127bc4}' +
			'body>ul {list-style-type: none; color:black}' +
			'h2>a{color:#127bc4}' +
			'ul {margin: 0; padding: 0;}' +
			'.indent {margin-left: 10px;}' +
			'h2, h3, h4, h5, h, l {margin: 10px 0 0 0;}' +
			'h1, h2, h3, h4, h5, h {text-transform: uppercase;}' +
			'.nobreak {page-break-inside: avoid;}' +
			'.summary {text-align: justify; text-justify: inter-word;}' +
			'body {font-size:80%; font-family: lato,arial,helvetica,sans-serif,\'arial unicode ms\'}</style>' +
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
				
				if (level === 2 && tags.includes('article:topic-guide')) {
					isSubTOC = 'yes';
					level = 3;
				}
				
				let prefix = `h${level}`;
				
				let hasLower = false;
				for (let i = 0; i < subpages.children.length; i++) {
					hasLower = hasLower || subpages.children[i].children.length;
				}
				if (!hasLower) { //at lowest level
					prefix = isSubTOC === 'yes' ? 'h' : 'l';
				}
				
				//Summary Handling
				let inner = await map(subpages.children, async (elem, callback) => {
					let summary = '';
					let isSubtopic = elem.title.match(/^[0-9.]+[A-Z]: /) && elem.tags.includes('article:topic') ? 'indent' : null;
					if (prefix !== 'l' && !isSubtopic) {
						let path = elem.url.split('/').splice(3).join('/');
						
						properties = elem.properties.find((prop) => prop['@name'] === 'mindtouch.page#overview' ? prop.contents['#text'] : undefined);
						let good = properties && properties.contents && properties.contents['#text'];
						if (good && (!elem.tags.includes('article:topic') || isSubTOC)) {
							summary = `<div style="padding-bottom:10px" class="summary">${properties.contents['#text']}</div>`;
						}
					}
					
					return `<li><div class="nobreak"><${prefix} class="${isSubtopic}"><a href="${elem.url}"><b>${elem.title}</b></a></${prefix}>${summary}</div>${await getLevel(elem, level + 1, isSubTOC)}</li>`
				});
				inner = inner.join('');
				
				result = `<ul>${inner}</ul>`;
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
		
		await page.pdf({
			path: `./PDF/TOC/${escapedURL}.pdf`,
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
		const end = performance.now();
		let time = end - start;
		time /= 100;
		time = Math.round(time);
		time /= 10;
		await page.close();
		// console.log(`TOC Created: ${time}s ${escapedURL}`);
		return escapedURL;
	}
	
	async function getPDF(url, ip, isNoCache = false) {
		let escapedURL = md5(url);
		let stats, err;
		try {
			stats = await fs.stat('./PDF/' + escapedURL + '.pdf');
		} catch (e) {
			err = e;
		}
		
		if ((working[escapedURL] && Date.now() - working[escapedURL] > 120000)) {
			delete working[escapedURL];					//5 min timeout for DUPE
		}
		
		const daysCache = 30;
		const updateTime = await checkTime(url);
		if (updateTime === 'restricted') {
			console.error(`PRIVE  ${ip} ${url}`);
			return {filename: 'restricted'};
		}
		else if (!isNoCache && !err && stats.mtime > updateTime && Date.now() - stats.mtime < daysCache * 8.64e+7) { //file is up to date
			// 8.64e+7 day
			console.log(`CACHE  ${ip} ${url}`);
			return {filename: escapedURL + '.pdf'};
		}
		else if (working[escapedURL] && !isBatch) { //another thread is already working
			eventEmitter.on(escapedURL, () => {
				console.log(`DUPE   ${ip} ${url}`);
				staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
			});
			return false;
		}
		
		const start = performance.now();
		console.log(`NEW    ${ip} ${url}`);
		// const browser = await puppeteer.launch();
		
		const page = await browser.newPage();
		const timeout = setTimeout(() => {
			if (!page.isClosed)
				page.close();
		}, 40000);
		// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
		let failed = false;
		
		working[escapedURL] = Date.now();
		let PDFname = escapedURL;
		let title;
		try {
			try {
				await page.goto(url + "?no-cache", {
					timeout: 30000,
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
				return [prefix, innerText];
			}, url);
			let prefix = out[0];
			title = out[1] || null;
			if (title) {
				title = title.trim();
			}
			
			const host = url.split("/")[2].split(".");
			const subdomain = host[0];
			const topIMG = baseIMG[subdomain];
			const color = colors[subdomain];
			prefix = prefix ? prefix + "." : "";
			const attribution = "";
			// "<a href='https://openstax.org/'>Content from OpenStax:</a>"
			let license = getCC(url, subdomain);
			
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
			await page.pdf({
				path: `./PDF/${PDFname}.pdf`,
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
			
			
		} catch (err) {
			failed = err;
		}
		const end = performance.now();
		let time = end - start;
		time /= 100;
		time = Math.round(time);
		time /= 10;
		await page.close();
		clearTimeout(timeout);
		let pages = await browser.pages();
		const now = new Date();
		
		eventEmitter.emit(escapedURL);
		delete working[escapedURL];
		if (failed) {
			console.error(failed);
			console.error(`FAILED ${ip} [${pages.length}] ${time}s ${PDFname}`);
			throw failed;
		}
		else {
			console.log(`RENDER ${ip} [${pages.length}] ${time}s ${PDFname}`);
		}
		
		return {filename: PDFname + '.pdf', title: title};
	}
	
	async function getLibretext(url, response, params) {
		let refreshOnly = params.refreshOnly;
		let isNoCache = params['no-cache'] || params.nocache;
		let current = params.subpages || await getSubpages(url);
		console.log(`Getting LibreText ${current.title}`);
		const zipFilename = filenamify(`${current.subdomain}-${current.title}`);
		const directory = './PDF/libretexts/' + zipFilename;
		const thinName = md5(zipFilename).slice(0, 16);
		
		if (!refreshOnly) {
			await fs.emptyDir(directory);
			await fs.emptyDir(`./PDF/Finished/${zipFilename}`);
			await fs.emptyDir(`./PDF/order/${thinName}/`);
		}
		let urlArray = [current];
		urlArray = urlArray.concat(addLinks(current.children));
		urlArray = urlArray.map((item, index) => {
			item.index = index + 10; //Have 10 open for beginning materials
			return item;
		});
		
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
			await mapLimit(urlArray, 4, async (page) => {
				let filename, title = page.title;
				let url = page.url;
				if (page.tags.includes('article:topic-category') || page.tags.includes('article:topic-guide')) {
					filename = `TOC/${await getTOC(page.url, page)}.pdf`;
					
					if (page.tags.includes('coverpage:yes'))
						title = '00000:B Table of Contents'
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
					let temp = await getPDF(url, params.ip, isNoCache);
					filename = temp.filename;
				}
				count++;
				eta.iterate();
				
				if (filename !== 'restricted' && !refreshOnly) {
					title = filenamify(title);
					
					await fs.copy(`./PDF/${filename}`, `${directory}/${title}.pdf`);
					await fs.copy(`./PDF/${filename}`, `./PDF/order/${thinName}/${`${page.index}`.padStart(3, '0')}.pdf`);
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
		
		//Overall cover
		let filename = `Cover/${await getCover(current)}.pdf`;
		await fs.copy(`./PDF/${filename}`, `${directory}/${filenamify('00000:A Cover.pdf')}`);
		await fs.copy(`./PDF/${filename}`, `./PDF/order/${thinName}/${`0`.padStart(3, '0')}.pdf`);
		
		
		let files = (await fs.readdir(`./PDF/order/${thinName}`)).map((file) => `./PDF/order/${thinName}/${file}`);
		console.log('Merging');
		if (response)
			response.write(JSON.stringify({
				message: "progress",
				percent: (Math.round(count / urlArray.length * 1000) / 10),
				eta: 'Finishing',
				// count: count,
			}) + "\r\n");
		if (files && files.length) {
			await merge(files, `./PDF/Finished/${zipFilename}/Full.pdf`, {maxBuffer: 1024 * 10000000});
			files.shift();
			await merge(files, `./PDF/Finished/${zipFilename}/Lulu.pdf`, {maxBuffer: 1024 * 10000000});
		}
		console.log('Done Merging');
		
		//Lulu cover
		let dataBuffer = await fs.readFile(`./PDF/Finished/${zipFilename}/Lulu.pdf`);
		let lulu = await pdf(dataBuffer);
		console.log(`Got numpages ${lulu.numpages}`);
		filename = `Cover/${await getCover(current, lulu.numpages)}.pdf`;
		await fs.copy(`./PDF/${filename}`, `./PDF/Finished/${zipFilename}/LuluCover.pdf`);
		
		zipLocal.sync.zip('./PDF/libretexts/' + zipFilename).compress().save(`./PDF/Finished/${zipFilename}/Individual.zip`);
		
		const end = performance.now();
		let time = end - start;
		time /= 100;
		time = Math.round(time);
		time /= 10;
		console.log(time);
		if (response)
			response.write(JSON.stringify({
				message: "complete",
				filename: zipFilename,
				timeTaken: time
			}));
		
		// cleanup
		await fs.emptyDir(`./PDF/libretexts/${zipFilename}`);
		await fs.emptyDir(`./PDF/order/${thinName}`);
	}
});

async function authenticatedFetch(path, api, subdomain) {
	//DUMMY FUNCTION - does not have elevated privileges
	let headers = {'X-Requested-With': 'XMLHttpRequest'};
	return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/${api}`,
		{headers: headers});
}

async function getSubpages(rootURL) {
	let origin = rootURL.split("/")[2].split(".");
	const subdomain = origin[0];
	let path = rootURL.split('/').splice(3).join('/');
	
	let pages = await authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
	pages = await pages.json();
	
	
	let info = authenticatedFetch(path, 'info?dream.out.format=json', subdomain);
	let properties = authenticatedFetch(path, 'properties?dream.out.format=json', subdomain);
	let tags = authenticatedFetch(path, 'tags?dream.out.format=json', subdomain);
	info = await (await info).json();
	properties = await (await properties).json();
	tags = await (await tags).json();
	properties = properties['@count'] !== '0' ? properties.property : [properties.property];
	if (tags['@count'] !== '0') {
		tags = tags.tag.length ? tags.tag : [tags.tag];
		tags = tags.map((elem) => elem.title);
	}
	
	return {
		title: info.title,
		url: rootURL,
		tags: tags,
		properties: properties,
		subdomain: subdomain,
		relativePath: '/',
		children: await subpageCallback(pages),
		id: info['@id'],
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
			let tags = authenticatedFetch(path, 'tags?dream.out.format=json', subdomain);
			let properties = authenticatedFetch(path, 'properties?dream.out.format=json', subdomain);
			if (hasChildren) { //recurse down
				children = await authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
				children = await children.json();
				children = await subpageCallback(children, false);
			}
			tags = await (await tags).json();
			properties = await (await properties).json();
			tags = tags.tag.length ? tags.tag : [tags.tag];
			properties = properties['@count'] !== '0' && properties.property.length ? properties.property : [properties.property];
			tags = tags.map((elem) => elem.title);
			
			result[index] = {
				title: subpage.title,
				url: url,
				tags: tags,
				properties: properties,
				subdomain: subdomain,
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

function stop() {
	Gserver.close();
	Gbrowser.close();
}

module.exports = stop;