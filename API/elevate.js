const express = require('express');
const check = require('./checkAuthorization');
const app = express();
app.use(express.json());
app.use(check);

const timestamp = require('console-timestamp');
const filenamify = require('filenamify');
const fs = require('fs-extra');

const md5 = require('md5');
const cheerio = require('cheerio');
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

//express.js endpoints
app.put(`${prefix}/createSandbox`, createSandbox);
app.put(`${prefix}/cleanPath`, cleanPath);
app.put(`${prefix}/fork`, fork);
app.put(`${prefix}/manageUser/:method`, manageUser);
app.put(`${prefix}/getUsers/:group.:format`, getUsersInGroup);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));

/**
 * Creates a user sandbox and limits permissions to just that user
 * @param {Request} req 
 * @param {Response} res 
 */
async function createSandbox(req, res) {
    const body = req.body;
    // console.log(body);
    
    let originalPath = `Sandboxes/${body.username}`;
    let path = originalPath.replace('@', '_at_');
    let result = `${body.subdomain}/${body.username}`;
    
    //replace any '@' in username
    if (body.username.includes('@')) {
        let migrate = await LibreTexts.authenticatedFetch(originalPath, `move?name=${body.username.replace('@', '_at_')}&allow=deleteredirects&dream.out.format=json`, body.subdomain, botUsername, {
            method: 'POST',
        });
        console.log(`Migrate ${body.username} pages: ${(await migrate.json())["@count"]}`);
    }
    
    //create sandbox page
    let response = await LibreTexts.authenticatedFetch(path, `contents?title=${body.username}`, body.subdomain, botUsername, {
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
            let image = 'https://cdn.libretexts.net/DefaultImages/sandbox.jpg';
            image = await fetch(image);
            image = await image.blob();
            createSandbox.image = image;
        }
        let imageExists = await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail?dream.out.format=json", body.subdomain);
        if (!imageExists.ok)
            await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", body.subdomain, botUsername, {
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
	            <user id="${body.user.id}"></user>
	            <permissions>
	                <role>Manager</role>
	            </permissions>
	        </grant>
	    </grants>
	</security>`
        });
        
        if (response.ok) {
            result += ' Set to Semi-Private.';
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

/**
 * Lists all of the groups for a particular subdomain
 * @param {string} subdomain 
 * @returns {array} groups for that subdomain
 */
async function getGroups(subdomain) {
    let groups;
    if (typeof getGroups.groups === "undefined") { //reuse old data
        getGroups.groups = {};
    }
    if (typeof getGroups.groups[subdomain] !== "undefined" && getGroups.groups[subdomain].length) { //reuse old data
        return getGroups.groups[subdomain];
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
    getGroups.groups[subdomain] = groups;
    return groups;
}

/**
 * Removes any problematic characters from a page's path by moving it
 * @param {Request} req 
 * @param {Response} res 
 */
async function cleanPath(req, res) {
    const body = req.body;
    body.subdomain = body.pageSubdomain || body.subdomain;
    let page = await LibreTexts.authenticatedFetch(body.pageID, '?dream.out.format=json', body.subdomain, 'LibreBot');
    page = await page.json();
    let path = page.path["#text"];
    let originalPath = path;
    path = LibreTexts.cleanPath(path);
    if (path && (originalPath !== path || body.force)) {
        try {
            let makeChange = await LibreTexts.authenticatedFetch(body.pageID, `move?title=${encodeURIComponent(page.title)}&to=${encodeURIComponent(path)}&allow=deleteredirects&dream.out.format=json`,
                body.subdomain, 'LibreBot', {
                    method: 'POST'
                });
            if (makeChange.ok) {
                // console.log(await makeChange.text());
            }
            else
                throw Error(await makeChange.text());
        } catch (e) {
            console.error(`[cleanPath] ${path}`);
            console.error(e);
            res.send(originalPath);
            res.status(500);
            return;
        }
        console.log(`[cleanPath] ${path}`);
        res.status(200);
        res.send(path);
    }
    else
        res.send('okay');
}

/**
 * Converts any content-reuse section in the page contents into the transcluded html content
 * @param {Request} req 
 * @param {Response} res 
 */
async function fork(req, res) {
    const body = req.body;
    let destination = {path: body.path, subdomain: body.subdomain};
    let current = await LibreTexts.getAPI(`https://${body.subdomain}.libretexts.org/${destination.path}`, undefined, body.username);
    let original = await LibreTexts.authenticatedFetch(destination.path, `contents?mode=raw`, destination.subdomain, body.username);
    let sourceTags = [];
    if (original.ok) {
        try {
            original = await original.text();
            if (original) {
                original = LibreTexts.decodeHTML(original);
                original = original.match(/(?<=<body>)[\s\S]*?(?=<\/body>)/)[0];
                
                //LibreBot Forker
                let result = original;
                let success;
                let index = getIndex(current.tags);
                let crossLibrary;
                let matches = result.match(/(<p class="mt-script-comment">Cross Library Transclusion<\/p>\s+<pre class="script">\s+template\('CrossTransclude\/Web',)[\S\s]*?(\);<\/pre>)/g);
                if (matches) {
                    for (let i = 0; i < matches.length; i++) {
                        let source = JSON.parse(matches[i].match(/{.*?}/)[0].replace(/'/g, '"'));
                        source = {subdomain: source.Library, path: source.PageID};
                        
                        //Get cross content
                        let contentReuse = await LibreTexts.authenticatedFetch(source.path, 'contents?mode=raw', source.subdomain, 'LibreBot');
                        crossLibrary = source.subdomain;
                        contentReuse = await contentReuse.text();
                        contentReuse = contentReuse.match(/(?<=<body>)[\s\S]*?(?=<\/body>)/)[0];
                        contentReuse = LibreTexts.decodeHTML(contentReuse);
                        
                        //copy files from cross library
                        contentReuse = await copyFiles(contentReuse, source, destination, body.username);
                        
                        //run local fork on the incoming content
                        contentReuse = await localFork(contentReuse, source.subdomain);
                        
                        sourceTags.push(`source[${++index}]-${source.subdomain}-${source.path}`);
                        contentReuse = `<div class="comment"><div class="mt-comment-content"><p>Forker source[${index}] start-${source.subdomain}-${source.path}</p></div></div>${contentReuse}<div class="comment"><div class="mt-comment-content"><p>Forker source[${index}] end-${source.subdomain}-${source.path}</p></div></div>`;
                        result = result.replace(matches[i], contentReuse);
                    }
                    success = true;
                }
                
                let temp = result;
                result = await localFork(result);
                if (temp !== result)
                    success = true;
                
                //Same-site Forker
                async function localFork(original, crossLibrary) {
                    let subdomain = crossLibrary || body.subdomain;
                    let result = original;
                    let matches = original.match(/(<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(&quot;\)\s*?<\/pre>)/g) || original.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);
                    if (matches) {
                        for (let i = 0; i < matches.length; i++) {
                            let path, section;
                            if (matches[i].startsWith('<div class="mt-contentreuse-widget'))
                                path = matches[i].match(/(?<=data-page=")[^"]+/)[0];
                            else
                                path = matches[i].match(/(?<=<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(?=&quot;\)\s*?<\/pre>)/)[0];
                            
                            if (path.includes("&quot;, &quot;")) {
                                [, path, section] = path.match(/(^.*)&quot;, &quot;(.*$)/);
                                console.log(path, section);
                            }
                            
                            let contentReuse = await LibreTexts.authenticatedFetch(path, 'contents?mode=raw', subdomain, 'LibreBot');
                            let info = await LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json', subdomain, 'LibreBot');
                            contentReuse = await contentReuse.text();
                            info = await info.json();
                            contentReuse = LibreTexts.decodeHTML(contentReuse);
                            
                            contentReuse = contentReuse.match(/(?<=<body>)[\s\S]*?(?=<\/body>)/)[0];
                            if (section) {
                                console.log(`Grabbing section "${section}"`);
                                const $ = cheerio.load(contentReuse);
                                const sections = $('.mt-section');
                                for (let j = 0; j < sections.length; j++) {
                                    const sec = $(sections[j]);
                                    let secTitle = sec.text();
                                    if (secTitle && secTitle.includes(section)) {
                                        contentReuse = sec.html()
                                        // console.log(contentReuse);
                                        break;
                                    }
                                }
                            }
                            
                            if (crossLibrary) {
                                contentReuse = await copyFiles(contentReuse, {
                                        subdomain: crossLibrary,
                                        path: path
                                    }, destination, body.username
                                );
                            }
                            
                            contentReuse = await localFork(contentReuse, crossLibrary);
                            
                            sourceTags.push(`source[${++index}]-${subdomain}-${info['@id']}`);
                            
                            result = result.replace(matches[i], contentReuse);
                        }
                        success = true;
                    }
                    return result;
                }
                
                sourceTags = sourceTags.concat(current.tags);
                sourceTags.splice(sourceTags.indexOf("transcluded:yes"), 1);
                sourceTags = sourceTags.map(tag => `<a href="#">${tag}</a>`).join('');
                const comment = `[BOT Fork] Successfully forked https://${body.subdomain}.libretexts.org/${body.path}`;
                if (success) { //update page contents
                    await LibreTexts.authenticatedFetch(destination.path, `contents?edittime=now&comment=${encodeURIComponent(comment)}`, destination.subdomain, body.username, {
                        method: "POST",
                        body: result + `<p class="template:tag-insert"><em>Tags recommended by the template: </em>${sourceTags}</p>`,
                    });
                    
                    res.status(200);
                    let message = `[fork] Successfully forked https://${body.subdomain}.libretexts.org/${body.path}`;
                    console.log(message);
                    res.send(message);
                }
                else {
                    throw Error("No content-reuse sections detected!");
                }
            }
        } catch (e) {
            res.status(500);
            console.error(e);
            res.send(e.message);
        }
    }
    else {
        console.error(await original.text());
        res.status(500);
        let e = `[fork] Can't fork https://${body.subdomain}.libretexts.org/${body.path}`;
        console.error(e);
        res.send(e);
    }
    
    function getIndex(tags) {
        let result = 0;
        tags.forEach((tag) => {
            let index = tag.match(/(?<=source\[)[0-9]+?(?=]-)/);
            if (index) {
                index = parseInt(index);
                if (index > result)
                    result = index;
            }
        });
        return result;
    }
    
    /**
     * 
     * @param {string} content - target page's HTML that will be modified 
     * @param {Object} source - source page object
     * @param {Object} destination - destination page object
     * @param {string} user - current user that is performing this operation
     * @returns {string} - modified target page content
     */
    async function copyFiles(content, source, destination, user) {
        let response = await LibreTexts.authenticatedFetch(source.path, 'files?dream.out.format=json', source.subdomain, 'LibreBot');
        if (response.ok) {
            let files = await response.json();
            if (files["@count"] !== "0") {
                if (files.file) {
                    if (!files.file.length) {
                        files = [files.file];
                    }
                    else {
                        files = files.file;
                    }
                }
            }
            let promiseArray = [];
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                if (file['@res-is-deleted'] === 'false')
                    promiseArray.push(processFile(file));
            }
            promiseArray = await Promise.all(promiseArray);
            for (let i = 0; i < promiseArray.length; i++) {
                if (promiseArray[i]) {
                    content = content.replace(promiseArray[i].original, promiseArray[i].final);
                    content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
                }
            }
        }
        return content;
        
        
        async function processFile(file) {
            //only files with extensions
            let filename = file['filename'];
            
            if (file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail')) {
                let hasThumbnail = await LibreTexts.authenticatedFetch(destination.path, "files/=mindtouch.page%2523thumbnail", destination.subdomain, user);
                if (hasThumbnail.ok)
                    return false;
                else
                    filename = `=mindtouch.page%23thumbnail`;
            }
            let image = await LibreTexts.authenticatedFetch(source.path, `files/${filename}`, source.subdomain);
            
            image = await image.blob();
            let response = await LibreTexts.authenticatedFetch(destination.path, `files/${filename}?dream.out.format=json`, destination.subdomain, user, {
                method: "PUT",
                body: image,
            });
            response = await response.json();
            let original = file.contents['@href'].replace(`https://${source.subdomain}.libretexts.org`, '');
            return {
                original: original,
                oldID: file['@id'],
                newID: response['@id'],
                final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(destination.path))}/files/${filename}`
            };
        }
    }
}

/**
 * Modifies a user's information and permissions
 * @param {Request} req 
 * @param {Response} res 
 */
async function manageUser(req, res) {
    const body = req.body;
    const payload = body.payload;
    
    const libraryGroups = await getGroups(payload.subdomain);
    const libraryGroupsMap = {};
    for (const group of libraryGroups)
        libraryGroupsMap[group.name] = group.id;
    
    let user = await LibreTexts.getUser(payload.username, payload.subdomain, body.user.username);
    if (req.params.method === 'get') {
        
        res.status(user ? 200 : 404);
        res.send(JSON.stringify(user));
        return;
    }
    
    //update user properties
    const role = payload.groups.includes('Admin') ? 'Admin' : 'Viewer';
    // if (req.params.method === 'modify') {
    
    //TODO: license.seat is not currently working
    let response = await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/users?dream.out.format=json`, null, null, body.user.username, {
        method: 'POST',
        headers: {'content-type': 'application/xml; charset=utf-8'},
        body: `<user ${user ? `id="${user.id}"` : ''}>
    <username>${payload.username}</username>
    <email>${payload.email}</email>
    <fullname>${payload.name}</fullname>
    <license.seat>true</license.seat>
    <status>${payload.status}</status>
    <service.authentication id="${payload.sso ? 3 : 1}" />
    <permissions.user>
        <role>${role}</role>
    </permissions.user>
    </user>`
    });
    res.status(response.status);
    response = await response.text();
    await LibreTexts.sleep(100);
    
    // console.log(user.groups, payload.groups);
    if (payload.status === 'active') {
        await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/users/${user.id}/seat?dream.out.format=json`,
            null,
            null,
            body.user.username,
            {method: 'PUT'});
    }
    
    //get updated user status
    user = await LibreTexts.getUser(payload.username, payload.subdomain, body.user.username);
    user.groups = user.groups.map(g => g.name);
    
    // console.log(user.groups, payload.groups);
    
    //check for differences in groups
    const addGroups = payload.groups.filter(g => !user.groups.includes(g));
    const removeGroups = user.groups.filter(g => !payload.groups.includes(g));
    
    // console.log(addGroups, removeGroups);
    // console.log(libraryGroupsMap);
    
    //add user to groups
    for (const group of addGroups) {
        if (libraryGroupsMap[group])
            await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/groups/${libraryGroupsMap[group]}/users`,
                null, null, body.user.username, {
                    method: 'POST',
                    headers: {'content-type': 'application/xml; charset=utf-8'},
                    body: `<users><user id="${user.id}"/></users>`
                })
    }
    
    //remove user from groups
    for (const group of removeGroups) {
        if (libraryGroupsMap[group])
            await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/groups/${libraryGroupsMap[group]}/users/${user.id}`,
                null, null, body.user.username, {
                    method: 'DELETE',
                })
        //.then(async data =>console.log(await data.text()))
    }
    
    res.send(response);
}

/**
 * Sends back CSV file of all users in a particular group
 * @param {Request} req 
 * @param {Response} res 
 */
async function getUsersInGroup(req, res) {
    let result = [];
    let subdomains = Object.values(LibreTexts.libraries);
    let libraries = {};
    const inputGroup = req?.params?.group;
    // res.setHeader('Content-Disposition', 'attachment');
    
    for (const subdomain of subdomains) {
        let groups = await getGroups(subdomain);
        let targetGroup = groups.find((e) => e.name === inputGroup);
        if (targetGroup) {
            libraries[subdomain] = LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/groups/${targetGroup.id}/users?dream.out.format=json`, null, null, 'admin');
        }
        else {
            libraries[subdomain] = false;
        }
    }
    
    const usersObject = {};
    for (const subdomain in libraries) {
        // console.log(subdomain, groups)
        if (!libraries[subdomain])
            continue;
        
        let targetGroup = await libraries[subdomain];
        targetGroup = (await targetGroup.json()).user;
        
        
        if (targetGroup) {
            if (!targetGroup.length)
                targetGroup = [targetGroup];
            targetGroup = targetGroup.map(item => {
                return {
                    group: inputGroup,
                    subdomain,
                    status: item.status,
                    // id: item['@id'],
                    username: item.username,
                    email: item.email,
                    fullname: item.fullname,
                }
            });
            
            targetGroup = targetGroup.filter(item => item.status === 'active');
            
            targetGroup.forEach(item => {
                if (usersObject[item.username]) {
                    usersObject[item.username].subdomain += `; ${item.subdomain}`;
                }
                else {
                    usersObject[item.username] = item;
                }
            });
            
            result = result.concat(targetGroup);
        }
    }
    result = Object.values(usersObject);
    
    // console.log(req?.params.format);
    if (req?.params.format === 'json') {
        // await fs.writeJSON('allUsers.json', result);
        res.type('json');
        res.send(JSON.stringify(result));
        return;
    }
    else if (req?.params.format === 'csv') {
        //convert to CSV
        let keys = Object.keys(result[0]);
        let CSV = keys.join(',') + '\n';
        const columnDelimiter = ',';
        result.forEach(item => {
            let ctr = 0
            keys.forEach(key => {
                if (ctr > 0) {
                    CSV += columnDelimiter;
                }
                
                CSV += typeof item[key] === "string" && item[key].includes(columnDelimiter) ? `"${item[key]}"` : item[key];
                ctr++;
            })
            CSV += '\n';
        })
        
        // await fs.writeFile('allUsers.csv', CSV)
        res.type('text/csv');
        res.send(CSV);
    }
    console.log('done');
}
