/**
 * Miscellanous LibreTexts API services & endpoints.
 * @file Defines various LibreTexts API endpoints.
 */
const http = require('http');
const timestamp = require('console-timestamp');
const filenamify = require('filenamify');
const server = http.createServer(handler);
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const secure = require('./secure.json');
const fs = require('fs-extra');
const md5 = require('md5');
const { MemoryCache } = require('memory-cache-node');
const { performance } = require('perf_hooks');
const LibreTexts = require('./reuse.js');
let port = 3005;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
    port = parseInt(process.argv[2]);
}
server.listen(port);

const expireCheckInterval = 300; // 5 minutes
const maxItemCount = 20;
const authorsCache = new MemoryCache(expireCheckInterval, maxItemCount);

const now1 = new Date();
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

async function handler(request, response) {
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    let url = request.url;
    url = url.replace('endpoint/', '');
    url = LibreTexts.clarifySubdomain(url);
    let localBounce = request.headers?.origin?.endsWith('libretexts.org');
    
    // allows external sites to access deki files
    if (url.startsWith('/bounce/')) {
        if (request.method === 'GET') {
            response.writeHead(200, !localBounce ? {
                'Access-Control-Allow-Origin': request.headers.origin || null,
                'Access-Control-Allow-Methods': 'GET',
                'Vary': 'Origin',
                'Content-Type': 'application/json',
            }:{
                'Content-Type': 'application/json',
            }); //allow targeted CORS, but prevent double CORS
            
            let [, targetURL] = url.split('/bounce/');
            if (!targetURL?.match(/^https:\/\/\w*?\.libretexts.org\/@api\/deki\/files\//)) {
                responseError(`Invalid target ${targetURL}`, 400);
            }
            else {
                let requests = await LibreTexts.authenticatedFetch(targetURL);
                if (requests.ok)
                    response.write(await requests.text());
                else
                    responseError(`${requests.statusText}\n${await requests.text()}`, 400);
            }
            response.end();
        }
        else {
            responseError(request.method + ' Not Acceptable', 406);
        }
    }
    // allows other sites to access anonymous read-only pages APIs
    else if (url.startsWith('/cross-library/')) {
        if (request.method === 'GET') {
            response.writeHead(200, !localBounce ? {
                'Access-Control-Allow-Origin': request.headers.origin || null,
                'Access-Control-Allow-Methods': 'GET',
                'Vary': 'Origin',
                'Content-Type': 'application/json',
            }:{
                'Content-Type': 'application/json',
            }); //allow targeted CORS, but prevent double CORS
            let [, targetURL] = url.split('/cross-library/');
            targetURL = targetURL.replace('%3A', ':')
            if (!targetURL?.match(/^https:\/\/\w*?\.libretexts.org\/@api\/deki\/pages\//))
                responseError(`Invalid target ${targetURL}`, 400);
            else {
                let requests;
                requests = await LibreTexts.authenticatedFetch(targetURL);
                if (requests.ok)
                    response.write(await requests.text());
                else
                    responseError(`${requests.statusText}\n${await requests.text()}`, 400);
            }
            response.end();
        }
        else {
            responseError(request.method + ' Not Acceptable', 406);
        }
    }
    // all subsequent endpoints must be same-origin of libretexts.org
    else if (!request.headers.origin || !request.headers.origin.endsWith('libretexts.org')) {
        responseError('Unauthorized', 401);
    }
    // access anonymous (GET) /contents endpoint
    // https://success.mindtouch.com/Integrations/API/API_Calls/pages/pages%2F%2F%7Bpageid%7D%2F%2Fcontents_(GET)
    else if (url.startsWith('/contents') ||url.startsWith('/tags') || url.startsWith('/info') || url.startsWith('/template')) {
        if (request.method === 'PUT') {
            response.writeHead(200, {'Content-Type': 'application/json'});
            let body = [];
            let endpoint = url.split('?')[0].replace(/^\/+/g,'');
            if (url.startsWith('/template')) endpoint = 'contents'; // resolve internal API call
            request.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body).toString();
                
                let input = JSON.parse(body);
                input.mode = input.mode ?? "raw";
                input.format = input.format ?? "html";
                input.dreamformat = input.dreamformat ?? "xml";
                if (url.startsWith('/template')) { // restrict Template calls
                    if (!input.path.startsWith('Template:')) {
                        responseError('Unauthorized', 401);
                        return response.end();
                    }
                    input = {
                        ...input,
                        mode: 'edit',
                        format: 'html',
                        dreamformat: 'json'
                    };
                }
                //Only get requests are acceptable
                let requests = await LibreTexts.authenticatedFetch(input.path, `${endpoint}?mode=${input.mode}&format=${input.format}&dream.out.format=${input.dreamformat}`, input.subdomain, 'LibreBot');
                if (requests.ok) {
                    if (!url.startsWith('/template')) {
                        response.write(await requests.text());
                    } else {
                        let templateRes = await requests.json();
                        if (typeof (templateRes.body) === 'string') { // return Template HTML
                            response.write(JSON.stringify({
                                template: templateRes.body
                            }));
                        } else {
                            responseError("Error loading Template HTML", 400);
                        }
                    }
                } else {
                    responseError(`${requests.statusText}\n${await requests.text()}`, 400);
                }
                response.end();
            });
        }
        else {
            responseError(request.method + ' Not Acceptable', 406);
        }
    }
    // store JSON of Commons books from batch.libretexts.org
    else if (url === '/refreshList') {
        if (request.method === 'PUT') {
            response.writeHead(200, {'Content-Type': 'application/json'});
            let body = [];
            request.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body).toString();
                
                let input = JSON.parse(body);
                console.log(`${input.subdomain}/${input.path}`);
                if (input && input.identifier === md5(authenBrowser[input.subdomain])
                    && ['Courses', 'Bookshelves', 'home'].includes(input.path)) {
                    await fs.ensureDir(`./public/DownloadsCenter/${input.subdomain}`);
                    await fs.writeJSON(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`, input.content);
                }
                else {
                    responseError(`Bad Request\nRejected path ${input.path}`, 400);
                }
                
                response.end();
            });
        }
        else {
            responseError(request.method + ' Not Acceptable', 406);
        }
    }
    // append a single JSON Commons book from batch.libretexts.org
    else if (url === '/refreshListAdd') {
        if (request.method === 'PUT') {
            response.writeHead(200, {'Content-Type': 'application/json'});
            let body = [];
            request.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body).toString();
                
                let input = JSON.parse(body);
                console.log(`Add ${input.subdomain}/${input.path}`);
                if (input && input.identifier === md5(authenBrowser[input.subdomain])
                    && ['Courses', 'Bookshelves', 'home'].includes(input.path) && input.content) {
                    await fs.ensureDir(`./public/DownloadsCenter/${input.subdomain}`);
                    if (await fs.exists(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`)) {
                        let content = await fs.readJSON(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`);
                        if (content) {
                            let array = content.items || content;
                            let index = array.findIndex(elem => elem.id === input.content.id);
                            if (index && index !== -1) {
                                array[index] = input.content;
                            }
                            else {
                                array.push(input.content);
                            }
                            await fs.writeJSON(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`, content);
                        }
                    }
                    else
                        await fs.writeJSON(`./public/DownloadsCenter/${input.subdomain}/${filenamify(input.path)}.json`, [input.content]);
                }
                else {
                    responseError(`Bad Request\nRejected path ${input.path}`, 400);
                }
                
                response.end();
            });
        }
        else {
            responseError(request.method + ' Not Acceptable', 406);
        }
    }
    // get a library's author's information
    else if (url.startsWith('/getAuthors/')) {
        if (request.method === 'GET') {
            response.writeHead(200, {'Content-Type': ' application/json', 'Cache-Control': 'public, max-age=43200'});
            
            const subdomain = url.split('/getAuthors/')[1];
            if (authorsCache.hasItem(subdomain)) {
                response.write(authorsCache.retrieveItemValue(subdomain));
            } else {
                let authors = '{}';
                let contents = await LibreTexts.authenticatedFetch('Template:Custom/Views/ContentHeader/LibrarySpecific', 'contents', subdomain, authen['getAuthors']);
                if (contents.ok) {
                    contents = await contents.text();
                    const match = contents.match(/^var authors = {([\s\S]*)?}(?=;)/m);
                    if (match) {
                        try {
                            contents = match[0];
                            contents = contents.replace('var authors = ', '');
                            contents = LibreTexts.decodeHTML(contents);
                            authors = LibreTexts.decodeHTML(contents);
                            authorsCache.storeExpiringItem(subdomain, authors, 3600);
                        } catch (e) {
                            console.error('Error parsing author information:', e);
                        }
                    }
                } else {
                    console.error(await contents.text());
                }
                response.write(authors);
            }
            response.end();
        }
    } else if (url.startsWith('/getTOC/')) {
        if (request.method === 'GET') {
            let start = performance.now();
            response.writeHead(200, {'Content-Type': 'application/json'});
            let resourceURL = url.split('/getTOC/')[1];
            resourceURL.replace('%3A', ':');
            let pages = await LibreTexts.getSubpages(resourceURL, 'LibreBot', { flat: false });
            let end = performance.now();
            response.end(JSON.stringify({
                time: `${end - start} ms`,
                toc: pages
            }));
        } else {
            responseError(request.method + 'Not Acceptable', 406);
        }
    } else if (url.startsWith('/licensereport/')) {
        let [, root] = url.split('/licensereport/');
        if (!root) {
            return responseError('No root URL provided.', 400);
        }

        // Handle cache control and URL encoding
        let noCache = false;
        try {
            const splitRoot = root.split('?');
            root = decodeURIComponent(splitRoot[0]);
            if (splitRoot.length > 1 && (splitRoot[1] === 'no-cache' || splitRoot[1] === 'nocache')) {
                noCache = true;
            }
        } catch (e) {
            return responseError('Invalid URL provided.', 400);
        }

        const [subdomain, path] = LibreTexts.parseURL(root);
        const allSubdomains = Object.values(LibreTexts.libraries);
        if (!subdomain || !allSubdomains.includes(subdomain)) {
            return responseError('Invalid URL provided.', 400);
        }

        const input = {
            root,
            path,
            subdomain,
            noCache,
            user: 'LibreBot',
        };
        const licenseReportData = await LibreTexts.getLicenseReport(input);

        if (licenseReportData === null) {
            return responseError('Provided URL is not a coverpage!', 400);
        }

        return response.end(JSON.stringify(licenseReportData));
    }
    else {
        responseError('Action not found', 400);
    }
    
    
    function responseError(message, status) {
        //else fall through to error
        response.writeHead(status ? status : 400, {'Content-Type': 'text/html'});
        response.write(('Bad Request\n' + (message ? message : url)));
        response.end();
    }
}
