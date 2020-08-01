var entire = document.getElementById("f");

entire.innerHTML=`

<button onclick="frontpage()" id="f_button"><i id="right" class="fa fa-long-arrow-right "></i></button>
<div id="f_title" ></div>
<button onclick="backpage()" id="b_button"><i id="left" class="fa fa-long-arrow-left "></i></button>
<div id="b_title"></div>

`;

let f_b = document.getElementById("f_button");
let b_b = document.getElementById("b_button");
document.body.appendChild(f_b);
document.body.appendChild(b_b);


$(document).ready(function() {
    $('#f_title').text($("a.mt-icon-next-article span").first().text());
    $('#b_title').text($("a.mt-icon-previous-article span").first().text());
});


$("#f_button").hover( function(){
   $('#f_title').fadeIn(200); 
   }, function(){
   $('#f_title').fadeOut(200);

});

$("#b_button").hover( function(){
   $('#b_title').fadeIn(200); 
   }, function(){
   $('#b_title').fadeOut(200);

});