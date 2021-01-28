const LibreTexts = require('./reuse.js');
const authenBrowser = require('./authenBrowser.json');

async function checkAuthorization(req, res, next) {
    if (!req.get('Referer')?.endsWith('libretexts.org/')) {
        res.status(401);
        next(`Unauthorized ${req.get('x-forwarded-for')}`)
    }
    
    
    const body = req.body;
    
    //Legacy conversion code
    body.username = body?.globalSettings?.userSystemName || body.username;
    body.id = body?.globalSettings?.userId || body.id;
    
    const user = await getUser(body.username, body.subdomain); //use backend channel and token to verify user identity
    req.body.user = user;
    // console.log(user);
    if (body.seatedCheck > 10 ** 15 || user.seated !== 'true' || body.token !== authenBrowser[body.subdomain] || parseInt(body.id) !== parseInt(user.id) || body.seatedCheck < 10 ** 10) {
        res.status(403);
        next(`${body.username} Unauthorized ${body.seatedCheck > 10 ** 15} ${user.seated !== 'true'} ${body.token !== authenBrowser[body.subdomain]} ${parseInt(body.id) !== parseInt(user.id)} ${body.seatedCheck < 10 ** 10}`);
    }
    next();
}

async function getUser(username, subdomain) {
    let user = await LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/users/=${encodeURIComponent(encodeURIComponent(username))}?dream.out.format=json`, null, null, username);
    
    user = await user.json();
    user.seated = user['license.seat'];
    if (user.seated['#text'])
        user.seated = user.seated['#text'];
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
