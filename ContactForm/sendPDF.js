const nodemailer = require("nodemailer");
const credentials = require("./credentials.json");

send("henryd.agnew@gmail.com",'<p>HTML version of the message</p>');

module.exports = send;

function send(address, message, attachments) {

	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: credentials
	});

	const fullMessage = {
		from: 'sender@server.com',
		to: address,
		subject: 'Message title',
		text: 'Plaintext version of the message',
		html: message,
		attachments: attachments,
	};

	transporter.sendMail(fullMessage, (err) => {
		if (err)
			console.error(err);
		else
			console.log("Sent to: " + address);
	});
};
