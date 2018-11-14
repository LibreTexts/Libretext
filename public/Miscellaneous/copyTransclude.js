class copyTransclude {
	static display() {
		const target = document.createElement("div");
		let originalURL = "";
		if (window.location.href.includes("Copy_Transclude?")) {
			originalURL = decodeURIComponent(window.location.href.split("Copy_Transclude?")[1]);
		}

		target.innerHTML = `<div>Source Root URL: <input id="copySource" oninput="copyTransclude.reset()" value="${originalURL}" placeholder="Paste source address here"/></div><div>Destination Root URL: <input id="copyDestination" oninput="copyTransclude.reset()" placeholder="Paste destination address here"/></div><button id="copyVerify" onclick="copyTransclude.verify()">Verify</button><div id="copyOutput"></div><div id="copyResults"></div><div id="copyErrors"></div>`;
		target.id = "copyTranscludeContainer";
		document.currentScript.parentNode.insertBefore(target, document.currentScript);
	}

	static reset() {
		document.getElementById("copyOutput").innerHTML = "";
		this.copyTree = null;
	}

	static getCredentials(subdomain, otherheaders) {
		let result = otherheaders || {};
		if (subdomain !== window.location.origin.split("/")[2].split(".")[0]) {
			result = Object.assign({'X-Deki-Token': this.credentials[subdomain]}, result);
		}
		return result;
	}

	static async verify() {
		this.sourceURL = document.getElementById("copySource").value.replace(/\/$/, "");
		this.destURL = document.getElementById("copyDestination").value.replace(/\/$/, "");
		const sourceArray = this.sourceURL.split("/");
		const destArray = this.destURL.split("/");

		if (!this.credentials) {
			let credentials = await fetch("https://awesomefiles.libretexts.org/Miscellaneous/credentials.json");
			this.credentials = await credentials.json();
		}
		const instance = this;

		// Valid URL check
		const sourceValid = checkURL(this.sourceURL);
		const destValid = checkURL(this.destURL);

		if (sourceValid && destValid) {
			//Cross Origin Check
			this.Sorigin = sourceArray.slice(0, 3).join("/");
			this.Dorigin = destArray.slice(0, 3).join("/");
			this.Ssubdomain = this.Sorigin.split("/")[2].split(".")[0];
			this.Dsubdomain = this.Dorigin.split("/")[2].split(".")[0];
			this.crossOrigin = this.Sorigin !== this.Dorigin;

			//Check if coverpage
			let path = sourceArray.slice(3, sourceArray.length).join("/");
			const isCover = isCoverpage(this.Sorigin, path);

			const tree = getTree(this.Sorigin, path);

			let coverTitle = fetch(this.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/info?dream.out.format=json", {
				headers: this.getCredentials(instance.Ssubdomain)
			});

			document.getElementById("copyOutput").innerHTML = `<div>Confirmed LibreText coverpage: ${await isCover}</div>
<div>Cross Library: ${this.crossOrigin}</div>
<div id="copyTreeHolder"></div>
<div>Pages under the Destination Root URL that already exist <i>will not be overwritten</i> for safety reasons.</div>
<button id="copyExecute" onclick="copyTransclude.copy()">Copy to Destination Root</button>`;

			await this.initializeFancyTree(this.Sorigin, path, await tree, await coverTitle);
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

			let tags = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags?dream.out.format=json", {
				headers: instance.getCredentials(instance.Ssubdomain)
			});
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
			let tree = await fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json", {
				headers: instance.getCredentials(instance.Ssubdomain)
			});
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
					await Promise.all(promiseArray);
				}
				return result;

				async function subpage(subpage, index) {
					let url = subpage["uri.ui"];
					let path = subpage.path["#text"];
					const hasChildren = subpage["@subpages"] === "true";
					let children = [];
					if (hasChildren) { //recurse down
						children = await
							fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json", {
								headers: instance.getCredentials(instance.Ssubdomain)
							});
						children = await children.json();
						children = await
							subpageCallback(children, false);
					}
					result[index] = {
						title: `<a href="${url}">${subpage.title}</a>`,
						url: url,
						relativePath: path.replace(relativePath, "").replace(decodeURIComponent(decodeURIComponent(relativePath)), ""),
						path: path,
						selected: false,
						expanded: true,
						children: children
					};
				}
			}
		}
	}

	static async initializeFancyTree(origin, path, tree, coverTitle) {
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
			this.copyTree = source;
			target.fancytree({
				source: source
			});
			console.log(source);
		}
	}


	static async copy() {
		let destRoot = this.destURL;
		destRoot = destRoot.replace(/\/$/, ""); //removes trailing slash if any
		const tree = this.copyTree;
		const results = document.getElementById("copyResults");
		const errors = document.getElementById("copyErrors");
		results.innerText = "Processing";
		let counter = 0;
		let failedCounter = 0;
		let errorText = "";


		const instance = this;
		await doCopy(destRoot, tree);
		results.innerText = "Finished: " + counter + " pages completed" + (failedCounter ? "\nFailed: " + failedCounter : "");

		function decodeHTML(content) {
			let ret = content.replace(/&gt;/g, '>');
			ret = ret.replace(/&lt;/g, '<');
			ret = ret.replace(/&quot;/g, '"');
			ret = ret.replace(/&apos;/g, "'");
			ret = ret.replace(/&amp;/g, '&');
			return ret;
		}

		async function doCopy(destRoot, tree) {

			for (let i = 0; i < tree.length; i++) {
				const child = tree[i];
				const destArray = destRoot.split("/");
				let path = destArray.slice(3, destArray.length).join("/");

				//get info
				let info = fetch(instance.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/info?dream.out.format=json", {
					headers: instance.getCredentials(instance.Ssubdomain)
				});

				//get Tags
				let copyContent = false;
				let tags = await fetch(instance.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/tags?dream.out.format=json", {
					headers: instance.getCredentials(instance.Ssubdomain)
				});
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
					copyContent = tags.includes("article:topic-category") || tags.includes("article:topic-guide");
					tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
					tags = "<tags>" + tags + "</tags>";
				}

				//copy Content
				let content;
				info = await info;
				info = await info.json();

				if (copyContent) {
					content = await fetch(instance.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/contents?mode=raw", {
						headers: instance.getCredentials(instance.Ssubdomain)
					});
					content = await content.text();
					content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
					content = decodeHTML(content);
				}
				else {
					content = !instance.crossOrigin ? `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>` :
						`<p class="mt-script-comment">Cross Library Transclusion</p>

<pre class="script">
templateclassNamessTransclude/Web',{'Library':'${instance.Ssubdomain}','PageID':${info["@id"]});
template('TranscludeAutoNumTitle');</pre>`;
				}

				let response = await fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/contents?abort=exists", {
					method: "POST",
					body: content,
					headers: instance.getCredentials(instance.Dsubdomain)
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
					default:
						errorText += "Error " + response.status + " " + child.relativePath + "\n";
						break;
					case 200:
						//copy Tags
						fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/tags", {
							method: "PUT",
							body: tags,
							headers: instance.getCredentials(instance.Dsubdomain, {"Content-Type": "text/xml; charset=utf-8"})
						}).then();

						fetch(instance.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/properties?dream.out.format=json", {
							headers: instance.getCredentials(instance.Ssubdomain)
						}).then(async (response) => {
							let content = await response.json();
							if (content["@count"] !== "0") {
								if (content.property) {
									if (content.property.length) {
										content = content.property.map((property) => {
											return {name: property["@name"], value: property["contents"]["#text"]}
										});
									}
									else {
										content = [{
											name: content.property["@name"],
											value: content.property["contents"]["#text"]
										}];
									}
								}
							}
							for (let i = 0; i < content.length; i++) {
								switch (content[i].name) {
									//subpageListing check
									case "mindtouch.idf#subpageListing":
										if (tags.includes("article:topic-category")) {
											fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/properties", {
												method: "POST",
												body: content[i].value,
												headers: instance.getCredentials(instance.Dsubdomain, {"Slug": content[i].name})
											}).then();
										}
										break;
									//subpageListing check
									case "mindtouch.idf#guideDisplay":
										if (tags.includes("article:topic-guide")) {
											fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/properties", {
												method: "POST",
												body: content[i].value,
												headers: instance.getCredentials(instance.Dsubdomain, {"Slug": content[i].name})
											}).then();
										}
										break;
									//pagecontent
									case "mindtouch.page#overview":
									case "mindtouch#idf.guideTabs":
									case "mindtouch.page#welcomeHidden":
									case "mindtouch.idf#product-image": //NEED FILE TRANSFER
										fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/properties", {
											method: "POST",
											body: content[i].value,
											headers: instance.getCredentials(instance.Dsubdomain, {"Slug": content[i].name})
										}).then();
										break;
								}
							}
						});

						// Title cleanup
						const endPath = (path + child.relativePath).split("/").pop();
						if (info.title !== endPath) {
							fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/move?title=" + info.title + "&name=" + path + child.relativePath, {
								method: "POST",
								headers: instance.getCredentials(instance.Dsubdomain)
							}).then();
						}

					//Thumbnail
									fetch(instance.Sorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/files/mindtouch.page%2523thumbnail", {
										headers: instance.getCredentials(instance.Ssubdomain)
									}).then(async (response) => {
										if (response.ok) {
											let image = await response.blob();
											fetch(instance.Dorigin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/files/mindtouch.page%2523thumbnail", {
												method: "PUT",
												body: image,
												headers: instance.getCredentials(instance.Dsubdomain)
											}).then();
										}
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

copyTransclude.display();
