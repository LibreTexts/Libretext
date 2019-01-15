(function () {
	function fn() {
		let nav = document.getElementsByClassName("elm-article-pagination");
		if (nav.length) {
			nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
			let media = document.getElementsByClassName("elm-social-share")[0];
			media.parentElement.insertBefore(nav, media);
		}
		if (window !== window.top && window.location.href.includes("contentOnly")) {
			document.getElementsByClassName("elm-header")[0].style.display = "none";
			document.getElementById("mt-summary").style.setProperty("display", "none", "important");
		}
		propagatorOption();
		remixerOption();
		copyTranscludeOption();
		copyContentOption();
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
		if(isAdmin) {
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

	async function askPropagator(){
		if(confirm(`Propagate ${window.location.href} to the other libraries?`)){
			let url = window.location.href;
			const subdomain = url.split("/")[2].split(".")[0];
			//Disabled for careered
			let otherArray = ["bio", "biz","careered", "chem", "eng", "geo", "human", "math", "med", "phys", "socialsci", "stats"];
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
		let copy = document.getElementsByClassName("mt-new-page");
		if (copy.length) {
			let original = document.getElementsByClassName("mt-new-page")[0];
			copy = original.cloneNode(true);
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Development_Details/OER_Remixer";
			copyTarget.innerText = "Remixer";
			copyTarget.classList.add("mt-icon-tree");
			copyTarget.classList.remove("mt-icon-new-page");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Remix a new LibreText";
			original.parentNode.insertBefore(copy, original.nextSibling)
		}
	}

	async function getTags(pageID, extraArray) {
		let tags = await fetch(`/@api/deki/pages/${pageID}/tags?dream.out.format=json`);
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
			if (extraArray && extraArray.length) {
				tags = tags.concat(extraArray);
			}
			tags.splice(tags.indexOf("transcluded:yes"), 1);
			tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
			return "<tags>" + tags + "</tags>";
		}
		else {
			return null;
		}
	}

	async function copyContent() {
		if (confirm("Fork this page?\nThis will transform all content-reuse pages into editable content.\n You can use the revision history to undo this action.")) {
			let pageID = document.getElementById("pageNumberHolder").children[0].children[1].innerText;
			let response = await fetch(`/@api/deki/pages/${pageID}/contents?mode=raw`);
			if (response.ok) {
				let contentReuse = await response.text();
				if (contentReuse) {
					contentReuse = decodeHTML(contentReuse);
					contentReuse = contentReuse.match(/(<body>)([\s\S]*?)(<\/body>)/)[2];

					//TODO: Cross-library Forker


					let matches = contentReuse.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);


					if (matches && matches.length) {
						let result = contentReuse;
						do {
							// WAITING FOR ECMA 2018      let path = matches[0].match(/(?<=data-page=")[^"]+/)[0];
							let path = matches[0].match(/(data-page=")[^"]+/)[0].replace('data-page="','');
							//End compliance code

							console.log(path);
							let content = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/contents?mode=raw`);
							content = await content.text();
							content = decodeHTML(content);

							// WAITING FOR ECMA 2018      content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
							content = content.match(/(<body>)([\s\S]*?)(<\/body>)/)[2];
							//End compliance code

							result = result.replace(matches[0], content);

							matches = result.match(/(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g);
						} while (matches && matches.length);

						await fetch(`/@api/deki/pages/${pageID}/contents?edittime=now`, {
							method: "POST",
							body: result,
						});

						let tags = await getTags(pageID);
						await fetch(`/@api/deki/pages/${pageID}/tags`, {
							method: "PUT",
							body: tags,
							headers: {"Content-Type": "text/xml; charset=utf-8"}
						});
						location.reload();
					}
					else {
						alert("No content-reuse sections detected!");
					}
				}
			}
		}
	}

	function copyContentOption() {
		let tags = document.getElementById("pageTagsHolder");
		const isAdmin = document.getElementById("adminHolder").innerText === 'true';
		const isPro = document.getElementById("proHolder").innerText === 'true';
		const groups = document.getElementById("groupHolder").innerText.toLowerCase();
		let target = $("span.title.mt-title-edit");
		if (tags && (isAdmin || (isPro && groups.includes('contributor')))) {
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
				if (!tags.includes("article:topic-category") && !tags.includes("article:topic-guide")) {
					let icon = document.createElement("a");
					icon.classList.add("mt-icon-flow-branch");
					icon.classList.add("printHide");
					icon.onclick = copyContent;
					target.after(icon);
				}
			}
		}
	}

	document.addEventListener('DOMContentLoaded', fn)
})();


function decodeHTML(content) {
	let ret = content.replace(/&gt;/g, '>');
	ret = ret.replace(/&lt;/g, '<');
	ret = ret.replace(/&quot;/g, '"');
	ret = ret.replace(/&apos;/g, "'");
	ret = ret.replace(/&amp;/g, '&');
	return ret;
}