window.addEventListener("load", fbButtons);

function fbButtons() {

   let first_div = document.createElement("div");
   document.body.appendChild(first_div);
   first_div.id = "f";

   console.log("Function here");


   $("#f").html(`

    
    <button onclick="frontpage()" id="f_button"><i id="right" class="fa fa-long-arrow-right "></i></button>
    <div class="button_title"  id="f_title" ></div>
    <button onclick="backpage()"  id="b_button"><i id="left" class="fa fa-long-arrow-left "></i></button>
    <div class="button_title"  id="b_title"></div>`);


   let f_b = document.getElementById("f_button");
   let b_b = document.getElementById("b_button");

   first_div.append(f_b);
   first_div.append(b_b);


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


   function frontpage() {
      var x = $('.mt-icon-next-article').closest('a').attr('href');
      console.log(x);

      this.location.href = x;
   }
   function backpage() {

      var x = $('.mt-icon-previous-article').closest('a').attr('href');
      console.log(x);

      this.location.href = x;
   }

}