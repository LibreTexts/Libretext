var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
const nodemailer = require("nodemailer");
const credentials = require("./credentials.json");
const md5 = require("md5");
//credentials.json format
/*{
	"secretKey":"recaptcha key",
	"host":"host",
	"auth": {"user":"username","pass":"password"},
	"recipient": "recipient"
}*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

/*app.get('/',function(req,res) {
	// Sending our HTML file to browser.
	res.sendFile(__dirname + '/index.html');
});*/

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.post('/', function (req, res) {
	// console.log(req.body['g-recaptcha-response']);
	// g-recaptcha-response is the key that browser will generate upon form submit.
	// if its blank or null means user has not selected the captcha, so return the error.
	if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		return res.json({"responseCode": 1, "responseDesc": "Please select captcha"});
	}
	// Put your secret key here.
	var secretKey = credentials.secretKey;
	// req.connection.remoteAddress will provide IP address of connected user.
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

	// Hitting GET request to the URL, Google will respond with success or error scenario.
	request(verificationUrl, function (error, response, verificationBody) {
		verificationBody = JSON.parse(verificationBody);
		// Success will be true or false depending upon captcha validation.);
		if (!verificationBody.success) {
			return res.json({"responseCode": 1, "responseDesc": "Failed captcha verification"});
		}
		res.json({
			"responseCode": 0,
			"responseDesc": "Your message has been received! You should get a CC of your request to the email you provided."
		});
		send(req.body);
	});
});

// This will handle 404 requests.
app.use("*", function (req, res) {
	console.log("404 " + req.href);
	res.status(404).send("404");
});

function send(body) {
	let {sender, senderName, message, plainMessage, subject, signature} = formatForm(body);
	const config = {
		secure: false, //Required due to misconfigured TLS
		ignoreTLS: true,
		auth: credentials.auth,
		host: credentials.host,
		port: 587
	};
	let transporter = nodemailer.createTransport(config);

	const fullMessage = {
		from: `${senderName} <${sender}>`,
		cc: sender,
		to: credentials.recipient,
		subject: subject,
		text: plainMessage,
		html: message,
	};

	transporter.sendMail(fullMessage, (err) => {
		if (err)
			console.error(err);
		else
			console.log(subject);
	});

	function formatForm(body) {
		const signature = md5(JSON.stringify(body)).substring(0,12);
		let top = body.reason;
		if (body.library !== "none") {
			top += " - " + body.library;
		}
		top += " [" + signature + "]";
		const message = `<h3>${body.name}: ${top}</h3><p>${body.message}</p><p>From ${body.name}</p>`;
		const subject = body.name + ": " + top;
		const plainMessage = subject + "\n" + body.message + "\n\nFrom " + body.name;
		return {
			sender: body.email,
			senderName: body.name,
			message: message,
			plainMessage: plainMessage,
			subject: subject,
			signature: signature
		};
	}
}

// lifting the app on port 3000.
app.listen(80);