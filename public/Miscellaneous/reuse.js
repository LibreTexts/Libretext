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
		getSubpages: getSubpages,
		getKeys: getKeys,
		// getSubpagesAlternate: getSubpagesAlternate,
		// clarifySubdomain: clarifySubdomain,
		encodeHTML: encodeHTML,
		decodeHTML: decodeHTML,
		// authenticate: authenticate,
		// addLinks: addLinks,
		extractSubdomain: extractSubdomain,
		parseURL: parseURL,
		getCurrent: getCurrent,
		getAPI: getAPI,
		libraries: libraries,
	};
	
	//Function Zone
	async function authenticatedFetch(path, api = '', subdomain, options = {}) {
		let isNumber;
		let [current, currentPath] = parseURL();
		path = path || currentPath;
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
			let keys = await fetch('https://keys.libretexts.org/authenBrowser.json');
			getKeys.keys = await keys.json();
		}
		return getKeys.keys;
	}
	
	async function getSubpages(rootURL, username) {
		let origin = rootURL.split("/")[2].split(".");
		const subdomain = origin[0];
		
		origin = rootURL.split("/").splice(0, 3).join('/');
		let path = rootURL.split('/').splice(3).join('/');
		
		let pages = await authenticatedFetch(path, 'subpages?dream.out.format=json', username, subdomain);
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
				let path = subpage.path["#text"];
				const hasChildren = subpage["@subpages"] === "true";
				let children = hasChildren ? undefined : [];
				if (hasChildren) { //recurse down
					children = await authenticatedFetch(path, 'subpages?dream.out.format=json', username, subdomain);
					children = await children.json();
					children = await subpageCallback(children, false);
				}
				result[index] = {
					title: subpage.title,
					url: url,
					children: children,
					id: subpage['@id'],
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
		if (url.match(/https?:\/\/.*?\.libretexts\.org/)) {
			return [url.match(/(?<=https?:\/\/).*?(?=\.)/)[0], url.match(/(?<=https?:\/\/.*?\/).*/)[0]]
		}
		else {
			return [];
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
		// page.response = response;
		if (response.ok) {
			response = await response.json();
			let {properties, tags, files} = response;
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
			if (files.file) {
				files = files.file.length ? files.file : [files.file];
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
	
	async function getCurrent() {
		let page = window.location.href;
		let subdomain = extractSubdomain(page);
		let path = page.replace(/^.*?libretexts.org\//, '');
		LibreTexts.authenticatedFetch(path, 'contents?mode=edit', subdomain).then(async (data) => console.log(await data.text()))
	}
	
}

