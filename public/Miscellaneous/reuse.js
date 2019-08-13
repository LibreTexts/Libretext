const LibreTexts = {
	authenticatedFetch: authenticatedFetch,
	getSubpages: getSubpages,
	// getSubpagesAlternate: getSubpagesAlternate,
	// clarifySubdomain: clarifySubdomain,
	encodeHTML: encodeHTML,
	decodeHTML: decodeHTML,
	// authenticate: authenticate,
	// addLinks: addLinks,
	extractSubdomain: extractSubdomain,
	getCurrent: getCurrent,
};

async function authenticatedFetch(path, api, subdomain) {
	let isNumber;
	if (path && !api && !subdomain) { // default to current page
		api = path;
		let page = window.location.href;
		subdomain = extractSubdomain(page);
		path = page.replace(/^.*?libretexts.org\//, '');
	}
	
	if (!isNaN(path)) {
		path = parseInt(path);
		isNumber = true;
	}
	if (path === 'home') {
		isNumber = true;
	}
	if (typeof authenticatedFetch.keys === 'undefined') {
		let keys = await fetch('https://keys.libretexts.org/authenBrowser.json');
		authenticatedFetch.keys = await keys.json();
	}
	let current = window.location.origin.split('/')[2].split('.')[0];
	let headers = {};
	subdomain = subdomain || current;
	let token = authenticatedFetch.keys[subdomain];
	headers['x-deki-token'] = token;
	if (current === subdomain)
		headers['X-Requested-With'] = 'XMLHttpRequest';
	
	return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`,
		{headers: headers});
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

function extractSubdomain(url) {
	let origin = url.split("/")[2].split(".");
	const subdomain = origin[0];
	return subdomain;
}

async function getCurrent() {
	let page = window.location.href;
	let subdomain = extractSubdomain(page);
	let path = page.replace(/^.*?libretexts.org\//, '');
	LibreTexts.authenticatedFetch(path, 'contents?mode=edit', subdomain).then(async (data) => console.log(await data.text()))
}