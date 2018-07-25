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

HTMLtoJSON();
let request = new XMLHttpRequest();
let requestJSON = {
	root: window.location.href,
	batchName: window["BatchName"],
	subpages: window["BatchTable"],
};
const email = document.getElementById("userEmailHolder").textContent;
const batchPrint = document.getElementById("batchPrint");

batchPrint.innerHTML = '<button id="batchButton" onclick="batch()">Batch</button>';

const targetComputer = email === "hdagnew@ucdavis.ed" ? "home.miniland1333.com" : "batch.libretexts.org";

function batch() {
	if(window["batchComplete"]){
		window.location = window["batchComplete"];
	}
	else {
		request.open("PUT", "https://" + targetComputer + "/print/Libretext=" + window["BatchName"], true); //async get
		request.addEventListener("progress", receive);
		request.addEventListener("load", download);
		request.send(JSON.stringify(requestJSON));
		const batchButton = document.getElementById("batchButton");

		function receive(data) {
			let newText = this.responseText;
			// console.log(newText);
			newText = newText.match(/\{[^{}]+\}(?=[^}]*$)/);
			if (newText) {
				console.log(newText[0]);
				batchButton.innerText = "ETA: "+JSON.parse(newText[0]).eta
			}
		}

		function download(data) {
			let newText = this.responseText.match(/\{[^{}]+\}(?=[^}]*$)/)[0];
			const out = JSON.parse(newText);
			batchButton.innerText = "Complete!";
			window.location = "https://" + targetComputer + "/print/ZIP/" + out.filename;
			window["batchComplete"] = "https://" + targetComputer + "/print/ZIP/" + out.filename;
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
	console.log(window["BatchTable"], window["BatchName"]);

};