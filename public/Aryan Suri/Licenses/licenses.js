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
						return {
							label: "cc-publicdomain",
							title: "Public Domain",
							link: "#"
						};
					case "ccby":
						return {
							label: "cc-BY",
							title: "CC BY",
							link: "https://creativecommons.org/licenses/by/4.0/"
						};
					case "ccbysa":
						return {
							label: "cc-by-sa",
							title: "CC BY-SA",
							link: "https://creativecommons.org/licenses/by-sa/4.0/"
						};
					case "ccbyncsa":
						return {
							label: "cc-by-nc-sa",
							title: "CC BY-NC-SA",
							link: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
						};
					case "ccbync":
						return {
							label: "cc-by-nc",
							title: "CC BY-NC",
							link: "https://creativecommons.org/licenses/by-nc/4.0/"
						};
					case "ccbynd":
						return {
							label: "cc-by-nd",
							title: "CC BY-ND",
							link: "https://creativecommons.org/licenses/by-nd/4.0/"
						};
					case "ccbyncnd":
						return {
							label: "cc-by-nc-nd",
							title: "CC BY-NC-ND",
							link: "https://creativecommons.org/licenses/by-nc-nd/4.0/"
						};
					case "gnu":
						return {
							label: "gnu",
							title: "GNU GPL",
							link: "https://www.gnu.org/licenses/gpl-3.0.en.html"
						};
					case "gnudsl":
						return { label: "gnudsl", title: "GNU DSL", link: "https://www.gnu.org/licenses/dsl.html" };
					case "gnufdl":
						return {
							label: "gnufdl",
							title: "GNU FDL",
							link: "https://www.gnu.org/licenses/fdl-1.3.en.html"
						};
					case "arr":
						return {
							label: "arr",
							title: "All Rights Reserved Â©",
							link: "https://en.wikipedia.org/wiki/All_rights_reserved"
						};
				}
			}
		}
	}
	return {
		label: "notset",
		title: "notset",
		link: "0#"
	};
};

(function () {

	$('body').append(`
		<div id="warningModal">
			<div id="warningModalContent">  
			</div>
		</div>
    `);

	function licenseControl() {

		const cc = getCC();
		const admin = document.getElementById('adminHolder').innerText === 'true';
		const pro = document.getElementById("proHolder").innerText === 'true';
		const groups = document.getElementById('groupHolder').innerText.toLowerCase();

		if (admin) { }
		else if (pro && groups.includes('developer')) { ccDetect(); }
		else { ccDetect(); }
		ccPageLabel();
	}

	function ccDetect() {
		const cc = getCC();
		ccCompare();
		if (cc) {
			switch (cc.label) {
				case "cc-BY":
					modalC.setAttribute("style", "background-color: #aed581;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You can can remix and distribute the work as long as proper attribution is given. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "cc-by-sa":
					modalC.setAttribute("style", "background-color: #fff176;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You can remix and distribute the work as long as proper attribution is given and your work also comes with this same license. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "cc-by-nc-sa":
					modalC.setAttribute("style", "background-color: #fff176;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You can remix and distribute the work without profit as long as proper attribution is given and your work also comes with this same license. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "cc-by-nc":
					modalC.setAttribute("style", "background-color: #fff176;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: <br> You can remix and distribute the work without profit as long as proper attribution is given. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "cc-by-nd":
					modalC.setAttribute("style", "background-color: #f44336;");

					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You can share the work if proper attribution is given, but cannot modify it in any way. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "cc-by-nc-nd":
					modalC.setAttribute("style", "background-color: #f44336;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You can share the work without profit if proper attribution is given, but cannot modify it in any way. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "gnu":
					modalC.setAttribute("style", "background-color: #fff176;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You have the freedom to run, study, share and modify the software. Learn more about this license <a href=${cc.link}>here</a>`;
					break;
				case "gnudsl":
					modalC.setAttribute("style", "background-color: #f44336;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You have the freedom to run and remix software without profit. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "gnufdl":
					modalC.setAttribute("style", "background-color: #fff176;");
					modalC.innerHTML = `<span> The content you just copied is ${cc.title} licensed: You have the freedom to run but not remix any software for profit. Learn more about this license <a href=${cc.link}>here</a> </span>`;
					break;
				case "arr":
					modalC.setAttribute("style", "background-color: #f44336;");
					modalC.innerHTML = `<span> The license of the content on this page All Rights Reserved and the content is allowed to be used on the LibreTexts platform thanks to the author. Usage off the platform requires explicit permission from the content authors.</span>`;

					break;
				case "cc-publicdomain":
					return null;
					break;
			}

		} else {
			modalC.innerHTML = `<span> The license of the content on this page is unselected. Please review the Contributors and Attributions section or the content author(s) for clarification of the applicable license(s). </span>`

		}
		document.addEventListener('copy', () => {
			$(modalB).show();
			localStorage.setItem("cc", cc.label);
			console.log(`cc cookie: ${cc.label}`);
		});
	}

	function ccCompare() {
		const cc = getCC();
		const ccm = {
			"cc-publicdomain": 1,
			"cc-BY": 2,
			"cc-by-sa": 3,
			"cc-by-nc-sa": 4,
			"cc-by-nc": 5,
			"cc-by-nd": 6,
			"cc-by-nc-nd": 7,
			"gnu": 8,
			"gnudsl": 9,
			"gnufdl": 10,
			"arr": 11,
			"notset": 12
		};
		const cct = cc.label;
		const ccs = localStorage.getItem("cc");
		if (ccm[cct] == 11) { preventCopy(); };
		if (ccs) {
			console.log(`#${ccm[ccs]} => #${ccm[cct]}`);
			switch (ccm[ccs]) {
				case 1:
					switch (ccm[cct]) {
						case 1:
						case 2:
						case 3:
						case 4:
						case 5:
						case 8:
						case 9:
						case 10:
							break;
						case 6:
						case 7:
							preventPaste()
							break;
						case 11:
						case 12:
							console.log("paste w/ warning");
							break;

					} break;
				case 2:
					switch (ccm[cct]) {
						case 1:
							console.log("paste and switch ccby");
							break;
						case 2:
						case 3:
						case 4:
						case 5:
							break;
						case 6:
						case 7:
						case 8:
						case 9:
						case 10:
						case 11:
							preventPaste()
							break;
						case 12:
							console.log("paste w/ warning");
							break;
					} break;
				case 3:
					switch (ccm[cct]) {
						case 1:
						case 12:
							console.log("paste n switch");
							break;
						case 3:
							break;
						case 2:
						case 4:
						case 5:
						case 6:
						case 7:
						case 8:
						case 9:
						case 10:
						case 11:
							preventPaste()
							break;
					} break;
				case 4:
					switch (ccm[cct]) {
						case 1:
						case 2:
						case 5:
							console.log("paste and switch ccbyncsa");
							break;
						case 4:
						case 8:
						case 9:
							break;
						case 3:
						case 6:
						case 7:
						case 10:
						case 11:
							preventPaste()
							break;
						case 12:
							break;
					} break;
				case 5:
					switch (ccm[cct]) {
						case 1:
						case 2:
							console.log("paste and switch ");
							break;
						case 5:
							break;
						case 3:
						case 4:
						case 6:
						case 7:
						case 8:
						case 9:
						case 10:
						case 11:
							preventPaste()
							break;
						case 12:
							console.log("paste w/ warning");
							break;
					} break;
				case 6:
				case 7:
					switch (ccm[cct]) {
						case 2:
						case 3:
						case 4:
						case 5:
						case 6:
						case 7:
						case 8:
						case 9:
						case 10:
						case 11:
							preventPaste()
							break;
						case 1:
						case 12:
							console.log("paste/warn/switch");
							break;
					} break;
				case 11:
					switch (ccm[cct]) {
						case 1:
						case 2:
						case 3:
						case 4:
						case 5:
						case 6:
						case 7:
						case 8:
						case 9:
						case 10:
						case 11:
						case 12:
							preventPaste()
							break;
					} break;
			}
		}
		function preventPaste() {
			$('body').bind('paste', function (e) {
				e.preventDefault();
				alert("no paste");
			});
		}

		function preventCopy() {
			$('body').bind('copy', function (e) {
				e.preventDefault();
			});
		}
	}


	/* 
		switch(ccm[cct]) {
			case 1:
			case 2: 
			case 3:
			case 4:
			case 5: 
			case 6:
			case 7:
			case 8:
			case 9:
			case 10:
			case 11:
			case 12:
		}
		
	*/
	function ccPageLabel() {
		const cc = getCC();
		if (cc) {
			const pageLabel = document.createElement("li");
			pageLabel.classList.add("pageInfo");
			if (cc.label === "gnu") {
				pageLabel.innerHTML = `<span> <a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gpl.png" alt="GNU General Public License"/></a>`;
			}
			else if (cc.label === "gnudsl") {
				pageLabel.innerHTML = `<span> <a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><p style="color: black; font-size: small">GNU Design Science License</p></a>`;
			}
			else if (cc.label === "gnufdl") {
				pageLabel.innerHTML = `<span> <a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gfdl.png" alt="GNU Free Documentation License"/></a>`;
			}
			else if (cc.label === "arr") {
				pageLabel.innerHTML = `<span> <a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/arr.png" alt="All Rights Reserved"/></a>`;
			}
			else {
				pageLabel.innerHTML = `<span> <a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><i class='cc ${cc.label}'></i></a>`;
			}


			if ($("li.elm-last-modified").length)
				$("li.elm-last-modified")[0].before(pageLabel);
			else
				pageLabel.style.display = "none";
		}
		const pageNumberHolder = document.getElementById("pageNumberHolder");
		if ($("li.elm-page-restriction").length)
			$("li.elm-page-restriction")[0].after(pageNumberHolder);
		else if (window.location.host.startsWith('query') && $("li.elm-last-modified").length)
			$("li.elm-last-modified")[0].after(pageNumberHolder);

		else
			pageNumberHolder.style.display = "none";

		const isAdmin = document.getElementById("adminHolder").innerText === 'true';

		if (!isAdmin) {
			const donor = document.createElement("script");
			donor.type = "text/javascript";
			donor.src = "https://donorbox.org/install-popup-button.js";
			if (document.getElementById("donate"))
				document.getElementById("donate").appendChild(donor);
		}
	}

	window.addEventListener('click', function (event) {
		if (event.target == modalB) {
			$(modalB).hide();
		}
	});

	const modalB = document.getElementById("warningModal");
	const modalC = document.getElementById("warningModalContent");
	document.addEventListener('DOMContentLoaded', licenseControl);
}());