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
	if (url.startsWith("/print/url=")) {
		url = url.split('/print/url=')[1];
		console.log(url);
		getPDF(url);

		async function getPDF(url) {
			// url = "https://chem.libretexts.org/LibreTexts/Sacramento_City_College/SCC%3A_CHEM_300_-_Beginning_Chemistry/SCC%3A_CHEM_300_-_Beginning_Chemistry_(Alviar-Agnew)/2%3A_Measurement_and_Problem_Solving/2.1%3A_Taking_Measurements";
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
			await page.goto(url, {waitUntil: ["load", "domcontentloaded", 'networkidle0']});

			var cssb = [];
			cssb.push('<style>');
			cssb.push('h1 { font-size:10px; margin-left:30px;}');
			// cssb.push('* { border: 1px solid blue}');
			cssb.push('#pageNumber {width:100vw; color:red}');
			cssb.push('</style>');
			var css = cssb.join('');


			const escapedURL = filenamify(url);
			const host = url.split("/").slice(0,3).join("/");
			console.log(host);
			await page.pdf({
				path: "./public/PDF/" + escapedURL + '.pdf',
				displayHeaderFooter: true,
				headerTemplate: css + '<h1><a href="https://libretexts.org"><img src="data:image/png;base64,' + baseIMG + '" height="40"/></a></h1>',
				footerTemplate: css + '<h1><div class="pageNumber" style="width:70vw; text-align:center"></div></h1>',
				margin: {
					top: "100px",
					bottom: "200px",
					right: "30px",
					left: "30px",
				}
			});
			await browser.close();

			/*	response.writeHead(200);
				response.write(url);
				response.end();*/
			// console.log(escapedURL);
			staticFileServer.serveFile('./PDF/' + escapedURL + '.pdf', 200, {}, request, response);
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