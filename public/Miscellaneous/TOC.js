window.addEventListener('load', TOC);

async function TOC() {
	let coverpage;
	let coverTitle;
	let content;
	if (!navigator.webdriver || !window.matchMedia('print').matches) {
		coverpage = await LibreTexts.getCoverpage();
		if (coverpage) {
			await makeTOC(coverpage, true);
		}
	}
	
	async function makeTOC(path, isRoot, full) {
		const origin = window.location.origin;
		path = path.replace(origin + "/", "");
		//get coverpage title & subpages;
		let info = LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json');
		
		
		let response = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json');
		response = await response.json();
		info = await info;
		info = await info.json();
		coverTitle = info.title;
		return await subpageCallback(response, isRoot);
		
		async function subpageCallback(info, isRoot) {
			let subpageArray = info["page.subpage"];
			const result = [];
			const promiseArray = [];
			if (!subpageArray)
				return false;
			
			if (!subpageArray.length) {
				subpageArray = [subpageArray];
			}
			for (let i = 0; i < subpageArray.length; i++) {
				promiseArray[i] = subpage(subpageArray[i], i);
			}
			
			async function subpage(subpage, index) {
				let url = subpage["uri.ui"];
				let path = subpage.path["#text"];
				let currentPage = url === window.location.href;
				const hasChildren = subpage["@subpages"] === "true";
				let defaultOpen = window.location.href.includes(url) && !currentPage;
				let children = hasChildren ? undefined : [];
				if (hasChildren && (full || defaultOpen)) { //recurse down
					children = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json');
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
				// console.log(content);
				initializeFancyTree();
			}
			return result;
		}
		
		function initializeFancyTree() {
			const target = $(".elm-hierarchy.mt-hierarchy");
			if (content) {
				const button = $(".elm-hierarchy-trigger.mt-hierarchy-trigger");
				button.text("Contents");
				button.attr('id', "TOCbutton");
				button.attr('title', "Expand/Contract Table of Contents");
				button.addClass("toc-button");
				target.addClass("toc-hierarchy");
				// target.removeClass("elm-hierarchy mt-hierarchy");
				target.innerHTML = "";
				target.prepend(`<a href="${origin + "/" + path}"><h6>${coverTitle}</h6></a>`);
				target.fancytree({
					source: content,
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						makeTOC(node.data.url).then((result) => dfd.resolve(result));
					}
				})
			}
		}
	}
}