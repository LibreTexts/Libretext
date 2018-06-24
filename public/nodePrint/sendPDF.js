const nodemailer = require("nodemailer");

// send("henryd.agnew@gmail.com",[{filename:"test.pdf",path:"./public/PDF/https!chem.libretexts.org!LibreTexts!Sacramento_City_College!SCC%3A_CHEM_300_-_Beginning_Chemistry!S.pdf"}]);

module.exports = function send(address, attachments) {

	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			type: 'OAuth2',
			user: 'libretextspdf@gmail.com',
			clientId: "584865325198-l1el8q4f29rl7r0k4qrorb9jkmr5erht.apps.googleusercontent.com",
			clientSecret: 'P91A1DJ7u3lflwJhbpt0dKT0',
			refreshToken: '1/gABYV6mCu2WpzuFDPFwYvfBX4glMBMri5rCTeMxaH7E',
		}
	});

	const message = {
		from: 'sender@server.com',
		to: address,
		subject: 'Message title',
		text: 'Plaintext version of the message',
		html: '<p>HTML version of the message</p>',
		attachments: attachments,
	};

	transporter.sendMail(message, (err) => {
		if (err)
			console.error(err);
		else
			console.log("Sent to: " + address);
	});
};
