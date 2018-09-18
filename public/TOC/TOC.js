TOC();

function TOC() {
	const urlArray = window.location.href.split("/");
	let coverpage;
	let coverTitle;
	let content;
	if (!window.matchMedia('print').matches) {
		for (let i = 3; i < urlArray.length; i++) {
			let path = urlArray.slice(3, i + 1).join("/");
			let getURL = window.location.origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags?dream.out.format=json";
			$.get(getURL).done((tags) => {
				if (tags.tag.length) {
					tags = tags.tag.map((tag) => tag["@value"]);
					if (tags.includes("coverpage:yes") && !coverpage) {
						coverpage = window.location.origin + path;
						makeTOC(window.location.origin, path, true);
					}
				}
				else if (tags.tag) {
					tags = tags.tag["@value"];
					if (tags.includes("coverpage:yes") && !coverpage) {
						coverpage = window.location.origin + path;
						makeTOC(window.location.origin, path, true);
					}
				}
			});
		}
	}

	function makeTOC(origin, path, full) {
		//get coverpage title & subpages;
		$.get(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/info?dream.out.format=json").done((info) =>
			coverTitle = info.title
		);
		$.get(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json").done((info) =>
			subpageCallback(info, true)
		);

		async function subpageCallback(info, isRoot) {
			const subpageArray = info["page.subpage"];
			const result = [];
			const promiseArray = [];
			for (let i = 0; i < subpageArray.length; i++) {
				promiseArray[i] = subpage(subpageArray[i], i);
			}

			async function subpage(subpage, index) {
				let url = subpage["uri.ui"];
				let path = subpage.path["#text"];
				let currentPage = url === window.location.href;
				const hasChildren = subpage["@subpages"] === "true";
				let defaultOpen = window.location.href.includes(url) && !currentPage;
				let children = hasChildren ? [] : undefined;
				if (hasChildren && (full || defaultOpen)) { //recurse down
					children = await
						fetch(origin + "/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/subpages?dream.out.format=json");
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
				console.log(content);
				initializeFancyTree();
			}
			else
				return result;
		}
	}

	function initializeFancyTree() {
		const target = $(".elm-hierarchy.mt-hierarchy");
		if (content) {
			target.addClass("toc-hierarchy");
			// target.removeClass("elm-hierarchy mt-hierarchy");
			target.innerHTML = "";
			target.fancytree({
				source: content
			})
		}
	}
}