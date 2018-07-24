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

const batchPrint = document.getElementById("batchPrint");

batchPrint.innerHTML = '<button onclick="batch()">Batch</button>';

function batch() {
	request.open("PUT", "https://home.miniland1333.com/print/Libretext=" + window["BatchName"], true); //async get
	request.addEventListener("progress", receive);
	request.addEventListener("load", download);
	request.send(JSON.stringify(requestJSON));
	let last = "";

	function receive(data) {
		console.log(this.responseText.replace(last, "").match(/\{[^{}]+\}(?=[^{}]*$)/));
		last = this.responseText;
	}

	function download(data) {
		last = this.responseText.match(/\{[^{}]+\}(?=[^{}]*$)/);
		const out = JSON.parse(last);
		setTimeout(() => window.location = "https://home.miniland1333.com/print/ZIP/" + out.filename, 2000);
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

	HTML = HTML[0].children[0].children;
	let link;

	for (let i = 0; i < HTML.length; i++) {
		link = HTML[i].children[0];
		JSON[link.textContent] = {link: link.href, children: getChildren(HTML[i])};
	}
	window["BatchTable"] = JSON;
	window["BatchName"] = title + URL.length;
	console.log(window["BatchTable"], window["BatchName"]);
};