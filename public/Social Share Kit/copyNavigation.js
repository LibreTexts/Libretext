(function () {

	function fn() {
		let nav = document.getElementsByClassName("elm-article-pagination");
		if (nav.length) {
			nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
			let media = document.getElementsByClassName("elm-social-share")[0];
			media.parentElement.insertBefore(nav, media);
		}
		if (!window.location.hostname.startsWith('query')) {
			propagatorOption();
			downloadOption();
			remixerOption();
			//copyTranscludeOption();
			copyContentOption(); //Forker
			sandboxOption();
		}
		// setInterval(editorContentReuseLink, 500);
	}

	function copyTranscludeOption() {
		let tags = document.getElementById("pageTagsHolder");
		if (tags) {
			tags = tags.innerText;
			tags = tags.replace(/\\/g, "");
			tags = JSON.parse(tags);
			let copy = document.getElementsByClassName("mt-user-menu-copy-page");
			if (copy.length && !tags.includes("transcluded:yes")) {
				let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
				copy = original.cloneNode(true);
				let copyTarget = copy.getElementsByTagName("a")[0];
				copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/Copy_Transclude?" + encodeURIComponent(window.location.href);
				copyTarget.innerText = "Copy-Transclude";
				copyTarget.classList.add("mt-icon-paste3");
				copyTarget.classList.remove("mt-icon-copy-page");
				copyTarget.setAttribute("target", "_blank");
				copyTarget.title = "Transcluding will make a copy that receives updates from the original content";
				original.parentNode.insertBefore(copy, original.nextSibling)
			}
		}
	}

	function propagatorOption() {
		const isAdmin = document.getElementById("adminHolder").innerText === "true";
		const isLibrarySpecific = window.location.href.includes('LibrarySpecific');
		if (isAdmin && !isLibrarySpecific) {
			let copy = document.getElementsByClassName("mt-user-menu-copy-page");
			if (copy.length) {
				let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
				copy = original.cloneNode(true);
				let copyTarget = copy.getElementsByTagName("a")[0];
				// copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/Propagator?" + encodeURIComponent(window.location.href);
				copyTarget.innerText = "Propagate";
				copyTarget.removeAttribute('href');
				copyTarget.classList.add("mt-icon-cycle");
				copyTarget.classList.remove("mt-icon-copy-page");
				// copyTarget.setAttribute("target", "_blank");
				copyTarget.onclick = askPropagator;
				copyTarget.style.cursor = 'pointer';
				copyTarget.title = "Propagate this page to other libraries";
				original.parentNode.insertBefore(copy, original.nextSibling);
			}
		}
	}

	async function askPropagator() {
		if (confirm(`Propagate ${window.location.href} to the other libraries?`)) {
			let url = window.location.href;
			const subdomain = url.split("/")[2].split(".")[0];
			//Disabled for careered
			let otherArray = ["bio", "biz", "chem", "eng", "espanol", "geo", "human", "math", "med", "phys", "socialsci", "stats", "workforce"];
			if (otherArray.includes(subdomain)) {
				let index = otherArray.indexOf(subdomain);
				if (index > -1) {
					otherArray.splice(index, 1);
					let response = await fetch(`https://api.libretexts.org/propagator/receive`, {
						method: "PUT",
						body: JSON.stringify({
							username: document.getElementById("usernameHolder").innerText,
							url: url,
						})
					});
					response = await response.json();
					alert('Propagation successful');
				}
			}
		}
	}

	function remixerOption() {
		let targetName = "mt-new-page";
		let copy = document.getElementsByClassName(targetName);
		if (!copy.length) {
			targetName = 'mt-site-tools';
			copy = document.getElementsByClassName(targetName);
		}
		if (!copy.length) {
			targetName = 'mt-user-menu-user';
			copy = document.getElementsByClassName(targetName);
		}
		if (copy.length) {
			let original = document.getElementsByClassName(targetName)[0];
			copy = original.cloneNode(true);
			copy.classList.remove("mt-new-page");
			copy.classList.remove("mt-site-tools");
			copy.classList.remove("mt-user-menu-user");
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Under_Construction/Development_Details/OER_Remixer";
			copyTarget.addEventListener('click', () => {
				localStorage.setItem('RemixerLastText', JSON.stringify({
					title: document.getElementById('titleHolder').innerText,
					url: window.location.href
				}));
			})
			copyTarget.innerText = "Remixer";
			if (Array.from(copyTarget.classList).includes('mt-icon-quick-sign-in'))
				copyTarget.id = "RemixerIcon";

			copyTarget.classList.add("mt-icon-tree");
			copyTarget.classList.remove("mt-icon-new-page");
			copyTarget.classList.remove("mt-icon-site-tools");
			copyTarget.classList.remove("mt-icon-site-tools");
			copyTarget.classList.remove("mt-icon-quick-sign-in");
			copyTarget.classList.remove("mt-toggle-right");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Remix a new LibreText";
			let target;
			switch (targetName) {
				case 'mt-site-tools':
					target = original;
					break;
				case 'mt-new-page':
					target = original.nextSibling;
					break;
				case 'mt-user-menu-user':
					target = original.previousSibling.previousSibling;
					break;
			}
			original.parentNode.insertBefore(copy, target)
		}
		if (window.location.href.endsWith('OER_Remixer')) {
			const groups = document.getElementById("groupHolder").innerText;
			const isAdmin = document.getElementById("adminHolder").innerText === 'true';
			if (!isAdmin) {
				$('.mt-edit-page, .mt-new-page, .mt-page-options').remove();
			}
		}
	}

	function downloadOption() {
		let targetName = "mt-new-page";
		let copy = document.getElementsByClassName(targetName);
		if (!copy.length) {
			targetName = 'mt-site-tools';
			copy = document.getElementsByClassName(targetName);
		}
		if (!copy.length) {
			targetName = 'mt-user-menu-user';
			copy = document.getElementsByClassName(targetName);
		}
		if (copy.length) {
			let original = document.getElementsByClassName(targetName)[0];
			copy = original.cloneNode(true);
			copy.classList.remove("mt-new-page");
			copy.classList.remove("mt-site-tools");
			copy.classList.remove("mt-user-menu-user");
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Courses/Remixer_University/Download_Center";
			copyTarget.innerText = "Downloads";
			if (Array.from(copyTarget.classList).includes('mt-icon-quick-sign-in'))
				copyTarget.id = "DownloadIcon";

			copyTarget.classList.add("mt-icon-download");
			copyTarget.classList.remove("mt-icon-new-page");
			copyTarget.classList.remove("mt-icon-site-tools");
			copyTarget.classList.remove("mt-icon-site-tools");
			copyTarget.classList.remove("mt-icon-quick-sign-in");
			copyTarget.classList.remove("mt-toggle-right");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Go to the Download Center";
			let target;
			switch (targetName) {
				case 'mt-site-tools':
					target = original;
					break;
				case 'mt-new-page':
					target = original.nextSibling;
					break;
				case 'mt-user-menu-user':
					target = original.previousSibling.previousSibling;
					break;
			}
			original.parentNode.insertBefore(copy, target)
		}
	}

	async function getTags(pageID, extraArray) {
		let tags = await LibreTexts.authenticatedFetch(pageID, 'tags?dream.out.format=json');
		tags = await tags.json();
		if (tags["@count"] !== "0") {
			if (tags.tag) {
				if (tags.tag.length) {
					tags = tags.tag.map((tag) => tag["@value"]);
				} else {
					tags = [tags.tag["@value"]];
				}
			}
			if (extraArray && extraArray.length) {
				for (let i = 0; i < extraArray.length; i++) {
					if (!tags.includes(extraArray[i]))
						tags.push(extraArray[i]);
				}
			}
			tags.splice(tags.indexOf("transcluded:yes"), 1);
			tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
			return "<tags>" + tags + "</tags>";
		} else {
			return null;
		}
	}

	async function copyContent() {
		if (confirm("Fork this page?\nThis will transform all content-reuse pages into editable content.\n You can use the revision history to undo this action.")) {
			let [, path] = LibreTexts.parseURL();
			if (path.startsWith('Sandboxes')) {
				let response = await LibreTexts.sendAPI('fork');
				response = await response.text();
				if (response.includes('Successfully forked')) {

					alert(response + '.\n The page will now reload.');
					location.reload();
				} else alert(response);
				return;
			}

			let pageID = document.getElementById("pageNumberHolder").children[0].children[1].innerText;
			let current = window.location.origin.split('/')[2].split('.')[0];
			let response = await LibreTexts.authenticatedFetch(pageID, `contents?mode=raw`);
			let sourceTags = [];
			if (response.ok) {
				let contentReuse = await response.text();
				if (contentReuse) {
					contentReuse = decodeHTML(contentReuse);
					contentReuse = contentReuse.match(/(<body>)([\s\S]*?)(<\/body>)/)[2];

					//Cross-library Forker
					let result = contentReuse;
					let success;
					let subdomain;
					let matches = result.match(/(<p class="mt-script-comment">Cross Library Transclusion<\/p>\n\n<pre class="script">\ntemplate\('CrossTransclude\/Web',)[\S\s]*?(\);<\/pre>)/g);
					if (matches && matches.length) {
						do {
							let path = JSON.parse(matches[0].match(/{.*?}/)[0].replace(/'/g, '"'));

							//Get cross content
							let content = await LibreTexts.authenticatedFetch(path.PageID, 'contents?mode=raw', path.Library);
							subdomain = path.Library;
							content = await content.text();
							content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
							content = decodeHTML(content);


							response = await LibreTexts.authenticatedFetch(path.PageID, 'files?dream.out.format=json', path.Library);
							if (response.ok) {
								let files = await response.json();
								if (files["@count"] !== "0") {
									alert('Copying files over');
									if (files.file) {
										if (!files.file.length) {
											files = [files.file];
										} else {
											files = files.file;
										}
									}
								}
								let promiseArray = [];
								for (let i = 0; i < files.length; i++) {
									let file = files[i];
									if (file['@res-is-deleted'] === 'false')
										promiseArray.push(processFile(file, {
											path: path.PageID,
											data: {subdomain: path.Library}
										}, window.location.pathname.slice(1), file['@id']));
								}
								promiseArray = await Promise.all(promiseArray);
								for (let i = 0; i < promiseArray.length; i++) {
									if (promiseArray[i]) {
										content = content.replace(promiseArray[i].original, promiseArray[i].final);
										content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
									}
								}
							}
							sourceTags.push(`source-${subdomain}-${path.PageID}`);

							content = `<div class="comment"><div class="mt-comment-content"><p>Forker source start-${subdomain}-${path.PageID}</p></div></div>${content}<div class="comment"><div class="mt-comment-content"><p>Forker source end-${subdomain}-${path.PageID}</p></div></div>`;

							result = result.replace(matches[0], content);
							matches = result.match(/(<p class="mt-script-comment">Cross Library Transclusion<\/p>\n\n<pre class="script">\ntemplate\('CrossTransclude\/Web',)[\S\s]*?(\);<\/pre>)/g);

						} while (matches && matches.length);
						success = true;
					}
					contentReuse = result;

					[subdomain] = await LibreTexts.parseURL();
					//Local Forker
					matches = contentReuse.match(/(<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(&quot;\)\s*?<\/pre>)/g) || contentReuse.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);
					if (matches && matches.length) {
						do {
							// WAITING FOR ECMA 2018      let path = matches[0].match(/(?<=data-page=")[^"]+/)[0];
							let path = matches[0].match(/(wiki.page\(&quot;)[\S\s]*?(&quot;\)\s*?<\/pre>)/) || matches[0].match(/(data-page=")[^"]+/);
							//End compliance code
							path = path[0]
								.replace('wiki.page(&quot;', '')
								.replace(/&quot;\)\s*?<\/pre>/, '')
								.replace('data-page="', '');

							let content = await fetch('https://api.libretexts.org/endpoint/contents', {
								method: 'PUT',
								body: JSON.stringify({
									path: path,
									api: 'contents?mode=raw',
									subdomain: subdomain,
								}),
							})
							let info = await LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json', subdomain);
							content = await content.text();
							info = await info.json();
							content = decodeHTML(content);

							// WAITING FOR ECMA 2018      content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
							content = content.match(/(<body>)([\s\S]*?)(<\/body>)/)[2];
							//End compliance code

							if (subdomain) {
								response = await LibreTexts.authenticatedFetch(path, 'files?dream.out.format=json', subdomain);
								alert('Copying files over. This may take a while...');
								if (response.ok) {
									let files = await response.json();
									if (files["@count"] !== "0") {
										if (files.file) {
											if (!files.file.length) {
												files = [files.file];
											} else {
												files = files.file;
											}
										}
									}
									let promiseArray = [];
									for (let i = 0; i < files.length; i++) {
										let file = files[i];
										if (file['@res-is-deleted'] === 'false')
											promiseArray.push(processFile(file, {
												path: path,
												data: {subdomain: subdomain}
											}, window.location.pathname.slice(1), file['@id']));
									}
									promiseArray = await Promise.all(promiseArray);
									for (let i = 0; i < promiseArray.length; i++) {
										if (promiseArray[i]) {
											content = content.replace(promiseArray[i].original, promiseArray[i].final);
											content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
										}
									}
								}
							}

							subdomain = subdomain || current;
							sourceTags.push(`source-${subdomain}-${info['@id']}`);

							content = `<div class="comment"><div class="mt-comment-content"><p>Forker source start-${subdomain}-${info['@id']}</p></div></div>${content}<div class="comment"><div class="mt-comment-content"><p>Forker source end-${subdomain}-${info['@id']}</p></div></div>`;

							result = result.replace(matches[0], content);

							matches = result.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);
						} while (matches && matches.length);
						success = true;
					}
					if (success) {
						await LibreTexts.authenticatedFetch(pageID, `contents?edittime=now`, subdomain, {
							method: "POST",
							body: result,
						});

						let tags = await getTags(pageID, sourceTags);
						await LibreTexts.authenticatedFetch(pageID, `tags`, subdomain, {
							method: "PUT",
							body: tags,
							headers: {"Content-Type": "text/xml; charset=utf-8"}
						});
						location.reload();
					} else {
						alert("No content-reuse sections detected!");
					}
				}
			}
		}
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function copyContentOption() {
		let tags = document.getElementById("pageTagsHolder");
		const isAdmin = document.getElementById("adminHolder").innerText === 'true';
		const isPro = document.getElementById("proHolder").innerText === 'true';
		// const groups = document.getElementById("groupHolder").innerText.toLowerCase();

		let $target = $("span.title.mt-title-edit");
		let [, path] = LibreTexts.parseURL();
		if (tags && isPro) {
			let time = 0;
			while (!$target.length) {
				if (time > 30) //timeout
					return null;
				await sleep(500);
				time += 0.5;
				$target = $("span.title.mt-title-edit");
			}

			tags = tags.innerText;
			tags = tags.replace(/\\/g, "");
			tags = JSON.parse(tags);

			//Options menu
			let copy = document.getElementsByClassName("mt-user-menu-copy-page");
			if (copy.length) {
				let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
				copy = original.cloneNode(true);
				let copyTarget = copy.getElementsByTagName("a")[0];
				copyTarget.onclick = copyContent;
				copyTarget.innerText = "Forker";
				copyTarget.classList.add("mt-icon-flow-branch");
				copyTarget.classList.remove("mt-icon-copy-page");
				copyTarget.title = "Fork this transcluded page";
				original.parentNode.insertBefore(copy, original.nextSibling)
			}
			if (tags.includes("transcluded:yes")) {
				//Next to title
				let icon = document.createElement("a");
				icon.classList.add("mt-icon-flow-branch");
				icon.classList.add("printHide");
				icon.onclick = copyContent;
				$target.after(icon);

			}
		}
	}

	function sandboxOption() {
		let original = document.getElementsByClassName("mt-user-menu-my-contributions");
		if (original.length) {
			original = original[0];
			let copy = original.cloneNode(true);
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = '#';
			copyTarget.onclick = goToSandbox;
			copyTarget.innerText = "Your Sandbox";
			copyTarget.classList.add("mt-icon-select-all");
			copyTarget.classList.remove("mt-icon-my-contributions");
			copyTarget.title = "Go to your personal Sandbox";
			original.parentNode.insertBefore(copy, original);
		}

		async function goToSandbox() {
			// let username = document.getElementById('usernameHolder').innerText;

			await LibreTexts.sendAPI('createSandbox');
			document.location.replace(`/Sandboxes`);
		}
	}

	async function processFile(file, child, path, id) {
		//only files with extensions
		let filename = file['filename'];

		if (file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail')) {
			let hasThumbnail = await LibreTexts.authenticatedFetch(null, "files/=mindtouch.page%2523thumbnail");
			if (hasThumbnail.ok)
				return false;
			else
				filename = `=mindtouch.page%23thumbnail`;
		}
		let image = await LibreTexts.authenticatedFetch(child.path, `files/${filename}`, child.data.subdomain);

		image = await image.blob();
		let response = await LibreTexts.authenticatedFetch(path, `files/${filename}?dream.out.format=json`, child.data.subdomain, {
			method: "PUT",
			body: image,
		});
		response = await response.json();
		let original = file.contents['@href'].replace(`https://${child.data.subdomain}.libretexts.org`, '');
		return {
			original: original,
			oldID: id,
			newID: response['@id'],
			final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`
		};
	}

	document.addEventListener('DOMContentLoaded', fn);
	document.addEventListener('DOMContentLoaded', () => {
		if (window !== window.top && window.location.href.includes("contentOnly")) {
			document.getElementsByClassName("elm-header")[0].style.display = "none";
			document.getElementById("mt-summary").style.setProperty("display", "none", "important");
		}
	});
})();


function decodeHTML(content) {
	let ret = content.replace(/&gt;/g, '>');
	ret = ret.replace(/&lt;/g, '<');
	ret = ret.replace(/&quot;/g, '"');
	ret = ret.replace(/&apos;/g, "'");
	ret = ret.replace(/&amp;/g, '&');
	ret = ret.replace(/&mdash;/g, '—');
	ret = ret.replace(/&ndash;/g, '–');
	return ret;
}