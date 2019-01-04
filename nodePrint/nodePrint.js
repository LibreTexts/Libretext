const http = require('http');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");
const colors = require("./colors");
const {performance} = require('perf_hooks');
const timestamp = require("console-timestamp");
const mapLimit = require("async/mapLimit");
const zipLocal = require('zip-local');
const Eta = require('node-eta');
const md5 = require('md5');
const events = require('events');
const fetch = require('node-fetch');

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

	//Determine if in Kubernetes
	let kubernetesServiceHost = process.env.NODE_BALANCER_SERVICE_HOST;
	if(kubernetesServiceHost){
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

			getPDF(url, isNoCache).then((result) => {
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
						"Access-Control-Allow-Methods": "PUT",
					});
					response.end();
				}
				else if (request.method === "PUT") {
					let body = [];
					request.on('data', (chunk) => {
						body.push(chunk);
					}).on('end', async () => {
						body = Buffer.concat(body).toString();
						const contents = JSON.parse(body);
						const zipFilename = filenamify(contents.batchName);
						const directory = './PDF/libretexts/' + zipFilename;
						const refreshOnly = body.refreshOnly;

						response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
							"Access-Control-Allow-Origin": request.headers.origin || null,
							"Access-Control-Allow-Methods": "PUT",
							// "Transfer-Encoding": "chunked",
							"Content-Type": " application/json",
						} : {"Content-Type": " application/json"});

						if (!refreshOnly)
							await fs.ensureDir(directory);
						let urlArray = [contents.root];
						urlArray = urlArray.concat(addLinks(contents.subpages));


						response.write(JSON.stringify({
							message: "start",
							percent: 0,
							eta: "Loading...",
						}) + "\r\n");

						let count = 0;
						let untitled = 0;
						const start = performance.now();
						const eta = new Eta(urlArray.length, true);

						mapLimit(urlArray, kubernetesServiceHost ? 4 : 2, async (url) => {
							let filename, title;
							if (kubernetesServiceHost) {
								let offloadURL = `http://${kubernetesServiceHost}/url=${url}`;
								if (contents.isNoCache)
									offloadURL += '?no-cache&offload';
								else
									offloadURL += '?offload';

								let offload = await fetch(offloadURL);
								offload = await offload.json();
								filename = offload.filename;
								title = offload.title;
							}
							else {
								let temp = await getPDF(url, contents.isNoCache, zipFilename);
								filename = temp.filename;
								title = temp.title;
							}
							count++;
							eta.iterate();

							if (filename !== 'restricted' && !refreshOnly) {
								if (!title) {
									const sourceArray = url.split("/");
									const domain = sourceArray.slice(0, 3).join("/");
									let path = sourceArray.slice(3, sourceArray.length).join("/");
									let response = await fetch(`${domain}/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/info?dream.out.format=json`);
									if (response.ok) {
										title = await response.json();
										title = title.title;
									}
									else {
										let error = await response.text();
										console.error(`Err: ${error}`);
										title = `Untitled ${++untitled}`;
									}
								}
								title = filenamify(title);

								await fs.copy(`./PDF/${filename}`, `${directory}/${title}.pdf`);
							}

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
							if (refreshOnly) {
								response.write(JSON.stringify({
									message: "complete",
									filename: 'refreshOnly',
									timeTaken: time
								}));
							}
							else {
								fs.ensureDir('./public/ZIP/');
								zipLocal.sync.zip('./PDF/libretexts/' + zipFilename).compress().save('./public/ZIP/' + zipFilename + '.zip');

								response.write(JSON.stringify({
									message: "complete",
									filename: zipFilename + '.zip',
									timeTaken: time
								}));
							}

							response.end();
						});
					});
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
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
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

		async function getPDF(url, isNoCache = false, isBatch = false) {
			let escapedURL = md5(url);
			let stats, err;
			try {
				stats = await fs.stat('./PDF/' + escapedURL + '.pdf');
			} catch (e) {
				err = e;
			}

			if ((working[escapedURL] && Date.now() - working[escapedURL] > 300000)) {
				delete working[escapedURL];					//5 min timeout for DUPE
			}

			const daysCache = 30;
			const updateTime = await checkTime(url);
			if (updateTime === 'restricted') {
				console.error(`PRIVE  ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
				return {filename: 'restricted'};
			}
			else if (!isNoCache && !err && stats.mtime > updateTime && Date.now() - stats.mtime < daysCache * 8.64e+7) { //file is up to date
				// 8.64e+7 day
				console.log(`CACHE  ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
				return {filename: escapedURL + '.pdf'};
			}
			else if (working[escapedURL] && !isBatch) { //another thread is already working
				eventEmitter.on(escapedURL, () => {
					console.log(`DUPE   ${timestamp('MM/DD hh:mm', Date.now())} ${ip} ${url}`);
					staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
				});
				setTimeout(() => {
					responseError("Request is duplicate.\nPlease try again.");
				}, 60000);
				return false;
			}

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
					console.error(`ERROR  ${timestamp('MM/DD hh:mm', Date.now())} Timeout Exceeded ${url}`);
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


				await fs.ensureDir('./PDF');
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
				console.error(`FAILED ${timestamp('MM/DD hh:mm', now)} ${ip} [${pages.length}] ${time}s ${PDFname}`);
				throw failed;
			}
			else {
				console.log(`RENDER ${timestamp('MM/DD hh:mm', now)} ${ip} [${pages.length}] ${time}s ${PDFname}`);
			}

			return {filename: PDFname + '.pdf', title: title};
		}
	}
});


function stop() {
	Gserver.close();
	Gbrowser.close();
}

module.exports = stop;