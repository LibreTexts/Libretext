(function () {
	function fn() {
		let nav = document.getElementsByClassName("elm-article-pagination");
		if (nav.length) {
			nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
			let media = document.getElementsByClassName("elm-social-share")[0];
			media.parentElement.insertBefore(nav, media);
		}
		if (window !== window.top && window.location.href.includes("contentOnly")) {
			document.getElementsByClassName("elm-header")[0].style.display = "none";
			document.getElementById("mt-summary").style.setProperty("display", "none", "important");
		}
		propagatorOption();
		remixerOption();
		copyTranscludeOption();
	}

	function copyTranscludeOption() {
		let copy = document.getElementsByClassName("mt-user-menu-copy-page");
		if (copy.length) {
			let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
			copy = original.cloneNode(true);
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/Copy_Transclude?" + encodeURIComponent(window.location.href);
			copyTarget.innerText = "Copy-Transclude";
			copyTarget.classList.add("mt-icon-paste3");
			copyTarget.classList.remove("mt-icon-copy-page");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Transcluding will make a copy that receives updates from the original content";
			original.parentNode.insertBefore(copy, original.nextSibling)
		}
	}

	function propagatorOption() {
		let copy = document.getElementsByClassName("mt-user-menu-copy-page");
		if (copy.length) {
			let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
			copy = original.cloneNode(true);
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/Propagator?" + encodeURIComponent(window.location.href);
			copyTarget.innerText = "Propagate";
			copyTarget.classList.add("mt-icon-cycle");
			copyTarget.classList.remove("mt-icon-copy-page");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Propagate this page to other libraries";
			original.parentNode.insertBefore(copy, original.nextSibling)
		}
	}

	function remixerOption() {
		let copy = document.getElementsByClassName("mt-new-page");
		if (copy.length) {
			let original = document.getElementsByClassName("mt-new-page")[0];
			copy = original.cloneNode(true);
			let copyTarget = copy.getElementsByTagName("a")[0];
			copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/LibreText_Remixer";
			copyTarget.innerText = "Remixer";
			copyTarget.classList.add("mt-icon-tree");
			copyTarget.classList.remove("mt-icon-new-page");
			copyTarget.setAttribute("target", "_blank");
			copyTarget.title = "Remix a new LibreText";
			original.parentNode.insertBefore(copy, original.nextSibling)
		}
	}

	document.addEventListener('DOMContentLoaded', fn)
})();