class LTForm {
	static async initialize() {
		this.formScript = document.currentScript;
		await this.getSubpages("Textbook_Maps", true);
	}

	static new() {
		let node = $("#LTRight").fancytree("getActiveNode");
		node.addChildren({
			title: "New Page",
			tooltip: "Newly Created Page",
		});
	}

	static mergeUp() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node && node.title !== "Cover Page. Drag onto me") {
			node.setExpanded(true).done(() => {
				if (node.hasChildren()) {
					while (node.hasChildren()) {
						node.getFirstChild().moveTo(node.parent, "child");
					}
					node.remove();
				}
			});
		}
	}

	static delAll() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node && node.title !== "Cover Page. Drag onto me") {
			node.remove();
		}
	}

	static reset() {
		let node = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (confirm("This will delete your work. Are you sure?")) {
			node.removeChildren();
		}
	}

	static mode(mode) {
		switch (mode) {
			case "preview":
				$("#LTForm").hide();
				$("#LTPreview").show();
				break;
			case "edit":
				$("#LTForm").show();
				$("#LTPreview").hide();
				break;
		}
	}

	static async preview() {
		let institution = document.getElementById("LTFormInstitutions");
		let name = document.getElementById("LTFormName").value;
		let url = `${institution.value}/${encodeURIComponent(encodeURIComponent(name))}`;
		if (name) {
			let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(`${institution.value.replace(window.location.origin, "")}/${name}`))}/info`);
			if (response.ok)
				alert(`The page ${url} already exists!`);
			else {
				// alert(`Good ${url}`);
				let source = $("#LTRight").fancytree("getTree");
				let preview = $("#LTPreviewForm").fancytree("getTree");
				let root = source.getNodeByKey("ROOT");
				if (root.children) {
					for (let i = 0; i < root.children.length; i++) {
						await root.children[i].visitAndLoad();
					}
					var d = root.toDict(true);
					LTForm.mode("preview");
					d.title = name;
					d = processNode(d);

					preview.getNodeByKey("ROOT").fromDict(d);

					console.log(d);
				}
				else
					alert("No content detected!");
			}
		}
		else {
			alert("No name provided!");
		}

		function processNode(node) {
			if (node.title.match(/(?<=target="_blank">).*?(?=<\/a>$)/)) {
				node.title = node.title.match(/(?<=target="_blank">).*?(?=<\/a>$)/)[0];
			}
			node.lazy = false;
			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i]);
				}
			}
			return node;
		}
	}

	static async getSubpages(path, isRoot, full) {
		const origin = window.location.origin;
		path = path.replace(origin + "/", "");
		let response = await fetch(origin + `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/subpages?dream.out.format=json`);
		response = await response.json();
		return await subpageCallback(response, isRoot);

		async function subpageCallback(info, isRoot) {
			const subpageArray = info["page.subpage"];
			const result = [];
			const promiseArray = [];

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

			if (subpageArray && subpageArray.length) {
				for (let i = 0; i < subpageArray.length; i++) {
					promiseArray[i] = subpage(subpageArray[i], i);
				}

				await Promise.all(promiseArray);
				if (isRoot) {
					LTForm.content = result;
					// console.log(LTForm.content);
					initializeFancyTree();
				}
				return result;
			}
			else {
				return [];
			}
		}

		async function initializeFancyTree() {
			if (LTForm.content) {
				let target = document.createElement("div");
				target.id = "LTRemixer";
				target.innerHTML = "<div id='LTForm'><div id='LTFormHeader'><button onclick='LTForm.new()'>New Page</button><button onclick='LTForm.mergeUp()'>Merge Folder Up</button><button onclick='LTForm.delAll()'>Delete</button><button onclick='LTForm.reset()'>Reset</button></div>" +
					"<div id='LTFormContainer'><div id='LTLeft'></div><div id='LTRight'></div></div>" +
					"<div id='LTFormFooter'><div>Select your college<select id='LTFormInstitutions'></select></div><div>Name for your LibreText (Usually your course name)<input id='LTFormName'/></div></div>" +
					"<div><button onclick='LTForm.preview()'>Enact</button></div></div>" +
					"<div id='LTPreview'><div>Preview Mode</div><button>Return to Edit mode</button><div id='LTPreviewForm'></div></div>";
				LTForm.formScript.parentElement.insertBefore(target, LTForm.formScript);
				$("#LTLeft").fancytree({
					source: LTForm.content,
					debugLevel: 0,
					extensions: ["dnd5"],
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						LTForm.getSubpages(node.data.url).then((result) => dfd.resolve(result));
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
					source: [{title: "Cover Page. Drag onto me", key: "ROOT", unselectable: true}],
					debugLevel: 0,
					extensions: ["dnd5", "edit"],
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						LTForm.getSubpages(node.data.url).then((result) => dfd.resolve(result));
					},
					tooltip: (event, data) => {
						return "Originally " + data.node.data.url
					},
					edit: {
						// Available options with their default:
						adjustWidthOfs: 4,   // null: don't adjust input size to content
						inputCss: {minWidth: "3em"},
						triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
						beforeEdit: function (event, data) {
							return data.orgTitle !== "Cover Page. Drag onto me";
						},
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

							if (data.otherNode) {
								// Drop another Fancytree node from same frame
								// (maybe from another tree however)
								var sameTree = (data.otherNode.tree === data.tree);
								if (node.getLevel() <= 1) {
									data.hitMode = "over";
								}
								if (sameTree) {
									data.otherNode.moveTo(node, data.hitMode);
								}
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
				});
				$("#LTPreviewForm").fancytree({
					source: [{title: "Cover Page. Drag onto me", key: "ROOT", unselectable: true}],
					debugLevel: 0,
					tooltip: (event, data) => {
						return "Originally " + data.node.data.url
					},
				});
				await LTForm.getInstitutions();
				LTForm.mode("edit");
			}
		}
	}

	static async getInstitutions() {
		const select = document.getElementById("LTFormInstitutions");
		let response;
		try {
			response = await fetch("/@api/deki/pages/=LibreTexts/subpages?dream.out.format=json");
		} catch (e) {
			response = await fetch("/@api/deki/pages/=Course_LibreTexts/subpages?dream.out.format=json");
		}
		response = await response.json();
		const subpageArray = response["page.subpage"];
		const result = [];
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push(`<option value="${institution["uri.ui"]}">${institution.title}</option>`);
		}
		result.push(`<option value="">Not listed? Contact info@libretexts.org</option>`);

		select.innerHTML = result.concat();
	}
}

LTForm.initialize();
