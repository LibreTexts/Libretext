const http = require('http');
const nodeStatic = require('node-static');
const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const server = http.createServer(handler);
const zipLocal = require('zip-local');
const secure = require('./secure.json');
const mysql = require('mysql');
const util = require('util');
let port = 3004;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
const staticFileServer = new nodeStatic.Server('./public');
server.listen(port);
const now1 = new Date();
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));

function handler(request, response) {
	const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	let url = request.url;
	url = url.replace("ay/", "");
	
	if (url.startsWith("/receive")) {
		if (request.headers.origin && request.headers.origin.endsWith("libretexts.org")) {
			if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
				response.writeHead(200, {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "PUT, POST",
					"Content-Type": " text/plain",
				});
				response.end();
			}
			else if (['PUT', 'POST'].includes(request.method)) {
				response.writeHead(200, request.headers.host.includes(".miniland1333.com") ? {
					"Access-Control-Allow-Origin": request.headers.origin || null,
					"Access-Control-Allow-Methods": "PUT, POST",
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
						let courseName = event.actor.courseName;
						if (!courseName) {
							await fs.ensureDir(`./analyticsData/General/${date.getMonth() + 1}-${date.getFullYear()}`);
							await fs.appendFile(`./analyticsData/General/${date.getMonth() + 1}-${date.getFullYear()}/${event.actor.library}-${event.actor.id}.txt`, body + "\n");
						}
						else {
							if (!Array.isArray(courseName))
								courseName = [courseName];
							for (let i = 0; i < courseName.length; i++) {
								await fs.ensureDir(`./analyticsData/${courseName[i]}/${date.getMonth() + 1}-${date.getFullYear()}`);
								await fs.appendFile(`./analyticsData/${courseName[i]}/${date.getMonth() + 1}-${date.getFullYear()}/${event.actor.library}-${event.actor.id}.txt`, body + "\n");
							}
						}
					} catch (e) {
						console.error(e)
					}
					response.end();
				});
			}
			else {
				responseError(request.method + " Not Acceptable", 406);
			}
		}
	}
	else if (url === "/ping") {
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
	else if (url.startsWith("/secureAccess")) {
		if (request.headers.host.includes(".miniland1333.com") && request.method === "OPTIONS") { //options checking
			response.writeHead(200, {
				"Access-Control-Allow-Origin": request.headers.origin || null,
				"Access-Control-Allow-Methods": "PUT, GET"
			});
			response.end();
		}
		else if (request.method === "GET") {
			let key = url.split('?key=');
			if (key) {
				key = key[1];
				let courseName = secure.keys[key];
				if (courseName)
					secureAccess(courseName).then();
				else
					responseError('Incorrect key', 403)
			}
		}
		else if (request.method === "PUT") {
			let body = [];
			request.on('data', (chunk) => {
				body.push(chunk);
			}).on('end', async () => {
				let key = Buffer.concat(body).toString();
				let courseName = secure.keys[key];
				if (courseName)
					await secureAccess(courseName);
				else
					responseError('Incorrect key', 403)
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
	
	
	async function secureAccess(courseName) {
		await fs.ensureDir(`./analyticsData/ZIP/${courseName}`);
		await fs.emptyDir(`./analyticsData/ZIP/${courseName}/RAW`);
		await fs.emptyDir(`./analyticsData/ZIP/${courseName}/JSON`);
		await fs.emptyDir(`./analyticsData/ZIP/${courseName}/CSV`);
		await fs.copy(`./analyticsData/${courseName}`, `./analyticsData/ZIP/${courseName}/RAW`);
		
		//Webwork Processing
		if (courseName === 'Chem2BH') {
			const connection = mysql.createConnection(secure.mysql);
			connection.connect();
			connection.query = util.promisify(connection.query);
			let SQLresult = await connection.query('SELECT * FROM `Chem2BH_past_answer` ');
			let result = [];
			let resultCSV = 'course_id, user_id, set_id, problem_id, answer_id, scores, comment_string, timestamp, source_file';
			const keys = ['course_id', 'user_id', 'set_id', 'problem_id', 'answer_id', 'scores', 'comment_string', 'timestamp', 'source_file'];
			for (let i = 0; i < SQLresult.length; i++) {
				result.push({
					course_id: SQLresult[i].course_id,
					user_id: SQLresult[i].user_id,
					set_id: SQLresult[i].set_id,
					problem_id: SQLresult[i].problem_id,
					answer_id: SQLresult[i].answer_id,
					answer_string: SQLresult[i].answer_string,
					scores: SQLresult[i].scores,
					comment_string: SQLresult[i].comment_string,
					timestamp: SQLresult[i].timestamp,
					source_file: SQLresult[i].source_file,
				});
				
				
				let values = keys.map((x) => SQLresult[i][x]);
				resultCSV += '\n' + values.join(',');
			}
			await fs.writeFile(`./analyticsData/ZIP/${courseName}/JSON/webwork.json`, JSON.stringify(result, null, "\t"));
			await fs.writeFile(`./analyticsData/ZIP/${courseName}/CSV/webwork.csv`, resultCSV);
			connection.end();
		}
		
		
		//Reprocessing raw data
		let months = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW`, {withFileTypes: true});
		console.time('Reprocessing');
		for (let i = 0; i < months.length; i++) {
			let month = months[i];
			if (month.isDirectory()) {
				await fs.ensureDir(`./analyticsData/ZIP/${courseName}/JSON/${month.name}/`);
				await fs.ensureDir(`./analyticsData/ZIP/${courseName}/CSV/${month.name}/`);
				//process each month
				let students = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW/${month.name}`, {withFileTypes: true});
				for (let j = 0; j < students.length; j++) {
					let student = students[j];
					if (student.isFile()) {
						student = student.name;
						const fileRoot = student.replace('.txt', '');
						let lines = await fs.readFile(`./analyticsData/ZIP/${courseName}/RAW/${month.name}/${student}`);
						lines = lines.toString().replace(/\n$/, "").split('\n');
						lines = lines.map((line) => {
							try {
								let result = JSON.parse(line);
								return result;
							} catch (e) {
								console.error(`Invalid: ${line}`);
								return undefined;
							}
						});
						let result = lines;
						let resultCSV = 'courseName, library, id, platform, verb, pageURL, pageID, timestamp, pageSession, timeMe, [type or percent]';
						
						//CSV Handling
						for (let k = 0; k < result.length; k++) {
							let line = lines[k];
							if (!line) {
								continue;
							}
							resultCSV += `\n${line.actor.courseName},${line.actor.library},${line.actor.id},${line.actor.platform ? line.actor.platform.description : 'undefined'},${line.verb},${line.object.page},${line.object.id},"${line.object.timestamp}",${line.object.pageSession},${line.object.timeMe}`;
							switch (line.verb) {
								case 'left':
									resultCSV += `,${line.type}`;
									break;
								case 'read':
									resultCSV += `,${line.result.percent}`;
									break;
								case 'answerReveal':
									resultCSV += `,${line.result.answer}`;
									break;
							}
						}
						
						await Promise.all([fs.writeFile(`./analyticsData/ZIP/${courseName}/JSON/${month.name}/${fileRoot}.json`, JSON.stringify(result, null, "\t")),
						fs.writeFile(`./analyticsData/ZIP/${courseName}/CSV/${month.name}/${fileRoot}.csv`, resultCSV)]);
					}
				}
			}
		}
		console.timeEnd('Reprocessing');
		
		
		console.time('Compressing');
		await fs.ensureDir('./analyticsSecure');
		zipLocal.sync.zip(`./analyticsData/ZIP/${courseName}`).compress().save(`./analyticsSecure/secureAccess-${courseName}.zip`);
		console.timeEnd('Compressing');
		console.log(`Secure Access ${courseName} ${ip}`);
		
		staticFileServer.serveFile(`../analyticsSecure/secureAccess-${courseName}.zip`, 200, request.headers.host.includes(".miniland1333.com") ? {
			"Access-Control-Allow-Origin": request.headers.origin || null,
			"Access-Control-Allow-Methods": "PUT"
		} : {}, request, response);
	}
	
}