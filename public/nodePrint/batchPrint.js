/*
Ladda.bind('getLibretext',{callback:(instance)=>{
		const request = new XMLHttpRequest();
		request.open("PUT", "https://dynamic.libretexts.org/print/Libretext="+window["TOCName"], true); //async get
		request.addEventListener("load", receive);
		request.send(JSON.stringify(window["TOCTable"]));

		function receive(data) {
			console.log(data);
		}
	}});*/

if (!window["batchPrint.js"]) {
	window["batchPrint.js"] = true;
	let email = document.getElementById('userEmailHolder').textContent || "";
	let batchAccess;
	const isAdmin = document.getElementById("adminHolder").innerText === 'true';
	const isPro = document.getElementById("proHolder").innerText === 'true';
	const groups = document.getElementById("groupHolder").innerText;
	const targetComputer = 'batch.libretexts.org';
	let request;
	let requestJSON;
	
	function fn() {
		HTMLtoJSON();
		request = new XMLHttpRequest();
		requestJSON = {
			root: window.location.href,
			batchName: window["BatchName"],
			isNoCache: false
		};
		batchAccess = isAdmin || (isPro && groups.includes('BatchAccess') );
		const batchPrint = document.getElementById("batchPrint");
		
		handleInner().then();
		
		async function handleInner() {
			//Download widget handling
			let tags = document.getElementById('pageTagsHolder').innerText;
			let downloads = [];
			let hasDownloads = false;
			let url = window.location.href.replace(/#$/,'');
			if (tags.includes('coverpage:yes')) {
				
				let subdomain = window.location.origin.split("/")[2].split(".")[0];
				let one = subdomain === 'espanol' ? fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/home.json`)
					: fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/Courses.json`);
				let two = fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/Bookshelves.json`);
				one = await one;
				two = await two;
				one = one.ok ? await one.json() : [];
				two = two.ok ? await two.json() : [];
				
				downloads = downloads.concat(one, two);
				let downloadLinks = downloads.map((value) => decodeURIComponent(value.link));
				if (downloadLinks.includes(url) || downloadLinks.includes(decodeURIComponent(url))) {
					hasDownloads = true;
				}
			}
			let innerHTML = "";
			if (batchAccess) {
				// $('#pageNumberHolder').append(`<div>Hello ${email}!</div>`);
				innerHTML += '<button id="batchButton" onclick="batch()" style="margin-right: 2px"><span>Batch</span></button>';
			}
			if (hasDownloads) {
				let entry = '';
				for (let i = 0; i < downloads.length; i++) {
					if (downloads[i].link === url || decodeURIComponent(downloads[i].link) === url || downloads[i].link === decodeURIComponent(url)) {
						entry = downloads[i];
					}
				}
				if (entry) {
					let root = 'https://batch.libretexts.org/print/Finished/';
					if (entry.zipFilename)
						root += entry.zipFilename.replace('/Full.pdf', '');
					innerHTML += '<div id="DownloadsDropdown" class="dropdown"  style="float:right;"><div class="dropbtn" style="margin-right: 2px" title="Downloads Center"><span>Downloads</span></div>';
					innerHTML += `<div class="dropdown-content">
					<a href='${root}/Full.pdf' class='mt-icon-file-pdf'
					   target='_blank'>Full PDF</a>
					<a href='${root}/LibreText.imscc' class='mt-icon-graduation'
					   target='_blank'>Import into LMS</a>
					${batchAccess ?`<a onclick = "event.preventDefault(); if (confirm('This will refresh all of the pages and will take quite a while. Are you sure?'))batch(window.location.href)" href='#' class='mt-icon-spinner6'>Refresh Text</a>` : ''}
					<a href='${root}/Individual.zip' class='mt-icon-file-zip'
					   target='_blank'>Individual ZIP</a>
					<a href='${root}/Publication.zip' class='mt-icon-book3'
					   target='_blank'>Print Book Files</a>
				</div></div>`;
				}
			}
			else {
				if (batchAccess) {
					innerHTML += '<a id="getTOCLink" class="notSS" target="_blank">TOC</a>';
				}
				innerHTML += '<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/18%3A_Importing_LibreTexts_into_an_LMS" target="_blank" id="thinCC" onClick="thinCC()" style="margin-right: 2px" title="Export to LMS"><span>LMS</span></a>';
			}
			
			
			
			batchPrint.innerHTML = innerHTML;
			let getTOCLink = document.getElementById("getTOCLink");
			if (getTOCLink) {
				getTOCLink.rel = "nofollow";
				getTOCLink.href = `https://batch.libretexts.org/print/toc=${url}`;
			}
		}
	}
	
	function getChildren(HTML) {
		let JSON = {};
		if (HTML.children[1]) {
			HTML = HTML.children[1].children;
			
			for (let i = 0; i < HTML.length; i++) {
				let link = HTML[i].children[0];
				JSON[link.textContent] = {link: link.href, children: getChildren(HTML[i])};
			}
		}
		return JSON;
	}
	
	function thinCC() {
		const zip = new JSZip();
		const textToSave = JSONtoXML();
		zip.file('imsmanifest.xml',textToSave);
		zip.generateAsync({type:"blob"})
			.then(function (blob) {
				const textToSaveAsURL = window.URL.createObjectURL(blob);
				const fileNameToSaveAs = `${window["BatchName"]}.imscc`;
				
				const downloadLink = document.createElement("a");
				downloadLink.download = fileNameToSaveAs;
				downloadLink.innerHTML = "Download File";
				downloadLink.href = textToSaveAsURL;
				downloadLink.onclick = this.destroyClickedElement;
				downloadLink.style.display = "none";
				document.body.appendChild(downloadLink);
				
				downloadLink.click();
			});
		
		/**
		 * @return {string}
		 */
		function JSONtoXML() {
			let root = window.location.href,
				batchName = window["BatchName"],
				title = window["BatchTitle"],
				subpages = window["BatchTable"];
			
			const {org, resources} = createXML(addLinks(subpages, title));
			
			function addLinks(object, title) {
				let result = [];
				if (Object.keys(object).length) {
					let resourceArray = [];
					let readyArray = [];
					for (let property in object) {
						if (object.hasOwnProperty(property)) {
							
							if (Object.keys(object[property].children).length) { //has children
								readyArray = readyArray.concat(addLinks(object[property].children, property));
							}
							else {
								resourceArray.push({
									title: property,
									url: object[property].link + "?contentOnly"
								});
							}
						}
					}
					if (resourceArray.length) //remove empty
						result.push({title: title, resources: resourceArray});
					result = result.concat(readyArray);
					
				}
				else { //too shallow
					result.push({
						title: title,
						resources: [{
							title: title,
							url: root + "?contentOnly"
						}],
					});
				}
				return result;
			}
			
			function escapeTitle(unsafe){
				return unsafe.replace(/[<>&'"]/g, function (c) {
					switch (c) {
						case '<': return '&lt;';
						case '>': return '&gt;';
						case '&': return '&amp;';
						case '\'': return '&apos;';
						case '"': return '&quot;';
					}
				});
			}
			
			function createXML(array) {
				let org = "";
				let resources = "";
				console.log(array);
				let counter = 1;
				
				function getIdentifier() {
					let result = "T_" + (counter.toString().padStart(6, "0"));
					counter++;
					return result;
				}
				
				array.forEach((item) => {
					if (item.hasOwnProperty("title") && item.hasOwnProperty("resources")) {
						org += "\n" +
							`            <item identifier=\"${getIdentifier()}\">\n` +
							`                <title>${escapeTitle(item.title)}</title>`;
						item.resources.forEach((resource) => {
							const identifier = getIdentifier();
							org += `
                <item identifier="${identifier}" identifierref="${identifier}_R">
                    <title>${escapeTitle(resource.title)}</title>
                </item>`;
							resources += `
        <resource identifier="${identifier}_R" type="imswl_xmlv1p1">
            <file href="${identifier}_F.xml"/>
        </resource>`;
							zip.file(`${identifier}_F.xml`,
`<?xml version="1.0" encoding="UTF-8"?>
<webLink xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd">
	<title>${escapeTitle(resource.title)}</title>
	<url href="${resource.url}" target="_iframe"/>
</webLink>`);
						});
						org += "\n" +
							"            </item>";
					}
				});
				
				return {org: org, resources: resources};
			}
			
			const top = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
				"<manifest xmlns=\"http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1\" xmlns:lom=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource\" xmlns:lomimscc=\"http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" identifier=\"cctd0015\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd\">\n" +
				"    <metadata>\n" +
				"        <schema>IMS Common Cartridge</schema>\n" +
				"        <schemaversion>1.1.0</schemaversion>\n" +
				"    <lomimscc:lom>\n" +
				"      <lomimscc:general>\n" +
				"        <lomimscc:title>\n" +
				`          <lomimscc:string language=\"en-US\">${escapeTitle(title)}</lomimscc:string>\n` +
				"        </lomimscc:title>\n" +
				"      </lomimscc:general>\n" +
				"    </lomimscc:lom>\n" +
				"    </metadata>\n" +
				"    <organizations>\n" +
				"        <organization identifier=\"T_90000\" structure=\"rooted-hierarchy\">\n" +
				"        <item identifier=\"T_00000\">";
			const middle = "\n" +
				"        </item>\n" +
				"        </organization>\n" +
				"    </organizations>\n" +
				"    <resources>";
			const end = "\n    </resources>\n" +
				"</manifest>";
			
			return top + org + middle + resources + end;
		}
	}
	
	function HTMLtoJSON() {
		let HTML = $("#batchTreeHolder .wiki-tree");
		let JSON = {};
		let URL = window.location.href;
		const title = document.getElementById("titleHolder").textContent;
		
		//get content root
		URL = URL.split("/").slice(0, 6).join("/");
		
		if (HTML[0].children.length) {
			HTML = HTML[0].children[0].children;
			let link;
			
			for (let i = 0; i < HTML.length; i++) {
				link = HTML[i].children[0];
				JSON[link.textContent] = {link: link.href, children: getChildren(HTML[i])};
			}
		}
		window["BatchTable"] = JSON;
		window["BatchName"] = title + URL.length;
		window["BatchTitle"] = title;
		console.log(window["BatchTable"], window["BatchName"]);
		
		
	}
	
	function batch(target) {
		if (!batchAccess) {
			alert('Authorization Error');
			return false;
		}
		if (window["batchComplete"]) {
			window.location = window["batchComplete"];
		}
		else {
			request.open("GET", `https://${targetComputer}/print/Libretext=${target ? `${target}?no-cache` : window.location.href}`, true); //async get
			request.addEventListener("progress", receive);
			request.addEventListener("load", download);
			request.send();
			//JSON.stringify(requestJSON)
			const batchButton = document.getElementById("batchButton");
			batchButton.innerText = 'Request sent...';
			
			
			function receive() {
				let newText = this.responseText;
				// console.log(newText);
				newText = newText.match(/^{.+}$(?!\s*^.*}$)/m);
				if (newText) {
					console.log(newText[0]);
					const json = JSON.parse(newText[0]);
					batchButton.innerText = json.percent + "%" + "\n" + json.eta;
				}
			}
			
			function download() {
				let newText = this.responseText.match(/^{.+}$(?!\s*^.*}$)/m)[0];
				const out = JSON.parse(newText);
				if (out.filename === 'refreshOnly') {
					batchButton.innerText = "Refresh complete";
					return;
				}
				batchButton.innerText = "Redownload";
				window.location = `https://${targetComputer}/print/Finished/${out.filename}/Full.pdf`;
				window["batchComplete"] = `https://${targetComputer}/print/Finished/${out.filename}/Full.pdf`
			}
		}
		
	}
}
document.addEventListener('DOMContentLoaded', fn);