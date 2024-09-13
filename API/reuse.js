const { performance } = require('perf_hooks');
const fs = require('fs-extra');
const fetch = require("node-fetch");
const filenamify = require('filenamify');
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
    getLicenseReport: getLicenseReport,
    clarifySubdomain: clarifySubdomain,
    encodeHTML: encodeHTML,
    decodeHTML: decodeHTML,
    authenticate: authenticate,
    addLinks: addLinks,
    extractSubdomain: extractSubdomain,
    parseURL: parseURL,
    cleanPath: cleanPath,
    getAPI: getAPI,
    getTOC: getTOC,
    getUser: getUser,
    addProperty: addProperty,
    sleep: sleep,
    libraries: libraries,
};


/**
 * fetch wrapper function that automatically uses Mindtouch browser or server API tokens
 * @param {string|number} path - the path or pageID of the target page. Can also instead take a full arbitrary API url.
 * @param {string} api - the /pages {@link https://success.mindtouch.com/Integrations/API/API_Calls/pages|sub-endpoint} that you are calling
 * @param {string} subdomain - subdomain that the target page belongs to
 * @param {string} username - the user that is performing this request
 * @param {Object} [options={}] - optional options that will be passed to fetch()
 */
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
            return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}${api}`, options).catch((error) => {
                console.error(error);
                return error
            })
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
            return await fetch(path, options).catch((error) => {
                console.error(error);
                return error
            });
        else
            return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}${api}`, options).catch((error) => {
                console.error(error);
                return error
            });
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

/**
 * Alternate getSubpages when working on the root. For all other uses, instead use getSubpages()
 * @param {string} rootURL - url to get the recursive subpages for
 * @param {username} username - current user that is performing this request
 * @param {{flat}} options
 */
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

/**
 * Recursively get the subpages for a given page
 * @param {string} rootURL - url to get the recursive subpages for
 * @param {username} username - current user that is performing this request
 * @param {{flat: boolean, depth: number, socket}} options
 */
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
                        getContents: options.getContents,
                        getDetails: options.getDetails,
                    });
                }
                else {
                    // console.log(subpageArray[i]["uri.ui"]);
                    promiseArray[i] = subpage(subpageArray[i], i, { getContents: options.getContents, getDetails: options.getDetails });
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

/**
 * @typedef {object} LicenseInfo
 * @property {string} label - The UI-ready license name.
 * @property {string} link - A link to information about the license, or '#'.
 * @property {string} raw - The internal license identifier/name.
 * @property {string} [version] - The license version, if a Creative Commons license.
 */

/**
 * @typedef {object} PageInfo
 * @property {string} id - The page's (library-scoped) unique identifier.
 * @property {string} url - The page's live URL.
 * @property {string} title - The UI-ready page title.
 * @property {LicenseInfo} [license=null] - The page's license information.
 * @property {PageInfo[]} [children] - The page's hierarchical children.
 */

/**
 * Generates and saves a License Report for a LibreText.
 *
 * @param {object} inputData - Request information.
 * @returns {Promise<object|null>} License report data. Null indicates the URL is not a coverpage.
 */
async function getLicenseReport(input) {
    const startTime = performance.now();
    let progress = 0;

    let infoRes = await authenticatedFetch(
        input.path,
        '?dream.out.format=json',
        input.subdomain,
        input.user
    );
    infoRes = await infoRes.json();
    if (!infoRes.tags || infoRes.tags['@count'] === '0') {
        return null;
    }

    let rootTags = infoRes.tags.tag.length ? infoRes.tags.tag : [infoRes.tags.tag];
    rootTags = rootTags.map((elem) => elem.title);

    const pageID = infoRes['@id'];
    const coverID = `${input.subdomain}-${infoRes['@id']}`;
    input.pageID = pageID;

    const isCoverpage = rootTags.includes('coverpage:yes') || rootTags.includes('coverpage:toc') || rootTags.includes('coverpage:nocommons');
    if (!isCoverpage) {
        return null;
    }

    const fileName = filenamify(coverID);
    const filePath = `./public/licensereports/${fileName}.json`;

    // Check if a cached report exists
    if (!input.noCache) {
        try {
            const foundFile = await fs.readJSON(filePath);
            if (foundFile) {
                const fileStat = await fs.stat(filePath);
                if (fileStat.mtime) {
                    const now = new Date();
                    const diff = Math.abs(fileStat.mtime.getTime() - now.getTime());
                    if (diff <= 1800000) { // 30 minutes
                        console.log(`Cached licensing report for ${coverID} exists.`);
                        return foundFile;
                    }
                    console.log(`Licensing report cache has expired for ${coverID}. Refreshing...`);
                }
            }
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log(`Licensing report for ${coverID} does not yet exist. Creating it now...`);
            } else {
                console.error(e);
            }
        }
    }

    const pages = await getSubpages(
        input.root,
        input.user,
        { delay: true, flat: false, getDetails: true },
    );

    let uniqueLicenses = [];
    let processedPages = 0;

    // 'Most restrictive' to 'least restrictive'
    const orderedLicenses = ['arr', 'fairuse', 'ccbyncnd', 'ccbynd', 'ck12', 'ccbyncsa', 'ccbync',
        'ccbysa', 'ccby', 'gnu', 'gnufdl', 'gnudsl', 'publicdomain'];
    const ncLicenses = ['ccbyncnd', 'ccbyncsa', 'ccbync', 'ck12'];
    const ndLicenses = ['ccbyncnd', 'ccbynd'];
    const fuLicenses = ['fairuse'];

    /**
     * Retrieves information about a content license given its internal name.
     *
     * @param {string} lic - The internal license identifier/name.
     * @param {string} [version='4.0'] - The license version, only applicable to Creative
     *  Commons (defaults to 4).
     * @returns {LicenseInfo} The license information object, returning 'Unknown' name
     *  fields if not found.
     */
    function getLicenseInfo(lic, version = '4.0') {
        switch(lic) {
            case 'publicdomain':
                return {
                    label: 'Public Domain',
                    link: '#',
                    raw: 'publicdomain',
                };
            case 'ccby':
                return {
                    label: 'CC BY',
                    link: `https://creativecommons.org/licenses/by/${version}/`,
                    raw: 'ccby',
                    version,
                };
            case 'ccbysa':
                return {
                    label: 'CC BY-SA',
                    link: `https://creativecommons.org/licenses/by-sa/${version}/`,
                    raw: 'ccbysa',
                    version,
                };
            case 'ccbync':
                return {
                    label: 'CC BY-NC',
                    link: `https://creativecommons.org/licenses/by-nc/${version}/`,
                    raw: 'ccbync',
                    version,
                };
            case 'ccbyncsa':
                return {
                    label: 'CC BY-NC-SA',
                    link: `https://creativecommons.org/licenses/by-nc-sa/${version}/`,
                    raw: 'ccbyncsa',
                    version,
                };
            case 'ccbynd':
                return {
                    label: 'CC BY-ND',
                    link: `https://creativecommons.org/licenses/by-nd/${version}/`,
                    raw: 'ccbynd',
                    version,
                };
            case 'ccbyncnd':
                return {
                    label: 'CC BY-NC-ND',
                    link: `https://creativecommons.org/licenses/by-nc-nd/${version}/`,
                    raw: 'ccbyncnd',
                    version,
                };
            case 'gnu':
                return {
                    label: "GPL",
                    link: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
                    raw: 'gnu',
                };
            case 'gnudsl':
                return {
                    label: "GNU Design Science License",
                    link: 'https://www.gnu.org/licenses/dsl.html',
                    raw: 'gnudsl',
                };
            case 'ck12':
                return {
                    label: 'CK-12 License',
                    link: 'https://www.ck12info.org/curriculum-materials-license/',
                    raw: 'ck12',
                }
            case 'gnufdl':
                return {
                    label: "GNU Free Documentation License",
                    link: 'https://www.gnu.org/licenses/fdl-1.3.en.html',
                    raw: 'gnufdl',
                };
            case 'fairuse':
                return {
                    label: "Fair Use",
                    link: 'https://fairuse.stanford.edu/overview/fair-use/what-is-fair-use/',
                    raw: 'fairuse',
                };
            case 'arr':
                return {
                    label: 'Other',
                    link: '#',
                    raw: 'arr',
                };
            case 'notset':
                return {
                    label: 'Undeclared',
                    link: '#',
                    raw: 'notset',
                };
            default: {
                return {
                    label: 'Unknown License',
                    link: '#',
                    raw: 'unknown'
                };
            }
        }
    }

    /**
     * Recursively counts the number of pages in a book hierarchy.
     *
     * @param {object} pageObject - An object with basic information about the page,
     *  retrieved from the CXone Expert API.
     * @returns {number} The total number of pages found.
     */
    function recursiveCount(pageObject) {
        let count = 1;
        if (Array.isArray(pageObject?.children)) {
            for (let i = 0, n = pageObject.children.length; i < n; i += 1) {
                count += recursiveCount(pageObject.children[i]);
            }
        }
        return count;
    }

    const pageCount = recursiveCount(pages);

    /**
     * Processes information about a page's licensing and transforms it to the report shape.
     *
     * @param {object} pageInfo - Gathered information about the page to process.
     * @returns {PageInfo} Detailed information about the page, including licensing.
     */
    function processPage(pageInfo) {
        const newEntry = {
            license: null
        };
        if (Array.isArray(pageInfo.tags)) {
            const foundLicTag = pageInfo.tags.find(item => item.includes('license:'));
            const foundLicVer = pageInfo.tags.find(item => item.includes('licenseversion:'));
            let license = null;
            let licenseVersion = null;
            if (foundLicTag) {
                license = foundLicTag.replace('license:', '');
                licenseVersion = '4.0';
                if (foundLicVer) {
                    licenseVersion = foundLicVer.replace('licenseversion:', '');
                    licenseVersion = licenseVersion.slice(0,1) + '.' + licenseVersion.slice(1);
                }
            } else {
              license = 'notset';
            }
            const existingUnique = uniqueLicenses.find((item) => {
                if (item.raw === license) {
                    if (!item.version || (item.version && item.version === licenseVersion)) {
                        return item;
                    }
                }
                return false;
            });
            const newLicenseInfo = getLicenseInfo(license, licenseVersion);
            if (!existingUnique) {
                uniqueLicenses.push(newLicenseInfo);
            }
            newEntry.license = newLicenseInfo;
        }
        if (pageInfo.id) newEntry.id = pageInfo.id;
        if (pageInfo.url) newEntry.url = pageInfo.url;
        if (pageInfo.title) newEntry.title = pageInfo.title;
        return newEntry;
    }

    /**
     * Recursively gathers information on a page hierarchy.
     *
     * @param {object} pageObject - A page hierarchy containing at least page URLs.
     * @returns {PageInfo} The page hierarchy with detailed information.
     */
    function recurseSection(pageObject) {
        const newEntry = processPage(pageObject);
        newEntry.children = [];
        if (Array.isArray(pageObject.children) && pageObject.children.length > 0) {
            pageObject.children.forEach((subpage) => {
                newEntry.children.push(recurseSection(subpage));
            });
        }
        processedPages += 1;
        const currentProgress = Math.round(processedPages / pageCount * 100);
        if (progress < currentProgress) {
            progress = currentProgress;
        }
        return newEntry;
    }

    const toc = recurseSection(pages);

    uniqueLicenses = uniqueLicenses.map((item) => {
        return {
            ...item,
            count: 0,
            percent: 0,
        }
    });

    /**
     * Recursively updates unique license counts in a page hierarchy.
     *
     * @param {PageInfo} pageObject - The page hierarchy object.
     */
    function recurseLicense(pageObject) {
        if (pageObject.license?.raw) {
            const foundUnique = uniqueLicenses.findIndex((uniqLic) => {
                if (uniqLic.raw === pageObject.license?.raw) {
                    if (!uniqLic.version || (uniqLic.version && uniqLic.version === pageObject.license?.version)) {
                        return true;
                    }
                }
                return false;
            });
            if (foundUnique >= 0) {
                uniqueLicenses[foundUnique].count = uniqueLicenses[foundUnique].count + 1;
            }
        }
        if (Array.isArray(pageObject.children) && pageObject.children.length > 0) {
            pageObject.children.forEach((subpage) => recurseLicense(subpage));
        }
    }

    recurseLicense(toc);

    let mostRestrIdx = null;
    uniqueLicenses.forEach((item, idx) => {
        let licensePercent = (item.count / pageCount) * 100;
        if (!isNaN(licensePercent)) licensePercent = parseFloat(licensePercent.toFixed(1));
        uniqueLicenses[idx].percent = licensePercent;
        const findMostRestr = orderedLicenses.findIndex(lic => lic === item.raw);
        if ((findMostRestr >= 0) && (findMostRestr < mostRestrIdx || mostRestrIdx === null)) {
            mostRestrIdx = findMostRestr;
        }
    });
    const mostRestrictive = getLicenseInfo(orderedLicenses[mostRestrIdx]);
    let ncRestriction = false;
    let ndRestriction = false;
    let fuRestriction = false;
    const foundSpecialRestrictions = [];
    uniqueLicenses.forEach((item) => {
        if (item.raw) {
            if (!ncRestriction && ncLicenses.includes(item.raw)) {
                ncRestriction = true;
                foundSpecialRestrictions.push('noncommercial');
            }
            if (!ndRestriction && ndLicenses.includes(item.raw)) {
                ndRestriction = true;
                foundSpecialRestrictions.push('noderivatives');
            }
            if (!fuRestriction && fuLicenses.includes(item.raw)) {
                fuRestriction = true;
                foundSpecialRestrictions.push('fairuse');
            }
        }
    });

    uniqueLicenses.sort((a, b) => {
        if (a.percent > b.percent) {
            return -1;
        }
        if (a.percent < b.percent) {
            return 1;
        }
        return 0;
    });

    toc.totalPages = pageCount;

    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base'
    });

    /**
     * Recursively sorts the pages in a hierarchy by URL.
     *
     * @param {PageInfo} pageObject - The page hierarchy to work on.
     */
    function recurseSort(pageObject) {
        if (Array.isArray(pageObject?.children) && pageObject.children.length > 0) {
            pageObject.children.sort((a,b) => collator.compare(a.url, b.url));
            for (let idx = 0; idx < pageObject.children.length; idx++) {
                recurseSort(pageObject.children[idx]);
            }
        }
    }

    recurseSort(toc);

    const endTime = performance.now();
    const licenseReportData = {
        coverID,
        id: pageID,
        library: input.subdomain,
        timestamp: new Date(),
        runtime: `${endTime - startTime} ms`,
        meta: {
            mostRestrictiveLicense: mostRestrictive, // TODO: Deprecated?,
            specialRestrictions: foundSpecialRestrictions,
            licenses: uniqueLicenses
        },
        text: toc,
    };

    // Save report data
    try {
        await fs.ensureDir(`./public/licensereports`);
        await fs.writeJSON(filePath, licenseReportData);
    } catch (e) {
        console.error(e);
    }

    console.log(`Generated license report for ${coverID}.`);
    return licenseReportData;
}

/**
 *
 * @param url
 * @returns {string}
 */
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

/**
 * Helper function for server API tokens. You should likely use authenticatedFetch()
 * instead of using this function directly
 * @param {string} username - user to authenticate as
 * @param {string} subdomain - library to authenticate with
 * @returns {string}
 */
function authenticate(username, subdomain) {
    const user = "=" + username;
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
    const epoch = Math.floor(Date.now() / 1000);
    hmac.update(`${authen[subdomain].key}${epoch}${user}`);
    const hash = hmac.digest('hex');
    return `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
}

/**
 * Squashes all the recursive subpages/childen into a single array
 * @param current
 * @returns {*[]}
 */
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

/**
 * @param url - url to get subdomain from
 * @returns {string}
 */
function extractSubdomain(url) {
    let origin = url.split("/")[2].split(".");
    const subdomain = origin[0];
    return subdomain;
}

/**
 * Breaks up a url into the subdomain and path
 * @param {string} url
 * @returns {string[]}
 */
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

/**
 * Removes problematic characters from the url
 * @param path
 * @returns {string}
 */
function cleanPath(path) {
    let front = "", back = path;
    path = path.replace(/\r?\n/g, '');
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

/**
 * Grabs and formats the API data for a page
 * @param {string|Object} page - url or page object
 * @param {boolean} getContents - include the page contents
 * @param {string} username
 */
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
        if (!response) return null; // return null if empty response
        
        let {properties, tags, files} = response;
        if (properties && properties['@count'] !== '0' && properties.property) {
            properties = properties.property.length ? properties.property : [properties.property]
            properties = properties.map((prop) => {
                if (prop['@revision']) return {name: prop['@name'], value: prop.contents['#text']};
                else return prop
            });
        }
        else {
            properties = [];
        }
        if (tags && tags.tag) {
            tags = tags.tag.length ? tags.tag : [tags.tag];
        }
        else {
            tags = []
        }
        if (files && files.file) {
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
        page.path = response.path ? response.path['#text'] : path;
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

/**
 * Builds a Table of Contents for a book/text.
 *
 * The TOC in flat and hierarchical form, or null if error encountered.
 */
async function getTOC(rootURL, username) {
    const coverpageData = await getAPI(rootURL, false, username);

    async function getRawTOC(page) {
        try {
            let res = await authenticatedFetch(
                page.id,
                'tree?dream.out.format=json&include=properties,lastmodified',
                page.subdomain,
                username,
            );
            const resData = await res.json();
            return resData?.page ?? null;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function buildHierarchy(page, parentID) {
        const pageID = Number.parseInt(page['@id'], 10);
        const subpages = [];

        const processPage = (p) => ({
            ...p,
            id: pageID,
            subdomain: extractSubdomain(p['uri.ui']),
            url: p['uri.ui'],
        });

        if (Array.isArray(page?.subpages?.page)) {
            page.subpages.page.forEach((p) => subpages.push(buildHierarchy(p, pageID)));
        } else if (typeof page?.subpages?.page === 'object') {
            // single page
            subpages.push(buildHierarchy(page.subpages.page, pageID));
        }

        return processPage({
            ...page,
            ...(parentID && { parentID }),
            ...(subpages.length && { subpages }),
        });
    }

    /**
     * Recursively flattens a page hierachy by extracting any subpages and removing
     * their container array.
     *
     * @param {Object} page - Page at the level of the hierarchy to start flattening at.
     * @returns {Object[]} The flattened array of page objects.
     */
    function flatHierarchy(page) {
        let pagesArr = [];
        const pageData = { ...page };
        if (Array.isArray(pageData.subpages)) {
            pageData.subpages.forEach((subpage) => {
                pagesArr = [...pagesArr, ...flatHierarchy(subpage)];
            });
        }
        delete pageData.subpages;
        pagesArr.unshift(pageData); // add to front to preserve "ordering"
        return pagesArr;
    }

    const rawTOC = await getRawTOC(coverpageData);
    if (!rawTOC) return null;
    const structured = buildHierarchy(rawTOC);
    const flat = flatHierarchy(structured);

    return { structured, flat };
}

/**
 * Get the information for a particular user
 * @param {string} username - user to get information about
 * @param {string} requester - user that is performing the request
 */
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
 * Add a property to a library page.
 *
 * @param {string} subdomain - Library identifier.
 * @param {string|number} page - Target page path or ID.
 * @param {string} property - Name of the property to add/set.
 * @param {string} value - Value of the new property.
 * @returns {Promise<boolean>} True if successfully set, false if error encountered.
 */
async function addProperty(subdomain, page, property, value) {
    try {
        const addRes = await authenticatedFetch(
            page,
            'properties?dream.out.format=json',
            subdomain,
            'LibreBot',
            { method: 'POST', body: value, headers: { 'Slug': property } },
        );
        if (addRes.ok) {
            return true;
        }
    } catch (e) {
        console.error('[putProperty] Error encountered:');
        console.error(e);
    }
    return false;
}

/**
 * Promise-wrapped setTimeout()
 * @param {number} ms - number of milliseconds to wait
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = LibreTextsFunctions;
