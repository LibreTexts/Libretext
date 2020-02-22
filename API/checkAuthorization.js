const LibreTexts = require('./reuse.js');
const authenBrowser = require('./authenBrowser.json');

async function checkAuthorization(req, res, next) {
	const body = req.body;
	const user = await getUser(body.username, body.subdomain);
	req.body.user = user;
	if (body.seatedCheck > 10 ** 15 || user.seated !== 'true' || body.token !== authenBrowser[body.subdomain] || body.id !== user.id || body.seatedCheck < 10 ** 10) {
		res.status(403);
		next('Unauthorized');
	}
	next();
}

async function getUser(username, subdomain) {
	let user = await LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/users/=${encodeURIComponent(encodeURIComponent(username))}?dream.out.format=json`, null, null, username);
	
	user = await user.json();
	user.seated = user['license.seat'];
	user.id = user['@id'];
	
	//condense groups
	if (user.groups['@count'] !== '0' && user.groups.group) {
		user.groups = user.groups.group.length ? user.groups.group : [user.groups.group];
		user.groups = user.groups.map((prop) => {
			return {name: prop['groupname'], id: prop['@id'], role: prop['permissions.group'].role['#text']};
		});
	}
	else {
		user.groups = [];
	}
	
	return user;
}

module.exports = checkAuthorization;