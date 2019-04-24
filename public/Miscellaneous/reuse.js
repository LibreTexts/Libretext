async function authenticatedFetch(path, api, subdomain) {
	let isNumber;
	if (!isNaN(path)) {
		path = parseInt(path);
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