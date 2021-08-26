const fs = require('fs-extra');
const fetch = require("node-fetch");
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const he = require('he');

const libraries = {
    'Biology': 'bio',
    'Business': 'biz',
    'Chemistry': 'chem',
    'Engineering': 'eng',
    'Espanol': 'espanol',
    'Geology': 'geo',
    'Humanities': 'human',
    'K12 Education': 'k12',
    'Mathematics': 'math',
    'Medicine': 'med',
    'Physics': 'phys',
    'Social Sciences': 'socialsci',
    'Statistics': 'stats',
    'Workforce': 'workforce'
};
let LibreTextsFunctions = {
    authenticatedFetch: authenticatedFetch,
    getSubpages: getSubpages,
    getSubpagesAlternate: getSubpagesAlternate,
    clarifySubdomain: clarifySubdomain,
    encodeHTML: encodeHTML,
    decodeHTML: decodeHTML,
    authenticate: authenticate,
    addLinks: addLinks,
    extractSubdomain: extractSubdomain,
    parseURL: parseURL,
    cleanPath: cleanPath,
    getAPI: getAPI,
    getUser: getUser,
    sleep: sleep,
    libraries: libraries,
};


//Function Zone
async function authenticatedFetch(path, api, subdomain, username, options = {}) {
    let isNumber;
    path = String(path);
    
    let arbitraryPage = !api && !subdomain && path.startsWith('https://');
    if (arbitraryPage) {
        [subdomain] = parseURL(path);
    }
    else {
        if (!isNaN(path)) {
            isNumber = true;
        }
        if (path === 'home') {
            isNumber = true;
        }
        if (!subdomain) {
            console.error(`Invalid subdomain ${subdomain}`);
            return false;
        }
    }
    if (api) { //query parameter checking
        if (!arbitraryPage && path && path.includes('?')) //isolated path should not have query parameters
            path = path.split('?')[0];
        if (!api.startsWith('?')) //allows for    pages/{pageid} (GET) https://success.mindtouch.com/Integrations/API/API_calls/pages/pages%2F%2F%7Bpageid%7D_(GET)
            api = `/${api}`;
    }
    if (!username) {
        options = optionsMerge({
            'X-Requested-With': 'XMLHttpRequest',
            'x-deki-token': authenBrowser[subdomain]
            
        }, options);
        if (arbitraryPage)
            return await fetch(path, options);
        else
            return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}${api}`, options);
    }
    else {
        const user = "=" + username;
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
        const epoch = Math.floor(Date.now() / 1000);
        hmac.update(`${authen[subdomain].key}${epoch}${user}`);
        const hash = hmac.digest('hex');
        let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
        
        options = optionsMerge({'x-deki-token': token}, options);
        
        if (arbitraryPage)
            return await fetch(path, options);
        else
            return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}${api}`, options);
    }
    
    function optionsMerge(headers, options) {
        if (options.headers) {
            options.headers = Object.assign(headers, options.headers)
        }
        else
            options.headers = headers;
        return options;
    }
}

async function getSubpagesAlternate(rootURL, username, options) {
    let origin = rootURL.split("/")[2].split(".");
    const subdomain = origin[0];
    let timer = 0;
    let numpages = setInterval(() => {
        if (options.socket) {
            timer += Math.round(Math.random() * 500);
            options.socket.emit('setState', {state: 'getSubpages', numPages: timer});
        }
    }, 1000);
    let pages = await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages?authenticate=true&dream.out.format=json`, {
        headers: {
            'x-deki-token': authenticate(username, subdomain)
        }
    });
    if (!pages.ok) {
        console.error(await pages.text());
        return;
    }
    pages = await pages.text();
    pages = pages.match(/(?<="uri.ui":").*?(?=")/g);
    clearInterval(numpages);
    return pages
}

async function getSubpages(rootURL, username, options = {}) {
    let origin = rootURL.split("/")[2].split(".");
    const subdomain = origin[0];
    if (rootURL.match(/\.libretexts\.org\/?$/)) { //at homepage
        rootURL = `https://${subdomain}.libretexts.org/home`;
        options['depth'] = 0;
        console.log(`Working on root ${subdomain}`);
        if (options.flat)
            return await getSubpagesAlternate(rootURL, username, options);
    }
    let count = 0;
    
    origin = rootURL.split("/").splice(0, 3).join('/');
    let path = rootURL.split('/').splice(3).join('/');
    if (options['depth'] !== 0)
        options['depth'] = (rootURL.split('/').length - 2 || 0);
    // console.log(`Initial Depth: ${options.depth}`);
    if (options.depth !== undefined)
        options.depth = options.depth + 1;
    
    let {info, contents, properties, tags} = await getPage(path, username, {
        getDetails: options.getDetails,
        getContents: options.getContents
    });
    let pages = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', subdomain, username);
    pages = await pages.json();
    
    let contentsArray = [{url: rootURL, id: info['@id'], contents: contents}];
    let flatArray = [rootURL];
    let numpages = setInterval(() => {
        if (options.socket) { //not quite working yet
            options.socket.emit('setState', {state: 'getSubpages', numPages: flatArray.length});
        }
    }, 1000);
    let result = {
        title: info.title,
        url: rootURL,
        tags: tags,
        properties: properties,
        subdomain: subdomain,
        children: await subpageCallback(pages, options),
        id: info['@id'],
    };
    clearInterval(numpages);
    if (options.getContents)
        return [result, contentsArray];
    else if (options.flat)
        return flatArray;
    else
        return result;
    
    
    async function subpageCallback(info, options = {}) {
        let subpageArray = info["page.subpage"];
        const result = [];
        const promiseArray = [];
        
        async function subpage(subpage, index, options = {}) {
            let url = subpage["uri.ui"];
            let path = subpage.path["#text"];
            const hasChildren = subpage["@subpages"] === "true";
            let children = hasChildren ? undefined : [];
            let {contents, properties, tags} = await getPage(path, username, options);
            if (hasChildren) { //recurse down
                children = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', subdomain, username);
                children = await children.json();
                children = await subpageCallback(children, !tags.includes('coverpage:yes') && options.delay ? {
                    delay: options.delay,
                    depth: options.depth,
                    getDetails: options.getDetails,
                    getContents: options.getContents
                } : {getDetails: options.getDetails, getContents: options.getContents});
            }
            contentsArray.push({url: url, id: subpage['@id'], contents: contents});
            result[index] = {
                title: subpage.title,
                url: url,
                tags: tags,
                properties: properties,
                subdomain: subdomain,
                children: children,
                id: subpage['@id'],
                relativePath: encodeURIComponent(decodeURIComponent(url).replace(decodeURIComponent(rootURL) + '/', ''))
            };
        }
        
        if (subpageArray) {
            if (!subpageArray.length) {
                subpageArray = [subpageArray];
            }
            for (let i = 0; i < subpageArray.length; i++) {
                flatArray.push(subpageArray[i]["uri.ui"]);
                if (options.delay && options.depth < 2) {
                    console.log(`Delay ${options.depth} ${subpageArray[i]["uri.ui"]}`);
                    await subpage(subpageArray[i], i, {
                        delay: options.delay,
                        depth: options.depth + 1,
                        getContents: options.getContents
                    });
                }
                else {
                    // console.log(subpageArray[i]["uri.ui"]);
                    promiseArray[i] = subpage(subpageArray[i], i, {getContents: options.getContents});
                }
            }
            await Promise.all(promiseArray);
            return result;
        }
        return {};
    }
    
    async function getPage(path, username, options) {
        let info, contents, tags, properties;
        
        if (!options.flat)
            info = authenticatedFetch(path, 'info?dream.out.format=json', subdomain, username);
        if (options.getDetails || options.getContents) {
            // properties = authenticatedFetch(path, 'properties?dream.out.format=json', subdomain, username);
            tags = authenticatedFetch(path, 'tags?dream.out.format=json', subdomain, username);
        }
        if (options.getContents) {
            contents = authenticatedFetch(path, 'contents?dream.out.format=json', subdomain, username);
        }
        
        info = await info;
        // properties = await properties;
        tags = await tags;
        contents = await contents;
        
        if (info)
            info = await info.json();
        if (contents)
            contents = await contents.text();
        /*		if (properties && (properties = await properties.json()) && properties['@count'] !== '0' && properties.property) {
                    properties = properties.property.length ? properties.property : [properties.property]
                }
                else {
                    properties = [];
                }*/
        if (tags && (tags = await tags.json()) && tags['@count'] !== '0' && tags.tag) {
            tags = tags.tag.length ? tags.tag : [tags.tag];
            tags = tags.map((elem) => elem.title);
        }
        else {
            tags = [];
        }
        
        return {info: info, tags: tags, properties: properties, contents: contents}
    }
}

function clarifySubdomain(url) {
    url = decodeURIComponent(url);
    url = url.replace('https://español.libretexts.org', 'https://espanol.libretexts.org');
    return url;
}

function decodeHTML(content) {
    /*	let ret = content.replace(/&gt;/g, '>');
        ret = ret.replace(/&lt;/g, '<');
        ret = ret.replace(/&quot;/g, '"');
        ret = ret.replace(/&apos;/g, "'");
        ret = ret.replace(/&amp;/g, '&');*/
    return he.decode(content);
}

function encodeHTML(content) {
    /*	let ret = content;
        ret = ret.replace(/&/g, '&amp;');
        ret = ret.replace(/>/g, '&gt;');
        ret = ret.replace(/</g, '&lt;');
        ret = ret.replace(/"/g, '&quot;');
        ret = ret.replace(/'/g, "&apos;");*/
    return he.encode(content, {'useNamedReferences': true});
}

function authenticate(username, subdomain) {
    const user = "=" + username;
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
    const epoch = Math.floor(Date.now() / 1000);
    hmac.update(`${authen[subdomain].key}${epoch}${user}`);
    const hash = hmac.digest('hex');
    return `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
}

function addLinks(current) {
    let array = [current.url];
    let children = current.children;
    if (children && children.length) {
        children.forEach((child) => {
            array = array.concat(addLinks(child));
        });
    }
    return array;
}

function extractSubdomain(url) {
    let origin = url.split("/")[2].split(".");
    const subdomain = origin[0];
    return subdomain;
}

function parseURL(url) {
    if (url.includes('?')) //strips any query parameters
        url = url.split('?')[0];
    if (url && url.match(/https?:\/\/.*?\.libretexts\.org/)) {
        return [url.match(/(?<=https?:\/\/).*?(?=\.)/)[0], url.match(/(?<=https?:\/\/.*?\/).*/)[0]]
    }
    else {
        return [];
    }
}

function cleanPath(path) {
    let front = "", back = path;
    if (path.includes('/'))
        [, front, back] = path.match(/(^.*[^\/]\/)([^\/].*?$)/); //only modifying page, not whole path
    try {
        back = decodeURIComponent(back);
        back = decodeURIComponent(back);
    } catch (error) {
        // console.error(path, error);
    }
    front = front.replace('?title=', '');
    back = back.replace('?title=', '');
    back = back.replace('//', '_');
    back = back.replace(/%/g, '_');
    back = back.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    back = back.replace(/[^A-Za-z0-9()_ :%\-.'@\/]/g, '');
    return front + back;
}

//fills in missing API data for a page. Username optional
async function getAPI(page, getContents, username = undefined) {
    if (page.title && page.properties && page.id && page.tags && (!getContents || page.content))
        return page;
    else if (typeof page === 'string')
        page = {
            url: page
        };
    page.url = page.url.replace('?contentOnly', '');
    let [subdomain, path] = parseURL(page.url);
    // console.log(page.url);
    let response = await authenticatedFetch(path, `?dream.out.format=json${getContents ? '&include=contents' : ''}`, subdomain, username);
    // page.response = response;
    if (response.ok) {
        response = await response.json();
        let {properties, tags, files} = response;
        if (properties['@count'] !== '0' && properties.property) {
            properties = properties.property.length ? properties.property : [properties.property]
            properties = properties.map((prop) => {
                if (prop['@revision']) return {name: prop['@name'], value: prop.contents['#text']};
                else return prop
            });
        }
        else {
            properties = [];
        }
        if (tags.tag) {
            tags = tags.tag.length ? tags.tag : [tags.tag];
        }
        else {
            tags = []
        }
        if (files.file) {
            files = files.file.length ? files.file : [files.file];
            files = files.map((file) => {
                return {
                    'id': file['@id'],
                    'revision': file['@revision'],
                    'href': file['@href'],
                    'contents': file['contents'],
                    'created': file['date.created'],
                    'filename': file['filename']
                }
            });
        }
        else {
            files = []
        }
        tags = tags.map((elem) => elem.title);
        page.id = parseInt(response['@id']);
        page.title = page.title || response.title;
        page.tags = page.tags || tags;
        page.properties = page.properties || properties;
        page.subdomain = subdomain;
        page.files = page.files || files;
        page.path = response.path['#text'];
        page.modified = new Date(response['date.modified']);
        page.content = response.content;
        if (response['page.parent'])
            page.parentID = parseInt(response['page.parent']['@id']);
        if (response.security && response.security['permissions.effective']) {
            let permissions = response.security['permissions.effective'].operations['#text'];
            if (permissions.includes('CHANGEPERMISSIONS'))
                page.security = 'Editor';
            else if (permissions.includes('UPDATE'))
                page.security = 'Author';
            else if (permissions.includes('READ'))
                page.security = 'Viewer';
        }
        
    }
    else {
        let error = await response.json();
        // console.error(`Can't get ${page.url}`);
        page.subdomain = subdomain;
        page.path = path;
        page.modified = 'restricted';
        page.error = error;
    }
    return page;
}

async function getUser(username, subdomain, requester = username) {
    let user = await authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/users/=${encodeURIComponent(encodeURIComponent(username))}?dream.out.format=json`, null, null, requester);
    if (!user.ok) {
        // console.error(await user.text());
        return false;
    }
    
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

/**
 * Promise-wrapped setTimeout()
 * @param {number} ms - number of milliseconds to wait
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = LibreTextsFunctions;
