LTform();

async function LTform() {
	const urlArray = window.location.href.replace("?action=edit", "").split("/");
	const formScript = document.currentScript;
	let content;
	await getSubpages("Textbook_Maps", true);

	async function getSubpages(path, isRoot, full) {
		const origin = window.location.origin;
		path = path.replace(origin+"/","");
		let response = await fetch(origin + `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/subpages?dream.out.format=json`);
		response = await response.json();
		return await subpageCallback(response, isRoot);

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
				let children = hasChildren ? undefined : [];
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
			return result;
		}

		async function initializeFancyTree() {
			if (content) {
				let target = document.createElement("div");
				target.id = "LTform";
				formScript.parentElement.insertBefore(target, formScript);
				target = $(target);
				target.fancytree({
					source: content,
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						getSubpages(node.data.url).then((result)=>dfd.resolve(result));
					}
				})
			}
		}
	}
}