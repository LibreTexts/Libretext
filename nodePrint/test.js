const stop = require('./nodePrint');
const expect = require('chai').expect;
const request = require('request');

before(function(done){
	setTimeout(function () {
		console.log("Done!");
		done();
	}, 5000);
	this.timeout(20000);
});

describe('basic response', function () {
	customTest('should return 404', '', 404);
	customTest('should return 200', 'logo.png', 200);
});

describe('dynamic response', function () {
	this.timeout(20000);
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
			if (err) {
				console.error(err);
				expect(false).to.equal(true);
			}
			else {
				expect(res.statusCode).to.equal(status);
			}
			done();
		});
	});
}