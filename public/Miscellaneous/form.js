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
				document.getElementById("copyResults").innerHTML = "";
				document.getElementById("copyErrors").innerHTML = "";
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
		let depth = 0;
		let chapter = 1;
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
				let d = root.toDict(true);
				LTForm.mode("preview");
				d.title = name;
				d["data"] = {url: url};
				depth = getDepth(d);
				d = processNode(d, 0, 0);

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

		function processNode(node, index, level, overTen) {
			if (depth - level <= 1 && node.title.includes(": ")) {
				node.title = node.title.match(/(?<=: ).*/)[0];
			}
			if (depth - level === 1) { //Chapter handling
				node.data["padded"] = `${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
				node.title = `${index}: ${node.title}`;
				chapter = index;
			}
			else if (depth - level === 0) { //Page handling
				node.data["padded"] = `${chapter}.${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
				node.title = `${chapter}.${index}: ${node.title}`;
			}
			else {
				node.data["padded"] = false;
			}
			node.lazy = false;
			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i], i + 1, level + 1, node.children.length >= 10);
				}
			}
			return node;
		}

		function getDepth(tree) {
			let depth = 0;
			while (tree.children) {
				depth++;
				tree = tree.children[0];
			}
			return depth;
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
					title: subpage.title,
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
				target.innerHTML = "<div id='LTForm'>Edit Mode<div id='LTFormHeader'><button onclick='LTForm.new()'>New Page</button><button onclick='LTForm.mergeUp()'>Merge Folder Up</button><button onclick='LTForm.delAll()'>Delete</button><button onclick='LTForm.reset()'>Reset</button></div>" +
					"<div id='LTFormContainer'><div id='LTLeft'></div><div id='LTRight'></div></div>" +
					"<div id='LTFormFooter'><div>Select your college<select id='LTFormInstitutions'></select></div><div>Name for your LibreText (Usually your course name)<input id='LTFormName'/></div></div>" +
					"<div><button onclick='LTForm.preview()'>Preview LibreText structure</button></div></div>" +
					"<div id='LTPreview'><div>Preview Mode</div><div id='LTPreviewHeader'><button onclick='LTForm.mode(\"edit\")'>Return to Edit mode</button><button onclick='LTForm.publish()'>Publish your LibreText</button></div><div id='LTPreviewForm'></div><div id='copyResults'></div><div id='copyErrors'></div> </div>";

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
						/*save: function (event, data) {
							setTimeout(() => data.node.setTitle(data.orgTitle.replace(/(?<=target="_blank">).*?(?=<\/a>$)/, data.node.title)), 500);
						},*/
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

	static async publish() {
		// let subdomain = window.document.origin.split("/")[2].split(".")[0];
		const tree = $("#LTPreviewForm").fancytree("getTree").toDict()[0];
		let destRoot = tree.data.url;
		const results = document.getElementById("copyResults");
		const errors = document.getElementById("copyErrors");
		results.innerText = "Processing";
		let counter = 0;
		let failedCounter = 0;
		let errorText = "";
		const total = getTotal(tree.children);

		await coverPage(tree);
		await doCopy(destRoot, tree.children);
		results.innerHTML = `<div><div>${"Finished: " + counter + " pages completed" + (failedCounter ? "\\nFailed: " + failedCounter : "")}</div><a href="${destRoot}" target="_blank">Visit your new LibreText here</a></div>`;

		function decodeHTML(content) {
			let ret = content.replace(/&gt;/g, '>');
			ret = ret.replace(/&lt;/g, '<');
			ret = ret.replace(/&quot;/g, '"');
			ret = ret.replace(/&apos;/g, "'");
			ret = ret.replace(/&amp;/g, '&');
			return ret;
		}

		async function coverPage(tree) {
			let path = tree.data.url.replace(window.location.origin + "/", "");
			let content = "<p>{{template.ShowCategory()}}</p>";
			let response = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
				method: "POST",
				body: content
			});
			let tags = '<tags><tag value="article:topic-category"/><tag value="coverpage:yes"/></tags>';
			let propertyArray = [putProperty('mindtouch.page#welcomeHidden', true), putProperty('mindtouch.idf#subpageListing', 'simple'), fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
				method: "PUT",
				body: tags,
				headers: {"Content-Type": "text/xml; charset=utf-8"}
			})];

			await Promise.all(propertyArray);

			async function putProperty(name, value) {
				fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
					method: "POST",
					body: value,
					headers: {"Slug": name}
				})
			}
		}

		function getTotal(treeArray) {
			let result = treeArray.length;
			for (let i = 0; i < treeArray.length; i++) {
				let child = treeArray[i].children;
				if (child) {
					result += getTotal(child);
				}
			}
			return result;
		}

		async function doCopy(destRoot, tree) {

			for (let i = 0; i < tree.length; i++) {
				const child = tree[i];
				child.path = child.data.url.replace(window.location.origin + "/", ""); //source
				let url = destRoot + "/" + (child.data.padded || child.title);
				let path = url.replace(window.location.origin + "/", "");
				//get info
				let info = fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/info?dream.out.format=json");

				//get Tags
				let copyContent = false;
				let tags = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/tags?dream.out.format=json");
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
					copyContent = copyContent || tags.includes("article:topic-category") || tags.includes("article:topic-guide");
					tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
					tags = "<tags>" + tags + "</tags>";
				}

				//copy Content
				let content;
				info = await info;
				info = await info.json();

				if (copyContent) {
					content = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/contents?mode=raw");
					content = await content.text();
					content = content.match(/(?<=<body>)([\s\S]*?)(?=<\/body>)/)[1];
					content = decodeHTML(content);
				}
				else {
					content = `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>`;
				}
				let response = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
					method: "POST",
					body: content
				});
				if (response.status >= 400) {
					failedCounter++;
				}
				switch (response.status) {
					case 403:
						errorText += "403 Forbidden - User does not have permission to create" + path + "\n";
						break;
					case 500:
						errorText += "500 Server Error " + path + "\n";
						break;
					case 409:
						errorText += "409 Conflict - Page already exists " + path + "\n";
						break;
					default:
						errorText += "Error " + response.status + " " + path + "\n";
						break;
					case 200:
						//copy Tags
						fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
							method: "PUT",
							body: tags,
							headers: {"Content-Type": "text/xml; charset=utf-8"}
						}).then();

						//Properties
						fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/properties?dream.out.format=json").then(async (response) => {
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
											fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
												method: "POST",
												body: content[i].value,
												headers: {"Slug": content[i].name}
											}).then();
										}
										break;
									//subpageListing check
									case "mindtouch.idf#guideDisplay":
										if (tags.includes("article:topic-guide")) {
											fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
												method: "POST",
												body: content[i].value,
												headers: {"Slug": content[i].name}
											}).then();
										}
										break;
									//pagecontent
									case "mindtouch.page#overview":
									case "mindtouch#idf.guideTabs":
									case "mindtouch.page#welcomeHidden":
									case "mindtouch.idf#product-image": //NEED FILE TRANSFER
										fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
											method: "POST",
											body: content[i].value,
											headers: {"Slug": content[i].name}
										}).then();
										break;
								}
							}
						});

						// Title cleanup
						if (child.data.padded) {
							fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + child.title + "&name=" + path, {
								method: "POST"
							}).then();
						}

					/*					//Thumbnail
										fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/files/mindtouch.page%2523thumbnail").then(async (response) => {
											if (response.ok) {
												let image = await response.blob();
												fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/files/mindtouch.page%2523thumbnail", {
													method: "PUT",
													body: image
												}).then();
											}
										});*/
				}

				counter++;
				results.innerText = `Processing: ${counter}/${total} pages completed (${Math.round(counter * 100 / total)}%)` + (failedCounter ? "\nFailed: " + failedCounter : "");
				errors.innerText = errorText;
				if (child.children) {
					await doCopy(url, child.children);
				}
			}
		}
	}

}

LTForm.initialize();
