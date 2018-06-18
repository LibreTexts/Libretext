const http = require('http');
const static = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs');
const filenamify = require('filenamify');
const baseIMG = require("./baseIMG.js");


const server = http.createServer(handler);
const staticFileServer = new static.Server('./public');

function handler(request, response) {
	var url = request.url;


	if (url.includes("/print")) { //dynamic server
		dynamicServer(request, response, url);
	}
	else { //static server
		console.log(url);
		staticFileServer.serve(request, response, function (error, res) {
			//on error
			if (error && error.status === 404) {//404 File not Found
				staticFileServer.serveFile("logo.png", 404, {}, request, response);
			}
		});
	}
}

function dynamicServer(request, response, url) {
	if (url.startsWith("/print/url=")) { //single page
		url = url.split('/print/url=')[1];
		console.log(url);
		const escapedURL = filenamify(url);


		fs.stat('./public/PDF/' + escapedURL + '.pdf', (err, stats) => {
			if (!err && false) { //file exists
				console.log(new Date(stats.mtime));
				staticFileServer.serveFile('./PDF/' + escapedURL + '.pdf', 200, {}, request, response);
			}
			else {
				getPDF(url);
			}
		});

		async function getPDF(url) {
			// url = "https://chem.libretexts.org/LibreTexts/Sacramento_City_College/SCC%3A_CHEM_300_-_Beginning_Chemistry/SCC%3A_CHEM_300_-_Beginning_Chemistry_(Alviar-Agnew)/2%3A_Measurement_and_Problem_Solving/2.1%3A_Taking_Measurements";
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			await page.goto(url, {waitUntil: ["load", "domcontentloaded", 'networkidle0']});


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


			var cssb = [];
			cssb.push('<style>');
			cssb.push('h1 { font-size:10px; margin-left:30px;}');
			// cssb.push('* { border: 1px solid blue}');
			cssb.push('#pageNumber {width:100vw; color:red}');
			cssb.push('</style>');
			var css = cssb.join('');


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
			prefix = prefix ? prefix + "." :"";

				await page.pdf({
					path: "./public/PDF/" + escapedURL + '.pdf',
					displayHeaderFooter: true,
					headerTemplate: css + '<h1><a href="https://libretexts.org"><img src="data:image/png;base64,' + topIMG + '" height="30"/></a></h1>',
					footerTemplate: css + '<h1 style="width:70vw; font-size:8px; text-align:center">' + prefix + '<div style="display:inline-block;" class="pageNumber"></div></h1>',
					printBackground: true,
					margin: {
						top: "80px",
						bottom: "70px",
						right: "0.75in",
						left: "0.75in",
					}
				});
			await browser.close();

			/*	response.writeHead(200);
				response.write(url);
				response.end();*/
			// console.log(escapedURL);
			staticFileServer.serveFile('./PDF/' + escapedURL + '.pdf', 200, {}, request, response);
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

server.listen(80);