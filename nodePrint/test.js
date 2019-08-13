const stop = require('./nodePrint');
const expect = require('chai').expect;
const request = require('request');

before(function (done) {
	setTimeout(function () {
		console.log("Done!");
		done();
	}, 5000);
	this.timeout(20000);
});

describe('basic response', function () {
	customTest(404, 'ajkgalsnflksd');
	customTest(200, '');
	customTest(200, 'logo.png');
});

describe('dynamic response', function () {
	this.timeout(60000);
	customTest(200, 'print/url=https://chem.libretexts.org/?no-cache');
	customTest(200, 'print/url=https://chem.libretexts.org/');
	customTest(403, 'print/url=https://chem.libretexts.org/NodePrintTest');
	customTest(200, 'print/testCover');
	customTest(200, 'print/tocHTML=https://chem.libretexts.org/Bookshelves/Introductory_Chemistry/Map%3A_Introductory_Chemistry_(Tro)');
});

after(function () {
	stop()
});

function customTest(status, path) {
	const port = 3001;
	it(`Should return ${status}`, function (done) {
		request.get(`http://localhost:${port}/${path}`, function (err, res, body) {
			if (err) {
				console.error(err);
			}
			expect(res.statusCode).to.equal(status);
			done();
		});
	});
}