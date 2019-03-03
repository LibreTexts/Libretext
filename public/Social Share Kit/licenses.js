(function () {
	function fn() {
		const cc = getCC();
		if (cc) {
			const thing = document.createElement("li");
			thing.classList.add("pageInfo");
			if (cc.label === "gnu") {
				thing.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gpl.png" alt="GNU General Public License"/></a>`;
			}
			else if (cc.label === "gnudsl") {
				thing.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><p style="color: black; font-size: small">GNU Design Science License</p></a>`;
			}
			else if (cc.label === "gnufdl") {
				thing.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gfdl.png" alt="GNU Free Documentation License"/></a>`;
			}
			else if (cc.label === "arr") {
				thing.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/arr.png" alt="All Rights Reserved"/></a>`;
			}
			else {
				thing.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><i class='cc ${cc.label}'></i></a>`;
			}


			if ($("li.elm-last-modified").length)
				$("li.elm-last-modified")[0].before(thing);
			else
				thing.style.display = "none";
		}

		socialShareConfig();
	}

	function getCC() {
		let tags = document.getElementById("pageTagsHolder");
		if (tags) {
			tags = tags.innerText;
			tags = tags.replace(/\\/g, "");
			tags = JSON.parse(tags);
			for (let i = 0; i < tags.length; i++) {
				if (tags[i].includes("license")) {
					let tag = tags[i].split(":")[1];
					switch (tag) {
						case "publicdomain":
							return {label: "cc-publicdomain", link: "#"};
						case "ccby":
							return {label: "cc-BY", link: "https://creativecommons.org/licenses/by/4.0/"};
						case "ccbysa":
							return {label: "cc-by-sa", link: "https://creativecommons.org/licenses/by-sa/4.0/"};
						case "ccbyncsa":
							return {label: "cc-by-nc-sa", link: "https://creativecommons.org/licenses/by-nc-sa/4.0/"};
						case "ccbync":
							return {label: "cc-by-nc", link: "https://creativecommons.org/licenses/by-nc/4.0/"};
						case "ccbynd":
							return {label: "cc-by-nd", link: "https://creativecommons.org/licenses/by-nd/4.0/"};
						case "ccbyncnd":
							return {label: "cc-by-nc-nd", link: "https://creativecommons.org/licenses/by-nc-nd/4.0/"};
						case "gnu":
							return {label: "gnu", link: "https://www.gnu.org/licenses/gpl-3.0.en.html"};
						case "gnudsl":
							return {label: "gnudsl", link: "https://www.gnu.org/licenses/dsl.html"};
						case "gnufdl":
							return {label: "gnufdl", link: "https://www.gnu.org/licenses/fdl-1.3.en.html"};
						case "arr":
							return {label: "arr"};

					}
				}
			}
		}
		return null; //not found
	}

	function socialShareConfig() {
		if ($(".elm-social-share").length) {
			$(".elm-social-share")[0].innerHTML = '<div class="ssk-group optimize"><div href="" class="ssk ssk-facebook"></div><div href="" class="ssk ssk-twitter"></div><a id="printme" class="material-icons notSS" href="" target="_blank" title="Get a PDF of this page">picture_as_pdf</a><div id="batchPrint"></div><a href="https://donorbox.org/libretexts" class="custom-dbox-popup notSS" id="donate"><span>Donate</span></a></div>';
			SocialShareKit.init();
			window.DonorBox = {widgetLinkClassName: 'custom-dbox-popup'};
		}

		const donor = document.createElement("script");
		donor.type = "text/javascript";
		donor.src = "https://donorbox.org/install-popup-button.js";
		if (document.getElementById("donate"))
			document.getElementById("donate").appendChild(donor);

		let printme = document.getElementById("printme");
		let email = document.getElementById('userEmailHolder').textContent;
		if (printme) {
			printme.rel = "nofollow";
			//${email === 'hdagnew@ucdavis.edu' ? 'home.miniland1333.com' : 'dynamic.libretexts.org'}
			printme.href = `https://dynamic.libretexts.org/print/url=${window.location}.pdf`;
		}
		const thing = document.getElementById("pageNumberHolder");
		if ($("li.elm-page-restriction").length)
			$("li.elm-page-restriction")[0].after(thing);
		else
			thing.style.display = "none";
	}

	document.addEventListener('DOMContentLoaded', fn)
})();