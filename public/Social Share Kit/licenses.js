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
							return { label: "cc-BY", title: "CC BY",  link: "https://creativecommons.org/licenses/by/4.0/" };
						case "ccbysa":
							return { label: "cc-by-sa", title: "CC BY-SA",  link: "https://creativecommons.org/licenses/by-sa/4.0/" };
						case "ccbyncsa":
							return { label: "cc-by-nc-sa", title: "CC BY-NC-SA",  link: "https://creativecommons.org/licenses/by-nc-sa/4.0/" };
						case "ccbync":
							return { label: "cc-by-nc", title: "CC BY-NC",  link: "https://creativecommons.org/licenses/by-nc/4.0/" };
						case "ccbynd":
							return { label: "cc-by-nd", title: "CC BY-ND",  link: "https://creativecommons.org/licenses/by-nd/4.0/" };
						case "ccbyncnd":
							return { label: "cc-by-nc-nd", title: "CC BY-NC-ND",  link: "https://creativecommons.org/licenses/by-nc-nd/4.0/" };
						case "gnu":
							return { label: "gnu", title: "GNU GPL",  link: "https://www.gnu.org/licenses/gpl-3.0.en.html" };
						case "gnudsl":
							return { label: "gnudsl", title: "GNU DSL",  link: "https://www.gnu.org/licenses/dsl.html" };
						case "gnufdl":
							return { label: "gnufdl", title: "GNU FDL",  link: "https://www.gnu.org/licenses/fdl-1.3.en.html" };
						case "arr":
							return { label: "arr", title: "All Rights Reserved ©",  };

					}
				}
			}
		}
		return null; //not found
	}

	document.getElementById("main_div").innerHTML =
		`
                <div class="modal" id="myModal">
					<div class="modal-content" id="myModal_Slide">
                            <span  id="myModal_Child"></span>

                    </div>
                </div>
         
		`;

	function ccDetector() {
		const cc = getCC();
        console.log(cc);
		if (cc) {
            $("#myModal").slideDown(800);
            $('#myModal_Slide').slideDown(800);
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
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You can can share the work without profit if proper attribution is given, but cannot modify it in any way. Learn more about this liscense <a href=${cc.link}>here</a> `;
					break;
                case "gnu":
                    thing_parent.setAttribute("style", "background-color: #fff176;");
					thing.innerHTML = `The content you just copied is ${cc.title} licensed: You have the freedom to run, study, share and modify the software. Learn more about this liscense <a href=${cc.link}>here</a>`;
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
	  window.addEventListener('click',function(event) {
	  if (event.target == modal) {
          $("#myModal").slideUp(800);
          $('#myModal_Slide').slideUp(800); 
     
      
	  }
	} );


	const modal = document.getElementById("myModal");
	const thing = document.getElementById("myModal_Child");
    const thing_parent = document.getElementById("myModal_Slide");
    document.body.appendChild(modal);
	document.addEventListener("copy", ccDetector);
})();
