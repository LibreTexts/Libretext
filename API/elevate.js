const express = require('express');
const check = require('./checkAuthorization');
const app = express();
app.use(express.json());
app.use(check);

const timestamp = require('console-timestamp');
const filenamify = require('filenamify');
const fs = require('fs-extra');
const md5 = require('md5');
const fetch = require('node-fetch');
const LibreTexts = require('./reuse.js');
let port = 3007;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
const now1 = new Date();
app.listen(port, () => console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`));
const prefix = '/elevate';
const botUsername = 'LibreBot';
//Creates a user sandbox and limits permissions to just that user
app.put(`${prefix}/createSandbox`, createSandbox);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));


async function createSandbox(req, res) {
	const body = req.body;
	// console.log(body);
	
	let path = `Sandboxes/${body.username}`;
	let result = body.username;
	let response = await LibreTexts.authenticatedFetch(path, 'contents', body.subdomain, botUsername, {
		method: 'POST',
		body: '<p>Welcome to LibreTexts&nbsp;{{user.displayname}}!</p><p class="mt-script-comment">Welcome Message</p><pre class="script">\ntemplate(\'CrossTransclude/Web\',{\'Library\':\'chem\',\'PageID\':207047});</pre><p>{{template.ShowOrg()}}</p><p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>'
	});
	if (!response.ok && !body.force) {
		result += ' Sandbox Already Exists.';
		res.status(200);
	}
	else {
		result += ' Sandbox Created.';
		
		//add thumbnail
		if (typeof createSandbox.image === 'undefined') {
			let image = 'https://files.libretexts.org/DefaultImages/sandbox.jpg';
			image = await fetch(image);
			image = await image.blob();
			createSandbox.image = image;
		}
		let imageExists = await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail?dream.out.format=json", body.subdomain);
		if (!imageExists.ok)
			await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", body.subdomain, 'LibreBot', {
				method: "PUT",
				body: createSandbox.image,
			});
		
		//change permissions
		const groups = await getGroups(body.subdomain);
		const developerGroup = groups.find((e) => e.name === 'Developer');
		
		response = await LibreTexts.authenticatedFetch(path, 'security?dream.out.format=json', body.subdomain, botUsername, {
			method: 'PUT',
			headers: {'content-type': 'application/xml; charset=utf-8'},
			body: `<security>
	    <permissions.page>
	        <restriction>Semi-Private</restriction>
	    </permissions.page>
	    <grants>
	        ${developerGroup ? `<grant><group id="${developerGroup.id}"></group><permissions><role>Manager</role></permissions></grant>` : ''}
	        <grant>
	            <user id="${body.id}"></user>
	            <permissions>
	                <role>Manager</role>
	            </permissions>
	        </grant>
	    </grants>
	</security>`
		});
		
		if (response.ok) {
			result += ' Set to Private.';
			res.status(200);
		}
		else {
			result += `\nError: ${await response.text()}`;
			res.status(500);
			console.error(result);
		}
		
	}
	
	
	console.log(`[createSandbox] ${result}`);
	res.send(result);
}

async function getGroups(subdomain) {
	let groups;
	if (typeof getGroups.groups !== "undefined") { //reuse old data
		return getGroups.groups;
	}
	
	groups = await LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/groups?dream.out.format=json`, null, null, 'LibreBot');
	
	groups = await groups.json();
	
	if (groups['@count'] !== '0' && groups.group) {
		groups = groups.group.length ? groups.group : [groups.group];
		groups = groups.map((prop) => {
			return {name: prop['groupname'], id: prop['@id'], role: prop['permissions.group'].role['#text']};
		});
	}
	else {
		groups = [];
	}
	getGroups.groups = groups;
	return groups;
}

async function createSandboxes() {
	const alternateBotUsername = 'Replace with something';
	
	const libraries = Object.values(LibreTexts.libraries);
	for (let i = 0; i < libraries.length; i++) {
		let subdomain = libraries[i];
		let path = `Sandboxes`;
		let result = '';
		let response = await LibreTexts.authenticatedFetch(path, 'contents', subdomain, alternateBotUsername, {
			method: 'POST',
			body: '<h2>This page contains your personal sandbox.</h2><p>{{template.ShowOrg()}}</p><p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>'
		});
		// console.log(await response.text());
		
		let userID = await LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/users/=${encodeURIComponent(encodeURIComponent(alternateBotUsername))}?dream.out.format=json`, null, null, 'LibreBot');
		userID = (await userID.json())['@id'];
		
		
		result += `${subdomain} Sandbox Created.`;
		
		response = await LibreTexts.authenticatedFetch(path, 'security?dream.out.format=json', subdomain, alternateBotUsername, {
			method: 'PUT',
			headers: {'content-type': 'application/xml; charset=utf-8'},
			body: `<security>
	    <permissions.page>
	        <restriction>Semi-Private</restriction>
	    </permissions.page>
	    <grants>
	        <grant>
	            <user id="${userID}"></user>
	            <permissions>
	                <role>Manager</role>
	            </permissions>
	        </grant>
	    </grants>
	</security>`
		});
		if (response.ok) {
			result += '\nSandbox Set to Semi-Private.';
		}
		else {
			result += `\nError: ${await response.text()}`;
		}
		console.log(result);
	}
	
}
