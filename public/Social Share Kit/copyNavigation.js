(function () {
	function fn() {
		let nav = document.getElementsByClassName("elm-article-pagination");
		if (nav.length) {
			nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
			let media = document.getElementsByClassName("elm-social-share")[0];
			media.parentElement.insertBefore(nav, media);
		}
		if (window.location.href.includes("contentOnly")) {
			document.getElementsByClassName("elm-header")[0].style.display = "none";
		}
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
			copyTarget.setAttribute("target","_blank");
			copyTarget.title = "Transcluding will make a copy that receives updates from the original content";
			original.parentNode.insertBefore(copy, original.nextSibling)
		}
	}

	document.addEventListener('DOMContentLoaded', fn)
})();