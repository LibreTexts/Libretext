const http = require('http');
const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const server = http.createServer(handler);
const deepcopy = require('deepcopy');
const fetch = require("node-fetch");
let port = 3001;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("timetrack/", "");
	url = clarifySubdomain(url);
	
	if (url.startsWith("/receive")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " text/plain",
				});
				response.end();
			}
			else if (request.method === "POST") {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "POST",
					"Content-Type": " text/plain",
				} : {"Content-Type": " text/plain"});
				let body = [];
				request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body).toString();
					console.log(body);
					try {
						let date = new Date();
						let event = JSON.parse(body);
						await fs.ensureDir(`./timetrackData/${date.getMonth() + 1}-${date.getFullYear()}`);
						await fs.appendFile(`./timetrackData/${date.getMonth() + 1}-${date.getFullYear()}/${event.username}`, body + "\n");
						/*						if (event.messageType === "Activity") {
													if (event.editorOpen) {

													}
													else {

													}
												}
												else {

												}*/
					} catch (e) {
						console.error(e)
					}
					
					
					response.end();
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406)
			}
		}
	}
	else if (url.startsWith("/ping")) {
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
	else if (url.startsWith("/editorStats?user=")) {
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
			let user = url.split("?user=")[1];
			user = decodeURIComponent(user);
			getUserData(user).then((result) => {
				response.write(JSON.stringify(result));
				response.end();
			});
		}
		else {
			responseError(request.method + " Not Acceptable", 406)
		}
	}
	
	function responseError(message, status) {
		//else fall through to error
		response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
		response.write(("Bad Request\n" + (message ? message : url)));
		response.end();
	}
	
	async function getUserData(user) {
		let month0 = await getFileCheck(0);
		let month1 = await getFileCheck(1);
		let month2 = await getFileCheck(2);
		
		let events = month0.concat(month1).concat(month2);
		
		return dataLoad(events);
		
		async function getFileCheck(monthOffset) {
			let date = new Date();
			date.setDate(1);
			date.setMonth(date.getMonth() - monthOffset);
			let data = (await fs.pathExists(`./timetrackData/${date.getMonth() + 1}-${date.getFullYear()}/${user}`)) ? await fs.readFile(`./timetrackData/${date.getMonth() + 1}-${date.getFullYear()}/${user}`, "utf8") : undefined;
			if (data) {
				return JSON.parse("[" + data.trim().replace(/\n/g, ",") + "]");
			}
			else {
				return [];
			}
		}
		
		function dataLoad(data) {
			const viewerDays = 14;
			
			let labelsX;
			let intermediate = [];
			let today = new Date();
			today.setHours(today.getHours() - 8);
			
			for (let i = viewerDays; i >= 0; i--) {
				labelsX = [];
				let values = [];
				let currentDay = new Date();
				currentDay.setDate(today.getDate() - i);
				for (let j = 0; j < 24; j++) {
					labelsX.push(j === 12 ? 12 : j % 12);
					values[j] = 0;
				}
				
				intermediate.push({
					label: currentDay.toDateString(),
					date: currentDay,
					values: values
				});
			}
			let result = {
				Inactivity: deepcopy(intermediate),
				Activity: deepcopy(intermediate),
				Editor: deepcopy(intermediate),
			};
			
			for (let i = 0; i < data.length; i++) {
				let activity = data[i];
				let type = activity.messageType;
				activity.timestamp = new Date(activity.timestamp);
				
				if (activity.timestamp >= result[type][0].date) {
					//Find Date
					for (let i = 0; i <= viewerDays; i++) {
						if (activity.timestamp.getMonth() === result[type][i].date.getMonth() && activity.timestamp.getDate() === result[type][i].date.getDate() && activity.timestamp.getFullYear() === result[type][i].date.getFullYear()) {
							//Find Time
							result[type][i].values[activity.timestamp.getHours()] += (activity.time / 60);
							break;
						}
					}
				}
			}
			for (let i = 0; i <= viewerDays; i++) {
				for (let h = 0; h < 24; h++) {
					result.Inactivity[i].values[h] = Math.round(result.Inactivity[i].values[h]);
					result.Activity[i].values[h] = Math.round(result.Activity[i].values[h]);
					result.Editor[i].values[h] = Math.round(result.Editor[i].values[h]);
				}
			}
			
			result.Inactivity[viewerDays].values[23] = 60;
			result.Activity[viewerDays].values[23] = 60;
			result.Editor[viewerDays].values[23] = 60;
			
			return result;
		}
	}
}

function clarifySubdomain(url) {
	url = decodeURIComponent(url);
	url = url.replace('https://español.libretexts.org', 'https://espanol.libretexts.org');
	return url;
}