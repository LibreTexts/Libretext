class propagator {
	static display() {
		const target = document.createElement("div");
		let originalURL = "";
		if (window.location.href.includes("Propagator?")) {
			originalURL = decodeURIComponent(window.location.href.split("Propagator?")[1]);
		}
		target.innerHTML = `<div>Source Root URL: <input id="copySource" oninput="propagator.reset()"  value="${originalURL}" placeholder="Paste source address here"/></div>` +
			'<div><button onclick="propagator.propagate()">Propagate to other Libraries</button></div><div id="copyResults"></div>';
		target.id = "propagatorContainer";
		document.currentScript.parentNode.insertBefore(target, document.currentScript);
	}

	static async propagate() {
		this.reset();
		let url = propagator.checkURL();
		const isAdmin = document.getElementById("adminHolder").innerText === "true";
		if (!isAdmin) {
			alert("You do not have permission to perform this action");
			return false;
		}
		if (url) {
			const subdomain = url.split("/")[2].split(".")[0];
			//Disabled for careered
			let otherArray = ["bio", "biz","careered", "chem", "eng", "geo", "human", "math", "med", "phys", "socialsci", "stats"];
			if (otherArray.includes(subdomain)) {
				let index = otherArray.indexOf(subdomain);
				if (index > -1) {
					otherArray.splice(index, 1);
					let path = url.split("/").slice(3).join("/");

					this.reset();
					for (let i = 0; i < otherArray.length; i++) {
						this.loader(otherArray[i], "Propagating...");
					}
					let response = await fetch(`https://api.libretexts.org/propagator/receive`, {
						method: "PUT",
						body: JSON.stringify({
							username: document.getElementById("usernameHolder").innerText,
							url: url,
						})
					});
					this.reset();
					response = await response.json();
					for (let i = 0; i < otherArray.length; i++) {
						if (response[i] === true) {
							status = `Done! See this page at <a href="https://${otherArray[i]}.libretexts.org/${path}">https://${otherArray[i]}.libretexts.org/${path}</a>`;
						}
						else {
							status = `Error: ${response[i]}`;
						}
						this.loader(otherArray[i], status);

					}
				}
			}
		}
		else {
			alert("URL [" + url + "] is not valid!");
		}
	}


	static loader(subdomain, status) {
		let thing = document.createElement("div");
		thing.id = "results" + subdomain;
		thing.classList.add("propagatorLoader");
		thing.innerHTML = `<img src="https://static.libretexts.org/img/LibreTexts/glyphs_blue/${subdomain}.png"><div class="loaderStatus">${status}</div>`;
		document.getElementById("copyResults").appendChild(thing);
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
		document.getElementById("copyResults").innerHTML = "";
	}
}

propagator.display();