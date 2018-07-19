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

(function HTMLtoJSON() {
	let HTML = $("#treeHolder .wiki-tree");
	let JSON = {};
	let URL = window.location.href;

	//get content root
	URL = URL.split("/").slice(0, 6).join("/");
	if (window.location.href === URL) {
		//at content root already
	}
	HTML = HTML[0].children[0].children;
	let link;

	//Find Current Libretext
	for (let i = 0; i < HTML.length; i++) { //for each college
		if (HTML[i].children[1] && HTML[i].children[1].children) {
			link = HTML[i].children[1].children; //if contains libretexts
			for (let j = 0; j < link.length; j++) {
				if (link[j].children[0].href === URL) {
					HTML = link[j].children[1].children;
					break;
				}
			}
		}
	}

	for (let i = 0; i < HTML.length; i++) {
		link = HTML[i].children[0];
		JSON[link.textContent] = {link: link.href, children: getChildren(HTML[i])};
	}
	window["TOCTable"] = JSON;
	window["TOCName"] = URL;
	console.log(JSON);
}());