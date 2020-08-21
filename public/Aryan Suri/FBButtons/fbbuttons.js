window.addEventListener("load", fbButtons);

function fbButtons() {
   if(window !== window.top) //don't show in iFrame
      return;
   
   let fbDiv = document.createElement("div");
   let fbNext = $('.mt-icon-next-article').closest('a').attr('href');
   let fbBack = $('.mt-icon-previous-article').closest('a').attr('href');


   document.body.append(fbDiv);
   $(fbDiv).html(`

    
    <a href="${fbNext}"><button id="fButton"><i id="fbRight" class="fa fa-long-arrow-right "></i></button></a>
    <div class="button_title"  id="fTitle" ></div>
    <a href="${fbBack}"><button id="bButton"><i id="fbLeft" class="fa fa-long-arrow-left "></i></button></a>
    <div class="button_title"  id="bTitle"></div>

    `);


   $('#fTitle').text($("a.mt-icon-next-article span").first().text());
   $('#bTitle').text($("a.mt-icon-previous-article span").first().text());

   $("#fButton").hover(function () {
      $('#fTitle').fadeIn(200);
   }, function () {
      $('#fTitle').fadeOut(200);

   });

   $("#bButton").hover(function () {
      $('#bTitle').fadeIn(200);
   }, function () {
      $('#bTitle').fadeOut(200);

   });



   if ($("#pageTagsHolder").text().includes('"article:topic"')) {

   } else {
      $(fbDiv).remove();
   }
}

