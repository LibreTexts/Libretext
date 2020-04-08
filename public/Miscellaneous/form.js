class LTForm {
	static async initialize() {
		this.formScript = document.currentScript;
		let keys = await fetch('https://files.libretexts.org/authenBrowser.json');
		LTForm.keys = await keys.json();
		
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		LTForm.content = await this.getSubpages("", subdomain, false, true);
		LTForm.initializeFancyTree();
	}
	
	static save(tree) {
		localStorage.setItem('RemixerSession', JSON.stringify(tree));
	}
	
	static async new() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node) {
			node.addChildren({
				title: "New Page",
				padded: "",
				lazy: false,
				expanded: true,
				tooltip: "Newly Created Page",
			});
			await node.setExpanded();
			await LTForm.renumber();
		}
	}
	
	static mergeUp() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node && node.key !== "ROOT") {
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
		if (node && node.key !== "ROOT") {
			node.remove();
			LTForm.renumber();
		}
	}
	
	static default(chapters = 5, pages = 0) {
		let node = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (confirm("This will delete your work and replace it with the template you've chosen. Are you sure?")) {
			const defaultMap = LTForm.generateDefault(chapters, pages)[0];
			LTForm.save(defaultMap);
			node.fromDict(defaultMap);
			node.setExpanded();
		}
	}
	
	static async reset() {
		let node = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (confirm("This will delete your work. Are you sure?")) {
			node.removeChildren();
		}
	}
	
	static async renumber() {
		if (window['disableAutonumber'])
			return false;
		let root = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (!root.children) {
			return false;
		}
		for (let i = 0; i < root.children.length; i++) {
			if (root.children[i].lazy) {
				await root.children[i].visitAndLoad();
			}
		}
		let d = root.toDict(true);
		let depth = this.getDepth(d);
		let chapter = 1;
		let shallow = depth < 2;
		processNode(d, [0], 0, false,);
		root.fromDict(d);
		LTForm.save(d);
		root.setExpanded(true);
		
		function processNode(node, sharedIndex, level, overTen) {
			node.title = node.title.replace('&amp;', 'and');
			let isEscaped = node.title.match(/{.*}/);
			let fullyEscaped = node.title.match(/{}/) || node.title.match(/^{.*}$/); // skip renumbering
			if (isEscaped) {
				node.data["padded"] = false;
			}
			else {
				++sharedIndex[0];
				let index = sharedIndex;
				if (level && depth - level <= 1 && node.title.includes(": ")) {
					node.title = node.title.replace(/^[^:]*: /, "");
				}
				if ((!shallow && depth - level === 1) || (shallow && level === 1)) { //Chapter handling
					node.data["padded"] = `${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
					node.title = `${index}: ${node.title}`;
					chapter = index;
				}
				else if (!shallow && depth - level === 0) { //Page handling
					node.data["padded"] = `${chapter}.${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
					node.title = `${chapter}.${index}: ${node.title}`;
				}
				else {
					node.data["padded"] = false;
				}
			}
			node.lazy = false;
			if (node.children) {
				let sharedIndex = [0];
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i], sharedIndex, level + 1, node.children.length >= 10);
				}
			}
			return node;
		}
	}
	
	static debug() {
		let root = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		return root.toDict(true);
	}
	
	static async setSubdomain() {
		let select = document.getElementById('LTFormSubdomain');
		let subdomain = select.value;
		this.subdomain = subdomain;
		let name = $(`#LTFormSubdomain option[value="${subdomain}"]`).text();
		let LTLeft = $("#LTLeft").fancytree("getTree");
		let LeftAlert = $("#LTLeftAlert");
		
		LTLeft.enable(false);
		LeftAlert.text(`Loading ${name}`);
		LeftAlert.slideDown();
		LTForm.content = await this.getSubpages("", subdomain, false, true);
		let root = LTLeft.getRootNode();
		root.removeChildren();
		root.addChildren(LTForm.content);
		
		for (let i = 0; i < root.children.length; i++) {
			let node = root.children[i];
			node.icon = `https://libretexts.org/img/LibreTexts/glyphs/${subdomain}.png`;
			node.renderTitle();
		}
		
		LeftAlert.slideUp();
		LTLeft.enable(true);
	}
	
	static setName() {
		let name = document.getElementById("LTFormName").value;
		name = name.replace('&', 'and');
		$("#LTRight").fancytree("getTree").getNodeByKey("ROOT").setTitle(name);
	}
	
	static getDepth(tree) {
		let depth = 0;
		while (tree && tree.children) {
			depth++;
			tree = tree.children[0];
		}
		return depth;
	}
	
	static async getSubpages(path, subdomain, full, linkTitle) {
		path = path.replace(`https://${subdomain}.libretexts.org/`, "");
		let response = await this.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		return await subpageCallback(response);
		
		async function subpageCallback(info) {
			let subpageArray = info["page.subpage"];
			if (subpageArray) {
				subpageArray = subpageArray.length ? info["page.subpage"] : [info["page.subpage"]];
			}
			const result = [];
			const promiseArray = [];
			
			async function subpage(subpage, index) {
				let url = subpage["uri.ui"];
				let path = subpage.path["#text"];
				url = url.replace('?title=', '');
				path = path.replace('?title=', '');
				const hasChildren = subpage["@subpages"] === "true";
				let children = hasChildren ? undefined : [];
				if (hasChildren && (full)) { //recurse down
					children = await LTForm.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
					children = await children.json();
					children = await subpageCallback(children, false);
				}
				result[index] = {
					title: linkTitle ? `${subpage.title}<a href="${url}" target="_blank"> ></a>` : subpage.title,
					url: url,
					path: url.replace(`https://${subdomain}.libretexts.org/`, ""),
					id: parseInt(subpage['@id']),
					children: children,
					lazy: !full,
					subdomain: subdomain,
				};
			}
			
			if (subpageArray && subpageArray.length) {
				let resultIndex = 0;
				for (let i = 0; i < subpageArray.length; i++) {
					if (subpageArray[i]["uri.ui"].endsWith('/link'))
						continue;
					promiseArray[resultIndex] = subpage(subpageArray[i], resultIndex++);
				}
				
				await Promise.all(promiseArray);
				return result;
			}
			else {
				return [];
			}
		}
	}
	
	static async copyTransclude() {
		let LTRight = $("#LTRight").fancytree("getTree");
		let RightAlert = $("#LTRightAlert");
		let url = window.location.href;
		
		if (url.includes('?url=')) {
			url = decodeURIComponent(url);
			url = url.split('url=')[1];
			let subdomain = url.split('/')[2].split('.')[0];
			let path = url.split('/').splice(3).join('/');
			
			LTRight.enable(false);
			RightAlert.text(`Loading Copy-Transclude`);
			RightAlert.slideDown();
			let content = await this.getSubpages(path, subdomain);
			let root = LTRight.getNodeByKey("ROOT");
			root.removeChildren();
			root.addChildren(content);
			await LTForm.renumber();
			RightAlert.slideUp();
			LTRight.enable(true);
		}
	}
	
	static async initializeFancyTree() {
		
		if (LTForm.content) {
			let target = document.createElement("div");
			target.id = "LTRemixer";
			const isAdmin = document.getElementById("adminHolder").innerText === 'true';
			const isPro = document.getElementById("proHolder").innerText === 'true';
			const isDemonstration = checkIfDemonstration();
			const groups = document.getElementById("groupHolder").innerText;
			let allowed = isAdmin || (isPro && (groups.includes('contributor') || groups.includes('Contributor'))) || isDemonstration;
			target.innerHTML =
				"<div id='LTForm'>" +
				`<div class='LTFormHeader'><div class='LTTitle'>${isDemonstration ? 'Workshop Mode' : allowed ? "Edit Mode" : "Demonstration Mode"}</div><button onclick='LTForm.new()'>New Page</button><button onclick='LTForm.delAll()'>Delete</button><button onclick='LTForm.mergeUp()'>Merge Folder Up</button><button onclick='LTForm.dialog.dialog("open")'> Default Template</button><button onclick='LTForm.reset()'>Clear All</button><button id='disableAutoNumber' onclick='LTForm.changeAutonumber()'>Disable AutoNumber</button></div>` +
				`<div id='LTFormContainer'><div>Library Panel<select id='LTFormSubdomain' onchange='LTForm.setSubdomain()'>${LTForm.getSelectOptions()}</select><div id='LTLeft'></div></div><div>Remix Panel<div id='LTRight'></div></div></div>` +
				`<div id='LTFormFooter'><div>Select your college<select id='LTFormInstitutions'></select></div><div>Name for your LibreText (Usually your course name)<input id='LTFormName' oninput='LTForm.setName()'/></div>${formMode(isAdmin, isPro, groups)}</div>` +
				"<div><button onclick='LTForm.publish()'>Publish your LibreText</button><div id='copyResults'></div><div id='copyErrors'></div>" +
				`<div id="dialog-form" title="Create a Default Template">
  <p class="validateTips">Choose the number of chapters and pages per chapter you would like.<br/><b>All unsaved changes will be lost!</b></p>
 
  <form>
    <fieldset>
      <label for="chapters">Number of Chapters</label>
      <input type="number" name="chapters" id="chapters" value="0" min='0' max='100' step='1' class="text ui-widget-content ui-corner-all">
      <label for="pages">Number of Pages per Chapter</label>
      <input type="number" name="pages" id="pages" value="0" min='0' max='100' step='1' class="text ui-widget-content ui-corner-all">
 
      <!-- Allow form submission with keyboard without duplicating the dialog button -->
      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
    </fieldset>
  </form>
</div>` + "</div>";
			
			LTForm.formScript.parentElement.insertBefore(target, LTForm.formScript);
			const LTLeft = $("#LTLeft");
			const LTRight = $("#LTRight");
			LTLeft.fancytree({
				source: LTForm.content,
				debugLevel: 0,
				autoScroll: true,
				extensions: ["dnd5"],
				lazyLoad: function (event, data) {
					const dfd = new $.Deferred();
					let node = data.node;
					data.result = dfd.promise();
					LTForm.getSubpages(node.data.url, node.data.subdomain, false, true).then((result) => dfd.resolve(result), node.data.subdomain);
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
						data.dataTransfer.dropEffect = "copy";
						return true;
					},
					/*dragDrag: function (node, data) {
						data.dataTransfer.dropEffect = "move";
					},
					dragEnd: function (node, data) {
					},*/
					
					// --- Drop-support:
					
					/*dragEnter: function (node, data) {
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
					},*/
				},
				icon: function (event, data) {
					let subdomain = window.location.origin.split("/")[2].split(".")[0];
					if ((!LTForm.subdomain || LTForm.subdomain === subdomain) && data.node.getLevel() === 1)
						return `https://libretexts.org/img/LibreTexts/glyphs/${subdomain}.png`;
				}
			});
			LTRight.fancytree({
				source: LTForm.generateDefault(5, 0),
				debugLevel: 0,
				autoScroll: true,
				extensions: ["dnd5", "edit"],
				lazyLoad: function (event, data) {
					const dfd = new $.Deferred();
					let node = data.node;
					data.result = dfd.promise();
					LTForm.getSubpages(node.data.url, node.data.subdomain).then((result) => dfd.resolve(result));
				},
				tooltip: (event, data) => {
					return data.node.data.url ? "Originally " + data.node.data.url : "Newly created page";
				},
				edit: {
					// Available options with their default:
					adjustWidthOfs: 4,   // null: don't adjust input size to content
					inputCss: {minWidth: "3em"},
					triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
					beforeEdit: function (event, data) {
						return data.node.key !== "ROOT";
					},
					/*save: function (event, data) {
						setTimeout(() => data.node.setTitle(data.orgTitle.replace(/(?<=target="_blank">).*?(?=<\/a>$)/, data.node.title)), 500);
					},*/
					close: function (event, data) {
						LTForm.renumber();
					}
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
						// data.dataTransfer.dropEffect = "move";
					},
					dragEnd: function (node, data) {
					},
					
					// --- Drop-support:
					
					dragEnter: function (node, data) {
						// node.debug("dragEnter", data);
						// data.dataTransfer.dropEffect = "move";
						return true;
					},
					/*dragOver: function (node, data) {
						data.dataTransfer.dropEffect = "move";
					},
					dragLeave: function (node, data) {
					},*/
					dragDrop: async function (node, data) {
						/* This function MUST be defined to enable dropping of items on
						 * the tree.
						 */
						const transfer = data.dataTransfer;
						
						if (data.otherNode) {
							// Drop another Fancytree node from same frame
							// (maybe from another tree however)
							var sameTree = (data.otherNode.tree === data.tree);
							if (node.getLevel() <= 1) {
								data.hitMode = "over";
							}
							if (data.hitMode === "over") {
								node.setExpanded(true);
							}
							await doTransfer();
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
						await LTForm.renumber();
						
						async function doTransfer() {
							if (sameTree) {
								data.otherNode.moveTo(node, data.hitMode);
							}
							else {
								data.otherNode.copyTo(node, data.hitMode, function (n) {
									n.title = n.title.replace(/<a.* ><\/a>/, "");
									n.key = null; // make sure, a new key is generated
								});
								let LTRight = $("#LTRight").fancytree("getTree");
								LTRight.enable(false);
								const RightAlert = $("#LTRightAlert");
								RightAlert.text('Importing content. Please wait...');
								RightAlert.slideDown();
								await data.otherNode.visitAndLoad();
								RightAlert.slideUp();
								LTRight.enable(true);
							}
						}
					}
				},
			});
			await LTForm.getInstitutions();
			
			
			LTLeft.append('<div id=\'LTLeftAlert\'>You shouldn\'t see this</div>');
			LTRight.append('<div id=\'LTRightAlert\'>You shouldn\'t see this</div>');
			$("#LTRightAlert,#LTLeftAlert").hide();
			
			LTForm.dialog = $("#dialog-form").dialog({
				autoOpen: false,
				height: 400,
				width: 350,
				modal: true,
				buttons: {
					"Create this default template structure": function () {
						let chapters, pages;
						chapters = Math.min(100, parseInt($('#chapters').val()));
						pages = Math.min(100, parseInt($('#pages').val()));
						
						LTForm.default(chapters, pages);
						LTForm.dialog.dialog("close");
					},
					Cancel: function () {
						LTForm.dialog.dialog("close");
					},
				},
				classes: {'ui-dialog-buttonset': 'buttonsetForm'},
				close: function () {
					LTForm.dialog.dialog("close");
				}
			});
			
			await LTForm.copyTransclude();
			
			//confirm('You have previously saved work available.\nWould you like to restore your previous session?'))
			if (localStorage.getItem('RemixerSession')) {
				let d = JSON.parse(localStorage.getItem('RemixerSession'));
				let root = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
				root.fromDict(d);
				root.setExpanded();
			}
		}
		
		function formMode(isAdmin, isPro, groups) {
			
			return (isPro && (groups.includes('contributor') || groups.includes('Contributor'))) || isAdmin ? `<div>Remix Type<select id='LTFormCopyMode'><option value='transclude'>Transclude</option><option value='copy'>Copy Source</option>${isAdmin ? `<option value='deep'>Copy Full [SLOW]</option>` : ''}</select></div>` : '';
		}
	}
	
	static getSelectOptions() {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let libraries = {
			'Biology': 'bio',
			'Business': 'biz',
			'Chemistry': 'chem',
			'Engineering': 'eng',
			'Espanol': 'espanol',
			'Geosciences': 'geo',
			'Humanities': 'human',
			'Mathematics': 'math',
			'Medicine': 'med',
			'Physics': 'phys',
			'Social Sciences': 'socialsci',
			'Statistics': 'stats',
			'Workforce': 'workforce'
		};
		let result = '';
		Object.keys(libraries).map(function (key, index) {
			result += `<option value="${libraries[key]}" ${current === libraries[key] ? 'selected' : ''}>${key}</option>`;
		});
		return result;
	}
	
	static async getInstitutions() {
		let subdomain = window.location.origin.split("/")[2].split(".")[0];
		
		const select = document.getElementById("LTFormInstitutions");
		const isDemonstration = checkIfDemonstration();
		if (isDemonstration) {
			select.innerHTML = `<option value="https://${subdomain}.libretexts.org/Workshops/Workshop_University">Workshop University</option>`;
			return;
		}
		
		let response = await this.authenticatedFetch('Courses', 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		const subpageArray = (response['@count'] === "1" ? [response["page.subpage"]] : response["page.subpage"]) || [];
		const result = [];
		// console.log(subpageArray);
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push(`<option value="${institution["uri.ui"]}">${institution.title}</option>`);
		}
		result.push(`<option value="">Not listed? Contact info@libretexts.org</option>`);
		
		select.innerHTML = result.concat();
	}
	
	static async publish() {
		let subdomain = window.location.origin.split("/")[2].split(".")[0];
		let institution = document.getElementById("LTFormInstitutions");
		if (institution.value === "") {
			if (confirm("Would you like to send an email to info@libretexts.com to request your institution?"))
				window.location.href = "mailto:info@libretexts.org?subject=Remixer%20Institution%20Request";
			return false;
		}
		let name = document.getElementById("LTFormName").value;
		let college = institution.value;
		if (college.includes('Remixer_University')) {
			college += `/Username:_${document.getElementById("usernameHolder").innerText}`;
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, "")}`)) + "/contents?edittime=now", {
				method: "POST",
				body: "<p>{{template.ShowCategory()}}</p>",
				headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
			});
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, "")}`)) + "/tags", {
				method: "PUT",
				body: '<tags><tag value="article:topic-category"/></tags>',
				headers: {
					"Content-Type": "text/xml; charset=utf-8",
					'x-deki-token': LTForm.keys[subdomain],
					'x-requested-with': 'XMLHttpRequest'
				}
			});
		}
		let url = `${college}/${name.replace(/ /g, "_")}`;
		if (!name) {
			alert("No name provided!");
			return false
		}
		let response = await this.authenticatedFetch(`${college.replace(window.location.origin, "")}/${name}`, 'info', subdomain);
		if (response.ok) {
			alert(`The page ${url} already exists!`);
			return false;
		}
		LTForm.renumber();
		
		
		const isAdmin = document.getElementById("adminHolder").innerText === 'true';
		const isPro = document.getElementById("proHolder").innerText === 'true';
		const groups = document.getElementById("groupHolder").innerText.toLowerCase();
		const isDemonstration = checkIfDemonstration();
		let allowed = isAdmin || (isPro && groups.includes('faculty') || isDemonstration);
		if (!allowed) {
			if (confirm("Thanks for trying out the OER Remixer in Demonstration mode!\n\nIf you are interested, contact us to get a free account so that you can publish your own LibreText! Would you like to send an email to info@libretexts.com to get started?"))
				window.location.href = "mailto:info@libretexts.org?subject=Remixer%20Account%20Request";
			return false;
		}
		let copyMode = document.getElementById("LTFormCopyMode") ? document.getElementById("LTFormCopyMode").value : undefined;
		if (copyMode && copyMode === 'deep' && !isAdmin) {
			alert("Deep copy is restricted to administratiors. Access Denied.");
			document.getElementById("LTFormCopyMode").value = 'transclude';
			return false;
		}
		
		// let subdomain = window.location.origin.split("/")[2].split(".")[0];
		let LTRight = $("#LTRight").fancytree("getTree");
		let RightAlert = $("#LTRightAlert");
		
		RightAlert.text('Beginning Publication process');
		RightAlert.slideDown();
		LTRight.enable(false);
		let tree = LTRight.toDict()[0];
		tree.data = {url: url};
		let destRoot = tree.data.url;
		const results = document.getElementById("copyResults");
		const errors = document.getElementById("copyErrors");
		results.innerText = "Processing";
		console.log(tree);
		let counter = 0;
		let startedAt = new Date();
		let failedCounter = 0;
		let errorText = "";
		const total = getTotal(tree.children);
		
		await coverPage(tree);
		await doCopy(destRoot, tree.children, 1);
		const text = `${"Finished: " + counter + " pages completed" + (failedCounter ? "\\nFailed: " + failedCounter : "")}`;
		results.innerHTML = `<div><div>${text}</div><a href="${destRoot}" target="_blank">Visit your new LibreText here</a></div>`;
		RightAlert.text(text);
		RightAlert.slideUp();
		LTRight.enable(true);
		
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
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
				method: "POST",
				body: content,
				headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
			});
			let tags = '<tags><tag value="article:topic-category"/><tag value="coverpage:yes"/></tags>';
			let propertyArray = [putProperty('mindtouch.page#welcomeHidden', true), putProperty('mindtouch.idf#subpageListing', 'simple'), fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
				method: "PUT",
				body: tags,
				headers: {
					"Content-Type": "text/xml; charset=utf-8",
					'x-deki-token': LTForm.keys[subdomain],
					'x-requested-with': 'XMLHttpRequest'
				}
			})];
			
			await Promise.all(propertyArray);
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + tree.title + "&name=" + encodeURIComponent(tree.title.replace(" ", "_")), {
				method: "POST",
				headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
			});
			
			async function putProperty(name, value) {
				await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
					method: "POST",
					body: value,
					headers: {
						"Slug": name,
						'x-deki-token': LTForm.keys[subdomain],
						'x-requested-with': 'XMLHttpRequest'
					}
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
		
		async function doCopy(destRoot, tree, depth) {
			
			for (let i = 0; i < tree.length; i++) {
				const child = tree[i];
				child.title = child.title.replace(/[{}]/g, '');
				child.data.padded = child.data.padded ? child.data.padded.replace(/[{}]/g, '') : false;
				let url = destRoot + "/" + (child.data.padded || child.title);
				let path = url.replace(window.location.origin + "/", "");
				if (!child.data.url) { //New Page
					const isGuide = depth === 1;
					await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
						method: "POST",
						body: isGuide ? "<p>{{template.ShowGuide()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>\n"
							: "",
						headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
					});
					let tags = `<tags><tag value="${isGuide ? "article:topic-guide" : "article:topic"}"/></tags>`;
					await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
						method: "PUT",
						body: tags,
						headers: {
							"Content-Type": "text/xml; charset=utf-8",
							'x-deki-token': LTForm.keys[subdomain],
							'x-requested-with': 'XMLHttpRequest'
						}
					});
					// Title cleanup
					if (child.data.padded) {
						fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + child.title + "&name=" + child.data.padded, {
							method: "POST",
							headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
						}).then();
					}
					if (isGuide) {
						await Promise.all(
							[putProperty("mindtouch.idf#guideDisplay", "single", path),
								putProperty('mindtouch.page#welcomeHidden', true, path),
								putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
						
						let current = window.location.origin.split('/')[2].split('.')[0];
						let headers = {
							headers: {
								'x-deki-token': LTForm.keys['chem'],
							}
						};
						if (current === 'chem')
							headers.headers['x-requested-with'] = 'XMLHttpRequest';
						let image = await fetch('https://chem.libretexts.org/@api/deki/files/170427/default.png?origin=mt-web', headers);
						
						image = await image.blob();
						fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/files/=mindtouch.page%2523thumbnail", {
							method: "PUT",
							body: image,
							headers: {
								'x-deki-token': LTForm.keys[subdomain],
								'x-requested-with': 'XMLHttpRequest'
							}
						}).then();
					}
				}
				else { //copying from an exisitg source
					// child.path = child.data.url.replace(window.location.origin + "/", ""); //source
					child.path = child.data.path;
					let content;
					//get info
					let info = await LTForm.authenticatedFetch(child.path, 'info?dream.out.format=json', child.data.subdomain);
					
					//get Tags
					let copyMode = document.getElementById("LTFormCopyMode") ? document.getElementById("LTFormCopyMode").value : undefined;
					let copyContent = copyMode && copyMode !== 'transclude';
					let response = await LTForm.authenticatedFetch(child.path, 'tags?dream.out.format=json', child.data.subdomain);
					let tags = await response.json();
					if (response.ok && tags["@count"] !== "0") {
						if (tags.tag) {
							if (tags.tag.length) {
								tags = tags.tag.map((tag) => tag["@value"]);
							}
							else {
								tags = [tags.tag["@value"]];
							}
						}
						copyContent = copyContent || tags.includes("article:topic-category") || tags.includes("article:topic-guide");
						if (!copyContent) {
							tags.push("transcluded:yes");
						}
					}
					else {
						tags = ["transcluded:yes"];
					}
					info = await (await info).json();
					
					tags.push(`source-${child.data.subdomain}-${info['@id']}`);
					let tagsHTML = tags.map((tag) => `<tag value="${tag}"/>`).join("");
					tagsHTML = "<tags>" + tagsHTML + "</tags>";
					
					//copy Content
					let current = window.location.origin.split('/')[2].split('.')[0];
					if (copyContent) {
						if (child.data.subdomain === current) {
							content = await LTForm.authenticatedFetch(child.path, 'contents?mode=raw', child.data.subdomain, {isLimited: isDemonstration});
							content = await content.text();
							content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
							content = decodeHTML(content);
						}
						else {
							//Get cross content
							content = await fetch('https://api.libretexts.org/endpoint/contents', {
								method: 'PUT',
								body: JSON.stringify({
									path: child.path,
									api: 'contents?mode=raw',
									subdomain: child.data.subdomain,
								})
							});
							content = await content.text();
							content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
							content = decodeHTML(content);
							
							let copyMode = document.getElementById("LTFormCopyMode") ? document.getElementById("LTFormCopyMode").value : undefined;
							if (copyMode === 'copy') {
								content = content.replace(/\/@api\/deki/g, `https://${child.data.subdomain}.libretexts.org/@api/deki`);
								content = content.replace(/ fileid=".*?"/g, '');
							}
							else if (copyMode === 'deep') {
								//Fancy file transfer VERY SLOW BUT EFFECTIVE
								response = await LTForm.authenticatedFetch(child.path, 'files?dream.out.format=json', child.data.subdomain);
								if (response.ok) {
									let files = await response.json();
									if (files["@count"] !== "0") {
										if (files.file) {
											if (!files.file.length) {
												files = [files.file];
											}
											else {
												files = files.file;
											}
										}
									}
									let promiseArray = [];
									for (let i = 0; i < files.length; i++) {
										let file = files[i];
										if (file['@res-is-deleted'] === 'false')
											promiseArray.push(processFile(file, child, path, file['@id']));
									}
									promiseArray = await Promise.all(promiseArray);
									for (let i = 0; i < promiseArray.length; i++) {
										if (promiseArray[i]) {
											content = content.replace(promiseArray[i].original, promiseArray[i].final);
											content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
										}
									}
								}
								
								// Handling of hotlinked images (not attached to the page)
								response = await LTForm.authenticatedFetch(path, 'files?dream.out.format=json');
								if (response.ok) {
									let files = await response.json();
									if (files["@count"] !== "0") {
										if (files.file) {
											if (!files.file.length) {
												files = [files.file];
											}
											else {
												files = files.file;
											}
										}
									}
									files = files.map((file) => file['@id']);
									
									let promiseArray = [];
									let images = content.match(/(<img.*?src="\/@api\/deki\/files\/)[\S\s]*?(")/g);
									if (images) {
										for (let i = 0; i < images.length; i++) {
											images[i] = images[i].match(/src="\/@api\/deki\/files\/([\S\s]*?)["/]/)[1];
											
											if (!files.includes(images[i])) {
												promiseArray.push(processFile(null, child, path, images[i]));
											}
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
							}
						}
					}
					else if (child.data.subdomain !== current) {
						content = `<p class="mt-script-comment">Cross Library Transclusion</p>

<pre class="script">
template('CrossTransclude/Web',{'Library':'${child.data.subdomain}','PageID':${child.data.id}});</pre>

<div class="comment">
<div class="mt-comment-content">
<p><a href="${child.data.url}">Cross-Library Link: ${child.data.url}</a><br/>source-${child.data.subdomain}-${info['@id']}</p>
</div>
</div>`
					}
					else {
						content = `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>

<div class="comment">
<div class="mt-comment-content">
<p><a href="${child.data.url}">Content Reuse Link: ${child.data.url}</a></p>
</div>
</div>`;
					}
					response = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?edittime=now", {
						method: "POST",
						body: content,
						headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
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
							if (tagsHTML) {
								fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
									method: "PUT",
									body: tagsHTML,
									headers: {
										"Content-Type": "text/xml; charset=utf-8",
										'x-deki-token': LTForm.keys[subdomain],
										'x-requested-with': 'XMLHttpRequest'
									}
								}).then();
							}
							//Properties
							LTForm.authenticatedFetch(child.path, 'properties?dream.out.format=json', child.data.subdomain).then(async (response) => {
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
													headers: {
														"Slug": content[i].name,
														'x-deki-token': LTForm.keys[subdomain],
														'x-requested-with': 'XMLHttpRequest'
													}
												}).then();
											}
											break;
										//subpageListing check
										case "mindtouch.idf#guideDisplay":
											if (tags.includes("article:topic-guide")) {
												fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
													method: "POST",
													body: content[i].value,
													headers: {
														"Slug": content[i].name,
														'x-deki-token': LTForm.keys[subdomain],
														'x-requested-with': 'XMLHttpRequest'
													}
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
												headers: {
													"Slug": content[i].name,
													'x-deki-token': LTForm.keys[subdomain],
													'x-requested-with': 'XMLHttpRequest'
												}
											}).then();
											break;
									}
								}
							});
							
							// Title cleanup
							if (child.data.padded) {
								fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + child.title + "&name=" + child.data.padded, {
									method: "POST",
									headers: {
										'x-deki-token': LTForm.keys[subdomain],
										'x-requested-with': 'XMLHttpRequest'
									}
								}).then();
							}
							
							//Thumbnail
							LTForm.authenticatedFetch(child.path, 'files', child.data.subdomain).then(async (response) => {
								if (response.ok) {
									let files = await response.text();
									if (files.includes('mindtouch.page#thumbnail') || files.includes('mindtouch.page%23thumbnail')) {
										let image = await LTForm.authenticatedFetch(child.path, 'thumbnail', child.data.subdomain);
										
										image = await image.blob();
										fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/files/=mindtouch.page%2523thumbnail", {
											method: "PUT",
											body: image,
											headers: {
												'x-deki-token': LTForm.keys[subdomain],
												'x-requested-with': 'XMLHttpRequest'
											}
										}).then();
									}
									else if (tags.includes("article:topic-category") || tags.includes("article:topic-guide")) {
										let current = window.location.origin.split('/')[2].split('.')[0];
										let headers = {
											headers: {
												'x-deki-token': LTForm.keys['chem'],
											}
										};
										if (current === 'chem')
											headers.headers['x-requested-with'] = 'XMLHttpRequest';
										let image = await fetch('https://chem.libretexts.org/@api/deki/files/170427/default.png?origin=mt-web', headers);
										
										image = await image.blob();
										fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/files/=mindtouch.page%2523thumbnail", {
											method: "PUT",
											body: image,
											headers: {
												'x-deki-token': LTForm.keys[subdomain],
												'x-requested-with': 'XMLHttpRequest'
											}
										}).then();
									}
								}
							});
					}
				}
				
				
				counter++;
				var elapsed = (new Date() - startedAt) / 1000;
				var rate = counter / elapsed;
				var estimated = total / rate;
				var eta = estimated - elapsed;
				var etah = secondsToStr(eta);
				const text = `Processing: ${counter}/${total} pages completed (${Math.round(counter * 100 / total)}%)` + (failedCounter ? "\nFailed: " + failedCounter : "");
				
				
				results.innerText = `${text} ETA: ${etah}`;
				RightAlert.text(text);
				errors.innerText = errorText;
				if (child.children) {
					await doCopy(url, child.children, depth + 1);
				}
			}
			
			
			async function putProperty(name, value, path) {
				fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
					method: "POST",
					body: value,
					headers: {
						"Slug": name,
						'x-deki-token': LTForm.keys[subdomain],
						'x-requested-with': 'XMLHttpRequest'
					}
				})
			}
			
			async function processFile(file, child, path, id) {
				let image, filename;
				if (!file) {
					image = await fetch(`https://${child.data.subdomain}.libretexts.org/@api/deki/files/${id}?dream.out.format=json`, {
						headers: {'x-deki-token': LTForm.keys[child.data.subdomain]}
					});
					filename = await fetch(`https://${child.data.subdomain}.libretexts.org/@api/deki/files/${id}/info?dream.out.format=json`, {
						headers: {'x-deki-token': LTForm.keys[child.data.subdomain]}
					});
					if (!image.ok || !filename.ok)
						return false;
					filename = await filename.json();
					filename = filename['filename'];
					
				}
				else if (!(file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail'))) {
					//only files with extensions
					filename = file['filename'];
					image = await LTForm.authenticatedFetch(child.path, `files/${filename}`, child.data.subdomain);
					if (!image.ok)
						return false;
				}
				
				
				if (filename) {
					image = await image.blob();
					
					let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}?dream.out.format=json`, {
						method: "PUT",
						body: image,
						headers: {'x-deki-token': LTForm.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'}
					});
					if (!response.ok)
						return false;
					
					response = await response.json();
					let original = file ? file.contents['@href'].replace(`https://${child.data.subdomain}.libretexts.org`, '') : `/@api/deki/files/${id}`;
					return {
						original: original,
						oldID: id,
						newID: response['@id'],
						final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`
					};
				}
				return false;
			}
		}
	}
	
	static async authenticatedFetch(path, api, subdomain, options) {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let headers = {};
		if (api === 'contents?mode=raw' && options.isLimited) {
			return await fetch(`https://api.libretexts.org/endpoint/contents`,
				{method: 'PUT', body: JSON.stringify({path: path, subdomain: subdomain})});
		}
		subdomain = subdomain || current;
		let token = LTForm.keys[subdomain];
		headers['x-deki-token'] = token;
		if (current === subdomain)
			headers['X-Requested-With'] = 'XMLHttpRequest';
		
		return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/${api}`,
			{headers: headers});
	}
	
	static generateDefault(chapters, pages) {
		let key = 1;
		let children = [];
		for (let i = 1; i <= chapters; i++) {
			let childPages = [];
			let chapterKey = key++;
			
			for (let j = 1; j <= pages; j++) {
				childPages.push({
					"expanded": true,
					"key": `_${key++}`,
					"lazy": false,
					"title": `${i}.${j}: New Page`,
					"tooltip": "Newly Created Page",
					"data": {"padded": `${i.toString().padStart(2, '0')}.${i.toString().padStart(2, '0')}: New Page`}
				})
			}
			
			children.push({
				"expanded": true,
				"key": `_${chapterKey}`,
				"lazy": false,
				"title": `${i}: Chapter ${i}`,
				"tooltip": "Newly Created Page",
				"data": {"padded": `${i.toString().padStart(2, '0')}: Chapter ${i}`},
				"children": childPages
			})
		}
		
		return [{
			title: "Cover Page. Drag onto me to get started",
			key: "ROOT",
			url: "",
			padded: "",
			unselectable: true,
			expanded: true,
			children: children
		}]
	}
	
	static changeAutonumber() {
		let button = $('#disableAutoNumber');
		if (window['disableAutonumber']) {
			button.text('Disable Autonumber');
		}
		else {
			button.text('Enable Autonumber');
		}
		window['disableAutonumber'] = !window['disableAutonumber'];
	}
}

function secondsToStr(seconds) {
	return millisecondsToStr(seconds * 1000);
}

// http://stackoverflow.com/a/8212878
function millisecondsToStr(milliseconds) {
	// TIP: to find current time in milliseconds, use:
	// var  current_time_milliseconds = new Date().getTime();
	
	function numberEnding(number) {
		return (number > 1) ? 's' : '';
	}
	
	let temp = Math.floor(milliseconds / 1000);
	const years = Math.floor(temp / 31536000);
	if (years) {
		return years + ' year' + numberEnding(years);
	}
	const days = Math.floor((temp %= 31536000) / 86400);
	if (days) {
		return days + ' day' + numberEnding(days);
	}
	const hours = Math.floor((temp %= 86400) / 3600);
	if (hours) {
		return hours + ' hour' + numberEnding(hours);
	}
	const minutes = Math.floor((temp %= 3600) / 60);
	if (minutes) {
		return minutes + ' minute' + numberEnding(minutes);
	}
	const seconds = temp % 60;
	if (seconds) {
		return seconds + ' second' + numberEnding(seconds);
	}
	return 'less than a second'; //'just now' //or other string you like;
}

function formatNumber(it) {
	return it.toPrecision(4);
}

function checkIfDemonstration() {
	const groups = document.getElementById("groupHolder").innerText;
	return groups.includes('Workshop');
}

LTForm.initialize();
