const http = require('http');
const timestamp = require("console-timestamp");
const EPub = require("epub");
const filenamify = require('filenamify');
const server = http.createServer(handler);
const io = require('socket.io')(server, {path: '/import/ws'});
const findRemoveSync = require('find-remove');
const fs = require('fs-extra');
const fetch = require("node-fetch");
const async = require('async');
const md5 = require('md5');
const util = require('util');
const Eta = require('node-eta');
const zipLocal = require('zip-local');
const convert = require('xml-js');
// const secret = require('./secure.json');
const excelToJson = require('convert-excel-to-json');
// @TODO unncoment await line
const LibreTexts = require("./reuse.js");
let port = 3003;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
    port = parseInt(process.argv[2]);
}
server.listen(port);
const now1 = new Date();
// fs.emptyDir('ImportFiles');
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

findRemoveSync('./ImportFiles', {
    age: {seconds: 30 * 8.64e+4},
    files: "*.*",
});

function handler(request, response) {
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    let url = request.url;
    url = LibreTexts.clarifySubdomain(url);
    console.log(url);
    
    if (url.startsWith('/websocketclient')) {
        //Serve client socket.io Javascript file
        staticFileServer.serveFile('../node_modules/socket.io-client/dist/socket.io.js', 200, {}, request, response);
    }
    else {
        responseError('Action not found', 400);
    }
    
    function responseError(message, status) {
        //else fall through to error
        response.writeHead(status ? status : 400, {"Content-Type": "text/html"});
        response.write(("Bad Request\n" + (message ? message : url)));
        response.end();
    }
    
    function reportMessage(message, isError) {
        if (isError) {
            console.error(message);
        }
        else {
            console.log(message);
        }
        let json = {
            message: message,
            isError: isError,
        };
        response.write(JSON.stringify(json) + "\r\n");
    }
}


//Set up Websocket connection using Socket.io
io.on('connection', function (socket) {
    // console.log('an user connected');
    socket.emit('welcome', `Hello!`);
    
    //Define callback events;
    socket.on('downloadFile', (data) => downloadFile(data, socket));
    socket.on('sendFile', (data, done) => sendFile(data, socket, done));
    socket.on('listFiles', (data) => listFiles(data, socket));
    socket.on('import', (data) => jobHandler(data, socket));
});

async function jobHandler(data, socket) {
    //ensure file exists
    data.path = `./ImportFiles/${data.user}/${data.type}/${data.filename}`;
    data.socket = socket;
    if (!await fs.exists(data.path)) {
        socket.emit('errorMessage', 'File does not exist!');
        return;
    }
    console.log(`Processing ${data.filename}`);
    switch (data.type) {
        case "epub":
            return processEPUB(data, socket);
        case 'commoncartridge':
            return processCommonCartridge(data, socket);
        case 'libremap':
            return processLibreMap(data, socket);
        case "pdf":
            return null;
        case "pretext":
            return processPretext(data, socket);
        default:
            break;
    }
}

async function downloadFile(data, socket) {
    let response;
    if (!data.url.startsWith('http')) {
        socket.emit('setState', {state: 'downloadFail'});
        return;
    }
    
    if (data.url.includes('dropbox.com')) {
        data.url = data.url.replace('?dl=0', '');
        response = await fetch(data.url + '?dl=1', {mode: "HEAD"});
        if (response.ok && response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('attachment'))
            data.url = data.url + '?dl=1';
    }
    else if (data.type === 'epub') {
        response = await fetch(data.url + '/open/download?type=epub', {mode: "HEAD"});
        if (response.ok && response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('.epub'))
            data.url = data.url + '/open/download?type=epub';
    }
    else if (data.type === 'pretext') {
        response = await fetch(data.url + '/archive/master.zip', {mode: "HEAD"});
        if (response.ok && response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('.zip'))
            data.url = data.url + '/archive/master.zip';
    }
    response = await fetch(data.url);
    
    // Step 2: get total length
    if (!response.ok || !response.headers.get('content-disposition')) {
        socket.emit('setState', {state: 'downloadFail'});
        return;
    }
    const contentLength = +response.headers.get('Content-Length');
    if (response.headers.get('content-disposition') && response.headers.get('content-disposition').match(/(?<=filename=).*$/)) {
        console.log(response.headers.get('content-disposition'))
        try {
            data.filename = response.headers.get('content-disposition').match(/(?<=filename=").*(?=")/)[0];
        } catch (e) {
            data.filename = response.headers.get('content-disposition').match(/(?<=filename=).*?(?=;|$)/)[0];
        }
    }
    
    // Step 3: read the data
    let receivedLength = 0; // received that many bytes at the moment
    let chunks = []; // array of received binary chunks (comprises the body)
    await new Promise((resolve, reject) => {
        response.body.on('data', (value) => {
            chunks.push(value);
            receivedLength += value.length;
            socket.emit('progress', parseFloat(receivedLength / contentLength * 100).toFixed(1));
        });
        response.body.on('end', resolve);
    });
    // Step 4: concatenate chunks into single Uint8Array
    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    data.filename = data.filename || data.url.match(/(?<=\/)[^\/]*?$/)[0];
    await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
    await fs.writeFile(`./ImportFiles/${data.user}/${data.type}/${data.filename}`, chunksAll);
    await listFiles(data, socket);
    socket.emit('setState', {state: 'downloadDone', filename: data.filename});
}

async function sendFile(data, socket, done) { //upload file to server for processing
    if (data.status === 'start') {
        await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
        socket.sendFile = {
            path: `./ImportFiles/${data.user}/${data.type}/${data.filename}`,
            buffer: [],
            length: data.length
        };
        
    }
    if (socket.sendFile) {
        socket.sendFile.buffer[data.index] = data.buffer;
        socket.emit('progress', parseFloat(socket.sendFile.buffer.length / socket.sendFile.length * 100).toFixed(1));
        done(data.index);
    }
    
    if (socket.sendFile.buffer.length === socket.sendFile.length) {
        let complete = true;
        for (let i = 0; i < socket.sendFile.buffer.length; i++) {
            if (!socket.sendFile.buffer[i])
                complete = false;
        }
        let body = Buffer.concat(socket.sendFile.buffer);
        await fs.writeFile(socket.sendFile.path, body);
        await listFiles(data, socket);
        socket.emit('setState', {state: 'downloadDone', filename: data.filename});
    }
}

async function listFiles(data, socket) {
    await fs.ensureDir(`./ImportFiles/${data.user}/${data.type}`);
    let files = await fs.readdir(`./ImportFiles/${data.user}/${data.type}`, {withFileTypes: true});
    if (files) {
        files = files.filter(elem => elem.isFile());
        files = files.map(elem => elem.name);
        socket.emit('listFiles', files);
    }
}

/*processPretext({
	path: './ImportFiles/hdagnew@ucdavis.edu/pretext/aata-master.zip',
	user: 'hdagnew@ucdavis.edu',
	subdomain: 'chem'
}, {emit: (a, b) => console.error(b)});*/

async function processCommonCartridge(data, socket) {
    const types = {
        "associatedcontent/imscc_xmlv1p2/learning-application-resource": "content",
        "imsdt_xmlv1p2": "discussion",
        "imswl_xmlv1p2": "link",
        "imsqti_xmlv1p2/imscc_xmlv1p2/assessment": "assessment",
        "imsqti_xmlv1p2/imscc_xmlv1p2/question-bank": "quiz",
        "webcontent": "content",
    };
    try {
        zipLocal.unzip = util.promisify(zipLocal.unzip);
        let unzipped = await zipLocal.unzip(data.path);
        unzipped.save = util.promisify(unzipped.save);
        await fs.emptyDir(`${data.path}-Unzipped`);
        await unzipped.save(`${data.path}-Unzipped`);
        if (!await fs.exists(`${data.path}-Unzipped/imsmanifest.xml`)) {
            socket.emit('errorMessage', 'imsmanifest.xml is invalid');
            return;
        }
        
        let rootPath = `${data.path}-Unzipped`;
        let onlinePath = `Sandboxes/${data.user}`;
        const Working = {}; // since user and subdomain are unchanged for these calls
        Working.authenticatedFetch = async (path, api, options) => await LibreTexts.authenticatedFetch(path, api, data.subdomain, data.user, options);
        Working.putProperty = async (name, value, path) => await putProperty(name, value, path, data.subdomain, data.user);
        
        //go through html and upload
        //setup parent pages
        await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
            method: "POST",
            body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
        }, data.subdomain);
        onlinePath += `/${data.filename}`;
        await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
            method: "POST",
            body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a><a href=\"#\">coverpage:yes</a></p>",
        }, data.subdomain);
        await Working.putProperty('mindtouch.idf#subpageListing', 'simple', onlinePath);
        
        //parse imsmanifest.xml
        let manifest = await fs.readFile(rootPath + '/imsmanifest.xml');
        manifest = convert.xml2js(manifest);
        let [metadata, organization, resources] = manifest.elements[0].elements;
        if (!resources.elements || !organization.elements)
            return;
        let temp = {};
        let resourceTypes = {};
        resources.elements.forEach(elem => {
                let item = {
                    name: elem.attributes.identifier,
                    file: elem.elements.find(elem => elem.name === 'file').attributes.href,
                    type: elem.attributes.type,
                    convertedType: elem.attributes?.intendeduse || types[elem.attributes.type]
                };
                temp[elem.attributes.identifier] = item;
                
                if (!resourceTypes[elem.attributes.type]) {
                    resourceTypes[elem.attributes.type] = [item];
                }
                else {
                    resourceTypes[elem.attributes.type].push(item);
                }
                
            }
        );
        resources = temp;
        organization = organization.elements;
        while (organization.length === 1) {
            organization = organization[0].elements;
            if (organization[0].name === 'title')
                organization.shift();
        }
        // organization = organization.filter(elem => elem.elements.length > 1);
        let totalPages = 0;
        organization = organization.map((page) => digestPage(page, resources));
        
        //begin page uploads
        let firstEntry = {
            title: data.filename,
            type: 'Coverpage',
            url: `https://${data.subdomain}.libretexts.org/${onlinePath}`,
        };
        let log = [firstEntry];
        let backlog = [firstEntry];
        let eta = new Eta(totalPages, true);
        let backlogClearer = setInterval(clearBacklog, 1000);
        
        //process content pages
        for (let i = 0; i < organization.length; i++) {
            // await processPage(organization[i], rootPath, onlinePath, i);
        }
        
        
        //process attachments and non-content pages
        let path = `${onlinePath}/Resources`;
        await Working.authenticatedFetch(path, "contents?abort=exists", {
            method: "POST",
            body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
        }, data.subdomain);
        await Working.putProperty('mindtouch.idf#subpageListing', 'simple', path);
        
        for (const [key, value] of Object.entries(resourceTypes)) { //new page for each resource type
            socket.emit('progress', {
                percentage: key,
                pages: `Uploading ${value.length} items for ${key}`,
                eta: 'Waiting on Resource uploads',
            });
            await processAttachments(value, rootPath, `${onlinePath}/Resources/${key.replace(/\//g, '***')}`, socket);
            let entry = {
                title: key,
                type: 'resources',
                url: `https://${data.subdomain}.libretexts.org/${onlinePath}/Resources/${key.replace(/\//g, '_')}`,
            };
            backlog.push(entry);
            log.push(entry);
            console.log(key, value.length);
        }
        
        
        //finishing up
        socket.emit('setState', {
            state: 'done',
            log: log,
            url: `https://${data.subdomain}.libretexts.org/${onlinePath}`
        });
        clearInterval(backlogClearer);
        await clearBacklog();
        
        //Function Zone
        function digestPage(page, resources) {
            let result = {};
            result.title = page.elements.find(elem => elem.name === 'title');
            if (!result.title.elements)
                result.title = `Untitled Page ${totalPages}`;
            else result.title = result.title.elements[0].text;
            result.title = result.title.replace(/&/g, 'and');
            result.subpages = page.elements.filter(elem => elem.name === 'item');
            
            if (!result.subpages.length) {
                result.type = 'topic';
            }
            else {
                result.subpages = result.subpages.map(elem => digestPage(elem, resources));
                if (result.subpages[0].type === 'topic')
                    result.type = 'guide';
                else
                    result.type = 'category';
            }
            if (page.attributes && page.attributes.identifierref) {
                result.href = resources[page.attributes.identifierref];
                resources[page.attributes.identifierref].active = true;
            }
            totalPages++;
            return result;
        }
        
        async function processPage(page, rootPath, onlinePath, index) {
            let safeTitle = encodeURIComponent(page.title);
            let path = `${onlinePath}/${("" + index).padStart(2, "0")}: ${page.title.replace(/[?/&]/g, '_')}`;
            const convertedType = page?.href?.convertedType ? `<a href=\"#\">lms:${page?.href?.convertedType}</a>` : "";
            if (page.type === 'category') {
                await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
                    method: "POST",
                    body: `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a>${convertedType}</p>`,
                }, data.subdomain);
                await Working.putProperty('mindtouch.idf#subpageListing', 'simple', path);
            }
            else if (page.type === 'guide') {
                await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
                    method: "POST",
                    body: `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a>${convertedType}</p>`,
                }, data.subdomain);
                await Promise.all(
                    [Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
                        Working.putProperty('mindtouch.page#welcomeHidden', true, path),
                        Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
                
            }
            else if (page.type === 'topic') {
                if (!page.href || !(page.href.file.endsWith('.html') || page.href.file.endsWith('.xml'))) {
                    page.type = 'attachment';
                    await processAttachments([page.href], rootPath, path);
                }
                else {
                    let contents = await fs.readFile(`${rootPath}/${page.href.file}`, 'utf8');
                    let currentPath = decodeURIComponent(`${rootPath}/${page.href.file}`.match(/^.*\/(?=.*?$)/)[0]);
                    const webResourcesExists = await fs.exists(`${rootPath}/web_resources`);
                    if (contents.includes('<text texttype="text/html">')) {
                        let inner = contents.match(/(?<=<text texttype="text\/html">)[\s\S]*?(?=<\/text>)/)?.[0];
                        if (inner) {
                            contents = LibreTexts.decodeHTML(inner);
                        }
                    }
                    
                    contents = await uploadImages(contents, path, imageProcessor, data);
                    
                    async function imageProcessor(imagePath) {
                        let filename = decodeURIComponent(imagePath).replace(/\$IMS-CC-FILEBASE\$\/?/, '');
                        if (filename.startsWith('../')) {
                            currentPath = currentPath.match(/.*\/(?=.*?\/$)/)?.[0];
                            filename = filename.match(/(?<=\.\.\/).*/)?.[0];
                        }
                        filename = filename.match(/^.*?(?=\?.*?$)/)?.[0] || filename;
                        filename = LibreTexts.decodeHTML(filename);
                        let completePath = currentPath + filename
                        let okay = filename && await fs.exists(completePath);
                        if (!okay && filename && webResourcesExists) { //try again in webResources
                            completePath = `${rootPath}/web_resources/${filename}`
                            // console.log(`Grabbing ${completePath}`);
                            okay = await fs.exists(completePath);
                        }
                        return [filename, okay ? await fs.readFile(completePath) : false, completePath];
                    }
                    
                    
                    let response = await Working.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&title=${safeTitle}`, {
                        method: 'POST',
                        body: contents + `<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a>${convertedType}</p>`
                    });
                    if (!response.ok) {
                        let error = await response.text();
                        console.error(error);
                        socket.emit('errorMessage', error);
                    }
                    await Working.putProperty('mindtouch.page#welcomeHidden', true, path);
                }
            }
            
            //report page upload
            if (!page.suppressLogs) {
                console.log(page.type, page.title);
                let entry = {
                    title: page.title,
                    type: page.type,
                    url: `https://${data.subdomain}.libretexts.org/${path}`,
                };
                backlog.push(entry);
                log.push(entry);
                eta.iterate();
                socket.emit('progress', {
                    percentage: `${parseFloat(log.length / totalPages * 100).toFixed(1)}%`,
                    pages: `${log.length} / ${totalPages} pages processed`,
                    eta: eta.format("{{etah}}"),
                });
            }
            
            await LibreTexts.sleep(500);
            
            //recurse down
            if (page.type !== 'topic') {
                for (let i = 0; i < page.subpages.length; i++) {
                    await processPage(page.subpages[i], rootPath, path, i)
                }
            }
        }
        
        async function processAttachments(resources, rootPath, onlinePath, socket) {
            resources = resources.filter(elem => elem);
            if (!resources.length)
                return false;
            let entries = [];
            let title = onlinePath.match(/(?<=\/)[^\/]*?$/)[0].replace(/\*\*\*/g, '/');
            onlinePath = onlinePath.replace(/\*\*\*/g, '_');
            
            const convertedType = title ? `<a href=\"#\">lms:${types[title]}</a>` : "";
            for (let i = 0; i < resources.length; i++) {
                try {
                    const currentResource = resources[i];
                    let filename = decodeURIComponent(currentResource.file).replace(/\$IMS-CC-FILEBASE\$\/?/, '');
                    let currentPath = rootPath;
                    if (filename.startsWith('../')) {
                        currentPath = currentPath.match(/.*\/(?=.*?\/$)/)[0];
                        filename = filename.match(/(?<=\.\.\/).*/)[0];
                    }
                    if (await fs.exists(currentPath + '/' + filename)) {
                        let file = await fs.readFile(currentPath + '/' + filename);
                        filename = filename.match(/(?<=\/)[^\/]*?$/)[0];
                        
                        
                        if (currentResource && (currentResource.file.endsWith('.html') || currentResource.file.endsWith('.xml')) && ['assignment', 'assessment', 'discussion'].includes(currentResource.convertedType)) {
                            await processPage({
                                title: filename,
                                href: currentResource,
                                type: 'topic',
                                suppressLogs: true
                            }, rootPath, onlinePath, i);
                        }
                        
                        let response = await Working.authenticatedFetch(onlinePath, `files/${encodeURIComponent(encodeURIComponent(filename))}?dream.out.format=json`, {
                            method: 'PUT',
                            body: file,
                        });
                        if (response.ok) {
                            let fileID = await response.json();
                            entries.push({title: filename, id: fileID['@id']});
                        }
                    }
                    if (socket) {
                        socket.emit('progress', {
                            percentage: `${i} / ${resources.length} files`,
                            pages: `Uploading ${resources[i].type}`,
                            eta: `Waiting on attachments`,
                        });
                    }
                    
                } catch (e) {
                
                }
            }
            if (!socket || !entries.length) //early exit
                return false;
            
            
            let contents = entries.filter(elem => elem.id).map(elem => `<a href='/@api/deki/files/${elem.id}'>${elem.title}</a>`).join();
            
            let response = await Working.authenticatedFetch(onlinePath, `contents?edittime=now&title=${encodeURIComponent(title)}&dream.out.format=json`, {
                method: 'POST',
                body: `<p>{{template.ShowOrg()}}</p>${contents}<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a>${convertedType}</p>`,
            });
            await Promise.all(
                [Working.putProperty("mindtouch.idf#guideDisplay", "single", onlinePath),
                    Working.putProperty('mindtouch.page#welcomeHidden', true, onlinePath),
                    Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", onlinePath)]);
            
            if (!response.ok) {
                let error = await response.text();
                console.error(error);
                socket.emit('errorMessage', error);
            }
        }
        
        async function clearBacklog() {
            if (backlog.length) {
                socket.emit('pages', backlog);
                backlog = [];
            }
        }
        
    } catch (e) {
        console.error(e);
        socket.emit('errorMessage', JSON.stringify(e));
    }
}

async function processEPUB(data, socket) {
    const Working = {}; // since user and subdomain are unchanged for these calls
    Working.authenticatedFetch = async (path, api, options) => await LibreTexts.authenticatedFetch(path, api, data.subdomain, data.user, options);
    Working.putProperty = async (name, value, path) => await putProperty(name, value, path, data.subdomain, data.user);
    
    let epub = new EPub(data.path);
    epub.parse();
    await new Promise((resolve, reject) => {
        epub.on("end", resolve);
    });
    const title = epub.metadata.title;
    
    let filtered = [];
    let chapters = [];
    let whole = [];
    const toc = epub.flow;
    let chapterIndex = 0;
    let pageIndex = 1;
    
    for (let i = 0; i < toc.length; i++) {
        if (toc[i].level) {
            //front and back matter ignored
            let page = toc[i];
            let indexes = page.title.match(/^[0-9]+\.[0-9]/);
            if (indexes) {
                indexes = indexes[0];
                page.title = page.title.replace(indexes, indexes + ':');
            }
            else {
                page.title = `${chapterIndex}.${pageIndex}: ${page.title}`;
            }
            pageIndex++;
            filtered.push({title: page.title, id: page.id, href: page.href});
        }
        else if (toc[i].href.includes('-chapter-') || toc[i].href.includes('part-')) {
            chapters.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
            chapterIndex++;
            pageIndex = 1;
        }
        whole.push({title: toc[i].title, id: toc[i].id, href: toc[i].href});
    }
    
    let filteredChapters = [];
    for (let i = 0; i < chapters.length; i++) {
        let current = chapters[i];
        if (!current.title.includes('Summary')) {
            current.index = i;
            filteredChapters.push(current);
        }
    }
    
    let onlinePath = `Sandboxes/${data.user}`;
    await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
        method: "POST",
        body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
    }, data.subdomain);
    onlinePath += `/${data.filename}`;
    const isSimple = !filtered.length || !filteredChapters.length;
    //begin page uploads
    let firstEntry = {
        title: data.filename,
        type: 'Coverpage',
        url: `https://${data.subdomain}.libretexts.org/${onlinePath}`,
    };
    let log = [firstEntry];
    let backlog = [firstEntry];
    const eta = new Eta(whole.length, true);
    let backlogClearer = setInterval(clearBacklog, 1000);
    
    if (await coverPage(onlinePath, isSimple)) {
        if (isSimple) { //falling back to simple import
            socket.emit('errorMessage', 'Warning: Cannot determine structure. Falling back to simple import.');
            await processPages(whole, onlinePath, null);
        }
        else {
            await processChapters(onlinePath, filteredChapters);
            await processPages(filtered, onlinePath, filteredChapters);
        }
        
        //finishing up
        socket.emit('setState', {
            state: 'done',
            log: log,
            url: `https://${data.subdomain}.libretexts.org/${onlinePath}`
        });
        clearInterval(backlogClearer);
        await clearBacklog();
    }
    
    async function clearBacklog() {
        if (backlog.length) {
            socket.emit('pages', backlog);
            backlog = [];
        }
    }
    
    async function coverPage(path, isSimple) {
        let content = `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-${isSimple ? 'guide' : 'category'}</a><a href=\"#\">coverpage:yes</a></p>`;
        let response = await Working.authenticatedFetch(path, 'contents?edittime=now', {
            method: "POST",
            body: content,
        });
        if (!response.ok) {
            let error = await response.text();
            socket.emit('errorMessage', error);
            return false;
        }
        
        let propertyArray = isSimple ? [Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
                Working.putProperty('mindtouch.page#welcomeHidden', true, path),
                Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]
            : [Working.putProperty('mindtouch.page#welcomeHidden', true, path),
                Working.putProperty('mindtouch.idf#subpageListing', 'simple', path)];
        
        
        await Promise.all(propertyArray);
        return true;
    }
    
    async function processChapters(onlinePath, chapters) {
        await async.mapLimit(chapters, 1, processChapter);
        
        async function processChapter(chapter) {
            let title = chapter.title;
            title = title.replace("Chapter ", "");
            let number = title.match(/[0-9]+(?= )/);
            if (number) {
                number = number[0];
            }
            else {
                number = chapter.index + 1;
                if (!title.startsWith(`${chapter.index + 1}:`))
                    title = `${chapter.index + 1}: ${title}`;
            }
            let padded = title.replace(number, ("" + number).padStart(2, "0"));
            chapter.title = title;
            chapter.padded = padded;
            let path = `${onlinePath}/${padded}`;
            let response = await Working.authenticatedFetch(path, `contents?edittime=now${padded !== title ? `&title=${encodeURIComponent(title)}` : ''}`, {
                method: "POST",
                body: `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>`,
            });
            if (!response.ok) {
                let error = await response.text();
                socket.emit('errorMessage', error);
                return false;
            }
            
            await Promise.all(
                [Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
                    Working.putProperty('mindtouch.page#welcomeHidden', true, path),
                    Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]
            );
            console.log('Chapter', title);
            let entry = {
                title: title,
                type: 'Chapter',
                url: `https://${data.subdomain}.libretexts.org/${path}`,
            };
            backlog.push(entry);
            log.push(entry);
            eta.iterate();
            socket.emit('progress', {
                percentage: `${parseFloat(log.length / whole.length * 100).toFixed(1)}%`,
                pages: `${log.length} / ${whole.length}`,
                eta: eta.format("{{etah}}"),
            });
            return true;
            
        }
    }
    
    
    async function processPages(pageArray, onlinePath, filteredChapters) {
        let isSimple = filteredChapters === null;
        let untitled = 0;
        return await async.mapLimit(pageArray, 1, processPage);
        
        async function processPage(page) {
            epub.getChapterRaw = util.promisify(epub.getChapterRaw);
            epub.getImage = util.promisify(epub.getImage);
            epub.readFile = util.promisify(epub.readFile);
            let contents = await epub.getChapterRaw(page.id);
            let pressBooksContent = contents.match(/(?<=class="ugc.*>)[\s\S]*?(?=<\/div>\n+<\/div>\n*<\/body>)/m);
            if (pressBooksContent) {
                contents = pressBooksContent[0];
            }
            
            let title = page.title || `Untitled Page ${("" + ++untitled).padStart(2, "0")}`;
            let path = title;
            
            let chapterNumber = path.match(/.*?(?=\.)/);
            if (!isSimple && chapterNumber) { //adds padding if necessary
                chapterNumber = parseInt(chapterNumber[0]);
                path = chapterNumber < 10 ? "0" + path : path;
            }
            try {
                path = isSimple || !filteredChapters[chapterNumber - 1] ? `${onlinePath}/${path}` : `${onlinePath}/${filteredChapters[chapterNumber - 1].padded}/${path}`;
            } catch (e) {
                console.error(e);
            }
            //remove extraneous link tags
            contents = contents.replace(/<a>\n\s*?(<img [\s\S]*?)<\/a>/gm, '$1');
            
            contents = await uploadImages(contents, path, imageProcessor, data);
            
            async function imageProcessor(imagePath) {
                let filename = decodeURIComponent(imagePath);
                let prefix = page.href.match(/.*\//);
                prefix = prefix ? prefix[0] : '';
                if (prefix && filename.startsWith('../')) {
                    prefix = prefix.match(/.*\/(?=.*?\/$)/)[0];
                    filename = filename.match(/(?<=\.\.\/).*/)[0];
                }
                let file;
                try {
                    if (filename && !filename.includes('base64') && !filename.includes('#fixme'))
                        file = await epub.readFile(prefix + filename);
                } catch (e) {
                }
                return [filename, file, prefix + filename];
            }
            
            let response = await Working.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&title=${encodeURIComponent(title)}`, {
                method: 'POST',
                body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
            });
            if (!response.ok) {
                let error = await response.text();
                console.error(error);
                socket.emit('errorMessage', error);
            }
            await Working.putProperty('mindtouch.page#welcomeHidden', true, path);
            
            //report page upload
            console.log('Topic', page.title || title);
            let entry = {
                title: page.title,
                type: 'Topic',
                url: `https://${data.subdomain}.libretexts.org/${path}`,
            };
            backlog.push(entry);
            log.push(entry);
            eta.iterate();
            socket.emit('progress', {
                percentage: `${parseFloat(log.length / whole.length * 100).toFixed(1)}%`,
                pages: `${log.length} / ${whole.length} pages uploaded`,
                eta: eta.format("{{etah}}"),
            });
        }
    }
}

async function processLibreMap(data, socket) {
    const rootURL = `https://libremaps.libretexts.org/`;
    const rootAPI = `${rootURL}/api/v1`;
    
    async function login(user) {
        const body = secret.libremaps[user];
        let token = await fetch(`${rootAPI}/oauth.json`);
        if (!token.ok) {
            console.error(await token.text());
            return null;
        }
        token = await token.json();
        token = token['access_token'];
        token = await fetch(`${rootAPI}/users/login.json?token=${token}`, {
            method: "POST",
            body: JSON.stringify(body)
        });
        if (!token.ok) {
            console.error(await token.text());
            return null;
        }
        token = await token.json();
        token = token['access_token'];
        
        return token;
    }
    
    try {
        const result = excelToJson({sourceFile: data.path});
        //begin page uploads
        let firstEntry = {
            title: data.filename,
            type: 'Board',
            url: `https://libremap.libretexts.org/`,
        };
        let log = [];
        let backlog = [];
        let backlogClearer = setInterval(clearBacklog, 1000);
        
        let keys = Object.keys(result);
        let token = await login('admin');
        
        let board = await fetch(`${rootAPI}/boards.json?token=${token}`, {
            method: "POST",
            body: JSON.stringify({
                "board_visibility": 0,
                "name": data.filename,
                "group_id": 0
            })
        });
        board = (await board.json()).id;
        console.log(`Board: ${board}`);
        
        //creating lists
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let sheet = result[key];
            
            let list = await fetch(`${rootAPI}/boards/${board}/lists.json?token=${token}`, {
                method: "POST",
                body: JSON.stringify({
                    "board_id": board,
                    "name": key,
                    "position": i
                })
            });
            list = (await list.json()).id;
            
            //creating cards
            let rows = Object.keys(sheet);
            let headers = sheet[rows[0]];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                let result = '';
                for (let j = 0; j < Object.keys(sheet[row]).length; j++) {
                    const cardKey = Object.keys(sheet[row])[j];
                    result += `${headers[cardKey] || 'Blank'}: ${sheet[row][cardKey]}\n`;
                }
                
                let card = await fetch(`${rootAPI}/boards/${board}/lists/${list}/cards.json?token=${token}`, {
                    method: "POST",
                    body: JSON.stringify({
                        "board_id": board,
                        "list_id": list,
                        "name": sheet[row].B || sheet[row].A || 'Untitled Card',
                        "description": result,
                        "position": i,
                    })
                });
                card = (await card.json()).id;
            }
        }
        let newUser = await fetch(`${rootAPI}/boards/${board}/users.json?token=${token}`, {
            method: "POST",
            body: JSON.stringify({
                "board_user_role_id": 1,
                "user_id": 6,
            })
        });
        newUser = await newUser.json();
        await fetch(`${rootAPI}/boards/${board}/boards_users/${newUser.id - 1}.json?token=${token}`, {
            method: "DELETE",
        });
        
        //finishing up
        socket.emit('setState', {
            state: 'done',
            log: log,
            url: `https://libremaps.libretexts.org/#/board/${board}`
        });
        clearInterval(backlogClearer);
        await clearBacklog();
        
        async function clearBacklog() {
            if (backlog.length) {
                socket.emit('pages', backlog);
                backlog = [];
            }
        }
        
    } catch (e) {
        console.error(e);
        socket.emit('errorMessage', JSON.stringify(e));
    }
}

async function processPretext(data, socket) {
    //xsltproc ./mathbook/xsl/mathbook-html.xsl ./ImportFiles/hdagnew@ucdavis.edu/pretext/aata-master.zip-Unzipped/aata-master/src/aata.xml --xinclude -o out/
    try {
        zipLocal.unzip = util.promisify(zipLocal.unzip);
        let unzipped = await zipLocal.unzip(data.path);
        unzipped.save = util.promisify(unzipped.save);
        await fs.emptyDir(`${data.path}-Unzipped`);
        await unzipped.save(`${data.path}-Unzipped`);
        
        
        //find the PreTeXt source within this zip file
        let source = await runProcess('grep', ['-rl', '-E', "<pretext|<mathbook", `${data.path}-Unzipped`]);
        if (!source) {
            console.error('errorMessage', 'Cannot find a valid PreTeXt source root');
            socket.emit('errorMessage', 'Cannot find a valid PreTeXt source root');
            return;
        }
        
        console.log(source.split(`${data.path}-Unzipped`), source.split(`${data.path}-Unzipped`).length)
        if (source.split(`${data.path}-Unzipped`)?.length !== 2) {
            console.error('Too many possible PreTeXt source roots: '+source);
            socket.emit('errorMessage', 'Too many possible PreTeXt source roots');
            return;
        }
        source = source.trim();
        console.log(source);
        
        //obtain JSON manifest
        let rootPath = `${data.path}-Unzipped/out`;
        let current = await runProcess('xsltproc', ['--xinclude', './mathbook/xsl/pretext-json-manifest.xsl', source]);
        if (!current) {
            socket.emit('errorMessage', 'Invalid manifest!');
            return;
        }
        
        //process manifest
        current = JSON.parse(current)[0];
        let totalPages = 0;
        digestPage(current);
        current.source = 'index.html';
        socket.emit('progress', {
            percentage: `0`,
            pages: `Building ${totalPages} pages. This may take a few minutes...`,
            eta: 'Building PreTeXt',
        });
        
        //Build PreTeXt
        let xsltproc = await runProcess('xsltproc', ['--xinclude', '-o', rootPath + '/', './mathbook/xsl/pretext-basic-html.xsl', source]);
        console.log('done building');
        //TODO fix onlinePath
        await fs.writeJSON('out.json', current);
        
        
        let onlinePath = `Sandboxes/${data.user}`;
        const Working = {}; // since user and subdomain are unchanged for these calls
        Working.authenticatedFetch = async (path, api, options) => await LibreTexts.authenticatedFetch(path, api, data.subdomain, data.user, options);
        Working.putProperty = async (name, value, path) => await putProperty(name, value, path, data.subdomain, data.user);
        
        //go through html and upload
        //setup parent pages
        await Working.authenticatedFetch(onlinePath, "contents?abort=exists", {
            method: "POST",
            body: "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>",
        }, data.subdomain);
        onlinePath += `/${data.filename}`;
        
        //begin page uploads
        let log = [];
        let backlog = [];
        let eta = new Eta(totalPages, true);
        let backlogClearer = setInterval(clearBacklog, 1000);
        
        //process content pages
        await processPage(current);
        
        
        //finishing up
        socket.emit('setState', {
            state: 'done',
            log: log,
            url: `https://${data.subdomain}.libretexts.org/${onlinePath}`
        });
        clearInterval(backlogClearer);
        await clearBacklog();
        
        //Function Zone
        function digestPage(page, parent = {depth: 0, path: null}) {
            totalPages++;
            page.depth = parent.depth + 1;
            page.source = page.link.match(/(?<=^.*\/)[^\/]*?$/)[0];
            page.path = parent.path === null ? '' : `${parent.path}/${page.title}`;
            
            if (page.depth === 1)
                page.type = 'category';
            else if (page.depth === 2)
                page.type = 'guide';
            else
                page.type = 'topic';
            
            //process children
            for (let i = 0; i < page.children.length; i++) {
                let child = page.children[i];
                digestPage(child, page);
            }
        }
        
        async function processPage(page) {
            let safeTitle = encodeURIComponent(page.title);
            let path = `${onlinePath}${page.path.replace(/[?& ]/g, '_')}`;
            
            let response;
            let contents = await fs.readFile(`${rootPath}/${page.source}`, 'utf8');
            
            //content cleanup
            contents = contents.match(/(?<=<body>)[\s\S]*(?=<\/body>)/)[0];
            contents = contents.replace(/(<nav class="summary-links">[\s\S]*?<\/nav>)/, '');
            contents = contents.replace(/<a [^<>]*? class="permalink">¶<\/a>/, '');
            
            if (page.type === 'category') {
                response = await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
                    method: "POST",
                    body: contents + "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">coverpage:yes</a><a href=\"#\">article:topic-category</a></p>",
                }, data.subdomain);
                await Working.putProperty('mindtouch.idf#subpageListing', 'simple', path);
            }
            else if (page.type === 'guide') {
                response = await Working.authenticatedFetch(path, `contents?abort=exists&title=${safeTitle}`, {
                    method: "POST",
                    body: contents + "<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>",
                }, data.subdomain);
                await Promise.all(
                    [Working.putProperty("mindtouch.idf#guideDisplay", "single", path),
                        Working.putProperty('mindtouch.page#welcomeHidden', true, path),
                        Working.putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
                
            }
            else if (page.type === 'topic') {
                response = await Working.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&title=${safeTitle}`, {
                    method: 'POST',
                    body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
                });
            }
            if (!response.ok) {
                let error = await response.text();
                console.error(error);
                // socket.emit('errorMessage', error);
            }
            await Working.putProperty('mindtouch.page#welcomeHidden', true, path);
            
            //report page upload
            console.log(page.type, page.title);
            let entry = {
                title: page.title,
                type: page.type,
                url: `https://${data.subdomain}.libretexts.org/${path}`,
            };
            backlog.push(entry);
            log.push(entry);
            eta.iterate();
            socket.emit('progress', {
                percentage: `${parseFloat(log.length / totalPages * 100).toFixed(1)}%`,
                pages: `${log.length} / ${totalPages} pages processed`,
                eta: eta.format("{{etah}}"),
            });
            
            //recurse down
            for (let i = 0; i < page.children.length; i++) {
                await processPage(page.children[i])
            }
        }
        
        async function processAttachments(resources, rootPath, onlinePath, socket) {
            resources = resources.filter(elem => elem);
            if (!resources.length)
                return false;
            let entries = [];
            let title = onlinePath.match(/(?<=\/)[^\/]*?$/)[0].replace(/\*\*\*/g, '/');
            onlinePath = onlinePath.replace(/\*\*\*/g, '_');
            
            for (let i = 0; i < resources.length; i++) {
                try {
                    let filename = decodeURIComponent(resources[i].file).replace(/\$IMS-CC-FILEBASE\$\/?/, '');
                    let currentPath = rootPath;
                    if (filename.startsWith('../')) {
                        currentPath = currentPath.match(/.*\/(?=.*?\/$)/)[0];
                        filename = filename.match(/(?<=\.\.\/).*/)[0];
                    }
                    if (await fs.exists(currentPath + '/' + filename)) {
                        let file = await fs.readFile(currentPath + '/' + filename);
                        filename = filename.match(/(?<=\/)[^\/]*?$/)[0];
                        let response = await Working.authenticatedFetch(onlinePath, `files/${encodeURIComponent(encodeURIComponent(filename))}?dream.out.format=json`, {
                            method: 'PUT',
                            body: file,
                        });
                        if (response.ok) {
                            let fileID = await response.json();
                            entries.push({title: filename, id: fileID['@id']});
                        }
                    }
                    if (socket) {
                        socket.emit('progress', {
                            percentage: `${i} / ${resources.length} files`,
                            pages: `Uploading ${resources[i].type}`,
                            eta: `Waiting on attachments`,
                        });
                    }
                    
                } catch (e) {
                
                }
            }
            if (!entries.length)
                return false;
            let contents = entries.map(elem => `<a href='/@api/deki/files/${elem.id}'>${elem.title}</a>`).join();
            
            
            let response = await Working.authenticatedFetch(onlinePath, `contents?edittime=now&title=${encodeURIComponent(title)}&dream.out.format=json`, {
                method: 'POST',
                body: contents + '<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a></p>'
            });
            if (!response.ok) {
                let error = await response.text();
                console.error(error);
                socket.emit('errorMessage', error);
            }
        }
        
        async function clearBacklog() {
            if (backlog.length) {
                socket.emit('pages', backlog);
                backlog = [];
            }
        }
        
    } catch (e) {
        console.error(e);
        socket.emit('errorMessage', JSON.stringify(e));
    }
    
    function runProcess(first, otherArgs) {
        return new Promise(function (resolve, reject) {
            const spawn = require('child_process').spawn;
            let res = '';
            let child;
            if (process.platform === "win32") //using WSL to open bash
                child = spawn('bash', ['-c', `${first} ${otherArgs.join(' ')}`]);
            else //running directly on bash
                child = spawn(first, otherArgs);
            
            child.stdout.on('data', function (buffer) {
                res += buffer.toString();
            });
            child.stderr.on('data', function (buffer) {
                // console.error(buffer.toString());
            });
            child.stdout.on('end', function () {
                resolve(res);
            });
            child.on('exit', function (code) {
                if (code > 0)
                    reject(`child process exited with code ${code}`);
            });
        });
    };
}

async function putProperty(name, value, path, subdomain, username) {
    await LibreTexts.authenticatedFetch(path, "properties", subdomain, username, {
        method: "POST",
        body: value,
        headers: {
            "Slug": name
        }
    })
}

async function uploadImages(contents, path, imageProcessor, data) {
    //Rewrite image src url
    let images = contents.match(/<img .*?src=".*?\/.*?>/g);
    let src = contents.match(/(?<=<img .*?src=").*?(?=")/g);
    const atRoot = images === null;
    if (atRoot) {
        images = contents.match(/<img .*?src=".*?>/g);
    }
    if (src) {
        for (let i = 0; i < src.length; i++) {
            if (!src[i].startsWith('http')) {
                let [filename, image, filePath] = await imageProcessor(src[i]);
                if (!image) {
                    console.error(`Could not find ${filePath}`);
                    continue;
                }
                const fileID = await uploadImage(filename, path, image, data.subdomain, data.user, data.socket);
                let toReplace;
                if (atRoot) { // at root url
                    toReplace = images[i].replace(/(?<=<img .*?src=)"/, `"/@api/deki/files/${fileID}/`);
                }
                else {
                    toReplace = images[i].replace(/(?<=<img .*?src=").*\/(?=.*?")/, `/@api/deki/files/${fileID}/`);
                }
                
                contents = contents.replace(images[i], toReplace);
                // contents = contents.replace(/(?<=<img .*?alt=")[^\/"]*?\/(?=.*?")/, '');
            }
        }
    }
    return contents;
    
    async function uploadImage(filename, path, image, subdomain, username, socket) {
        if (!image) {
            socket.emit('errorMessage', filename);
            return false;
        }
        let shortname = filename.match(/(?<=\/)[^\/]*?$/);
        if (shortname) {
            filename = shortname[0];
        }
        let response = await LibreTexts.authenticatedFetch(path, `files/${encodeURIComponent(encodeURIComponent(filename))}?dream.out.format=json`, subdomain, username, {
            method: 'PUT',
            body: image,
        });
        if (response.ok) {
            let fileID = await response.json();
            return fileID['@id'];
        }
        else {
            console.error(filename);
            socket.emit('errorMessage', filename);
            return false;
        }
    }
}

/*
async function processXHTML(text) {
	let title = getProperty("title");
	let copyright = getProperty("book-license");
	let author = getProperty("authors");
	let coverImage = getProperty("cover-image");
	let splice = text.match(/<div .*?\n^<\/div>/gm);
	let filtered = [];
	for (let i = 0; i < splice.length; i++) {
		if (splice[i].startsWith("<div class=\"chapter")) {
			//front and back matter ignored
			filtered.push(splice[i]);
		}
	}
	let root = `https://${subdomain}.libretexts.org/Under_Construction/Users/Henry/${title}`;
	let contentArray = await processPages(filtered, root);
	reportMessage(contentArray);
	function getProperty(property) {
		let regex = new RegExp(`(?<=<meta name="pb-${property}" content=).*(?=" \\/>)`);
		let result = text.match(regex);
		return result ? result[0] : null;
	}
	async function processPages(splice, root) {
		async function processPage(page) {
			let title = page.match(/(?<=<div class=".*?-title-wrap">.*?-title">).*?(?=<.*?<\/div>)/)[0];
			let content = page.match(/(?<=<div class=".*?-title-wrap">.*?<\/div><.*?>).*(?=<\/div)/)[0];
			let sourceImages = page.match(/(?<=<img .*src=").*?(?=")/g);
			let filenames = sourceImages.map((image) => {
				return image.match(/[^/]+(?=\/$|$)/)[0];
			});
			let path = "";
			for (let i = 0; i < content.length; i++) {
				let regex = new RegExp(`(?<=<img .*src=")${sourceImages[i]}(?=")`);
				content = content.replace(regex, `${root}${path}/${filenames[i]}`)
			}
			return {title: title, content: content, sourceImages: sourceImages, filenames};
		}
		return await mapLimit(splice, 10, processPage);
	}
}*/
