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
app.put(`${prefix}/cleanPath`, cleanPath);
app.put(`${prefix}/fork`, fork);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));


async function createSandbox(req, res) {
    const body = req.body;
    // console.log(body);

    let path = `Sandboxes/${body.username}`;
    let result = `${body.subdomain}/${body.username}`;
    let response = await LibreTexts.authenticatedFetch(path, 'contents', body.subdomain, botUsername, {
        method: 'POST',
        body: '<p>Welcome to LibreTexts&nbsp;{{user.displayname}}!</p><p class="mt-script-comment">Welcome Message</p><pre class="script">\ntemplate(\'CrossTransclude/Web\',{\'Library\':\'chem\',\'PageID\':207047});</pre><p>{{template.ShowOrg()}}</p><p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>'
    });
    if (!response.ok && !body.force) {
        result += ' Sandbox Already Exists.';
        res.status(200);
    } else {
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
        } else {
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
    } else {
        groups = [];
    }
    getGroups.groups[subdomain] = groups;
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
        } else {
            result += `\nError: ${await response.text()}`;
        }
        console.log(result);
    }

}

async function cleanPath(req, res) {
    const body = req.body;
    let page = await LibreTexts.authenticatedFetch(body.pageID, '?dream.out.format=json', body.subdomain, 'LibreBot');
    page = await page.json();
    let path = page['uri.ui'];
    [, path] = LibreTexts.parseURL(path);
    let originalPath = path;
    path = LibreTexts.cleanPath(path);
    if (path && (originalPath === path || body.force)) {
        try {
            await LibreTexts.authenticatedFetch(body.pageID, `move?title=${encodeURIComponent(page.title)}&to=${path}&allow=deleteredirects&dream.out.format=json`,
                body.subdomain, 'LibreBot', {
                    method: 'POST'
                });
        } catch (e) {
            console.error(`[cleanPath] ${path}`);
			res.status(500);
			throw e;
        }
        console.log(`[cleanPath] ${path}`);
		res.status(200);
        res.send(path);
    } else
        res.send('okay');
}

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

                //Cross-library Forker
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
                        let contentReuse = await LibreTexts.authenticatedFetch(source.path, 'contents?mode=raw', source.subdomain, 'Cross-Library');
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

                //Local Forker
                async function localFork(original, crossLibrary) {
                    let subdomain = crossLibrary || body.subdomain;
                    let result = original;
                    let matches = original.match(/(<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(&quot;\)\s*?<\/pre>)/g) || original.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);
                    if (matches) {
                        for (let i = 0; i < matches.length; i++) {
                            let path;
                            if (matches[i].startsWith('<div class="mt-contentreuse-widget'))
                                path = matches[i].match(/(?<=data-page=")[^"]+/)[0];
                            else
                                path = matches[i].match(/(?<=<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(?=&quot;\)\s*?<\/pre>)/)[0];

                            let contentReuse = await LibreTexts.authenticatedFetch(path, 'contents?mode=raw', subdomain, 'Cross-Library');
                            let info = await LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json', subdomain, 'Cross-Library');
                            contentReuse = await contentReuse.text();
                            info = await info.json();
                            contentReuse = LibreTexts.decodeHTML(contentReuse);

                            contentReuse = contentReuse.match(/(?<=<body>)[\s\S]*?(?=<\/body>)/)[0];
                            if (crossLibrary) {
                                contentReuse = await copyFiles(contentReuse, {
                                        subdomain: crossLibrary,
                                        path: path
                                    }, destination, body.username
                                );
                            }

                            contentReuse = await localFork(contentReuse, crossLibrary);

                            sourceTags.push(`source[${++index}]-${subdomain}-${info['@id']}`);
                            contentReuse = `<div class="comment"><div class="mt-comment-content"><p>Forker source[${index}] start-${subdomain}-${info['@id']}</p></div></div>${contentReuse}<div class="comment"><div class="mt-comment-content"><p>Forker source[${index}] end-${subdomain}-${info['@id']}</p></div></div>`;

                            result = result.replace(matches[i], contentReuse);
                        }
                        success = true;
                    }
                    return result;
                }

                sourceTags = sourceTags.concat(current.tags);
                sourceTags.splice(sourceTags.indexOf("transcluded:yes"), 1);
                sourceTags = sourceTags.map(tag => `<a href="#">${tag}</a>`).join('');
                if (success) {
                    await LibreTexts.authenticatedFetch(destination.path, `contents?edittime=now`, destination.subdomain, body.username, {
                        method: "POST",
                        body: result + `<p class="template:tag-insert"><em>Tags recommended by the template: </em>${sourceTags}</p>`,
                    });

                    res.status(200);
                    let message = `[fork] Successfully forked https://${body.subdomain}.libretexts.org/${body.path}`;
                    console.log(message);
                    res.send(message);
                } else {
                    throw Error("No content-reuse sections detected!");
                }
            }
        } catch (e) {
            res.status(500);
            console.error(e.message);
            res.send(e.message);
        }
    } else {
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


    async function copyFiles(content, source, destination, user) {
        let response = await LibreTexts.authenticatedFetch(source.path, 'files?dream.out.format=json', source.subdomain, 'Cross-Library');
        if (response.ok) {
            let files = await response.json();
            if (files["@count"] !== "0") {
                if (files.file) {
                    if (!files.file.length) {
                        files = [files.file];
                    } else {
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