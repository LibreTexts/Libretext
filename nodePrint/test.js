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
	customTest(404, '');
	customTest(200, 'logo.png');
});

describe('dynamic response', function () {
	this.timeout(20000);
	customTest(200, 'print/url=https://chem.libretexts.org/?no-cache');
	customTest(200, 'print/url=https://chem.libretexts.org/');
	customTest(403, 'print/url=https://chem.libretexts.org/LibreTexts/University_of_California_Davis/UCD_Chem_110B%3A_Physical_Chemistry_II/Chapters/14%3A_Nuclear_Magnetic_Resonance_Spectroscopy/14.6%3A_Spin-Spin_Coupling_Results_in_Multiplets_in_NMR_Spectra');

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