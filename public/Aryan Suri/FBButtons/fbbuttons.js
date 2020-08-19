window.addEventListener("load", fbButtons);


//init function
function fbButtons() {

   let first_div = document.createElement("div");
   document.body.append(first_div);
   
   //TODO: Replace onclick functionality with links <a src=`${forward_link}`/>
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

   if($("#pageTagsHolder").text().includes('"article:topic"')){
       console.log("found section/page");
       
       
   } else {  
       $(first_div).remove();
   }
    
   

}
/*
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
*/
