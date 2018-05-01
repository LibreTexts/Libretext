

(function(){
	function fn ()
	{
		let nav = document.getElementsByClassName("elm-article-pagination");
		if(nav.length) {
			nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
			let media = document.getElementsByClassName("elm-social-share")[0];
			media.parentElement.insertBefore(nav, media);
		}
	}
	document.addEventListener('DOMContentLoaded', fn)
})();