var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
const credentials = require("./credentials.json");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

/*app.get('/',function(req,res) {
	// Sending our HTML file to browser.
	res.sendFile(__dirname + '/index.html');
});*/

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.post('/',function(req,res){
	console.log(req.body['g-recaptcha-response']);
	// g-recaptcha-response is the key that browser will generate upon form submit.
	// if its blank or null means user has not selected the captcha, so return the error.
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
	}
	// Put your secret key here.
	var secretKey = credentials.secretKey;
	// req.connection.remoteAddress will provide IP address of connected user.
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	// Hitting GET request to the URL, Google will respond with success or error scenario.
	request(verificationUrl,function(error,response,body) {
		body = JSON.parse(body);
		// Success will be true or false depending upon captcha validation.);
		if(!body.success) {
			return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
		}
		res.json({"responseCode" : 0,"responseDesc" : "Your message has been received! You should get a CC of your request to the email you provided."});
	});
});

// This will handle 404 requests.
app.use("*",function(req,res) {
	console.log("404");
	res.status(404).send("404");
});

// lifting the app on port 3000.
app.listen(80);