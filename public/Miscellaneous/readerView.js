(function () {
  
  if (window !== window.top || window.location.href.includes("readerView") || window.location.href.includes("readerView")) {

    // add the readerView class to the body element (used in readerView.css)
    document.body.classList.add("readerView");
  }
  
  window.addEventListener('load', function() {

    // add the readerView parameter to specific URLs on page
    // to ensure user does not accidently nav away from readerView

    //let pageLinks = document.querySelectorAll("article a");
    let pageLinks = [
      "a.internal",
      "#nextButton",
      "#backButton",
      ".mt-icon-previous-article",
      ".mt-icon-next-article"
    ]

    pageLinks.forEach(function(sel){
      let el = document.querySelectorAll(sel)
      el.forEach(function(target){
        if (target.href.includes("libretexts.org")){
          target.href += "?readerView";
        }
      });
    });

  });
  
})();