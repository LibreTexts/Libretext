const stop = require('./nodePrint');
const expect = require('chai').expect;
const request = require('request');

before(function(){
	console.log("1");
	this.timeout(10000);
	console.log("2");
});

describe('basic response', function () {
	customTest('should return 404', '', 404);
	customTest('should return 200', 'logo.png', 200);
});

describe('dynamic response', function () {
	this.timeout(15000);
	customTest('should return 200', 'print/url=https://chem.libretexts.org/?no-cache', 200);
	customTest('should return 200', 'print/url=https://chem.libretexts.org/', 200);

});

after(function () {
	stop()
});

function customTest(string, path, status) {
	const port = 3001;
	it(string, function (done) {
		request.get(`http://localhost:${port}/${path}`, function (err, res, body) {
			if (err)
				expect(false).to.equal(true);
			else
				expect(res.statusCode).to.equal(status);
			done();
		});
	});
}