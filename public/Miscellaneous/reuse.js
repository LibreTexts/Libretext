// Plugins to the Editor are registered onto this object for later activation
const LibreEditor = {
  initialized: false,
  pluginNames: ['enableBinder', 'libreTextsQuery', 'libreTextsAdapt', 'a11ychecker', 'a11yButton',
    'balloonpanel', 'LibreFormat', 'LibreBoxes', 'LibreQuery'],
  /**
   * Register the individual plugins with the CKEditor instance.
   *
   * @param {object} config - The current CKEditor instance.
   */
  registerPlugins: (config) => {
    Object.keys(LibreEditor).forEach((plugin) => {
      if (
        typeof (LibreEditor[plugin]) === 'function'
        && !['registerPlugins', 'registerAll'].includes(plugin)
      ) {
        try {
          LibreEditor[plugin](config);
        } catch (e) {
          console.error(e);
          console.error('LibreEditor: Encountered an error registering a plugin');
        }
      }
    });
  },
  /**
   * Sets up event listeners and registers or re-registers LibreTexts plugins
   * with the CKEditor instance.
   *
   * @param {object} config - The current CKEditor instance.
   */
  registerAll: (config) => {
    /* De-register LibreTexts plugins when editor winds down */
    CKEDITOR.on('instanceDestroyed', () => {
      for (let i = 0, n = LibreEditor.pluginNames.length; i < n; i += 1) {
        if (Object.keys(CKEDITOR.plugins.registered).includes(LibreEditor.pluginNames[i])) {
          delete CKEDITOR.plugins.registered[LibreEditor.pluginNames[i]];
        }
      }
    });
    if (!LibreEditor.initialized) {
      LibreEditor.registerPlugins(config);
      LibreEditor.initialized = true;
    } else {
      CKEDITOR.config.extraPlugins = '';
      console.log('LibreEditor: Already initialized, reactivating plugins now...');
      LibreEditor.registerPlugins(config);
      console.log('LibreEditor: Plugins reactivated.');
    }
  },
};

// attach functions to namespace
const LibreTexts = LibreTextsReuse();

function LibreTextsReuse() {
    const libraries = {
        "Biology": "bio",
        "Business": "biz",
        "Chemistry": "chem",
        "Engineering": "eng",
        "Espanol": "espanol",
        "Geosciences": "geo",
        "Humanities": "human",
        "K12 Education": "k12",
        "Mathematics": "math",
        "Medicine": "med",
        "Physics": "phys",
        "Social Sciences": "socialsci",
        "Statistics": "stats",
        "Workforce": "workforce",
        "Query": "query"
    };
    
    return {
        /**
         * Object for active tool/feature instances to attach to
         */
        active: {},
        /**
         * Object for information about the current page/book
         */
        current: {
          downloads: {
            pdf: {},
          },
        },
        debug: {},
        authenticatedFetch: authenticatedFetch,
        // clarifySubdomain: clarifySubdomain,
        encodeHTML: encodeHTML,
        decodeHTML: decodeHTML,
        // authenticate: authenticate,
        // addLinks: addLinks,
        extractSubdomain: extractSubdomain,
        parseURL: parseURL,
        cleanPath: cleanPath,
        sendAPI: sendAPI,
        getSubpages: getSubpages,
        getKeys: getKeys,
        getCitationInformation: getCitationInformation,
        // getSubpagesAlternate: getSubpagesAlternate,
        getAPI: getAPI,
        getCurrentContents: getCurrentContents,
        getCoverpage: getCoverpage,
        TOC: TOC,
        sleep: sleep,
        libraries: libraries,
    };
    
    //Function Zone
    function decodeHTML(content) {
        let ret = content.replace(/&gt;/g, '>');
        ret = ret.replace(/&lt;/g, '<');
        ret = ret.replace(/&quot;/g, '"');
        ret = ret.replace(/&apos;/g, "'");
        ret = ret.replace(/&amp;/g, '&');
        return ret;
    }
    
    function encodeHTML(content) {
        let ret = content;
        ret = ret.replace(/&/g, '&amp;');
        ret = ret.replace(/>/g, '&gt;');
        ret = ret.replace(/</g, '&lt;');
        ret = ret.replace(/"/g, '&quot;');
        ret = ret.replace(/'/g, "&apos;");
        return ret;
    }
    
    /**
     * @param {string} url - url to get subdomain from
     * @returns {string}
     */
    function extractSubdomain(url = window.location.href) {
        let origin = url.split("/")[2].split(".");
        const subdomain = origin[0];
        return subdomain;
    }
    
    /**
     * Breaks up a url into the subdomain and path
     * @param {string} url
     * @returns {string[]}
     */
    function parseURL(url = window.location.href) {
        if (url.includes('?')) //strips any query parameters
            url = url.split('?')[0];
        if (url.endsWith('#'))
            url = url.replace(/#$/, '');
        if (url && url.match(/https?:\/\/.*?\.libretexts\.org/)) {
            if (url.includes('libretexts.org/@go/page'))
                return [url.match(/(https?:\/\/)(.*?)(?=\.)/)[2], url.match(/(https?:\/\/.*?\/@go\/page\/)(.*)/)[2]]
            else {
                let path = url.match(/(https?:\/\/.*?\/)(.*)/);
                if (path)
                    path = path[2]
                else path = ""
                
                return [url.match(/(https?:\/\/)(.*?)(?=\.)/)[2], path]
            }
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
        if (path.includes('/'))
            [, front, back] = path.match(/(^.*[^\/]\/)([^\/].*?$)/); //only modifying page, not whole path
        try {
            back = decodeURIComponent(back);
            back = decodeURIComponent(back);
        } catch (error) {
            // console.error(path, error.message);
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
     * Wrapper for interacting with api.libretexts.org/elevate endpoints.
     * Used by developers for elevated-permission API requests
     * @param {string} api - endpoint to request
     * @param {Object} options
     * @param {string} method - REST method
     */
    async function sendAPI(api, options = {}, method = 'PUT') {
        if (!document.getElementById('seatedCheck'))
            throw Error('User not authenticated');
        
        let [current, path] = LibreTexts.parseURL();
        let payload = {
            globalSettings: JSON.parse(document.getElementById('mt-global-settings').innerText),
            subdomain: current,
            token: (await getKeys())[current],
            path: path,
            seatedCheck: Number(document.getElementById('seatedCheck').innerText),
        };
        payload = Object.assign({}, payload, options);
        
        return await fetch(`https://api.libretexts.org/elevate/${api}`, {
            method: method,
            body: JSON.stringify(payload),
            headers: {'Content-Type': 'application/json'}
        })
    }
    
    /**
     * fetch wrapper function that automatically uses Mindtouch browser API tokens
     * @param {string|number} path - the path or pageID of the target page. Can also instead take a full arbitrary API url.
     * @param {string} api - the /pages {@link https://success.mindtouch.com/Integrations/API/API_Calls/pages|sub-endpoint} that you are calling
     * @param {string} subdomain - subdomain that the target page belongs to
     * @param {Object} [options={}] - optional options that will be passed to fetch()
     */
    async function authenticatedFetch(path, api = '', subdomain, options = {}) {
        let isNumber;
        let [current, currentPath] = parseURL();
        path = path || currentPath;
        path = String(path);
        if (path.endsWith('#'))
            path = path.replace(/#$/, '');
        
        let arbitraryPage = !api && !subdomain && path.startsWith('https://');
        if (arbitraryPage) {
            [subdomain] = parseURL(path);
        }
        else {
            if (path.startsWith('https://')) { //gets path from a url
                [, path] = parseURL(path);
            }
            if (!isNaN(path)) { //if using pageIDs
                isNumber = true;
            }
            if (path === 'home') { //if at root page
                isNumber = true;
            }
        }
        if (api) { //query parameter checking
            if (!arbitraryPage && path && path.includes('?')) //isolated path should not have query parameters
                path = path.split('?')[0];
            if (!api.startsWith('?')) //allows for    pages/{pageid} (GET) https://success.mindtouch.com/Integrations/API/API_calls/pages/pages%2F%2F%7Bpageid%7D_(GET)
                api = `/${api}`;
        }
        let keys = await getKeys();
        let headers = options.headers || {};
        subdomain = subdomain || current;
        let token = keys[subdomain];
        if (current === subdomain)
            headers['X-Requested-With'] = 'XMLHttpRequest';
        
        headers['x-deki-token'] = token;
        
        options.headers = headers;
        if (arbitraryPage)
            return await fetch(path, options);
        else
            return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}${api}`,
                options);
    }
    
    // Retrieves public browser API keys
    async function getKeys() {
        if (typeof getKeys.keys === 'undefined') {
            let keys = await fetch('https://cdn.libretexts.net/authenBrowser.json');
            getKeys.keys = await keys.json();
        }
        return getKeys.keys;
    }
    
    /**
     * Parses citation information for a page
     * @param url
     * @returns {Promise<{Object}>}
     */
    async function getCitationInformation(url = window.location.href) {
        let coverpage = await LibreTexts.getCoverpage(url);
        let result = {};
        
        if (coverpage) {
            result.coverpage = await parseTags(coverpage);
        }
        
        async function parseTags(page) {
            const citationInformation = {originalResponse: page};
            
            for (let i = 0; i < page.tags.length; i++) {
                let tag = page.tags[i];
                if (tag)
                    tag = tag.replace(/\\\\/g, '\n');
                else
                    continue;
                
                let items;
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
                        citationInformation.title = items[1];
                    if (items[2])
                        citationInformation.name = items[2];
                    if (items[3])
                        citationInformation.companyname = items[3];
                    if (items[4])
                        citationInformation.shortTitle = items[4];
                    break;
                }
                else if (tag.startsWith('authorname:')) { //get some information from authorbar
                    citationInformation.authorTag = tag.replace('authorname:', '');
                    
                    if (!citationInformation.name) {
                        if (typeof getCitationInformation.libreAuthors === 'undefined') {
                            let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${page.subdomain}`);
                            getCitationInformation.libreAuthors = await authors.json();
                        }
                        
                        let information = getCitationInformation.libreAuthors[citationInformation.authorTag];
                        if (information) {
                            Object.assign(citationInformation, information);
                        }
                    }
                }
            }
            
            return citationInformation;
        }
        
        return result;
    }
    
    /**
     * Recursively get the subpages for a given page
     * @param {string} rootURL - url to get the recursive subpages for
     * @param {{flat: boolean, depth: number, socket}} options
     */
    async function getSubpages(rootURL = window.location.href, options = {}) {
        const [subdomain, path] = LibreTexts.parseURL(rootURL);
        
        let pages = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', subdomain);
        pages = await pages.json();
        
        let info = await authenticatedFetch(path, 'info?dream.out.format=json', subdomain);
        info = await info.json();
        return {
            title: info.title,
            id: info["@id"],
            url: rootURL,
            children: await subpageCallback(pages)
        };
        
        
        async function subpageCallback(info) {
            const subpageArray = info["page.subpage"];
            const result = [];
            const promiseArray = [];
            
            async function subpage(subpage, index) {
                let url = subpage["uri.ui"];
                let id = subpage['@id'];
                const hasChildren = subpage["@subpages"] === "true";
                let children = hasChildren ? undefined : [];
                if (hasChildren) { //recurse down
                    children = await authenticatedFetch(id, 'subpages?limit=all&dream.out.format=json', subdomain);
                    children = await children.json();
                    children = await subpageCallback(children, false);
                }
                let temp = {
                    title: subpage.title,
                    url: url,
                    children: children,
                    id: id,
                    relativePath: url.replace(rootURL, '')
                };
                if (options.getAPI)
                    temp = await LibreTexts.getAPI(temp, options.getAPI.contents);
                result[index] = temp;
            }
            
            if (subpageArray && subpageArray.length) {
                for (let i = 0; i < subpageArray.length; i++) {
                    promiseArray[i] = subpage(subpageArray[i], i);
                }
                
                await Promise.all(promiseArray);
                return result;
            }
            else {
                return [];
            }
        }
    }
    
    /**
     * Grabs and formats the API data for a page
     * @param {string|Object} page - url or page object
     * @param {boolean} getContents - include the page contents
     */
    async function getAPI(page, getContents) {
        if (page.title && page.properties && page.id && page.tags && (!getContents || page.content))
            return page;
        else if (typeof page === 'string')
            page = {
                url: page
            };
        page.url = page.url.replace('?contentOnly', '');
        
        let [subdomain, path] = parseURL(page.url);
        // console.log(page.url);
        let response = await authenticatedFetch(path, `?dream.out.format=json${getContents ? '&include=contents' : ''}`, subdomain);
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
            let errorCode = response.status;
            let error = await response.json();
            error.errorCode = errorCode;
            // console.error(`Can't get ${page.url}`);
            page.subdomain = subdomain;
            page.path = path;
            page.modified = 'restricted';
            page.error = error;
        }
        return page;
    }
    
    // Outputs the current page contents to the console
    async function getCurrentContents() {
        LibreTexts.authenticatedFetch(window.location.href, 'contents?mode=edit').then(async (data) => console.log(await data.text()))
    }
    
    /**
     * Locates the parent page that is the coverpage, if it exists
     * @param url - page to look up the coverpage for
     * @returns {Promise<string>} - path to the coverpage
     */
    async function getCoverpage(url = window.location.href) {
        if (typeof getCoverpage.coverpage === 'undefined') {
            const urlArray = url.replace("?action=edit", "").split("/");
            for (let i = urlArray.length; i > 3; i--) {
                let path = urlArray.slice(3, i).join("/");
                if (!path)
                    break;
                let response = await LibreTexts.authenticatedFetch(path, 'tags?dream.out.format=json');
                let tags = await response.json();
                if (tags.tag) {
                    if (tags.tag.length) {
                        tags = tags.tag.map((tag) => tag["@value"]);
                    }
                    else {
                        tags = tags.tag["@value"];
                    }
                    if (tags.includes("coverpage:yes") || tags.includes("coverpage:toc")) {
                        getCoverpage.coverpage = path;
                        break;
                    }
                }
            }
        }
        return getCoverpage.coverpage;
    }
    
    /**
     * Attaches a FancyTree Table of Contents to an element
     * @param {string|null} coverpageUrl - root url for the table of contents hiearchy
     * @param {string} targetElement - HTML selector to append the fancytree to
     * @param {boolean} showTitle
     * @returns {Promise<void>}
     * @constructor
     */
    async function TOC(coverpageUrl, targetElement = ".elm-hierarchy.mt-hierarchy", showTitle = false) {
        let coverTitle;
        let content;
        const [subdomain] = LibreTexts.parseURL();
        if (!navigator.webdriver || !window.matchMedia('print').matches) {
            if (!coverpageUrl || typeof coverpageUrl !== 'string' || !coverpageUrl.startsWith('https://')) {
                coverpageUrl = await LibreTexts.getCoverpage(); //returns path
                if (coverpageUrl)
                    coverpageUrl = `https://${subdomain}.libretexts.org/${coverpageUrl}`;
            }
            if (coverpageUrl) {
                await makeTOC(coverpageUrl, true);
            }
            else {
                await makeTOC(`https://${subdomain}.libretexts.org/home`, true);
            }
        }
        
        async function makeTOC(url, isRoot, full) {
            const [subdomain, path] = LibreTexts.parseURL(url);
            //get coverpage title & subpages;
            let info = LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json', subdomain);
            
            
            let response = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json&limit=all', subdomain);
            response = await response.json();
            info = await info;
            info = await info.json();
            coverTitle = info.title;
            return await subpageCallback(response, isRoot);
            
            async function subpageCallback(info, isRoot) {
                let subpageArray = info["page.subpage"];
                const result = [];
                const promiseArray = [];
                if (!subpageArray)
                    return false;
                
                if (!subpageArray.length) {
                    subpageArray = [subpageArray];
                }
                for (let i = 0; i < subpageArray.length; i++) {
                    promiseArray[i] = subpage(subpageArray[i], i);
                }
                
                async function subpage(subpage, index) {
                    let url = subpage["uri.ui"];
                    let path = subpage.path["#text"];
                    let currentPage = url === window.location.href;
                    const hasChildren = subpage["@subpages"] === "true";
                    let defaultOpen = window.location.href.includes(url) && !currentPage;
                    let children = hasChildren ? undefined : [];
                    if (hasChildren && (full || defaultOpen)) { //recurse down
                        children = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
                        children = await children.json();
                        children = await
                            subpageCallback(children, false);
                    }
                    result[index] = {
                        title: currentPage ? subpage.title : `<a href="${url}">${subpage.title}</a>`,
                        url: url,
                        selected: currentPage,
                        expanded: defaultOpen,
                        children: children,
                        lazy: !full
                    };
                }
                
                await Promise.all(promiseArray);
                if (isRoot) {
                    content = result;
                    // console.log(content);
                    initializeFancyTree();
                }
                return result;
            }
            
            function initializeFancyTree() {
                const target = $(targetElement);
                if (content) {
                    const button = $(".elm-hierarchy-trigger.mt-hierarchy-trigger");
                    button.text("Contents");
                    button.attr('id', "TOCbutton");
                    button.attr('title', "Expand/Contract Table of Contents");
                    button.addClass("toc-button");
                    target.addClass("toc-hierarchy");
                    // target.removeClass("elm-hierarchy mt-hierarchy");
                    target.innerHTML = "";
                    if (showTitle)
                        target.prepend(`<a href="${url}"><b>${coverTitle}</b></a>`);
                    target.fancytree({
                        source: content,
                        lazyLoad: function (event, data) {
                            const dfd = new $.Deferred();
                            let node = data.node;
                            data.result = dfd.promise();
                            makeTOC(node.data.url).then((result) => dfd.resolve(result));
                        }
                    })
                }
            }
        }
    }
    
    /**
     * Promise-wrapped setTimeout()
     * @param {number} ms - number of milliseconds to wait
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

