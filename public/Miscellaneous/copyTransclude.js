display();

function display() {
	const target = document.createElement("div");
	target.innerHTML = '<div>Source Root URL: <input id="copySource" oninput="reset()"/></div><div>Destination Root URL: <input id="copyDestination" oninput="verify()"/></div><div id="copyOutput"></div><div id="copyResults"></div><div id="copyErrors"></div>';
	target.id = "copyTranscludeContainer";
	document.currentScript.parentNode.insertBefore(target, document.currentScript);
}

function reset() {
	document.getElementById("copyOutput").innerHTML = "";
	window["copyTree"] = null;
}

async function verify() {
	const sourceURL = document.getElementById("copySource").value;
	const destURL = document.getElementById("copyDestination").value;
	const sourceArray = sourceURL.split("/");
	const destArray = destURL.split("/");

	// Valid URL check
	const sourceValid = checkURL(sourceURL);

	const destValid = checkURL(destURL);
	if (sourceValid && destValid) {

		//Cross Origin Check
		const crossOrigin = sourceArray.slice(0, 3).join("/") !== destArray.slice(0, 3).join("/");
		window['copyCrossOrigin'] = crossOrigin;

		//Check if coverpage
		let origin = sourceArray.slice(0, 3).join("/");
		let path = sourceArray.slice(3, sourceArray.length).join("/");
		const isCover = isCoverpage(origin, path);

		const tree = getTree(origin, path);

		let coverTitle = fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/info?dream.out.format=json");

		document.getElementById("copyOutput").innerHTML = `<div>Confirmed LibreText coverpage: ${await isCover}</div>
<div>Cross Library: ${crossOrigin}</div>
<div id="copyTreeHolder"></div>
<div>Pages under the Destination Root URL that already exist <i>will not be overwritten</i> for safety reasons.</div>
<button id="copyVerify" onclick="copy()">Copy to Destination Root</button>`;

		await initializeFancyTree(origin, path, await tree, await coverTitle);
	}
	else {
		const bothInvalid = !sourceValid && !destValid;
		let endText = "";
		if (bothInvalid)
			endText = "both URLs";
		else if (!sourceValid)
			endText = "source URL";
		else if (!destValid)
			endText = "destination URL";
		document.getElementById("copyOutput").innerText = "URLs are not valid LibreTexts URLs. Please check " + endText + ".";
	}


	/*Function Zone*/
	function checkURL(url) {
		if (url) {
			let urlArray = url.split("/");
			if (urlArray && urlArray.length >= 2) {
				return urlArray[2].includes("libretexts.org");
			}
		}
		return false;
	}

	async function isCoverpage(origin, path) {
		let tags = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags?dream.out.format=json");
		tags = await
			tags.json();
		if (tags.tag) {
			if (tags.tag.length) {
				tags = tags.tag.map((tag) => tag["@value"]);
			}
			else {
				tags = tags.tag["@value"];
			}
			return tags.includes("coverpage:yes")
		}
		return false;
	}

	async function getTree(origin, path) {
		let tree = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json");
		const relativePath = path;
		tree = await tree.json();
		return await subpageCallback(tree, true);

		async function subpageCallback(info, isRoot) {
			const subpageArray = info["page.subpage"];
			const result = [];
			const promiseArray = [];
			if (subpageArray && subpageArray.length) {
				for (let i = 0; i < subpageArray.length; i++) {
					promiseArray[i] = subpage(subpageArray[i], i);
				}

				async function subpage(subpage, index) {
					let url = subpage["uri.ui"];
					let path = subpage.path["#text"];
					const hasChildren = subpage["@subpages"] === "true";
					let children = [];
					if (hasChildren) { //recurse down
						children = await
							fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json");
						children = await children.json();
						children = await
							subpageCallback(children, false);
					}
					result[index] = {
						title: `<a href="${url}">${subpage.title}</a>`,
						url: url,
						relativePath: path.replace(relativePath, ""),
						path: path,
						selected: false,
						expanded: true,
						children: children
					};
				}

				await Promise.all(promiseArray);
			}
			return result;
		}
	}

	async function initializeFancyTree(origin, path, tree, coverTitle) {
		const target = $("#copyTreeHolder");
		if (tree) {
			target.innerHTML = "";
			const title = await coverTitle.json();
			target.prepend(`<a href="${origin + "/" + path}"><h6>${title.title}</h6></a>`);
			const source = [{
				title: `<a href="${origin + "/" + path}">${title.title}</a>`,
				url: origin + "/" + path,
				relativePath: "/",
				path: path,
				selected: false,
				expanded: true,
				children: tree
			}];
			window["copyTree"] = source;
			target.fancytree({
				source: source
			});
			console.log(source);
		}
	}
}


async function copy() {
	let destRoot = document.getElementById("copyDestination").value;
	destRoot = destRoot.replace(/\/$/, ""); //removes trailing slash if any
	const tree = window["copyTree"];
	const results = document.getElementById("copyResults");
	const errors = document.getElementById("copyErrors");
	results.innerText = "Processing";
	let counter = 0;
	let failedCounter = 0;
	let errorText = "";

	await doCopy(destRoot, tree);
	results.innerText = "Finished: " + counter + " pages completed" + (failedCounter ? "\nFailed: " + failedCounter : "");

	async function doCopy(destRoot, tree) {
		for (let i = 0; i < tree.length; i++) {
			const child = tree[i];
			if (!window["copyCrossOrigin"]) {
				const destArray = destRoot.split("/");
				let origin = destArray.slice(0, 3).join("/");
				let path = destArray.slice(3, destArray.length).join("/");

				const content = `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>`;

				let tags = fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/tags?dream.out.format=json");

				let response = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/contents?abort=exists", {
					method: "POST",
					body: content
				});
				if (response.status >= 400) {
					failedCounter++;
				}
				switch (response.status) {
					case 403:
						errorText += "403 Forbidden - User does not have permission to create" + child.relativePath + "\n";
						break;
					case 500:
						errorText += "500 Server Error " + child.relativePath + "\n";
						break;
					case 409:
						errorText += "409 Conflict - Page already exists " + child.relativePath + "\n";
						break;

				}

				//tags handling
				tags = await tags;
				tags = await tags.json();
				if (tags["@count"] !== "0") {
					if (tags.tag) {
						if (tags.tag.length) {
							tags = tags.tag.map((tag) => tag["@value"]);
						}
						else {
							tags = [tags.tag["@value"]];
						}
					}
					tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
					tags = "<tags>" + tags + "</tags>";

					response = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/tags", {
						method: "PUT",
						body: tags,
						headers: new Headers({"Content-Type": "text/xml; charset=utf-8"})
					});
				}

				counter++;
				results.innerText = "Processing: " + counter + " pages completed" + (failedCounter ? "\nFailed: " + failedCounter : "");
				errors.innerText = errorText;
				await doCopy(destRoot, child.children);

			}
		}
	}
}