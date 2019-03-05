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
	let email = document.getElementById('userEmailHolder').textContent;
	const targetComputer = 'batch.libretexts.org';
	//email === 'hdagnew@ucdavis.edu'
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
		email = ['hdagnew@ucdavis.edu', 'delmarlarsen@gmail.com', 'dlarsen@ucdavis.edu'].includes(email);
		const batchPrint = document.getElementById("batchPrint");
		batchPrint.innerHTML = (email ? '<button id="batchButton" onclick="batch()" style="margin-right: 2px"><span>Batch</span></button><a id="getTOCLink" class="notSS" target="_blank">TOC</a>' : "") + '<a href="https://chem.libretexts.org/Under_Construction/Users/Henry/How_to_use_the_LMS_Thin_Common_Cartridge" target="_blank" id="thinCC" onClick="thinCC()" style="margin-right: 2px" title="Export to LMS"><span>LMS</span></a>';
		let getTOCLink = document.getElementById("getTOCLink");
		if (getTOCLink) {
			getTOCLink.rel = "nofollow";
			getTOCLink.href = `https://dynamic.libretexts.org/print/toc=${window.location.href}`;
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
		const textToSave = JSONtoXML();
		const textToSaveAsBlob = new Blob([textToSave], {type: "application/xml"});
		const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
		const fileNameToSaveAs = 'imsmanifest.xml';
		
		const downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		downloadLink.href = textToSaveAsURL;
		downloadLink.onclick = this.destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
		
		downloadLink.click();
	}
	
	/**
	 * @return {string}
	 */
	function JSONtoXML() {
		let
			root = window.location.href,
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
						`                <title>${item.title}</title>`;
					item.resources.forEach((resource) => {
						const identifier = getIdentifier();
						org += `
                <item identifier="${identifier}" identifierref="${identifier}_R">
                    <title>${resource.title}</title>
                </item>`;
						resources += `
        <resource identifier="${identifier}_R" type="imswl_xmlv1p3">
            <webLink>
                <title>${resource.title}</title>
                <url href="${resource.url}"/>
            </webLink>
        </resource>`;
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
			"        <schema>IMS Thin Common Cartridge</schema>\n" +
			"        <schemaversion>1.3.0</schemaversion>\n" +
			"    </metadata>\n" +
			"    <organizations>\n" +
			"        <organization identifier=\"T_1000\" structure=\"rooted-hierarchy\">\n" +
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
	
	function batch() {
		if (window["batchComplete"]) {
			window.location = window["batchComplete"];
		}
		else {
			request.open("GET", "https://" + targetComputer + "/print/Libretext=" + window.location.href, true); //async get
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