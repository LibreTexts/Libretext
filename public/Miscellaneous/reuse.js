const LibreTexts = LibreTextsReuse();

//Plugins to the Editor are registered onto this object for later activation
const LibreEditor = {
	registerAll: (config) => {
		if (LibreEditor.done)
			console.log('Already registered plugins');
		else {
			for (const key in LibreEditor) {
				if (LibreEditor.hasOwnProperty(key) && key !== 'registerAll') {
					const element = LibreEditor[key];
					if (typeof element === 'function')
						element(config);
				}
			}
			LibreEditor.done = true;
		}
	}
};

function LibreTextsReuse() {
	const libraries = {
		'Biology': 'bio',
		'Business': 'biz',
		'Chemistry': 'chem',
		'Engineering': 'eng',
		'Espanol': 'espanol',
		'Geology': 'geo',
		'Humanities': 'human',
		'Mathematics': 'math',
		'Medicine': 'med',
		'Physics': 'phys',
		'Social Sciences': 'socialsci',
		'Statistics': 'stats',
		'Workforce': 'workforce'
	};
	
	return {
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
	
	function extractSubdomain(url = window.location.href) {
		let origin = url.split("/")[2].split(".");
		const subdomain = origin[0];
		return subdomain;
	}
	
	function parseURL(url = window.location.href) {
		if (url && url.match(/https?:\/\/.*?\.libretexts\.org/)) {
			return [url.match(/(https?:\/\/)(.*?)(?=\.)/)[2], url.match(/(https?:\/\/.*?\/)(.*)/)[2]]
		}
		else {
			return [];
		}
	}
	
	function cleanPath(path) {
		path = decodeURIComponent(decodeURIComponent((path)));
		path = path.replace('?title=', '');
		path = path.replace(/[+!#$%^&*{}\\]/g, '');
		return path;
	}
	
	async function sendAPI(api, options = {}, method = 'PUT') {
		let [current, path] = LibreTexts.parseURL();
		let payload = {
			username: document.getElementById('usernameHolder').innerText,
			id: document.getElementById('userIDHolder').innerText,
			subdomain: current,
			token: (await getKeys())[current],
			path: path,
			seatedCheck: Number(document.getElementById('seatedCheck').innerText),
		};
		payload = {...payload, ...options};
		
		return await fetch(`https://api.libretexts.org/elevate/${api}`, {
			method: method,
			body: JSON.stringify(payload),
			headers: {'Content-Type': 'application/json'}
		})
	}
	
	async function authenticatedFetch(path, api = '', subdomain, options = {}) {
		let isNumber;
		let [current, currentPath] = parseURL();
		path = path || currentPath;
		path = String(path);
		let arbitraryPage = !api && !subdomain && path.startsWith('https://');
		if (arbitraryPage) {
			[subdomain] = parseURL(path);
		}
		else {
			if (path.startsWith('https://')) { //gets path from a url
				[, path] = parseURL(path);
			}
			if (!isNaN(path)) { //if using pageIDs
				path = parseInt(path);
				isNumber = true;
			}
			if (path === 'home') { //if at root page
				isNumber = true;
			}
		}
		let keys = await getKeys();
		if (api && !api.startsWith('?')) //allows for pages/{pageid} (GET) https://success.mindtouch.com/Integrations/API/API_calls/pages/pages%2F%2F%7Bpageid%7D_(GET)
			api = `/${api}`;
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
	
	async function getKeys() {
		if (typeof getKeys.keys === 'undefined') {
			let keys = await fetch('https://files.libretexts.org/authenBrowser.json');
			getKeys.keys = await keys.json();
		}
		return getKeys.keys;
	}
	
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
	
	async function getSubpages(rootURL, username) {
		let origin = rootURL.split("/")[2].split(".");
		const subdomain = origin[0];
		
		origin = rootURL.split("/").splice(0, 3).join('/');
		let path = rootURL.split('/').splice(3).join('/');
		
		let pages = await authenticatedFetch(path, 'subpages?limit=all&dream.out.format=json', username, subdomain);
		pages = await pages.json();
		
		let info = await authenticatedFetch(path, 'info?dream.out.format=json', username, subdomain);
		info = await info.json();
		return {
			title: info.title,
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
					children = await authenticatedFetch(id, 'subpages?limit=all&dream.out.format=json', username, subdomain);
					children = await children.json();
					children = await subpageCallback(children, false);
				}
				result[index] = {
					title: subpage.title,
					url: url,
					children: children,
					id: id,
					relativePath: url.replace(rootURL, '')
				};
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
	
	//fills in missing API data for a page
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
			let error = await response.json();
			// console.error(`Can't get ${page.url}`);
			page.subdomain = subdomain;
			page.path = path;
			page.modified = 'restricted';
			page.error = error;
		}
		return page;
	}
	
	async function getCurrentContents() {
		LibreTexts.authenticatedFetch(window.location.href, 'contents?mode=edit').then(async (data) => console.log(await data.text()))
	}
	
	async function getCoverpage(url = window.location.href) {
		if (typeof getCoverpage.coverpage === 'undefined') {
			const urlArray = url.replace("?action=edit", "").split("/");
			for (let i = urlArray.length; i > 3; i--) {
				let path = urlArray.slice(3, i).join("/");
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
	
}

