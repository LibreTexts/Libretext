require('dotenv').config();
const http = require('http');
const util = require('util');
const events = require('events');
const { performance } = require('perf_hooks');
const querystring = require('querystring');
const nodeStatic = require('node-static');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const filenamify = require('filenamify');
const async = require('async');
const Eta = require('node-eta');
const md5 = require('md5');
const timestamp = require('console-timestamp');
const fetch = require('node-fetch');
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
const findRemoveSync = require('find-remove');
const storage = require('node-persist');
const JSZip = require('jszip');
const he = require('he');
const convert = require('xml-js');
const { MongoClient } = require('mongodb');
const { RateLimiterMemory } = require("rate-limiter-flexible");
const baseIMG = require('./baseIMG.js');
const styles = require('./styles.js');
const colors = require('./colors');
const {
  pdfPageMargins,
  generatePDFHeader,
  generatePDFFooter
} = require('./pdflayouts.js');
const {
    dynamicTOCLayout,
    dynamicLicensingLayout,
    dynamicDetailedLicensingLayout,
} = require('./defaults.js');
const pdfPostProcessor = require('./pdfPostProcessor.js');
// const merge = util.promisify(require('./PDFMerger.js'));
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const ignoreList = require('./ignoreList.json');

let Gbrowser;
let Gserver;
let keys;
const maxAge = 100; // in days
const maxFreshAge = 60; // in days

const cxOneRateLimiter = new RateLimiterMemory({
    duration: process.env.CXONE_RATE_LIMITER_DURATION ?? 60,
    keyPrefix: 'cxone',
    points: process.env.CXONE_RATE_LIMITER_POINTS ?? 800,
});
const waitUntilCXOneAPIAvailable = async (points = 1) => {
    let retry = true;
    while (retry) {
        try {
            await cxOneRateLimiter.consume('cxone', points);
            retry = false;
        } catch (e) {
            const waitTime = e.msBeforeNext;
            console.warn(`CXone rate limit exceeded. Retrying in ${waitTime} ms.`);
            await sleep(waitTime);
        }
    }
};

puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ],
    // headless: false,
    // devtools: true,
}).then(
    async (browser) => {
        const server = http.createServer(handler);
        const localServer = http.createServer(handler);
        const staticFileServer = new nodeStatic.Server('./public');
        const dbClient = new MongoClient(process.env.MONGODB_URI);
        const database = dbClient.db(process.env.MONGODB_DB_NAME);
        const downloadEvents = database.collection('download-events');
        let port = 3001;
        keys = authenBrowser;
        server.listen(port);
        if (process.argv.length >= 3 && parseInt(process.argv[2])) {
            port = parseInt(process.argv[2]);
            localServer.listen(port);
        }
        const now1 = new Date();
        await storage.init();
        console.log("Restarted " + timestamp('MM/DD hh:mm', now1) + " Port:" + port);
        fs.ensureDir('./PDF/Letter/Margin');
        
        // 'TOC',
        ['order', 'Cover', 'libretexts'].forEach(path => { //clean on restart
            fs.emptyDir(`./PDF/Letter/${path}`);
        });
        
        let working = {};
        let workingLibraries = {};
        const eventEmitter = new events.EventEmitter();
        
        //Determine if in Kubernetes
        let kubernetesServiceHost = process.env.NODE_BALANCER_SERVICE_HOST;
        if (kubernetesServiceHost) {
            console.log(`In Kubernetes cluster: ${kubernetesServiceHost}`);
        }
        const numThreads = kubernetesServiceHost ? 6 : 2;
        const concurrentTexts = 2;
        
        Gbrowser = browser;
        Gserver = server;

        const viewportSettings = { width: 975, height: 1000 };
        const pptrPageTimeout = 120000;
        const pptrPageLoadSettings = {
          timeout: pptrPageTimeout,
          waitUntil: ['load', 'domcontentloaded', 'networkidle0']
        };

        const pptrRequestHandler = (pptrReq) => {
          if (Array.isArray(ignoreList?.list)) {
            const pptrURL = pptrReq.url();
            const foundURL = ignoreList.list.find((u) => pptrURL.includes(u));
            if (foundURL) {
                return pptrReq.abort();
            }
          }
          return pptrReq.continue();
        };

        const pptrDialogHandler = async (dialog) => {
          await dialog.dismiss();
        };

        const eagerImageLoader = () => {
          const images = document.getElementsByTagName('img');
          for (let img of images) {
            img.loading = 'eager';
          }
        };

        const detailsOpener = () => {
          const detailsElems = document.getElementsByTagName('details');
          for (let elem of detailsElems) {
              elem.open = true;
          }
        };

        function safe(input) {
          if (input) return he.encode(input, { 'useNamedReferences': true });
          return '';
        }
        
        async function handler(request, response) {
            let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
            ip = ip.padEnd(15);
            request.url = request.url.replace("print/", "");
            request.url = request.url.replace(/https?:\/([A-z].*?).libretexts.org/, "https://$1.libretexts.org/");
            let url = clarifySubdomain(request.url);
            
            let size = 'Letter';
            url = url.replace("Letter/", "");
            if (url.startsWith('/A4')) {
                url = url.split('/A4')[1];
            }
            
            if (url.startsWith("/url=")) { //single page
                url = url.split('/url=')[1];
                
                //query string handling
                let isNoCache = false;
                let isOffload = false;
                let withMargin = true;
                if (!url.includes("libretexts.org")) {
                    responseError();
                    return;
                }
                if (url.includes("?nocache")) {
                    isNoCache = true;
                    url = url.replace("?nocache", "");
                }
                if (url.includes("?no-cache")) {
                    isNoCache = true;
                    url = url.replace("?no-cache", "");
                }
                if (url.includes("?offload") || url.includes("&offload")) {
                    isOffload = true;
                    url = url.replace("?offload", "");
                    url = url.replace("&offload", "");
                    ip = 'BatchOffload';
                }
                /*if (url.endsWith("?margin")) {
                    withMargin = true;
                }*/
                url = url.replace("?margin", "");
                /*if (url.includes('Wakim_and_Grewal'))
                    withMargin = true;*/
                if (url.endsWith(".pdf")) {
                    url = url.slice(0, -4);
                }
                // response.setHeader("Content-Disposition","attachment");
                
                getPDF(url, ip, isNoCache).then((result) => {
                    if (result) {
                        if (isOffload) {
                            response.writeHead(200);
                            response.write(JSON.stringify(result));
                            response.end();
                        }
                        else if (result.filename === 'restricted') {
                            responseError('This page is not publicly accessible.', 403)
                        }
                        else if (withMargin) //always true
                            staticFileServer.serveFile(`../PDF/${size}/Margin/${result.filename}`, 200, {'cache-control': 'no-cache'}, request, response);
                        else
                            staticFileServer.serveFile(`../PDF/${size}/${result.filename}`, 200, {'cache-control': 'no-cache'}, request, response);
                    }
                }, (err) => responseError("Server \n" + err, 500));
                
            }
            else if (url.startsWith("/Libretext=")) { //|| url.startsWith("/LibreText=")
                if ((request.headers.origin && request.headers.origin.endsWith("libretexts.org")) || request.headers.host === 'localhost') {
                    if (request.method === "GET") {
                        response.writeHead(200, {"Content-Type": " application/json"});
                        url = url.split('/Libretext=')[1];
                        let params = querystring.parse(url.split('?')[1]);
                        url = url.split('?')[0];
                        for (let param in params) {
                            if (params[param] === "")
                                params[param] = true;
                        }
                        params.ip = ip;
                        console.log(`Received Libretext request ${ip}`);
                        let finished = await getLibretext(url, response, params);
                        let [subdomain, path] = parseURL(url);
                        
                        if (finished && finished.tags && (finished.tags.includes("coverpage:yes") || finished.tags.includes('coverpage:nocommons'))) {
                            // console.log(JSON.stringify(finished, null, 2));
                            await fetch('https://api.libretexts.org/endpoint/refreshListAdd', {
                                method: 'PUT',
                                body: JSON.stringify({
                                    subdomain: subdomain,
                                    path: path.match(/^.*?(?=\/)/)[0],
                                    identifier: md5(keys[subdomain]),
                                    content: finished
                                }),
                                headers: {
                                    origin: 'print.libretexts.org'
                                }
                            });
                        }
                        response.end();
                    }
                    else {
                        responseError(request.method + " Not Acceptable", 406)
                    }
                }
                else {
                    responseError("CORS Error " + request.headers.origin, 403);
                }
            }
            else if (url === '/' || url.startsWith("/ping")) {
                if (["GET", "HEAD"].includes(request.method)) {
                    response.writeHead(200, {"Content-Type": " text/plain"});
                    response.end();
                }
                else {
                    responseError(request.method + " Not Acceptable", 406)
                }
            }
            else if (url.startsWith('/toc=')) {
                url = url.split('/toc=')[1];
                if (url.endsWith(".pdf")) {
                    url = url.slice(0, -4);
                }
                let file = await getTOC(url);
                staticFileServer.serveFile(`../PDF/${size}/Margin/TOC/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
            }
            else if (url.startsWith('/cover=')) {
                url = url.split('/cover=')[1];
                if (url.endsWith(".pdf")) {
                    url = url.slice(0, -4);
                }
                let options = url.split('&options=');
                if (options[1]) {
                    url = options[0];
                    options = JSON.parse(decodeURIComponent(options[1]));
                }
                else
                    options = {};
                
                let current = await getSubpages(url, {subpages: []});
                
                
                let file = await getCover(current, options.numPages, options);
                staticFileServer.serveFile(`../PDF/${size}/Cover/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
            }
            else if (url.startsWith('/testCover')) {
                let current = await getSubpages('https://socialsci.libretexts.org/Courses/University_of_Hawaii_Maui_College/UHMC%3A_PSY_212_-_Research_Methods_(Thornton)', {subpages: []});
                let options = url.split('?options=');
                if (options[1]) {
                    options = JSON.parse(decodeURIComponent(options[1]));
                }
                else
                    options = {hasExtraPadding: true};
                let file = await getCover(current, 216, options); //, url.includes('pad'), url.includes('hard')
                staticFileServer.serveFile(`../PDF/${size}/Cover/${file}.pdf`, 200, {'cache-control': 'no-cache'}, request, response);
            }
            else if (url.startsWith('/Finished/')) {
                url = url.split('/Finished/')[1];
                url = decodeURIComponent(url);
                let forceView = false;
                if (url.includes('?view=true')) {
                    url = url.replace('?view=true', '');
                    forceView = true;
                }
                const splitURL = url.split('/');
                if (await fs.exists(`./PDF/${size}/Finished/${url}`)) {
                    staticFileServer.serveFile(`../PDF/${size}/Finished/${url}`, 200, {
                        'Content-Disposition': forceView ? '' : 'attachment',
                        'cache-control': 'no-cache'
                    }, request, response);
                    try {
                        if (splitURL.length > 1) {
                            const identifier = splitURL[0];
                            const file = splitURL.slice(1).join('/');
                            const extension = file.split('.')[1];
                            if (identifier && file && extension) {
                                downloadEvents.insertOne({
                                    identifier,
                                    file,
                                    format: extension.toLowerCase(),
                                    timestamp: new Date(),
                                });
                            }
                        }
                        // old total download count
                        let count = await storage.getItem('downloadCount') || 0;
                        await storage.setItem('downloadCount', count + 1);
                    } catch (e) {
                        console.warn('Error inserting download event record in database.');
                        console.warn(e);
                    }
                    let now2 = new Date();
                    // await fs.appendFile(`./public/StatsFull.txt`, `${timestamp('MM/DD hh:mm', now2)}: ${ip} ${url}\n`);
                }
                else {
                    console.error(url);
                    staticFileServer.serveFile("404.html", 404, {}, request, response);
                }
            }
            else if (url === '/Stats') {
                response.write("" + (await storage.getItem('downloadCount') || 0));
                response.end();
            }
            /*else if (url === '/StatsFull') {
                staticFileServer.serveFile(`./StatsFull.txt`, 404, {'cache-control': 'no-cache'}, request, response);
            }*/
            else if (url.startsWith('/Refresh') && request.method === 'PUT') {
                if (!request.headers.origin || !request.headers.origin.endsWith("libretexts.org")) {
                    responseError('Unauthorized', 401);
                    return;
                }
                else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                }
                let body = [];
                request.on('data', (chunk) => {
                    body.push(chunk);
                }).on('end', async () => {
                    body = Buffer.concat(body).toString();
                    let input = JSON.parse(body);
                    
                    let toBatch = [];
                    for (const library in input.libraries) {
                        if (!input.libraries.hasOwnProperty(library))
                            continue;
                        let libraryContents = input.libraries[library];
                        if (library === 'espanol' && libraryContents.home) {
                            toBatch.push({subdomain: library, paths: ['home']});
                        }
                        else {
                            let paths = [];
                            if (libraryContents.courses)
                                paths.push('Courses');
                            if (libraryContents.bookshelves)
                                paths.push('Bookshelves');
                            if (paths.length)
                                toBatch.push({subdomain: library, paths: paths});
                        }
                        
                    }
                    
                    console.log(toBatch);
                    response.write(JSON.stringify(toBatch, null, 2));
                    response.end();
                    
                    //Remove all files older than 2 months.
                    console.log(`Cleaning...`);
                    /*let count = 0;
                    let heartbeat = setInterval(() => {
                        if (response && !response.finished)
                            response.write(`${(++count)}s\r\n`.padStart(5, ' '))
                    }, 1000);*/
                    findRemoveSync('./PDF', {
                        age: {seconds: maxAge * 8.64e+4},
                        // dir: "*",
                        files: "*.*",
                    });
                    
                    
                    for (const library of toBatch) {
                        for (const path of library.paths) {
                            const subdomain = library.subdomain
                            console.log(`Starting Refresh ${subdomain} ${path} ${ip}`);
                            let all = await getSubpagesFull(`https://${subdomain}.libretexts.org/${path}`);
                            let texts = [];
                            let finished = [];
                            console.log(`Sorting ${subdomain} ${path} ${ip}`);
                            let sortCounter = 0;
                            await sort(all);
                            
                            async function sort(current) {
                                current = await getAPI(current);
                                if (++sortCounter % 100 === 0)
                                    console.log(sortCounter, current.url)
                                for (let i = 0; i < current.subpages.length; i++) {
                                    let page = current.subpages[i];
                                    page = await getAPI(page);
                                    await sleep(100);
                                    if (++sortCounter % 100 === 0)
                                        console.log(sortCounter, page.url)
                                    
                                    if (page.modified === 'restricted')
                                        continue;
                                    if (page.title === 'Remixer University')
                                        page.subpages = page.subpages.filter((item) => item.title === "Contruction Guide");
                                    
                                    if (page.tags.includes('coverpage:yes') || page.tags.includes('coverpage:nocommons')) {
                                        texts.push(page);
                                    }
                                    else if (page.tags.includes('coverpage:toc')) {
                                        //do nothing
                                    }
                                    else {
                                        if (page.tags.includes('article:topic-category') && page.subpages)
                                            await sort(page); //recurse down
                                    }
                                }
                            }
                            
                            //process Texts
                            console.log(`Processing ${texts.length} LibreTexts in ${subdomain}`);
                            let availIndex = Array.from(Array(concurrentTexts), (_, i) => i + 1);
                            await async.mapLimit(texts, concurrentTexts, async (current, callback) => {
                                let index = availIndex.shift();
                                finished.push(await getLibretext(current, null, {
                                    current: current,
                                    ip: `<<Batch [${index}]>>`.padEnd(15),
                                    index: index,
                                    nocache: input.nocache,
                                    multiple: true,
                                }));
                                availIndex.push(index);
                            });
                            
                            await fetch('https://api.libretexts.org/endpoint/refreshList', {
                                method: 'PUT',
                                body: JSON.stringify({
                                    subdomain: subdomain,
                                    path: path,
                                    identifier: md5(keys[subdomain]),
                                    content: {
                                        timestamp: new Date(),
                                        numItems: finished.length,
                                        items: finished
                                    }
                                }),
                                headers: {
                                    origin: 'print.libretexts.org'
                                }
                            });
                            console.log(`Finished Refresh: ${subdomain}/${path} (${ip}), ${finished.length} items`);
                            if (subdomain === 'espanol')
                                break; //Only processing home path
                            
                        }
                    }
                    
                });
            }
            else { //static server
                // console.log(url);
                staticFileServer.serve(request, response, function (error, res) {
                    //on error
                    if (error && error.status === 404) {//404 File not Found
                        staticFileServer.serveFile("404.html", 404, {}, request, response);
                    }
                });
            }
            
            
            function responseError(message, status) {
                //else fall through to error
                if (!response.finished) {
                    response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
                    response.write(message ? message : "Bad Request\n" + url);
                    response.end();
                }
            }
        }
        
        function addLinks(subpages) {
            let array = [];
            if (subpages && subpages.length) {
                subpages.forEach((child) => {
                    if (child.title === 'Front Matter' || child.title === 'Back Matter')
                        return;
                    let result = [child];
                    array = array.concat(result.concat(addLinks(child.subpages)));
                });
            }
            return array;
        }
        
        async function getLicense(current) {
            /**
             * Builds an HTML string with the specified Creative Commons license's icon(s).
             * @param {string[]} clauses - Array of clause identifiers, starting with 'cc'.
             * @returns {string} HTML string with license's icon(s) as image/svg.
             */
            function ccIcons(clauses) {
                if (Array.isArray(clauses) && clauses.length > 0) {
                    let iconString = '';
                    clauses.forEach((item) => {
                        iconString = `${iconString}<img src="data:image/svg+xml;base64,${baseIMG.cc[`${item}-clause`]}"/>`;
                    });
                    return iconString;
                }
                return '';
            }

            if (Array.isArray(current.tags)) {
                let license = '';
                let licenseVersion = '4.0';
                /* Find license and version (if indicated) */
                current.tags.forEach((item) => {
                    if (typeof (item) === 'string' && item.includes('license')) {
                        const tagRaw = item.split(':');
                        if (Array.isArray(tagRaw) && tagRaw.length > 1) {
                            const [tagName, tagVal] = tagRaw;
                            if (tagName === 'license') {
                                license = tagVal;
                            } else if (tagName === 'licenseversion' && tagVal.length === 2) {
                                licenseVersion = `${tagVal.slice(0,1)}.${tagVal.slice(1)}`; // raw version has no separator
                            }
                        }
                    }
                });
                if (license.length > 0) {
                    switch (license) {
                        case 'publicdomain':
                            return {
                                label: ccIcons(['pd']),
                                link: 'https://en.wikipedia.org/wiki/Public_domain',
                                raw: 'publicdomain',
                            };
                        case 'ccby':
                            return {
                                label: ccIcons(['cc', 'by']),
                                link: `https://creativecommons.org/licenses/by/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccby',
                            };
                        case 'ccbysa':
                            return {
                                label: ccIcons(['cc', 'by', 'sa']),
                                link: `https://creativecommons.org/licenses/by-sa/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccbysa',
                            };
                        case 'ccbyncsa':
                            return {
                                label: ccIcons(['cc', 'by', 'nc', 'sa']),
                                link: `https://creativecommons.org/licenses/by-nc-sa/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccbyncsa',
                            };
                        case 'ccbync':
                            return {
                                label: ccIcons(['cc', 'by', 'nc']),
                                link: `https://creativecommons.org/licenses/by-nc/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccbync',
                            };
                        case 'ccbynd':
                            return {
                                label: ccIcons(['cc', 'by', 'nd']),
                                link: `https://creativecommons.org/licenses/by-nd/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccbynd',
                            };
                        case 'ccbyncnd':
                            return {
                                label: ccIcons(['cc', 'by', 'nc', 'nd']),
                                link: `https://creativecommons.org/licenses/by-nc-nd/${licenseVersion}/`,
                                version: licenseVersion,
                                raw: 'ccbyncnd',
                            };
                        case 'gnu':
                            return {
                                label: 'GPL',
                                link: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
                                raw: 'gnu',
                            };
                        case 'gnudsl':
                            return {
                                label: 'GNU Design Science License',
                                link: 'https://www.gnu.org/licenses/dsl.html',
                                raw: 'gnudsl',
                            };
                        case 'gnufdl':
                            return {
                                label: 'GNU Free Documentation License',
                                link: 'https://www.gnu.org/licenses/fdl-1.3.en.html',
                                raw: 'gnufdl',
                            };
                        case 'arr':
                            return {
                                label: '© All Rights Reserved',
                                link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
                                raw: 'arr',
                            };
                        case 'ck12':
                            return {
                                label: `<img src="data:image/png;base64,${baseIMG.cc['ck12']}"/>`,
                                link: 'https://www.ck12info.org/curriculum-materials-license',
                                raw: 'ck12',
                            };
                        default:
                            break;
                        }
                }
            }
            return null; // not found
        }
        
        async function getInformation(current) {
            if (current.gotInformation) return; //exit if already ran
            else current.gotInformation = true;
            // Retrieve LibreText summary
            current.summary = ''; // set to empty in case of not found
            if (Array.isArray(current.properties)) {
                let findSummary = current.properties.find(prop => typeof(prop) === 'object' && prop['@name'] === 'mindtouch.page#overview');
                if (findSummary !== undefined && typeof(findSummary.contents) === 'object') {
                    if (typeof(findSummary.contents['#text']) === 'string') {
                        current.summary = findSummary.contents['#text'];
                    }
                }
            }
            // Process tags
            for (let i = 0; i < current.tags.length; i++) {
                let tag = current.tags[i];
                let items;
                if (tag)
                    tag = tag.replace(/\\\\/g, '\n');
                if (tag.startsWith('lulu@')) {
                    items = tag.split('@');
                }
                else if (tag.startsWith('lulu|')) {
                    items = tag.split('|');
                }
                else if (tag.startsWith('lulu,')) {
                    items = tag.split(',');
                }
                if (items) {
                    if (items[1])
                        current.title = items[1];
                    if (items[2])
                        current.name = items[2];
                    if (items[3])
                        current.companyname = items[3];
                    if (items[4])
                        current.spineTitle = items[4];
                }
                else if (tag.startsWith('authorname:')) {
                    current.authorTag = tag.replace('authorname:', '');
                    
                    if (!current.name) {
                        if (typeof getInformation.libreAuthors === 'undefined')
                            getInformation.libreAuthors = {};
                        if (!getInformation.libreAuthors[current.subdomain]) {
                            let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${current.subdomain}`, {headers: {'origin': 'print.libretexts.org'}});
                            getInformation.libreAuthors[current.subdomain] = await authors.json();
                        }
                        
                        let information = getInformation.libreAuthors[current.subdomain][current.authorTag];
                        if (information) {
                            Object.assign(current, information);
                        }
                    }
                }
            }
        }
        
        async function getCover(current, numPages, options = {}) {
            current = await getAPI(current);
            await fs.ensureDir(`./PDF/Letter/Cover`);
            
            if (!options.thin && (numPages < 32 && options.hasExtraPadding && !options.isHardcover) || (numPages < 24 && options.hasExtraPadding && options.isHardcover))
                return false;
            
            let escapedURL = `${current.subdomain}-${current.id}`;
            const page = await browser.newPage();
            
            /*let origin = url.split("/")[2].split(".");
            const subdomain = origin[0];
            let path = url.split('/').splice(3).join('/');*/
            await getInformation(current);
            
            let overview = current.properties.find(prop => prop['@name'] === 'mindtouch.page#overview');
            let logo = current.tags.find(tag => tag.startsWith('luluCover@'));
            if (overview)
                overview = overview.contents['#text'];
            if (logo)
                logo = logo.split('luluCover@')[1];
            else
                logo = 'https://chem.libretexts.org/@api/deki/files/242117/default.png';
            
            let style = `<link rel="stylesheet" type="text/css" href="http://localhost:${port}/print/cover.css"/><script src="http://localhost:${port}/print/qrcode.js"></script>
		<link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i" rel="stylesheet"><style>#frontContainer{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluFront' : 'NormalFront'}/${current.subdomain}.png")}#backContainer{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluBack' : 'NormalBack'}/${current.subdomain}.png")</style>`;
            let frontContent = `<div id="frontContainer"><div><div id="frontTitle">${current.title || ''}</div></div><div><div id="frontCite"><i>${current.name || ''}</i><br/>${current.companyname || ''}</div></div></div>`;
            let backContent = `<div id="backContainer"><div>${logo ? `<img id="backLogo" src="${logo}">` : ''}</div><div><div id="backOverview">${overview}</div><canvas id="canvas"></canvas></div></div></div>`;
            let spine = `<div id="spine"><div>${current.spineTitle || current.title || ''}</div><div id="spineCite"><b style="flex:1; text-align: center">${current.name || ''}</b><img src="http://localhost:${port}/print/stacked.png"/></div></div><style>#spine{background-image: url("http://localhost:${port}/print/${options.hasExtraPadding ? 'LuluSpine' : 'NormalSpine'}/${current.subdomain}.png")}></style>`;
            spine += `<style>#spine{ width: ${getSpine() / getWidth() * 100}%; font-size: ${Math.min(getSpine() / getWidth() * 500, 40)}px}</style>`;
            
            let content = numPages ? `${style}${backContent}${(options.thin ? '' : spine)}${frontContent}` : `${style}${frontContent}`;
            if (options.hasExtraPadding) {
                content += `<style>#frontContainer, #backContainer {padding: 117px 50px;} #spine {padding: 117px 0;}</style>`;
            }
            let QRoptions = {errorCorrectionLevel: 'L', margin: 2, scale: 2, color: {dark: '#127bc4', light: '#fff'}};
            content += `<script>QRCode.toCanvas(document.getElementById('canvas'), '${current.url}', ${JSON.stringify(QRoptions)},  function (error) {if (error) console.error(error);console.log('success!');})</script>`;
            // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
            
            try {
                await page.setContent(content,
                    {waitUntil: ["load", "domcontentloaded", 'networkidle0']});
            } catch (e) {
            
            }
            await page.pdf({
                path: `./PDF/Letter/Cover/${escapedURL}.pdf`,
                printBackground: true,
                width: numPages ? `${getWidth()} in` : '8.5 in',
                height: numPages ?
                    (options.isHardcover ? '12.75 in' : '11.25 in') : '11 in',
                timeout: pptrPageTimeout
            });
            
            // console.log(numPages ? getWidth() : '8.5 in', numPages ? (isHardcover ? '12.750 in' : '11.25 in') : '11 in');
            await page.close();
            return escapedURL;
            
            function getSpine() {
                let sizes = {
                    '0': null,
                    '24': .25,
                    '84': .5,
                    '140': .625,
                    '169': .6875,
                    '195': .75,
                    '223': .8125,
                    '251': .875,
                    '279': .9375,
                    '307': 1,
                    '335': 1.0625,
                    '361': 1.125,
                    '389': 1.1875,
                    '417': 1.25,
                    '445': 1.3125,
                    '473': 1.375,
                    '501': 1.4375,
                    '529': 1.5,
                    '557': 1.5625,
                    '582': 1.625,
                    '611': 1.6875,
                    '639': 1.75,
                    '667': 1.8125,
                    '695': 1.875,
                    '723': 1.9375,
                    '751': 2,
                    '779': 2.0625,
                    '800': 2.125,
                };
                if (options.thin) {
                    return 0;
                }
                else if (!options.hasExtraPadding) { //Amazon size
                    return numPages * 0.002252;
                }
                else if (options.isHardcover) {
                    let result = '';
                    for (let number in sizes) {
                        if (numPages > parseInt(number)) {
                            result = sizes[parseInt(number)];
                        }
                    }
                    if (result) {
                        return result;
                    }
                    
                }
                else {
                    let width = (numPages / 444) + 0.06;
                    width = Math.floor(width * 1000) / 1000;
                    return width;
                }
            }
            
            function getWidth() {
                // return '20.125 in';
                let sizes = {
                    '0': null,
                    '24': .25,
                    '84': .5,
                    '140': .625,
                    '169': .6875,
                    '195': .75,
                    '223': .8125,
                    '251': .875,
                    '279': .9375,
                    '307': 1,
                    '335': 1.0625,
                    '361': 1.125,
                    '388': 1.1875,
                    '417': 1.25,
                    '445': 1.3125,
                    '473': 1.375,
                    '501': 1.4375,
                    '529': 1.5,
                    '557': 1.5625,
                    '582': 1.625,
                    '611': 1.6875,
                    '639': 1.75,
                    '667': 1.8125,
                    '695': 1.875,
                    '723': 1.9375,
                    '751': 2,
                    '779': 2.0625,
                    '800': 2.125,
                };
                if (options.thin) {
                    return 17.25;
                }
                else if (!options.hasExtraPadding) { //Amazon size
                    // console.log(numPages * 0.002252);
                    return numPages * 0.002252 + 0.375 + 17;
                }
                else if (options.isHardcover) {
                    let result = '';
                    for (let number in sizes) {
                        if (numPages > parseInt(number)) {
                            result = sizes[parseInt(number)];
                        }
                    }
                    if (result) {
                        return result + 18.75;
                    }
                    
                }
                else {
                    let width = (numPages / 444) + 0.06 + 17.25;
                    width = Math.floor(width * 1000) / 1000;
                    return width;
                }
            }
        }

        async function getLevel(current, level = 2, isSubTOC) {
          let result = '';
          if (current.subpages && current.subpages.length) {
              let pages = [];
              for (let i = 0; i < current.subpages.length; i++) {
                  let child = current.subpages[i];
                  if ((child.title === 'Front Matter' || child.title === 'Back Matter') && (!child.subpages || !child.subpages.length)) {
                      // skip since empty
                  } else if (child.title === 'Front Matter') {
                      let tempChildren = child.subpages;
                      tempChildren = tempChildren.filter(subpage => !['TitlePage', 'InfoPage', 'Table of Contents'].includes(subpage.title));
                      pages = pages.concat(tempChildren)
                  } else if (child.title === 'Back Matter') {
                      pages = pages.concat(child.subpages);
                  } else {
                      pages.push(child);
                  }
              }
              if (level === 2 && current.tags.includes('article:topic-guide')) {
                  isSubTOC = 'yes';
                  level = 3;
              }
              const twoColumn = current.tags?.includes('columns:two') && (current.tags?.includes('coverpage:yes') || current.tags?.includes('coverpage:nocommons')) && level === 2;
              const prefix = level === 2 ? 'h2' : 'h';
              // Get subtitles
              let inner = await async.map(pages, async (elem) => {
                  if (!elem.title) elem = await getAPI(elem);
                  if (elem.modified === 'restricted') return ''; // private page
                  const isSubtopic = level > 2 ? `indent${level - 2}` : null;
                  const subPageDir = await getLevel(elem, level + 1, isSubTOC);
                  let hasSubpages = false;
                  if (subPageDir?.length > 0) hasSubpages = true;
                  const subListSpacing = hasSubpages ? `libre-print-sublisting${level - 2}` : '';
                  if (elem.url && elem.title) {
                    return `<li><div class="nobreak ${isSubtopic} ${subListSpacing}"><${prefix}><a href="${elem.url}">${elem.title}</a></${prefix}></div>${subPageDir}</li>`;
                  }
                  return '';
              });
              inner = inner.join('');
              result = `<ul class='libre-print-list' ${twoColumn ? 'style="column-count: 2;"' : ''}>${inner}</ul>`;
          }
          return result;
      }

        async function processDirectoryPage(title, tags, listing) {
          let directory = document.querySelector('.mt-guide-content, .mt-category-container');
          if (directory !== null && listing !== null) {
            const newDirectory = document.createElement('div');
            newDirectory.innerHTML = listing;
            newDirectory.classList.add('libre-print-directory');
            directory.replaceWith(newDirectory);
            if (Array.isArray(tags)) {
              let pageType = 'Section Overview';
              if (tags.includes('coverpage:yes') || tags.includes('coverpage:nocommons') || title?.includes('Table of Contents')) {
                pageType = 'Table of Contents'; // server-side TOC generation (deprecated)
              } else if (tags.includes('article:topic-guide')) {
                pageType = 'Chapter Overview';
              }
              const pageTitle = document.querySelector('#title');
              const pageTitleParent = pageTitle?.parentNode;
              if (pageTitle !== null && pageTitleParent !== null) {
                pageTitle.setAttribute('style', 'border-bottom: none !important');
                const newTitle = document.createElement('h1');
                newTitle.appendChild(document.createTextNode(pageType));
                newTitle.id = 'libre-print-directory-header';

                const typeContainer = document.createElement('div');
                typeContainer.id = 'libre-print-directory-header-container';
                typeContainer.appendChild(newTitle);
                pageTitleParent.insertBefore(typeContainer, pageTitle);
                if (pageType === 'Table of Contents') pageTitle.remove();
              }
            }
            return true;
          }
          return false;
        }

        
        async function getTOC(current) {
          // await fs.ensureDir('./PDF/Letter/TOC');
          await fs.ensureDir('./PDF/Letter/Margin/TOC');
          console.log('Starting TOC');
          const start = performance.now();
          current = await getAPI(current);
          if (!current.subpages) {
            current.subpages = (await getSubpages(current)).subpages;
          }
          let escapedURL = `${current.subdomain}-${current.id}`;
          if (current.modified === 'restricted') return 'restricted'; // private page
          let url = current.url;
          const [subdomain, path] = parseURL(current.url);
          const isMainToc = current.tags?.includes('coverpage:yes') || current.tags?.includes('coverpage:nocommons');

          if (isMainToc) {
            const tocPath = `${path}${path.endsWith('/') ? '' : '/'}00:_Front_Matter/03:_Table_of_Contents`;
            url = `https://${subdomain}.libretexts.org/${tocPath}`;
            console.log(`Creating Main TOC at ${url}`);
            await authenticatedFetch(
              tocPath,
              `contents?title=Table of Contents&edittime=now&comment=[PrintBot] Weekly Batch ${timestamp('MM/DD', new Date())}`,
              subdomain,
              'LibreBot',
              { method: 'POST', body: dynamicTOCLayout },
            );
          }

          const page = await browser.newPage();
          page.setViewport(viewportSettings);
          await page.setRequestInterception(true);

          try { 
            page.on('dialog', pptrDialogHandler);
            page.on('request', pptrRequestHandler);
            await waitUntilCXOneAPIAvailable(2);
            await page.goto(`${url}?no-cache`, pptrPageLoadSettings);
          } catch (err) {
            console.error(err);
            console.error(`ERROR TOC - Timeout Exceeded ${url}`)
          }

          try {
            await page.evaluate(eagerImageLoader);
            await sleep(1000);
            if (!isMainToc) { // don't overwrite Main TOC
                const listing = await getLevel(current);
                await page.evaluate(processDirectoryPage, current.title, current.tags, listing);
            }
            await sleep(1000);
          } catch (err) {
            console.error(err);
            console.error(`ERROR Rendering TOC ${url}`);
          }

          const color = "#127bc4";
          const prefix = '';
          let styleTag = `
            @page {
                size: letter portrait;
                margin: ${pdfPageMargins};
                padding: 0;
            }
          `;
          if (!isMainToc) {
            styleTag = `${styleTag}${styles.tocStyles}`;
          }
          await page.addStyleTag({ content: styleTag });
          await page.pdf({ //Lulu Letter
              path: `./PDF/Letter/Margin/TOC/${escapedURL}.pdf`,
              displayHeaderFooter: true,
              headerTemplate: generatePDFHeader(baseIMG["default"]),
              footerTemplate: generatePDFFooter(color, null, null, prefix),
              printBackground: true,
              preferCSSPageSize: true,
              timeout: pptrPageTimeout
          });
          const end = performance.now();
          let time = end - start;
          time /= 100;
          time = Math.round(time);
          time /= 10;
          await page.close();
          console.log(`TOC Created: ${time}s ${escapedURL}`);
          return escapedURL;
        }
        
        async function getThinCC(current, destination) {
            const zip = new JSZip();
            let result;
            let guides = addsubpages(current);
            guides = guides.filter(elem => elem.title);
            const {org, resources} = createXML(guides);
            
            function getTopicPages(resourceArray, current) {
                for (let i = 0; i < current.subpages.length; i++) {
                    let topic = current.subpages[i];
                    resourceArray.push({title: topic.title, url: topic.url + "?contentOnly"});
                    getTopicPages(resourceArray, topic);
                }
            }
            
            function addsubpages(current) { //find guides
                let subpages = current.subpages.filter(child => child.title !== 'Front Matter' && child.title !== 'Back Matter');
                let result = [];
                
                if (!subpages.length) //too shallow
                    return [{
                        title: current.title,
                        resources: [{
                            title: current.title,
                            url: current.url + "?contentOnly"
                        }],
                    }];
                
                let hasLower = false;
                for (let i = 0; i < subpages.length; i++) {
                    hasLower = hasLower || subpages[i].subpages.length;
                }
                let resourceArray = []; // for current
                if (hasLower && current.tags?.includes('article:topic-category')) { //go down a level
                    for (let i = 0; i < subpages.length; i++) {
                        result = result.concat(addsubpages(subpages[i]));
                    }
                    return result;
                }
                else { //just right, found a guide
                    resourceArray = [];
                    getTopicPages(resourceArray, current);
                    if (resourceArray.length) { //remove empty
                        resourceArray = resourceArray.filter(elem => elem.title);
                        return [{title: current.title, resources: resourceArray}];
                    }
                }
            }
            
            function escapeTitle(unsafe) {
                return unsafe.replace(/[<>&'"]/g, function (c) {
                    switch (c) {
                        case '<':
                            return '&lt;';
                        case '>':
                            return '&gt;';
                        case '&':
                            return '&amp;';
                        case '\'':
                            return '&apos;';
                        case '"':
                            return '&quot;';
                    }
                });
            }
            
            function createXML(array) {
                if (!array || !array.length) {  // invalid CC
                    return {org: "", resources: ""};
                }
                let org = "";
                let resources = "";
                let counter = 1;
                
                function getIdentifier() {
                    let result = "T_" + (counter.toString().padStart(6, "0"));
                    counter++;
                    return result;
                }
                
                array.forEach((item) => {
                    if (item.hasOwnProperty("title") && item.hasOwnProperty("resources")) {
                        org += "\n" +
                            `            <item identifier=\"${getIdentifier()}\">\n` +
                            `                <title>${escapeTitle(item.title)}</title>`;
                        item.resources.forEach((resource) => {
                            const identifier = getIdentifier();
                            org += `
                <item identifier="${identifier}" identifierref="${identifier}_R">
                    <title>${escapeTitle(resource.title)}</title>
                </item>`;
                            resources += `
        <resource identifier="${identifier}_R" type="imswl_xmlv1p1">
            <file href="${identifier}_F.xml"/>
        </resource>`;
                            zip.file(`${identifier}_F.xml`,
                                `<?xml version="1.0" encoding="UTF-8"?>
<webLink xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd">
	<title>${escapeTitle(resource.title)}</title>
	<url href="${resource.url.replace(/%3F/g, '%253F')}" target="_iframe"/>
</webLink>`);
                        });
                        org += "\n" +
                            "            </item>";
                    }
                });
                
                return {org: org, resources: resources};
            }
            
            const top = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<manifest xmlns=\"http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1\" xmlns:lom=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource\" xmlns:lomimscc=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" identifier=\"cctd0015\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd\">\n" +
                "    <metadata>\n" +
                "        <schema>IMS Common Cartridge</schema>\n" +
                "        <schemaversion>1.1.0</schemaversion>\n" +
                "    <lomimscc:lom>\n" +
                "      <lomimscc:general>\n" +
                "        <lomimscc:title>\n" +
                `          <lomimscc:string language=\"en-US\">${escapeTitle(current.title)}</lomimscc:string>\n` +
                "        </lomimscc:title>\n" +
                "      </lomimscc:general>\n" +
                "    </lomimscc:lom>\n" +
                "    </metadata>\n" +
                "    <organizations>\n" +
                "        <organization identifier=\"T_1000\" structure=\"rooted-hierarchy\">\n" +
                "        <item identifier=\"T_00000\">";
            const middle = "\n" +
                "        </item>\n" +
                "        </organization>\n" +
                "    </organizations>\n" +
                "    <resources>";
            const end = "\n    </resources>\n" +
                "</manifest>";
            
            result = top + org + middle + resources + end;
            if (!org || !resources) { // invalid CC
                await fs.writeFile(destination.replace('LibreText.imscc', 'ERROR.txt'), `Could not generate Libretexts.imscc. Please report this error to info@libretexts.org with the url ${current.url}`);
                return false;
            }
            else {
                zip.file('imsmanifest.xml', result);
                result = await zip.generateAsync({type: "nodebuffer"});
                await fs.writeFile(destination, result);
                return destination;
            }
        }
        
        async function getPDF(current, ip, isNoCache = false, isTOC = false) {
            current = await getAPI(current);
            let escapedURL = `${current.subdomain}-${current.id}`;
            let stats, err, compile;
            
            if (ip.startsWith('<<Batch')) {
            
            }
            if ((working[escapedURL] && Date.now() - working[escapedURL] > 120000)) {
                delete working[escapedURL];	//2 min timeout for DUPE
            }
            if (current.title === 'InfoPage') {
              isNoCache = true;
            }
            
            const updateTime = current.modified;
            let allExist = [fs.exists(`./PDF/Letter/Margin/${escapedURL}.pdf`)];
            allExist = await Promise.all(allExist);
            allExist = allExist.every((item) => item);
            
            if (allExist) {
                try {
                    stats = await fs.stat(`./PDF/Letter/Margin/${escapedURL}.pdf`);
                } catch (e) {
                    err = e;
                }
            }
            
            let url = current.url;
            
            if (updateTime === 'restricted') {
                console.error(`PRIVA  ${ip} ${url}`);
                return { filename: 'restricted' };
            }
            
            // variable in which recompiling becomes more probable as file ages. Caps at maxAge
            let randomCache = Math.random() * 2; //0 to 2
            randomCache = (Date.now() - stats?.mtime) > (randomCache + 0.2) * (maxFreshAge * 8.64e+7);
            
            if (!isNoCache && allExist && !err && stats.mtime > updateTime && !randomCache) { // file is up to date
                // 8.64e+7 ms/day
                console.log(`CACHE  ${ip} ${url}`);
                await sleep(ip.startsWith('<<Batch ') ? 1000 : 500);
                
                return {filename: escapedURL + '.pdf'};
            }
            
            const start = performance.now();
            console.log(`NEW    ${ip} ${url}`);
            
            const page = await browser.newPage();
            page.setViewport(viewportSettings);
            await page.setRequestInterception(true);

            let timeout;
            let failed = false;
            
            working[escapedURL] = Date.now();
            let PDFname = escapedURL;
            let title = '';
            
            try {
                let renderPDF = new Promise(async (resolve, reject) => {
                    await waitUntilCXOneAPIAvailable(2);
                    timeout = setTimeout(() => reject(new Error(`Render Timeout Reached  ${url}`)), 200000);
                    try {
                        page.on('dialog', pptrDialogHandler);
                        page.on('request', pptrRequestHandler);

                        if (url.includes('Sandboxes')) {
                            await page.goto(`https://${current.subdomain}.libretexts.org/?no-cache`, pptrPageLoadSettings);
                            // authenticate the BOT
                            let token = authenticate('LibreBot', current.subdomain);
                            await page.evaluate(async function (token, subdomain, redirect) {
                                await fetch(`https://${subdomain}.libretexts.org/@api/deki/users/authenticate?x-deki-token=${token}&redirect=${redirect}`);
                            }, token, current.subdomain, url);
                        }
                        
                        await page.goto(`${url}?no-cache`, pptrPageLoadSettings);
                    } catch (err) {
                        console.error(`ERROR  Timeout Exceeded ${url}`);
                    }
                    
                    await page.evaluate(eagerImageLoader);
                    await page.evaluate(detailsOpener);
                    await sleep(1000);

                    const listing = await getLevel(current);
                    await page.evaluate(processDirectoryPage, current.title, current.tags, listing);
                    await sleep(1000);
                    
                    const out = await page.evaluate(function (url) {
                        let prefix = "";
                        let title = document.getElementById("title");
                        let innerText;
                        
                        if (title) {
                            let color = window.getComputedStyle(title).color;
                            innerText = title.innerText;
                            if (innerText && innerText.includes(":")) {
                                prefix = innerText.split(":")[0];
                            }
                            title.innerHTML = `<a style="color:${color}; text-decoration: none" href="${url}">${innerText}</a>`
                        }
                        let tags = document.getElementById('pageTagsHolder').innerText;
                        return [prefix, innerText, tags];
                    }, url);
                    let prefix = out[0];
                    title = current.title;
                    if (title) {
                        title = title.trim();
                    }
                    let showHeaders = true;
                    let tags = current.tags || [];
                    if (tags.includes('hidetop:solutions'))
                        await page.addStyleTag({content: 'dd, dl {display: none;} h3 {font-size: 160%}'});
                    if (tags.includes('printoptions:no-header') || tags.includes('printoptions:no-header-title'))
                        showHeaders = false;

                    const color = "#127bc4";
                    prefix = prefix ? prefix + "." : "";
                    let license = await getLicense(current);
                    await getInformation(current);

                    const loadTime = (performance.now() - start) / 1000;
                    if (loadTime > 20) console.log(`LOAD ${ip} ${loadTime.toFixed(2)} ${PDFname}`);

                    try {
                        if (url.includes('Wakim_and_Grewal')) {
                            await page.addStyleTag({content: `.mt-content-container {font-size: 93%}`});
                        }
                        await page.addStyleTag({ content: `
                            @page {
                                size: letter portrait;
                                margin: ${showHeaders ? `${pdfPageMargins};` : '0.625in;'}
                                padding: 0;
                            }
                            ${styles.tocStyles}
                        `});
                        await page.pdf({ //Letter Margin
                            path: `./PDF/Letter/Margin/${PDFname}.pdf`,
                            displayHeaderFooter: showHeaders,
                            headerTemplate: generatePDFHeader(baseIMG['default']),
                            footerTemplate: generatePDFFooter(color, current, license, prefix),
                            printBackground: true,
                            preferCSSPageSize: true,
                            timeout: pptrPageTimeout
                        });
                    } catch (e) {
                        console.error(e);
                    }
                    clearTimeout(timeout);
                    resolve();
                });
                let thing = await renderPDF;
            } catch (err) {
                failed = err;
                console.error(err);
            }
            const end = performance.now();
            let time = end - start;
            time /= 100;
            time = Math.round(time);
            time /= 10;
            if (!page.isClosed())
                await page.close();
            let pages = await browser.pages();
            const now = new Date();
            
            eventEmitter.emit(escapedURL);
            delete working[escapedURL];
            if (failed) {
                console.error(`FAILED ${ip} [${pages.length}] ${time}s ${PDFname}`);
                console.error(failed);
                let exists = await fs.exists('./PDF/Letter' + PDFname + '.pdf');
                if (!exists)
                    return {filename: 'restricted'};
                
                let stats, err;
                try {
                    stats = await fs.stat('./PDF/Letter' + PDFname + '.pdf');
                } catch (e) {
                    err = e;
                }
                
                if (err || Date.now() - stats.mtime > 120000) { //file not modified
                    return {filename: 'restricted'};
                    // throw failed;
                }
            }
            else {
                console.log(`RENDER ${ip} [${pages.length}] ${time}s ${PDFname}`);
                // console.log(pages);
            }
            return {filename: PDFname + '.pdf', title: title, lastModified: updateTime};
        }
        
        async function getLibretext(current, response, options) {
            const matterMode = options.createMatterOnly ? 'edittime=now' : 'abort=exists';
            let refreshOnly = options.refreshOnly;
            let isNoCache = options['no-cache'] || options.nocache;
            const APIoptions = options.createMatterOnly ? {username: 'LibreBot'} : undefined;
            
            let heartbeat, altID;
            if (typeof current === 'string') {
                let count = 0;
                heartbeat = setInterval(() => {
                    if (response && !response.finished)
                        response.write(JSON.stringify({
                            message: "subpages",
                            percent: 0,
                            eta: `Calculating number of pages...\nTime elapsed: ${++count} seconds`,
                        }) + "\r\n")
                }, 1000);
                current = await getSubpages(current, APIoptions);
            }
            current = await getAPI(current, APIoptions);
            if (current.modified === 'restricted') {
                if (response && !response.finished)
                    response.write(JSON.stringify({
                        message: "error",
                        text: `LibreText is not Public!`,
                        percent: -1,
                        eta: "LibreText is not Public!",
                    }));
                return false;
            }
            
            //Merge up Text or Chapters
            let content;
            for (let i = 0; i < current.subpages.length; i++) {
                await getAPI(current.subpages[i]);
                if (['Text', 'Chapters'].includes(current.subpages[i].title)) {
                    content = current.subpages[i];
                    break;
                }
            }
            
            if (content) {
                content.title = current.title;
                content.tags = current.tags.concat(content.tags);
                content.properties = current.properties.concat(content.properties);
                altID = current.id; //save current.id and keep as id
                current = {...content};
                current.id = altID;
                altID = content.id; //save content.id as altID
            }
            await getInformation(current);
            const topPage = {...current};
            
            if (!current.subpages || !current.subpages.length) {
                if (response && !response.finished)
                    response.write(JSON.stringify({
                        message: "error",
                        text: `Error: No subpages found!`,
                        percent: -1,
                        eta: "Error: No subpages found!",
                    }));
                return false;
            }
            console.log(`Getting LibreText ${options.index ? `[${options.index}] ` : ''}${current.title}`);
            const zipFilename = `${current.subdomain}-${current.id}`;
            const thinName = md5(zipFilename).slice(0, 6);
            const hasCoverpage = current.tags.includes('coverpage:yes') || current.tags.includes('coverpage:nocommons');
            let privatePages = [];
            
            //Try to get special files
            let totalIndex = 0;
            let uploadedTOC = false;
            let frontArray = await getMatter('Front');
            let TOCIndex = ++totalIndex;
            
            async function getMatter(text) {
                if (!hasCoverpage) {
                    console.log(`Skipping ${text} matter. No coverpage`);
                    return [];
                }
                let path = current.url.split('/').splice(3).join('/');
                let miniIndex = 1;
                let title = text;
                text = `${(text === 'Front' ? '00' : 'zz')}:_${text}`;
                let createMatter = await authenticatedFetch(`${path}/${text}_Matter`, `contents?title=${title} Matter&${matterMode}&dream.out.format=json`, current.subdomain, 'LibreBot', {
                    method: "POST",
                    body: `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>`
                });
                // console.log(createMatter = await createMatter.json());
                if (matterMode || createMatter.ok) { //Add properties if it is new
                    await Promise.all([putProperty("mindtouch.idf#guideDisplay", "single"),
                        putProperty('mindtouch.page#welcomeHidden', true),
                        putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]")]);
                    
                    /*const groups = await getGroups(current.subdomain);
                    const developerGroup = groups.find((e) => e.name === 'Developer');
                    await LibreTexts.authenticatedFetch(path, 'security?dream.out.format=json', current.subdomain, 'LibreBot', {
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
                    });*/
                    getImage(`${path}/${text}_Matter`, title).then();
                }
                await defaultMatter(text);
                
                
                let response = await authenticatedFetch(`${path}/${text}_Matter`, 'subpages?limit=all&dream.out.format=json', current.subdomain);
                if (!response.ok) {
                    // console.error(await response.text());
                    return [];
                }
                response = (await response.json());
                if (!response["page.subpage"])
                    return [];
                response = response["page.subpage"];
                if (!response.length)
                    response = [response];
                
                response = response.map(subpage => {
                    return {
                        title: subpage.title,
                        url: subpage['uri.ui'],
                        subdomain: current.subdomain,
                        id: subpage['@id'],
                        matter: title,
                        index: ++totalIndex,
                        miniIndex: miniIndex++,
                    }
                });
                response.forEach(subpage => {
                    if ('Table of Contents' === subpage.title)
                        uploadedTOC = current.url;
                });
                return response;
                
                async function putProperty(property, value) {
                    return await authenticatedFetch(`${path}/${text}_Matter`, 'properties?dream.out.format=json', current.subdomain, 'LibreBot', {
                        method: "POST",
                        body: value,
                        headers: {"Slug": property}
                    });
                }
                
                async function defaultMatter(text) {
                    if (text.includes('Front')) {
                        current = await getAPI(current);
                        await getInformation(current);
                        
                        //Create TitlePage
                        let QRoptions = {errorCorrectionLevel: 'L', margin: 2, scale: 2};
                        await authenticatedFetch(`${path}/${text}_Matter/01:_TitlePage`, `contents?${matterMode}&title=TitlePage&dream.out.format=json`, current.subdomain, 'LibreBot', {
                            method: "POST",
                            body: `<div style="height:95vh; display:flex; flex-direction: column; position: relative; align-items: center">
<div style=" display:flex; flex:1; flex-direction: column; justify-content: center">
<p class="mt-align-center"><span class="mt-font-size-36">${current.companyname || ''}</span></p>
<p class="mt-align-center"><span class="mt-font-size-36">${current.title || ''}</span></p></div>
<p style="position: absolute; bottom: 0; right: 0"><canvas id="canvas"></canvas></p>
<p class="mt-align-center" style="max-width: 70%"><span class="mt-font-size-24">${current.name || ''}</span></p>
<script>QRCode.toCanvas(document.getElementById('canvas'), '${topPage.url}', ${JSON.stringify(QRoptions)})</script>
<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a><a href=\"#\">printoptions:no-header-title</a></p></div>`
                        });
                        
                        //Create InfoPage
                        await authenticatedFetch(`${path}/${text}_Matter/02:_InfoPage`, `contents?${matterMode}&title=InfoPage&dream.out.format=json`, current.subdomain, 'LibreBot', {
                            method: "POST",
                            body: "<p class=\"mt-script-comment\">Cross Library Transclusion</p><pre class=\"script\">template('CrossTransclude/Web',{'Library':'chem','PageID':170365});</pre>" +
                                "<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a><a href=\"#\">transcluded:yes</a><a href=\"#\">printoptions:no-header-title</a></p>"
                        });

                        // Create Table Of Contents
                        await authenticatedFetch(`${path}/${text}_Matter/03:_Table_of_Contents`, `contents?${matterMode}&title=Table of Contents&dream.out.format=json`, current.subdomain, 'LibreBot', {
                          method: 'POST',
                          body: dynamicTOCLayout,
                        });

                        // Create Licensing
                        await authenticatedFetch(`${path}/${text}_Matter/04:_Licensing`, `contents?${matterMode}&title=Licensing&dream.out.format=json`, current.subdomain, 'LibreBot', {
                            method: 'POST',
                            body: dynamicLicensingLayout,
                        });
                    }
                    else if (text.includes('Back')) {
                        //Create Index
                        await authenticatedFetch(`${path}/${text}_Matter/10:_Index`, `contents?${matterMode}&title=Index&dream.out.format=json`, current.subdomain, 'LibreBot', {
                            method: "POST",
                            body: "<p class=\"mt-script-comment\">Dynamic Index</p><pre class=\"script\">template('DynamicIndex');</pre>" +
                                "<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a><a href=\"#\">showtoc:no</a><a href=\"#\">printoptions:no-header</a><a href=\"#\">columns:three</a></p>"
                        });
                        try {
                            let dynamicGlossary = await authenticatedFetch('https://chem.libretexts.org/@api/deki/pages/279134/contents?dream.out.format=json&mode=edit', null, null, 'LibreBot');
                            dynamicGlossary = await dynamicGlossary.json();
                            if (dynamicGlossary && dynamicGlossary.body) {
                                dynamicGlossary = dynamicGlossary.body;
                                await authenticatedFetch(`${path}/${text}_Matter/20:_Glossary`, `contents?abort=exists&title=Glossary&dream.out.format=json`, current.subdomain, 'LibreBot', {
                                    method: "POST",
                                    body: dynamicGlossary +
                                        "\n<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a><a href=\"#\">showtoc:no</a><a href=\"#\">printoptions:no-header</a><a href=\"#\">columns:three</a></p>"
                                });
                            }
                        } catch (e) {
                            console.error('Glossary Error', e);
                        }

                        // Create Detailed Licensing
                        await authenticatedFetch(`${path}/${text}_Matter/30:_Detailed_Licensing`, `contents?${matterMode}&title=Detailed Licensing&dream.out.format=json`, current.subdomain, 'LibreBot', {
                            method: 'POST',
                            body: dynamicDetailedLicensingLayout,
                        });
                    }
                }
                
                async function getImage(path, title) {
                    let image;
                    switch (title) {
                        case 'Front':
                            image = 'https://chem.libretexts.org/@api/deki/files/239315/Front_Matter.jpg?origin=mt-web';
                            break;
                        case 'Back':
                            image = 'https://chem.libretexts.org/@api/deki/files/239316/Back_matter.jpg?origin=mt-web';
                            break;
                        default:
                            image = 'https://chem.libretexts.org/@api/deki/files/239314/default.png?origin=mt-web'
                    }
                    image = await fetch(image);
                    image = await image.blob();
                    authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", current.subdomain, 'LibreBot', {
                        method: "PUT",
                        body: image,
                    }).then();
                }
            }
            
            
            await fs.emptyDir(`./PDF/Letter/libretexts/${zipFilename}`);
            await fs.emptyDir(`./PDF/Letter/Finished/${zipFilename}`);
            if (hasCoverpage)
                await fs.ensureDir(`./PDF/Letter/Finished/${zipFilename}/Publication`);
            await fs.emptyDir(`./PDF/Letter/order/${thinName}/`);
            
            let urlArray = [current];
            urlArray = urlArray.concat(addLinks(current.subpages));
            urlArray = urlArray.map((item, index) => {
                item.index = index + totalIndex; //Have 10 open for beginning materials
                return item;
            });
            urlArray = frontArray.concat(urlArray);
            totalIndex = urlArray.length;
            
            urlArray = urlArray.concat(await getMatter('Back'));
            urlArray.reverse();
            
            if (options.createMatterOnly) {
                await getTOC(current);
                response.write(JSON.stringify({
                    message: "complete",
                    filename: "createMatterOnly",
                }));
                return null; //done creating matter, exit immediately.
            }
            
            if (heartbeat)
                clearInterval(heartbeat);
            if (response && !response.finished)
                response.write(JSON.stringify({
                    message: "start",
                    percent: 0,
                    eta: "Loading...",
                }) + "\r\n");
            
            let count = 0;
            const start = performance.now();
            const eta = new Eta(urlArray.length, true);
            let originalFiles = [];
            let updateTimes = [];
            let failed = false;
            
            try {
                let number = numThreads;
                if (options.multiple) {
                    number /= concurrentTexts;
                    number = Math.floor(number); //integer check
                }
                await async.mapLimit(urlArray, number, async (page) => {
                    page = await getAPI(page);
                    let filename, title = page.title;
                    if (page.matter) {
                        let temp = await getPDF(page, options.ip, isNoCache);
                        filename = temp.filename;
                        if (temp.lastModified) updateTimes.push(temp.lastModified);
                        if (page.matter !== 'Back') {
                            title = `00000:${String.fromCharCode(64 + page.index)} ${page.title}`;
                        } else {
                            title = `99999:${String.fromCharCode(64 + page.miniIndex)} ${page.title}`;
                        }
                    } else if (page.subpages && page.subpages.length > 1 && page.tags && (page.tags.includes('article:topic-category') || page.tags.includes('article:topic-guide'))) {
                        filename = `TOC/${await getTOC(page)}.pdf`;
                        
                        if (page.tags.includes('coverpage:yes') || page.tags.includes('coverpage:nocommons')) {//no Front Matter TOC
                            if (uploadedTOC)
                                return;
                            page.index = TOCIndex;
                            
                            title = `00000:${String.fromCharCode(64 + page.index)} Table of Contents`;
                        }
                    } else {
                        let temp = await getPDF(page, options.ip, isNoCache);
                        filename = temp.filename;
                        if (temp.lastModified) updateTimes.push(temp.lastModified);
                    }
                    count++;
                    eta.iterate();
                    
                    if (filename && filename !== 'restricted' && !refreshOnly) {
                        title = filenamify(title);
                        originalFiles.push(filename);
                        await fs.copy(`./PDF/Letter/Margin/${filename}`, `./PDF/Letter/libretexts/${zipFilename}/${title}.pdf`);
                        await fs.copy(`./PDF/Letter/Margin/${filename}`, `./PDF/Letter/order/${thinName}/${`${page.index}`.padStart(3, '0')}.pdf`);
                        
                    } else {
                      privatePages.push(page.url);
                    }
                    if (response && !response.finished) {
                      response.write(JSON.stringify({
                        message: "progress",
                        percent: (Math.round(count / urlArray.length * 1000) / 10),
                        eta: eta.format("{{etah}}"),
                        // count: count,
                      }) + "\r\n");
                    }
                });
            } catch (err) {
                throw err;
            }
            let numPages;
            
            if (!refreshOnly) {
                //Overall cover
                let filename = `Cover/${await getCover(current)}.pdf`;
                await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/libretexts/${zipFilename}/${filenamify('00000:A Cover.pdf')}`);
                await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/order/${thinName}/${`0`.padStart(3, '0')}.pdf`);
                
                
                if (hasCoverpage) {
                    await getThinCC(current, `./PDF/Letter/Finished/${zipFilename}/LibreText.imscc`);
                }
                let files = (await fs.readdir(`./PDF/Letter/order/${thinName}`)).map((file) => `./PDF/Letter/order/${thinName}/${file}`);
                console.log(`Merging${options.index ? ` [${options.index}]` : ''}`);
                if (response && !response.finished) {
                    let count = 0;
                    heartbeat = setInterval(() => {
                        if (response && !response.finished)
                            response.write(JSON.stringify({
                                message: "progress",
                                percent: 100,
                                eta: `Finishing...\nTime elapsed: ${++count} seconds`,
                            }) + "\r\n")
                    }, 1000);
                }

                // Merge content files
                try {
                    const mergeStart = performance.now();
                    if (files && files.length > 2) {
                        const pdfMeta = { title: current.title, author: current.name };
                        /* Save full document */
                        const fullOutput = await mergePDFFiles(files, pdfMeta); // current.title current.name
                        await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Full.pdf`, fullOutput);
                        /* Save preview and inner content */
                        if (hasCoverpage) {
                          const previewFiles = files.slice(0,10);
                          const previewOutput = await mergePDFFiles(previewFiles, { ...pdfMeta, isPreview: true });
                          await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Preview.pdf`, previewOutput);
                          const contentFiles = files.slice(1);
                          const contentOutput = await mergePDFFiles(contentFiles, { ...pdfMeta, isContent: true });
                          await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`, contentOutput);
                        }
                    } else {
                        await fs.copy(files[0], `./PDF/Letter/Finished/${zipFilename}/Full.pdf`);
                        if (hasCoverpage) {
                            await fs.copy(files[0], `./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`);
                        }
                    }
                    const mergeEnd = performance.now();
                    const mergeSeconds = (mergeEnd - mergeStart) / 1000;
                    console.log(`Done Merging${options.index ? ` [${options.index}]` : ''} (${mergeSeconds.toFixed(2)}s)`);
                } catch (e) {
                    console.error(`Merge Failed ${zipFilename}${options.index ? ` [${options.index}]` : ''}`);
                    console.error(e);
                    failed = true;
                }
                
                // Publication covers
                try {
                    if (!failed && await fs.exists(`./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`)) {
                        let dataBuffer = await fs.readFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Content.pdf`);
                        let lulu = await pdf(dataBuffer);
                        numPages = lulu.numpages;
                        console.log(`Got numpages${options.index ? ` [${options.index}]` : ''} ${lulu.numpages}`);
                        filename = `Cover/${await getCover(current, lulu.numpages)}.pdf`;
                        await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_Amazon.pdf`);
                        if (lulu.numpages >= 32) {
                            filename = `Cover/${await getCover(current, lulu.numpages, {hasExtraPadding: true})}.pdf`;
                            await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_PerfectBound.pdf`);
                        }
                        else {
                            let notice = `Your LibreText of ${lulu.numpages} is below the minimum of 32 for Perfect Bound. Please use one of the other bindings or increase the number of pages`;
                            await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Notice_PerfectBound.txt`, notice);
                        }
                        if (lulu.numpages >= 24) {
                            filename = `Cover/${await getCover(current, lulu.numpages, {
                                hasExtraPadding: true,
                                isHardcover: true
                            })}.pdf`;
                            await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_Casewrap.pdf`);
                        }
                        else {
                            let notice = `Your LibreText of ${lulu.numpages} is below the minimum of 24 for Casewrap. Please use one of the other bindings or increase the number of pages`;
                            await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Notice_Casewrap.txt`, notice);
                        }
                        filename = `Cover/${await getCover(current, lulu.numpages, {
                            hasExtraPadding: true,
                            thin: true
                        })}.pdf`;
                        await fs.copy(`./PDF/Letter/${filename}`, `./PDF/Letter/Finished/${zipFilename}/Publication/Cover_CoilBound.pdf`);
                    }
                } catch (e) {
                    console.error(`Error creating publication covers ${zipFilename}`);
                    console.error(e);
                }

                //save log of private pages
                try {
                    if (hasCoverpage && privatePages.length) {
                        await fs.writeFile(`./PDF/Letter/Finished/${zipFilename}/Publication/Notice_Private_Pages.txt`, privatePages.join('\n'));
                    }
                } catch (e) {
                    console.error(`Error saving log of private pages ${zipFilename}`);
                    console.error(e);
                }

                // postprocess PDFs
                try {
                    await pdfPostProcessor(`./PDF/Letter/Finished/${zipFilename}`);
                } catch (e) {
                    console.error(`Error performing PDF postprocess ${zipFilename}`);
                    console.error(e);
                }

                // creating zip files
                try {
                    if (hasCoverpage) {
                        console.log(`Zipping${options.index ? ` [${options.index}]` : ''}`);
                        let individualZIP = new JSZip();
                        let PublicationZIP = new JSZip();
                        files = await fs.readdir('./PDF/Letter/libretexts/' + zipFilename);
                        for (let i = 0; i < files.length; i++) {
                            individualZIP.file(files[i], await fs.readFile(`./PDF/Letter/libretexts/${zipFilename}/${files[i]}`));
                        }
                        files = await fs.readdir(`./PDF/Letter/Finished/${zipFilename}/Publication`);
                        for (let i = 0; i < files.length; i++) {
                            PublicationZIP.file(files[i], await fs.readFile(`./PDF/Letter/Finished/${zipFilename}/Publication/${files[i]}`));
                        }
                        
                        
                        await saveAs(individualZIP, `./PDF/Letter/Finished/${zipFilename}/Individual.zip`);
                        await saveAs(PublicationZIP, `./PDF/Letter/Finished/${zipFilename}/Publication.zip`);
                        
                        
                        async function saveAs(zip, destination) {
                            let result = await zip.generateAsync({type: "nodebuffer"});
                            await fs.writeFile(destination, result);
                        }
                        
                        if (failed) {
                            console.error(`Merge Failed, clearing cache${options.index ? ` [${options.index}]` : ''}`);
                            await async.mapLimit(originalFiles, 10, async (filename) => {
                                await fs.remove(`./PDF/Letter/${filename}`);
                                await fs.remove(`./PDF/Letter/Margin/${filename}`);
                            });
                            console.error(`Cache ${zipFilename} cleared${options.index ? ` [${options.index}]` : ''}`);
                        }
                    }
                } catch (e) {
                    console.error(`Error creating zip files ${zipFilename}`);
                    console.error(e);
                }
            }
            const end = performance.now();
            let time = end - start;
            time /= 100;
            time = Math.round(time);
            time /= 10;
            console.log(zipFilename, time);

            /* util to check if a variable is a proper Date */
            function isValidDate(date) {
                return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
            }

            /* Find the timestamp of the most recent modification */
            let latestDate = null;
            updateTimes.forEach((updTime) => {
                let tempDate = null;
                if (isValidDate(updTime)) {
                    tempDate = updTime;
                } else {
                    tempDate = new Date(updTime);
                }
                if (isValidDate(tempDate) && (latestDate === null || tempDate > latestDate)) {
                    latestDate = tempDate;
                }
            });

            if (response && heartbeat)
                clearInterval(heartbeat);
            if (response && !response.finished)
                response.write(JSON.stringify({
                    message: "complete",
                    filename: zipFilename,
                    timeTaken: time
                }));
            // cleanup
            await fs.emptyDir(`./PDF/Letter/libretexts/${zipFilename}`);
            await fs.remove(`./PDF/Letter/order/${thinName}`);
            
            let libretextInfo = {
                zipFilename: zipFilename,
                title: current.title,
                id: topPage.id,
                altID: altID,
                author: current.name,
                institution: current.companyname,
                link: current.url,
                tags: current.tags,
                summary: current.summary,
                failed: failed,
                numPages: numPages,
            };
            if (isValidDate(latestDate)) libretextInfo.lastModified = latestDate.toISOString();
            return libretextInfo;
        }
    }
);

function authenticate(user, subdomain) {
    user = '=' + user;
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
    const epoch = Math.floor(Date.now() / 1000);
    hmac.update(`${authen[subdomain].key}${epoch}${user}`);
    const hash = hmac.digest('hex');
    let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
    return token;
}

async function authenticatedFetch(path, api, subdomain, username, options = {}) {
    await waitUntilCXOneAPIAvailable();
    let isNumber;
    
    let arbitraryPage = !api && !subdomain && path.startsWith('https://');
    if (arbitraryPage) {
        [subdomain] = parseURL(path);
    }
    else {
        if (path === "")
            path = "home";
        if (!isNaN(path)) {
            path = parseInt(path);
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
    if (api && !api.startsWith('?')) //allows for pages/{pageid} (GET) https://success.mindtouch.com/Integrations/API/API_calls/pages/pages%2F%2F%7Bpageid%7D_(GET)
        api = `/${api}`;
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
        let token = authenticate(username, subdomain);
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

async function getGroups(subdomain) {
    let groups;
    if (typeof getGroups.groups === "undefined") { //reuse old data
        getGroups.groups = {};
    }
    if (typeof getGroups.groups[subdomain] !== "undefined" && getGroups.groups[subdomain].length) { //reuse old data
        return getGroups.groups[subdomain];
    }

    await waitUntilCXOneAPIAvailable();
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

async function getSubpages(rootURL, options = {}) {
    rootURL = rootURL.url || rootURL;
    let origin = rootURL.split("/")[2].split(".");
    const subdomain = origin[0];
    let path = rootURL.split('/').splice(3).join('/');
    options['depth'] = 0;
    
    let pages = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', subdomain, options.username);
    pages = await pages.json();
    
    let result = {
        url: rootURL,
        relativePath: '/',
        subpages: options.subpages || await subpageCallback(pages, options)
    };
    if (options.getAPI)
        result = await getAPI(result, {getContents: options.getContents, username: options.username});
    
    return result;
    
    
    async function subpageCallback(info, options = {}) {
        let subpageArray = info["page.subpage"];
        const result = [];
        const promiseArray = [];
        
        async function subpage(subpage, index, options = {}) {
            let url = subpage["uri.ui"];
            let path = subpage.path["#text"];
            const hassubpages = subpage["@subpages"] === "true";
            let subpages = hassubpages ? undefined : [];
            if (hassubpages) { //recurse down
                subpages = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', subdomain);
                subpages = await subpages.json();
                if (subpages && subpages['page.subpage'] && subpages['page.subpage'].length && subpage.title === 'Remixer University') { //Skip Remixer except for contruction guide
                    subpages['page.subpage'] = subpages['page.subpage'].filter((item) => item.title === "Contruction Guide");
                    if (!subpages['page.subpage'].length)
                        delete subpages['page.subpage'];
                }
                else
                    subpages = await subpageCallback(subpages, options.delay ? {
                        delay: options.delay,
                        depth: options.depth + 1
                    } : {});
            }
            
            result[index] = {
                title: subpage.title,
                url: url,
                subdomain: subdomain,
                subpages: subpages,
                id: subpage['@id'],
                relativePath: encodeURIComponent(decodeURIComponent(url).replace(decodeURIComponent(rootURL) + '/', ''))
            };
        }
        
        if (subpageArray) {
            if (!subpageArray.length) {
                subpageArray = [subpageArray];
            }
            for (let i = 0; i < subpageArray.length; i++) {
                if (options.delay && options.depth < 3) {
                    console.log(`Delay ${subpageArray[i]["uri.ui"]}`);
                    await subpage(subpageArray[i], i, {delay: options.delay});
                }
                else {
                    // console.log(subpageArray[i]["uri.ui"]);
                    promiseArray[i] = subpage(subpageArray[i], i);
                }
            }
            
            await Promise.all(promiseArray);
            return result;
        }
        return {};
    }
}

// getSubpagesFull('https://socialsci.libretexts.org/Bookshelves').then(result => console.log(result));

async function getSubpagesFull(rootURL) { //More performant for entire libraries
    let origin = rootURL.split("/")[2].split(".");
    const subdomain = origin[0];
    let path = rootURL.split('/').splice(3).join('/');
    
    let full = await getSitemap();
    if (path) {
        for (let i = 0; i < full?.subpages?.length; i++) {
            if (full.subpages[i].url === rootURL)
                return full.subpages[i];
        }
    }
    return full;
    
    async function getSitemap() {
        await waitUntilCXOneAPIAvailable();
        let map = await fetch(`https://${subdomain}.libretexts.org/sitemap.xml`);
        if (map.ok) {
            map = await map.text();
            map = convert.xml2js(map).elements[0];
        }
        else {
            let error = await map.text();
            console.error(error);
            return false;
        }
        // let map = await fs.readFile('./socialsci.xml', 'utf8'); //Test using local files
        // map = convert.xml2js(map).elements[0];
        if (map.name === 'sitemapindex') { //
            map = map.elements.map(elem => {
                let url = elem.elements.find(i => i.name === 'loc');
                if (!url)
                    return false;
                
                url = url.elements[0].text;
                return url;
            });
            let submaps = [];
            await async.mapLimit(map, 1, async (submap) => {
                submap = await fetch(submap);
                if (submap.ok) {
                    submap = await submap.text();
                    submap = convert.xml2js(submap).elements[0];
                    if (submap.name === 'urlset') { //extract urls from submap
                        submap = submap.elements.map(elem => {
                            let url = elem.elements.find(i => i.name === 'loc');
                            if (!url)
                                return false;
                            
                            url = url.elements[0].text;
                            return url;
                        });
                        submaps = submaps.concat(submap);
                    }
                }
                else {
                    let error = await submap.text();
                    console.error(error);
                    return false;
                }
                
            });
            map = submaps;
        }
        else if (map.name === 'urlset') { //extract urls from map
            map = map.elements.map(elem => {
                let url = elem.elements.find(i => i.name === 'loc');
                if (!url)
                    return false;
                
                url = url.elements[0].text;
                return url;
            });
        }
        
        if (map.length) { //process map into a tree
            map.sort();
            map = map.map(item => item.replace('http://', 'https://'));
            const start = performance.now();
            let lastNode;
            
            // Add an item node in the tree, at the right position
            function addToTree(node, treeNodes) {
                let parentNode;
                if (lastNode && node.match(/^.*(?=\/)/)[0] === lastNode.url)
                    parentNode = lastNode;
                else
                    parentNode = GetTheParentNodeChildArray(node, treeNodes) || treeNodes;
                if (parentNode && parentNode.subpages)
                    parentNode.subpages.push({
                        url: node,
                        subpages: [],
                        parent: parentNode
                    });
            }
            
            function GetTheParentNodeChildArray(path, treeNodes) {
                for (let i = 0; i < treeNodes.length; i++) {
                    const treeNode = treeNodes[i];
                    
                    let parentPath = path.match(/^.*(?=\/)/);
                    if (path === treeNode.url) { // same as parent, so skip
                        return false;
                    }
                    if (parentPath && parentPath[0] === treeNode.url) { //found parent
                        lastNode = treeNode;
                        return treeNode;
                    }
                    else if (path.match(new RegExp(`^${treeNode.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/`))) { //found ancestor
                        if (treeNode.subpages.find(item => path.startsWith(item.url))) {
                            return GetTheParentNodeChildArray(path, treeNode.subpages);
                        }
                        else {//create subpage
                            let pathPart = path.replace(treeNode.url, '').match(/^\/.*?(?=\/)/)[0];
                            treeNode.subpages.push({
                                url: `${treeNode.url}${pathPart}`,
                                subpages: [],
                                parent: treeNode
                            });
                            return GetTheParentNodeChildArray(path, treeNode.subpages);
                        }
                    }
                }
            }
            
            
            //Create the item tree starting from menuItems
            function createTree(nodes) {
                const tree = [{url: `https://${subdomain}.libretexts.org`, subpages: []}];
                
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i].replace(/\s/g, '');
                    addToTree(node, tree);
                }
                return tree;
            }
            
            map = createTree(map);
            if (map.length !== 1)
                console.err(`Incorrect sitemap.xml ${subdomain} ${map.length}`);
            map = map[0];
            const end = performance.now();
            let time = end - start;
            time /= 100;
            time = Math.round(time);
            time /= 10;
            console.log(time);
        }
        return map;
    }
    
}

async function getAPI(page, options = {getContents: false, username: null}) {
    if (page.title && page.properties && page.id && page.tags && (!options.getContents || page.content))
        return page;
    else if (typeof page === 'string')
        page = {
            url: page
        };
    page.url = page.url.replace('?contentOnly', '');
    let [subdomain, path] = parseURL(page.url);
    // console.log(page.url);
    let response = await authenticatedFetch(path, `?dream.out.format=json${options.getContents ? '&include=contents' : ''}`, subdomain, options.username || path.startsWith('Sandboxes') ? 'LibreBot' : '');
    if (response.ok) {
        response = await response.json();
        let {properties, tags} = response;
        if (properties['@count'] !== '0' && properties.property) {
            properties = properties.property.length ? properties.property : [properties.property]
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
        tags = tags.map((elem) => elem.title);
        page.id = response['@id'];
        page.title = page.title || response.title;
        page.tags = page.tags || tags;
        page.properties = page.properties || properties;
        page.subdomain = subdomain;
        page.path = response.path['#text'];
        page.modified = new Date(response['date.modified']);
        page.content = response.content;
    }
    else {
        let error = response = await response.json();
        // console.error(`Can't get ${page.url}`);
        page.subdomain = subdomain;
        page.path = path;
        page.modified = 'restricted';
    }
    return page;
}

/**
 * Combines all provided PDF files (read by filename) into a single PDF document.
 * @param {string[]} files - An array of paths/filenames to PDF documents to include.
 * @param {Object} [metadata=null] - An object containing metadata to attach to the PDF.
 * @param {string} [metadata.title] - The title of the content.
 * @param {string} [metadata.author] - The author of the content.
 * @param {boolean} [metadata.isPreview] - If the output PDF is a LibreText 'preview'.
 * @param {boolean} [metadata.isContent] - If the output PDF is the LibreText's publication content.
 * @returns {Promise<Uint8Array>} The bytes of the output document (for filesystem save).
 */
async function mergePDFFiles(files, metadata = null) {
  const outputDocument = await PDFDocument.create();
  for (let i = 0, n = files.length; i < n; i += 1) {
    const fileData = await fs.readFile(files[i]);
    const filePDF = await PDFDocument.load(fileData);
    const filePages = await outputDocument.copyPages(filePDF, filePDF.getPageIndices());
    for (let j = 0, k = filePages.length; j < k; j += 1) {
      outputDocument.addPage(filePages[j]);
    }
  }
  if (metadata) {
    if (typeof (metadata.title) === 'string') {
      let pdfTitle = metadata.title;
      if (metadata.isPreview) {
        pdfTitle = `${pdfTitle} (Preview)`;
      } else if (metadata.isContent) {
        pdfTitle = `${pdfTitle} (Inner Content)`;
      }
      outputDocument.setTitle(pdfTitle);
    }
    if (typeof (metadata.author) === 'string') outputDocument.setAuthor(metadata.author);
  }
  outputDocument.setProducer('LibreTexts nodePrint');
  outputDocument.setCreator('LibreTexts (libretexts.org)')
  outputDocument.setCreationDate(new Date());
  return outputDocument.save();
}

function clarifySubdomain(url) {
    url = url.replace('https://espa%C3%B1ol.libretexts.org', 'https://espanol.libretexts.org');
    return url;
}

function parseURL(url) {
    if (url.match(/https?:\/\/.*?\.libretexts\.org/)) {
        //returns [subdomain, path]
        let path = url.match(/(?<=https?:\/\/.*?\/).*/);
        path = path ? path[0] : '';
        return [url.match(/(?<=https?:\/\/).*?(?=\.)/)[0], path]
    }
    else {
        return [];
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function stop() {
    Gserver.close();
    Gbrowser.close();
}

module.exports = stop;
