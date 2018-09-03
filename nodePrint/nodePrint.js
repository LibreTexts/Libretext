const http = require('http');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");
const colors = require("./colors");
const {performance} = require('perf_hooks');
const timestamp = require("console-timestamp");
const mapLimit = require("async/mapLimit");
const zipLocal = require('zip-local');
const mkdirp = require('mkdirp');
const Eta = require('node-eta');
const md5 = require('md5');
const events = require('events');

var Gbrowser;
var Gserver;

puppeteer.launch({
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox'
	]
}).then((browser) => {
	const server = http.createServer(handler);
	const staticFileServer = new nodeStatic.Server('./public');
	let port = 3001;
	if (process.argv.length >= 3 && parseInt(process.argv[2])) {
		port = parseInt(process.argv[2]);
	}
	server.listen(port);
	const now1 = new Date();
	console.log("Restarted " + timestamp('MM/DD hh:mm', now1) + " Port:" + port);
	let working = {};
	const eventEmitter = new events.EventEmitter();

	Gbrowser = browser;
	Gserver = server;

	function handler(request, response) {
		let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
		ip = ip.padEnd(15);
		request.url = request.url.replace("print/", "");
		let url = request.url;


		if (url.startsWith("/url=") && url.includes("libretexts.org")) { //single page
			let nocache = false;
			if (url.includes("?nocache")) {
				nocache = true;
				url = url.replace("?nocache", "");
			}
			if (url.includes("?no-cache")) {
				nocache = true;
				url = url.replace("?no-cache", "");
			}
			url = url.split('/url=')[1];
			if (url.endsWith(".pdf")) {
				url = url.slice(0, -4);
			}
			const escapedURL = md5(url);

			// response.setHeader("Content-Disposition","attachment");

			fs.stat('./PDF/' + escapedURL + '.pdf', (err, stats) => {
				const hoursCache = .5;
				if ((working[escapedURL] && Date.now() - working[escapedURL] > 300000)) {
					delete working[escapedURL];					//5 min timeout for DUPE
				}

				if (!nocache && (!err && Date.now() - stats.mtime < hoursCache * 4.32e+7)) { //file exists
					// 4.32e+7 12 hr
					console.log(`CACHE  ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
					staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
				}
				else if (working[escapedURL]) { //another thread is already working
					eventEmitter.on(escapedURL, () => {
						console.log(`DUPE   ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
						staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
					});
					setTimeout(() => {
						responseError("Request is duplicate.\nPlease try again.");
					}, 60000);
				}
				else {
					getPDF(url).then(() => {
						staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
					}, (err) => responseError("Server \n" + err, 500));
				}
			});
		}
		else if (url.startsWith("/Libretext=")) {
			if (request.headers.origin.endsWith("libretexts.org")) {
				if (request.headers.host === "home.miniland1333.com" && request.method === "OPTIONS") { //options checking
					response.writeHead(200, {
						"Access-Control-Allow-Origin": request.headers.origin,
						"Access-Control-Allow-Methods": "PUT",
					});
					response.end();
				}
				else if (request.method === "PUT") {
					let body = [];
					request.on('data', (chunk) => {
						body.push(chunk);
					}).on('end', () => {
						body = Buffer.concat(body).toString();
						const contents = JSON.parse(body);
						const zipFilename = filenamify(contents.batchName);

						mkdirp.sync('./PDF/libretexts/' + zipFilename);
						let urlArray = [contents.root];
						urlArray = urlArray.concat(addLinks(contents.subpages));


						response.writeHead(200, request.headers['host'] === "home.miniland1333.com" ? {
							"Access-Control-Allow-Origin": request.headers.origin,
							"Access-Control-Allow-Methods": "PUT",
							// "Transfer-Encoding": "chunked",
							"Content-Type": " application/json",
						} : {"Content-Type": " application/json"});

						response.write(JSON.stringify({
							message: "start",
							percent: 0,
							eta: "Loading...",
						}) + "\r\n");

						let count = 0;
						const start = performance.now();
						const eta = new Eta(urlArray.length, true);

						mapLimit(urlArray, 4, async (url) => {
							await getPDF(url, zipFilename);
							count++;
							eta.iterate();
							response.write(JSON.stringify({
								message: "progress",
								percent: (Math.round(count / urlArray.length * 1000) / 10),
								eta: eta.format("{{etah}}"),
								// count: count,
							}) + "\r\n");
						}, (err, results) => {
							if (err) throw err;

							const end = performance.now();
							let time = end - start;
							time /= 100;
							time = Math.round(time);
							time /= 10;

							console.log(time);
							mkdirp.sync('./public/ZIP/');
							zipLocal.sync.zip('./PDF/libretexts/' + zipFilename).compress().save('./public/ZIP/' + zipFilename + '.zip');

							response.write(JSON.stringify({
								message: "complete",
								filename: zipFilename + '.zip',
								timeTaken: time
							}));
							response.end();
						});
					});
				}
				else {
					responseError(406, request.method + " Not Acceptable")
				}
			}
			else {
				responseError(403, "CORS Error " + request.headers.origin);
			}
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

		function addLinks(object) {
			let array = [];
			if (Object.keys(object).length) {
				for (let property in object) {
					array.push(object[property].link);
					if (Object.keys(object[property].children).length) {
						array = array.concat(addLinks(object[property].children))
					}
				}
			}
			return array;
		}

		async function getPDF(url, directory) {
			const start = performance.now();
			console.log(`NEW    ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
			// const browser = await puppeteer.launch();
			const page = await browser.newPage();
			const timeout = setTimeout(() => {
				if (!page.isClosed)
					page.close();
			}, 40000);
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			let failed = false;
			let escapedURL = md5(url);

			if (!directory)
				directory = "";
			else
				directory = "libretexts/" + directory + "/";

			working[escapedURL] = Date.now();
			let PDFname = escapedURL;
			try {
				try {
					await page.goto(url, {timeout: 30000, waitUntil: ["load", "domcontentloaded", 'networkidle0']});
				}
				catch (err) {
					console.error(`ERROR  ${timestamp('MM/DD hh:mm', Date.now())} Timeout Exceeded ${url}`);
				}

				const out = await page.evaluate((url) => {
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
				if (directory) {
					PDFname = filenamify(out[1] ? out[1] : escapedURL);
				}


				const host = url.split("/")[2].split(".");
				const subdomain = host[0];
				const topIMG = baseIMG[subdomain];
				const color = colors[subdomain];
				prefix = prefix ? prefix + "." : "";
				const attribution = "";
				// "<a href='https://openstax.org/'>Content from OpenStax:</a>"

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

				const style2 = `<div id="mainF">` +
					`<div style="flex:1; display:inline-flex; align-items: center; justify-content: flex-start; color:#F5F5F5;">${attribution}<div  class='added'><a href="https://creativecommons.org/licenses/by-nc-sa/3.0/us/">CC BY-NC-SA 3.0 US</a></div></div>` +
					`<div style="background-color: white; border: 1px solid ${color}; color: ${color}; padding: 2px; border-radius: 10px; min-width: 10px; text-align: center; font-size: 8px">` + prefix + `<div class="pageNumber"></div></div>` +
					`<div style="flex:1; display:inline-flex; align-items: center;   justify-content: flex-end; color:#F5F5F5;">` +
					(attribution ? "<div class='added'>Powered by LibretextsPDF:</div>" : "") + `<div>Updated <div class="date"/></div>` +
					'</div>';

				mkdirp.sync("./PDF/" + directory);
				await page.pdf({
					path: "./PDF/" + directory + PDFname + '.pdf',
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

				/*			response.writeHead(200);
							response.write(escapedURL);
							response.end();*/


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
				console.error(`FAILED ${timestamp('MM/DD hh:mm', now)} ${ip} [${pages.length}] ${time}s ${PDFname}`);
				throw failed;
			}
			else {
				console.log(`RENDER ${timestamp('MM/DD hh:mm', now)} ${ip} [${pages.length}] ${time}s ${PDFname}`);
			}

			return PDFname + '.pdf';
		}
	}
});


function stop(){
	Gserver.close();
	Gbrowser.close();
}
module.exports = stop;