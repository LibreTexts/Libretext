const http = require('http');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");
const colors = require("./colors");
const { performance } = require('perf_hooks');

const server = http.createServer(handler);
const staticFileServer = new nodeStatic.Server('./public');
console.log("Restarted");

function handler(request, response) {
	request.url = request.url.replace("print/", "");
	const url = request.url;


	if (url.includes("url=")) { //dynamic server
		dynamicServer(request, response, url);
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
}

function dynamicServer(request, response, url) {
	if (url.startsWith("/url=") && url.includes("libretexts.org")) { //single page
		url = url.split('/url=')[1];
		if (url.endsWith(".pdf")) {
			url = url.slice(0, -4);
		}
		const escapedURL = filenamify(url);

		// response.setHeader("Content-Disposition","attachment");

		fs.stat('./PDF/' + escapedURL + '.pdf', (err, stats) => {
			if (!err && false) { //file exists
				console.log("CACHE " + url);
				staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
			}
			else {
				getPDF(url).then(() => {
					staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
				}, (err) => console.log(err));
			}
		});


		async function getPDF(url) {
			const start = performance.now();
			console.log("NEW " + url);
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			await page.goto(url, {timeout: 15000, waitUntil: ["load", "domcontentloaded", 'networkidle0']});


			let prefix = await page.evaluate((url) => {
				let prefix = "";
				let title = document.getElementById("title");

				if (title) {
					let innerText = title.textContent;
					if (innerText && innerText.includes(":")) {
						prefix = innerText.split(":")[0];
					}
					console.log(innerText);
					title.innerHTML = `<a style="color: DarkOliveGreen" href="${url}">${innerText}</a>`
				}
				return prefix;
			}, url);

			const escapedURL = filenamify(url);
			const host = url.split("/")[2].split(".");
			const subdomain = host[0];
			const topIMG = baseIMG[subdomain];
			const color = colors[subdomain];
			prefix = prefix ? prefix + "." : "";


			const cssb = [];
			cssb.push('<style>');
			cssb.push('h1 { font-size:10px;}');
			cssb.push('#main {display:flex; margin: -1px 60px 0 60px; width: 100vw}');
			// cssb.push('#main {border: 1px solid blue;}');
			cssb.push(`#library {background-color: ${color}; flex:1; display:inline-flex; justify-content:flex-end; border-radius: 0 7px 7px 0; }`);
			cssb.push('* { -webkit-print-color-adjust: exact}');
			cssb.push('#pageNumber {width:100vw; color:red}');
			cssb.push(`.trapezoid{ position:relative; display:inline-block; border-bottom: 30px solid ${color}; border-right: 0px solid transparent; border-left: 12px solid transparent; width: 9px; top: -5px; left: 0px; }`);
			cssb.push(`.trapezoid:before{ content:\' \'; left:-12px; top:37px; position:absolute; background: ${color}; border-radius:80px 0px 0px 80px; width:21px; height:8px; }`);
			cssb.push(`.trapezoid:after { content:\' \'; left:-1px; top:5px; position:absolute; background: ${color}; border-radius:75px 0px 0px 80px; width:10px; height:19px; }`);
			cssb.push('</style>');
			const css = cssb.join('');


			const style1 = '<div id="main">' +
				'<a href="https://libretexts.org" style="display: inline-block"><img src="data:image/png;base64,' + baseIMG["default"] + '" height="30"; style="padding:5px; background-color: white; margin-right: 10px"/></a>' +
				'<div class="trapezoid"></div>' +
				'<div id="library"><img src="data:image/png;base64,' + baseIMG["phys"] + '" height="20" style="padding:10px;"/></div>' +
				'</div>';

			await page.pdf({
				path: "./PDF/" + escapedURL + '.pdf',
				displayHeaderFooter: true,
				headerTemplate: css + style1,
				footerTemplate: css + '<h1 style="width:100vw; font-size:8px; text-align:center">' + prefix + '<div style="display:inline-block;" class="pageNumber"></div></h1>',
				printBackground: true,
				margin: {
					top: "90px",
					bottom: "50px",
					right: "0.75in",
					left: "0.75in",
				}
			});

			/*			response.writeHead(200);
						response.write(escapedURL);
						response.end();*/

			const end = performance.now();
			let time = end - start;
			time /= 100;
			time = Math.round(time);
			time /= 10;

			console.log("RENDERED " + time + "s " + escapedURL);
			await browser.close();
			return escapedURL + '.pdf';
		}
	}
	else {
		responseError();
	}


	function responseError(message) {
		//else fall through to error
		response.writeHead(400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
}

server.listen(3001);