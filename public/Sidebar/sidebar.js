window.addEventListener("load", fbButtons);


//init function
function fbButtons() {

   let first_div = document.createElement("div");
   document.body.append(first_div);

   //inner HTML
   $(first_div).html(`

    
    <button onclick="next_article_page()" id="f_button"><i id="right" class="fa fa-long-arrow-right "></i></button>
    <div class="button_title"  id="f_title" ></div>
    <button onclick="previous_article_page()"  id="b_button"><i id="left" class="fa fa-long-arrow-left "></i></button>
    <div class="button_title"  id="b_title"></div>`);

   $(document).ready(function () {
      $('#f_title').text($("a.mt-icon-next-article span").first().text());
      $('#b_title').text($("a.mt-icon-previous-article span").first().text());
   });


   $("#f_button").hover(function () {
      $('#f_title').fadeIn(200);
   }, function () {
      $('#f_title').fadeOut(200);

   });

   $("#b_button").hover(function () {
      $('#b_title').fadeIn(200);
   }, function () {
      $('#b_title').fadeOut(200);

   });

   if ($("dd.mt-classification-value a:first").text() != 'Section or Page') {

      $(first_div).remove();

   } else {
      console.log("btn show");

   }

}
//Link Content
function next_article_page() {
   let x = $('.mt-icon-next-article').closest('a').attr('href');
   console.log(x);

   this.location.href = x;
}

function previous_article_page() {

   let x = $('.mt-icon-previous-article').closest('a').attr('href');
   console.log(x);

   this.location.href = x;
}