const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const timestamp = require('console-timestamp');
const filenamify = require('filenamify');
const fs = require('fs-extra');
const md5 = require('md5');
const LibreTexts = require('./reuse.js');
let port = 3005;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
const now1 = new Date();
app.listen(port, () => console.log('Restarted ' + timestamp('MM/DD hh:mm', now1)));
const prefix = '/elevate';
const botUsername = 'LibreBot';
//Creates a user sandbox and limits permissions to just that user
app.put(`${prefix}/createSandbox`, createSandbox);

createSandbox({body:{username: 'hdagnew@ucdavis.edu', id: 10332, subdomain: 'chem'}});

async function createSandbox(req, res) {
	const body = req.body;
	let path = `Courses/Remixer_University/Username: ${body.username}`;
	let response /*= await LibreTexts.authenticatedFetch(path, 'contents', body.subdomain, botUsername, {
		method: 'POST',
		body: '<p>{{template.ShowOrg()}}</p><p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>'
	});
	console.log(await response.text())*/;
	let result =
	response = await LibreTexts.authenticatedFetch(path, 'security?dream.out.format=json', body.subdomain, botUsername, {
		method: 'PUT',
		headers: {'content-type':'application/xml; charset=utf-8'},
		body: `<security>
    <permissions.page>
        <restriction>Semi-Private</restriction>
    </permissions.page>
    <grants>
        <grant><group id="2"></group><permissions><role>Manager</role></permissions></grant>
        <grant>
            <user id="${body.id}"></user>
            <permissions>
                <role>Manager</role>
            </permissions>
        </grant>
    </grants>
</security>`
	});
	
	console.log(await response.text());
	
	//url = LibreTexts.clarifySubdomain(url);
}

