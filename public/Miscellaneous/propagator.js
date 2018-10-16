class propagator {
	static display() {
		const target = document.createElement("div");
		let originalURL = "";
		if (window.location.href.includes("Propagator?")) {
			originalURL = decodeURIComponent(window.location.href.split("Propagator?")[1]);
		}
		target.innerHTML = `<div>Source Root URL: <input id="copySource" oninput="propagator.reset()"  value="${originalURL}" placeholder="Paste source address here"/></div>` +
			'<div>Username to Authenticate: <input id="user" oninput="propagator.reset()" placeholder="Username"/></div>' +
			'<div>Password to Authenticate: <input id="password" oninput="propagator.reset()" placeholder="Password" type="password"/></div>' +
			'<div><button onclick="propagator.propagate()">Propagate to other Libraries</button></div><div id="copyResults"></div>';
		target.id = "propagatorContainer";
		document.currentScript.parentNode.insertBefore(target, document.currentScript);
	}

	static async propagate() {
		this.reset();
		let url = propagator.checkURL();
		if (url) {
			const subdomain = url.split(".")[0];
			if (this.libraries.includes(subdomain)) {
				let otherArray = ["bio", "biz", "chem", "eng", "geo", "human", "math", "med", "photon", "phys", "socialsci", "stats"];
				let index = otherArray.indexOf(subdomain);
				if (index > -1) {
					otherArray = otherArray.splice(index, 1);
					let promiseArray = [];
					let path = url.split("/")[1];
					for (let i = 0; i < otherArray.length; i++) {
						await loader(otherArray[i]);
						promiseArray.push(propagator.propagatePage(otherArray[i], path));
					}
					await Promise.all(promiseArray);
				}
			}
		}
		else {
			alert("URL [" + url + "] is not valid!")
		}
	}

	static async propagatePage(subdomain, path) {
	}

	static async loader(subdomain) {
	}

	static checkURL() {
		let url = document.getElementById("copySource").value;
		if (url) {
			let urlArray = url.split("/");
			if (urlArray && urlArray.length >= 2 && urlArray[2].includes("libretexts.org")) {
				return url;
			}
		}
		return false;
	}

	static reset() {

	}
}

propagator.display();