(function () {
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
							return {label: "gnudsl", title: "GNU DSL", link: "https://www.gnu.org/licenses/dsl.html"};
						case "gnufdl":
							return {
								label: "gnufdl",
								title: "GNU FDL",
								link: "https://www.gnu.org/licenses/fdl-1.3.en.html"
							};
						case "arr":
							return {label: "arr", title: "All Rights Reserved Â©",};
						
					}
				}
			}
		}
		return null; //not found
	}
	
	$('body').append(`
                <div id="warningModal">
					<div id="warningModalSlide">
                            <span id="warningModalChild"></span>
                    </div>
                </div>
		`);
	
	function ccDetector() {
		const cc = getCC();
		console.log(cc);
		if (cc) {
			$("#warningModal").slideDown(800);
			$('#warningModalSlide').slideDown(800);
			switch (cc.label) {
				case "cc-BY":
					thing_parent.setAttribute("style", "background-color: #aed581;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can can remix and distribute the work as long as proper attribution is given. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "cc-by-sa":
					thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can remix and distribute the work as long as proper attribution is given and your work also comes with this same license. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "cc-by-nc-sa":
					thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can can remix and distribute the work without profit as long as proper attribution is given and your work also comes with this same license. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "cc-by-nc":
					thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: <br> You can can remix and distribute the work without profit as long as proper attribution is given. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "cc-by-nd":
					thing_parent.setAttribute("style", "background-color: #f44336;");
					
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can can share the work if proper attribution is given, but cannot modify it in any way. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "cc-by-nc-nd":
					thing_parent.setAttribute("style", "background-color: #f44336;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can can share the work without profit if proper attribution is given, but cannot modify it in any way. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "gnu":
					thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You have the freedom to run, study, share and modify the software. Learn more about this license <a href=${cc.link}>here</a>`;
					break;
				case "gnudsl":
					thing_parent.setAttribute("style", "background-color: #f44336;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You have the freedom to run and remix software without profit. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "gnufdl":
					thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You have the freedom to run but not remix any software for profit. Learn more about this license <a href=${cc.link}>here</a> `;
					break;
				case "arr":
					thing_parent.setAttribute("style", "background-color: #f44336;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You are NOT allowed to distribute or remix the content at all.`;
					
					break;
				case "cc-publicdomain":
					return null;
					break;
			}
			
		}
	}
	
	function ccPageLabel() {
		const cc = getCC();
		if (cc) {
			const pageLabel = document.createElement("li");
			pageLabel.classList.add("pageInfo");
			if (cc.label === "gnu") {
				pageLabel.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gpl.png" alt="GNU General Public License"/></a>`;
			}
			else if (cc.label === "gnudsl") {
				pageLabel.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><p style="color: black; font-size: small">GNU Design Science License</p></a>`;
			}
			else if (cc.label === "gnufdl") {
				pageLabel.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gfdl.png" alt="GNU Free Documentation License"/></a>`;
			}
			else if (cc.label === "arr") {
				pageLabel.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/arr.png" alt="All Rights Reserved"/></a>`;
			}
			else {
				pageLabel.innerHTML = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size:30px" href="${cc.link}"><i class='cc ${cc.label}'></i></a>`;
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
			$(".elm-social-share")[0].innerHTML = html;
			SocialShareKit.init();
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
		if (event.target == modal) {
			$("#warningModal").slideUp(800);
			$('#warningModalSlide').slideUp(800);
		}
	});
	
	
	const modal = document.getElementById("warningModal");
	const thing = document.getElementById("warningModalChild");
	const thing_parent = document.getElementById("warningModalSlide");
	document.body.appendChild(modal);
	document.addEventListener("copy", ccDetector);
	document.addEventListener('DOMContentLoaded', ccPageLabel)
})();