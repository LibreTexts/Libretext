var upperDiv = document.getElementById("ffs");
upperDiv.innerHTML=`
<button id="myBtn">Customize Page</button>
<div class="modal_ar" id="myModal">
  <div class="modal-content_ar">
    <h1>Customize Page
      <span class="close_ar">&times;</span>
    </h1>

    <p>
      <b class="h_ar">Select Font:</b>
      <select id="fs">
        
        <option value="Arial">Arial</option>
        <option value="Comic Sans MS">Comic Sans MS</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Impact ">Impact</option>
        <option value="Roboto">Roboto</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana ">Verdana</option>
      </select>
      <div class="slidecontainer_ar">
        <b class='h_ar'>Font Size:</b>
        <input id="size" type="range" min="10" max="50" value="" class="slider_ar">
        <b class='h_ar'>Page Width:</b>
        <input id="width" type="range" min="0" max="400" value="" class="slider_ar">
      </div>

      <a id="darkbtn" class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>
    </p>
  </div>
</div>



<p class="changeMe">
  So insisted received is occasion advanced honoured. Among ready to which up. Attacks smiling and may out assured moments man nothing outward. Thrown any behind afford either the set depend one temper. Instrument melancholy in acceptance collecting frequently be if. Zealously now pronounce existence add you instantly say offending. Merry their far had widen was. Concerns no in expenses raillery formerly.

  Kindness to he horrible reserved ye. Effect twenty indeed beyond for not had county. The use him without greatly can private. Increasing it unpleasant no of contrasted no continuing. Nothing colonel my no removed in weather. It dissimilar in up devonshire inhabiting.

  Sigh view am high neat half to what. Sent late held than set why wife our. If an blessing building steepest. Agreement distrusts mrs six affection satisfied. Day blushes visitor end company old prevent chapter. Consider declared out expenses her concerns. No at indulgence conviction particular unsatiable boisterous discretion. Direct enough off others say eldest may exeter she. Possible all ignorant supplied get settling marriage recurred.

  Unpacked now declared put you confined daughter improved. Celebrated imprudence few interested especially reasonable off one. Wonder bed elinor family secure met. It want gave west into high no in. Depend repair met before man admire see and. An he observe be it covered delight hastily message. Margaret no ladyship endeavor ye to settling.

  Impossible considered invitation him men instrument saw celebrated unpleasant. Put rest and must set kind next many near nay. He exquisite continued explained middleton am. Voice hours young woody has she think equal. Estate moment he at on wonder at season little. Six garden result summer set family esteem nay estate. End admiration mrs unreserved discovered comparison especially invitation.

  Offered say visited elderly and. Waited period are played family man formed. He ye body or made on pain part meet. You one delay nor begin our folly abode. By disposed replying mr me unpacked no. As moonlight of my resolving unwilling.

  Consulted perpetual of pronounce me delivered. Too months nay end change relied who beauty wishes matter. Shew of john real park so rest we on. Ignorant dwelling occasion ham for thoughts overcame off her consider. Polite it elinor is depend. His not get talked effect worthy barton. Household shameless incommode at no objection behaviour. Especially do at he possession insensible sympathize boisterous it. Songs he on an widen me event truth. Certain law age brother sending amongst why covered.

  In show dull give need so held. One order all scale sense her gay style wrote. Incommode our not one ourselves residence. Shall there whose those stand she end. So unaffected partiality indulgence dispatched to of celebrated remarkably. Unfeeling are had allowance own perceived abilities.

  Windows talking painted pasture yet its express parties use. Sure last upon he same as knew next. Of believed or diverted no rejoiced. End friendship sufficient assistance can prosperous met. As game he show it park do. Was has unknown few certain ten promise. No finished my an likewise cheerful packages we. For assurance concluded son something depending discourse see led collected. Packages oh no denoting my advanced humoured. Pressed be so thought natural.

  Arrived compass prepare an on as. Reasonable particular on my it in sympathize. Size now easy eat hand how. Unwilling he departure elsewhere dejection at. Heart large seems may purse means few blind. Exquisite newspaper attending on certainty oh suspicion of. He less do quit evil is. Add matter family active mutual put wishes happen.





</p>

`

var modal = document.getElementById("myModal");
document.body.appendChild(modal);
// <a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close_ar")[0];
let bLine = document.getElementById("bLine");
// When the user clicks the button, open the modal 

btn.onclick = function() {
  modal.style.display = "block";
}

if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
			localStorage.setItem('darkMode', true);
		if (localStorage.getItem('darkMode') === 'true')
			$('.elm-skin-container').addClass('darkMode');
/*
if(window.beelineEnabled) {
				bLine.innerHTML += `<div class="LTdropdown beeline-toggles" style="float:left; background-color: #d4d4d4; color:black"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div><div class="LTdropdown-content" style="right: 0">`;
				bLine.innerHTML += `<a class="btn btn-large" style="display: flex" href="http://www.beelinereader.com/education/?utm_source=libretexts" target="_blank"
title="BeeLine helps you read on screen more easily by using a color gradient that pulls your eyes through the text. Try out the color schemes to find your favorite to use on LibreTexts. Be sure to check out BeeLine's apps and plugins, so you can read PDFs, Kindle books, and websites more easily!">
<img style="margin-right: 5px; width:25px; height: 25px" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png">About BeeLine</a>`;
				bLine.innerHTML += `<a class="btn btn-large" data-color="bright">Bright</a>`;
				bLine.innerHTML += `<a class="btn btn-large" data-color="dark">Dark</a>`;
				bLine.innerHTML += `<a class="btn btn-large" data-color="blues">Blues</a>`;
				bLine.innerHTML += `<a class="btn btn-large" data-color="gray">Gray</a>`;
				bLine.innerHTML += `<a class="btn btn-large" data-color="night_blues">Inverted</a>`;
				bLine.innerHTML += `<a class="btn btn-large active" data-color="off">Off</a>`;
				bLine.innerHTML += `<a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;
				bLine.innerHTML += `</div></div>`;
			}
*/


//When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

span.onclick = function() {
  modal.style.display = "none";
}

$('.changeMe').css("font-size", localStorage.getItem('font_size') + "px");
console.log(localStorage.getItem('font_size') + ": INITIAL SIZE");

$('.changeMe').css("font-family", localStorage.getItem('font_family') );
console.log(localStorage.getItem('font_family') + ": INITIAL FONT");

$('.changeMe').css("margin-left", localStorage.getItem('page_width') + "px" );
console.log(localStorage.getItem('page_width') + ": INITIAL WIDTH");

$('.changeMe').css("margin-right", localStorage.getItem('page_width') + "px" );
console.log(localStorage.getItem('page_width') + ": INITIAL WIDTH");


$("#fs").change(function() {
    //alert($(this).val());
    var initial_data = $(this).val();
    $('.changeMe').css("font-family", initial_data);
    $("#fs").val(initial_data);
    
    
    localStorage.setItem('font_family', initial_data);
    var final_data = localStorage.getItem('font_family');
    console.log(final_data +": FINAL FONT");
});



$("#size").change(function() {
    var initial_data = $(this).val();
  
    
    //CHANGE CSS TO SIZE FUNC VALUE
    $('.changeMe').css("font-size", initial_data  + "px");
    //INPUT THAT AS A PLACE HOLDER VALUE 
    $("#size").val(initial_data);
    
    //LOG SIZE VALUE AFTER INPUT DATA
  
    localStorage.setItem('font_size', initial_data);
    var final_data = localStorage.getItem('font_size');
    console.log(final_data +": FINAL SIZE");
   
});


$("#width").change(function() {
    var initial_data = $(this).val();
    
    
    $('.changeMe').css("margin-left", initial_data + "px");
    $('.changeMe').css("margin-right", initial_data + "px");
    
     $("#width").val(initial_data);
    
    
     localStorage.setItem('page_width', initial_data);
    var final_data = localStorage.getItem('page_width');
    console.log(final_data +": FINAL WIDTH");
    
});