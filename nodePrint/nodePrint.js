const http = require('http');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");

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
	if (url.startsWith("/url=")) { //single page
		url = url.split('/url=')[1];
		if (url.endsWith(".pdf")) {
			url = url.slice(0, -4);
		}
		const escapedURL = filenamify(url);


		fs.stat('./PDF/' + escapedURL + '.pdf', (err, stats) => {
			if (!err) { //file exists
				console.log("CACHE " + url);
				staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
			}
			else {
				getPDF(url).then(() => {
				}, (err) => console.log(err));
			}
		});

		async function getPDF(url) {
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


			const cssb = [];
			cssb.push('<style>');
			cssb.push('h1 { font-size:10px;}');
			// cssb.push('* { border: 1px solid blue}');
			cssb.push('* { -webkit-print-color-adjust: exact}');
			cssb.push('#pageNumber {width:100vw; color:red}');
			cssb.push('</style>');
			const css = cssb.join('');


			const escapedURL = filenamify(url);
			const host = url.split("/")[2].split(".");
			let topIMG = "";
			let subdomain = "";
			if (host[1] === "libretexts") {
				topIMG = baseIMG[host[0]];
				subdomain = host[0] + ".";
			}
			else {
				topIMG = baseIMG["default"];
			}
			prefix = prefix ? prefix + "." : "";

			const style1 = '<div style="background-color: #38CBFD; margin-left: 40px; margin-top: -1px; width: 100vw">' +
				'<a href="https://libretexts.org" style="display: inline-block"><img src="data:image/png;base64,' + baseIMG["default"] + '" height="30"; style="padding:5px; background-color: white"/></a>' +
				'<div style="width: 0; height: 0; display: inline-block; border-top: 40px solid white;border-right: 40px solid transparent;"></div></div>';
			const style2 = '<div style="background-color: #38CBFD; margin-top: -1px; width: 100vw">' +
				'<a href="https://libretexts.org" style="margin-left: 40px; display: inline-block"><img src="data:image/png;base64,' + baseIMG["default"] + '" height="30"; style="padding:5px; background-color: white"/></a>' +
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

			console.log("RENDERED "+escapedURL);
			await browser.close();
			staticFileServer.serveFile('../PDF/' + escapedURL + '.pdf', 200, {}, request, response);
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