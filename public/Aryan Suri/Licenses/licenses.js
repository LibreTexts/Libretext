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
						return null /*label: "cc-publicdomain", title: "Public Domain", link: "#"*/;
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
						return { label: "arr", title: "All Rights Reserved Â©", };
				}
			}
		}
	}
	return null; //not found
}

(function () {

	$('body').append(`
                <div id="warningModal">
					<div id="warningModalContent">  
                    </div>
                </div>
		`);

	function controlCopy() {

		const cc = getCC();
		const admin = document.getElementById('adminHolder').innerText === 'true';
		const pro = document.getElementById("proHolder").innerText === 'true';
		const groups = document.getElementById('groupHolder').innerText.toLowerCase();

		if (admin) { console.log("admin") }
		else if (pro && groups.includes('developer')) { console.log("developer") }
		else if (pro && (groups.includes('basicuser') || groups.includes('workshop'))) {
			if (cc) {
				localStorage.setItem("cc", cc.label);
				console.log("basicuser");
				switch (cc.label) {
					case "arr":
						$('body').bind('copy paste cut', function (e) {
							e.preventDefault();
							ccDetector();
						});
						break;
					default: document.addEventListener("copy", ccDetector);
				}
			}
			else {
				document.addEventListener("copy", ccDetector);
			}
		} else {
			if (cc) {
				localStorage.setItem("cc", cc.label);
				switch (cc.label) {
					case "arr":
						$('body').bind('copy paste cut', function (e) {
							e.preventDefault();
							ccDetector();
						});
						break;
					default: document.addEventListener("copy", ccDetector);
				}
			}
			else {
				document.addEventListener("copy", ccDetector);
			}
		}
	}


	function ccDetector() {
		const cc = getCC();
		if (cc) {
			$(modalB).show();
			switch (cc.label) {
				// NC INNER HTML CASES NOT NEEDED ANYMORE // 
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
			$(modalB).show();
			modalC.innerHTML = `<span> The license of the content on this page is unselected. Please review the Contributors and Attributions section or the content author(s) for clarification of the applicable license(s). </span>`

		}
	}


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
		if ($(".elm-social-share").length) {
			let html = '<div class="ssk-group optimize"><div href="" class="ssk ssk-facebook"></div><div href="" class="ssk ssk-twitter"></div><div id="batchPrint"></div>';
			if (!isAdmin)
				html += '<a href="https://donorbox.org/libretexts" class="custom-dbox-popup notSS" id="donate"><span>Donate</span></a></div>';
			else
			        html +='</div>';
			$(".elm-social-share")[0].innerHTML = html;
			//SocialShareKit.init();
			window.DonorBox = { widgetLinkClassName: 'custom-dbox-popup' };
		}


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
	document.addEventListener('DOMContentLoaded', ccPageLabel);
	document.addEventListener('DOMContentLoaded', controlCopy);
})();
