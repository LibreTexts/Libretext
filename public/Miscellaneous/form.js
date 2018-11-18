LTform();

async function LTform() {
	const urlArray = window.location.href.replace("?action=edit", "").split("/");
	const formScript = document.currentScript;
	let content;
	await getSubpages("Textbook_Maps", true);

	async function getSubpages(path, isRoot, full) {
		const origin = window.location.origin;
		path = path.replace(origin + "/", "");
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
					title: currentPage ? subpage.title : `<a href="${url}" target="_blank">${subpage.title}</a>`,
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

		async function initializeFancyTree() {
			if (content) {
				let target = document.createElement("div");
				target.id = "LTform";
				target.innerHTML = "<div id='LTLeft'></div><div id='LTRight'></div>";
				formScript.parentElement.insertBefore(target, formScript);
				$("#LTLeft").fancytree({
					source: content,
					extensions: ["dnd5"],
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						getSubpages(node.data.url).then((result) => dfd.resolve(result));
					},
					dnd5: {
						// autoExpandMS: 400,
						// preventForeignNodes: true,
						// preventNonNodes: true,
						// preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
						// preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
						// scroll: true,
						// scrollSpeed: 7,
						// scrollSensitivity: 10,

						// --- Drag-support:

						dragStart: function (node, data) {
							/* This function MUST be defined to enable dragging for the tree.
							 *
							 * Return false to cancel dragging of node.
							 * data.dataTransfer.setData() and .setDragImage() is available
							 * here.
							 */
//					data.dataTransfer.setDragImage($("<div>hurz</div>").appendTo("body")[0], -10, -10);
							return true;
						},
						dragDrag: function (node, data) {
							data.dataTransfer.dropEffect = "move";
						},
						dragEnd: function (node, data) {
						},

						// --- Drop-support:

						dragEnter: function (node, data) {
							// node.debug("dragEnter", data);
							data.dataTransfer.dropEffect = "move";
							// data.dataTransfer.effectAllowed = "copy";
							return true;
						},
						dragOver: function (node, data) {
							data.dataTransfer.dropEffect = "move";
							// data.dataTransfer.effectAllowed = "copy";
						},
						dragLeave: function (node, data) {
						},
					},
				});
				$("#LTRight").fancytree({
					source: [{title: "Data root. Drag onto me"}],
					extensions: ["dnd5", "edit"],
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						getSubpages(node.data.url).then((result) => dfd.resolve(result));
					},
					tooltip: (event, data) => {
						return "Originally " + data.node.data.url
					},
					edit: {
						// Available options with their default:
						adjustWidthOfs: 4,   // null: don't adjust input size to content
						inputCss: {minWidth: "3em"},
						triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
						save: function (event, data) {
							setTimeout(() => data.node.setTitle(data.orgTitle.replace(/(?<=target="_blank">).*?(?=<\/a>$)/, data.node.title)), 500);
						},
					},
					dnd5: {
						// autoExpandMS: 400,
						// preventForeignNodes: true,
						// preventNonNodes: true,
						// preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
						// preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
						// scroll: true,
						// scrollSpeed: 7,
						// scrollSensitivity: 10,

						// --- Drag-support:

						dragStart: function (node, data) {
							/* This function MUST be defined to enable dragging for the tree.
							 *
							 * Return false to cancel dragging of node.
							 * data.dataTransfer.setData() and .setDragImage() is available
							 * here.
							 */
//					data.dataTransfer.setDragImage($("<div>hurz</div>").appendTo("body")[0], -10, -10);
							return true;
						},
						dragDrag: function (node, data) {
							data.dataTransfer.dropEffect = "move";
						},
						dragEnd: function (node, data) {
						},

						// --- Drop-support:

						dragEnter: function (node, data) {
							// node.debug("dragEnter", data);
							data.dataTransfer.dropEffect = "move";
							data.dataTransfer.effectAllowed = "copy";
							return true;
						},
						dragOver: function (node, data) {
							data.dataTransfer.dropEffect = "move";
							data.dataTransfer.effectAllowed = "copy";
						},
						dragLeave: function (node, data) {
						},
						dragDrop: function (node, data) {
							/* This function MUST be defined to enable dropping of items on
							 * the tree.
							 */
							var transfer = data.dataTransfer;

							node.debug("drop", data);

							// alert("Drop on " + node + ":\n"
							// 	+ "source:" + JSON.stringify(data.otherNodeData) + "\n"
							// 	+ "hitMode:" + data.hitMode
							// 	+ ", dropEffect:" + transfer.dropEffect
							// 	+ ", effectAllowed:" + transfer.effectAllowed);

							if (data.otherNode) {
								// Drop another Fancytree node from same frame
								// (maybe from another tree however)
								var sameTree = (data.otherNode.tree === data.tree);
								if (sameTree)
									data.otherNode.moveTo(node, data.hitMode);
								else {
									data.otherNode.copyTo(node, data.hitMode);
								}
							}
							else if (data.otherNodeData) {
								// Drop Fancytree node from different frame or window, so we only have
								// JSON representation available
								node.addChild(data.otherNodeData, data.hitMode);
							}
							else {
								// Drop a non-node
								node.addNode({
									title: transfer.getData("text")
								}, data.hitMode);
							}
							// node.setExpanded();
						}
					},
				})
			}
		}
	}
}