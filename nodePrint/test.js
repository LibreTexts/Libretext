const expect = require('chai').expect;
require('./nodePrint');
const request = require('request');

describe('basic response', function () {
	customTest('should return 404', '', 404);
	customTest('should return 200', 'logo.png', 200);
});

describe('dynamic response', function () {
	this.timeout(15000);
	customTest('should return 200', 'print/url=https://chem.libretexts.org/?no-cache', 200);
	customTest('should return 200', 'print/url=https://chem.libretexts.org/', 200);
});

function customTest(string, path, status) {
	const port = 3001;
	it(string, function (done) {
		request.get(`http://localhost:${port}/${path}`, function (err, res, body) {
			expect(res.statusCode).to.equal(status);
			done();
		});
	});
}