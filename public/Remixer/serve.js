const http = require('http');
const nodeStatic = require('node-static');

const server = http.createServer(handler);
const localServer = http.createServer(handler);
const staticFileServer = new nodeStatic.Server('.', {headers: {'cache-control': 'no-cache'}});
let port = 3001;
server.listen(port);
if (process.argv.length >= 3 && parseInt(process.argv[2], 10)) {
	port = parseInt(process.argv[2], 10);
	localServer.listen(port);
}
const now1 = new Date();

async function handler(request, response) {
	let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	console.log(request.url);
	staticFileServer.serve(request, response, function (error, res) {
		//on error
		if (error && error.status === 404) {//404 File not Found
			staticFileServer.serveFile("404.html", 404, {}, request, response);
		}
	});
}