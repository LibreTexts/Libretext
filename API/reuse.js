const http = require('http');
const timestamp = require("console-timestamp");
const filenamify = require('filenamify');
const fs = require('fs-extra');
const md5 = require('md5');
const fetch = require("node-fetch");
const authen = require('./authen.json');
const authenBrowser = require('./authenBrowser.json');
const async = require('async');
const util = require('util');


let LibreTextsFunctions = {
	authenticatedFetch: authenticatedFetch,
	getSubpages: getSubpages,
	clarifySubdomain: clarifySubdomain,
	decodeHTML: decodeHTML,
	authenticate: authenticate,
	addLinks: addLinks,
	extractSubdomain: extractSubdomain,
};

async function authenticatedFetch(path, api, username, subdomain) {
	let isNumber;
	if (!isNaN(path)) {
		path = parseInt(path);
		isNumber = true;
	}
	if (path === 'home') {
		isNumber = true;
	}
	if (!username) {
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`);
	}
	if (subdomain) {
		const user = "=" + username;
		const crypto = require('crypto');
		const hmac = crypto.createHmac('sha256', authen[subdomain].secret);
		const epoch = Math.floor(Date.now() / 1000);
		hmac.update(`${authen[subdomain].key}${epoch}${user}`);
		const hash = hmac.digest('hex');
		let token = `${authen[subdomain].key}_${epoch}_${user}_${hash}`;
		
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/${isNumber ? '' : '='}${encodeURIComponent(encodeURIComponent(path))}/${api}`,
			{headers: {'x-deki-token': token}});
	}
	else
		console.error(`Invalid subdomain ${subdomain}`);
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

function clarifySubdomain(url) {
	url = decodeURIComponent(url);
	url = url.replace('https://español.libretexts.org', 'https://espanol.libretexts.org');
	return url;
}

function decodeHTML(content) {
	let ret = content.replace(/&gt;/g, '>');
	ret = ret.replace(/&lt;/g, '<');
	ret = ret.replace(/&quot;/g, '"');
	ret = ret.replace(/&apos;/g, "'");
	ret = ret.replace(/&amp;/g, '&');
	return ret;
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

module.exports = LibreTextsFunctions;