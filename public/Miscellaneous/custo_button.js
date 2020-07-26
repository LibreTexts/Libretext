var upperDiv = document.getElementById("ffs");
upperDiv.innerHTML=`

<div id="sidebar1"  class="custom_sidebar">
  <div class="top-bar" style="">
        <div class="top-bar-unit">
            <h5 id="acess_home">Directory</h5>
        </div>

        <div class="top-bar-unit" style="background-color: #ececec; color:white;" >
            <h5 >Accessibility</h5>
        </div>

        <div class="top-bar-unit">
            <h5 id="acess_refer" class="">References</h5>
        </div>
  
        <div class="top-bar-unit">
            <h5 id="acess_developer" class="">Developers</h5>
        </div>

        <!--<div class="top-bar-unit">    
            <a id="custom_close1" class="custom_close" href="javascript:void(0)" >×</a>
        </div>--!>
  </div>
    <p class="h_ar">Select Font:</p>
    <div class="custom_field">      
        <select id="fs">
        
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
        </select>
    </div>
    <p class="h_ar">Font Size:</p>
    <div class="custom_field">   
       
        <input class="slider_ar" type="range" min="90" max="150" value="100" step="5" id="size" 


    
    </div>
    <p class="h_ar">Page Width:</p>
<div class="custom_field">   
  <input class="slider_ar" type="range" min="0" max="450" value="" step ="10" id="width">
</div>
    <div id="enterBL"></div>
        

    

    <div class="custom_field">
        <a class="btn btn-large" onlick="$('.elm-skin-container').toggleClass('bright'); " data-color="bright">Bright</a>
			  <a class="btn btn-large" data-color="dark">Dark</a>
			  <a class="btn btn-large" data-color="blues">Blues</a>
			  <a class="btn btn-large" data-color="gray">Gray</a>
			  <a class="btn btn-large" data-color="night_blues">Inverted</a>
		  	<a class="btn btn-large" data-color="off">Off</a>
        <a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>
        
    </div>
</div>

<div id="sidebar2"  class="custom_sidebar">
    <div class="top-bar" style="">
        <div class="top-bar-unit">
            <h5 id="refer_home">Directory</h5>
        </div>
    
        <div class="top-bar-unit">
            <h5 id="refer_acess" class="">Accessibility</h5>
        </div>

        <div class="top-bar-unit" style="background-color: #ececec; color:white;" >
            <h5 >References</h5>
        </div>
  
        <div class="top-bar-unit">
            <h5 id="refer_developer" class="">Developers</h5>
        </div>

       
     </div>
    <div class="custom_field">
         <a id="per_table" target="_blank" >Periodic Table</a>
            <div class="custom_field">
                <iframe class="pubchem-widget" style="display:none; width:400px;" src="https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=table&amp;embed=true" alt="The Periodic Table of the Elements showing all elements with their chemical symbols, atomic weight, and atomic number." style="border: 0px; width: 100%; height: 506px; overflow: auto;" id="iFrameResizer0">
                </iframe>
            </div>         
        <a id="ref_table" target="_blank" >Reference Table</a>
            <div id="ref_table_put" class="custom_field" style="display: none; background-color: white ">                
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Acid-Base_Indicators"> Acid-Base Indicators</a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Analytic_References"> Analytic References </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Analytic_References"> Atomic and Molecular properties </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Bulk_Properties"> Bulk properties </a>
<a> Electrochemistry Tables </a>
<a> equilibirum constants </a>
<a> group theory tables </a>
<a> Mathematical functions </a>
<a> Nuclear tables </a>
<a> Solvents </a>
<a> Spectroscopic parameters </a>
<a> Thermodynamics Tables </a>

            </div>
         <a id="phy_table" target="_blank" >Physical Constants</a>
                <div id="phy_table_put" class="custom_field">
                </div>
        <a id="conv_table"  target="_blank" >Unit and Conversions</a>
            <div id="conv_table_put" class="custom_field">   
            </div>
        <a id="gloss_table">Organic Chemistry Glossary</a>
            <div id="gloss_table_put" class="custom_field">
            </div>
        <a id="conversion_table">Conversion Calculator</a>
        <div class="custom_field"  id="conversion_table_put" style="display:none; background-color: white;" >

                    <div class="converter-wrapper">
  

  <form name="property_form">
    <span>
      <select class="select-property" name="the_menu" size=1 onChange="UpdateUnitMenu(this, document.form_A.unit_menu); UpdateUnitMenu(this, document.form_B.unit_menu)">
      </select>
    </span>
  </form>

  <div class="converter-side-a">
    <form name="form_A" onSubmit="return false">
      <input type="text" class="numbersonly" name="unit_input" maxlength="20" value="0" onKeyUp="CalculateUnit(document.form_A, document.form_B)">
      <span>
        <select name="unit_menu" onChange="CalculateUnit(document.form_B, document.form_A)">
        </select>
      </span>
    </form>
  </div> <!-- /converter-side-a -->
  
 <div class="converter-equals">
   <p>=</p>
 </div> <!-- /converter-side-a -->

  <div class="converter-side-b">
    <form name="form_B" onSubmit="return false">
      <input type="text" class="numbersonly" name="unit_input" maxlength="20" value="0" onkeyup="CalculateUnit(document.form_B, document.form_A)">
      <span>
        <select name="unit_menu" onChange="CalculateUnit(document.form_A, document.form_B)">
        </select>
      </span>
    </form>
  </div> <!-- /converter-side-b -->
</div><!-- /converter-wrapper -->

        </div>
    </div>
    
</div>

<div id="sidebar3"  class="custom_sidebar">
   <div class="top-bar" style="">
        <div class="top-bar-unit">
            <h5 id="developer_home">Directory</h5>
        </div>

        <div class="top-bar-unit">
            <h5 id="developer_acess" class="">Accessibility</h5>
        </div>
  
        <div class="top-bar-unit">
            <h5 id="developer_refer" class="">References</h5>
        </div>
        
        <div class="top-bar-unit" style="background-color: #ececec; color:white;" >
            <h5 >Developers</h5>
        </div>
    </div>
    <div class="custom_field">
        <a onclick = "event.preventDefault(); cover(window.location.href)" href='#' class=''>Get Cover</a>
        <a href="/Under_Construction/Sandboxes/Henry/Get_Contents?${document.getElementById('IDHolder').innerText}" class="" target="_blank">Get Contents</a>
        <a onclick = "event.preventDefault(); buildcite()" href='#' class=''>Get Citation</a>
        <a onclick = "event.preventDefault(); $('dd').show();" href='#' class=''>Reveal Answers</a>
        <a onclick = "event.preventDefault(); LibreTexts.authenticatedFetch(null,'unorder',null,{method:'PUT'}); window.location.reload()" href='#' class=''>Unorder Page</a>
    </div>
</div>





<div id="custom_sidebar" class="custom_sidebar">
  <div class="top-bar" style="">
        <div class="top-bar-unit" style="background-color: #ececec; color:white;" >
            <h5>Libretexts</h5>
        </div>


        <div class="top-bar-unit">
            <h5 id="open_sidebar1">Accessibility</h5>
        </div>

        <div class="top-bar-unit">
            <h5 id="open_sidebar2" class="">References</h5>
        </div>
  
        <div class="top-bar-unit">
            <h5 id="open_sidebar3" class="">Developers</h5>
        </div>

       
  </div>
  <div class="" id="custom_target"></div>
</div>





</div>

<button id="custom_open"  >☰</button> 




`
let bL = document.getElementById("enterBl");

let sidebar = document.getElementById("custom_sidebar");
let sidebar1 = document.getElementById("sidebar1");
let sidebar2 = document.getElementById("sidebar2");
let sidebar3 = document.getElementById("sidebar3");


let btn = document.getElementById("myBtn");
let sidebarbtn = document.getElementById("custom_open");


let closebtn = document.getElementById("custom_close");
let closebtn1 = document.getElementById("custom_close1");
let closebtn2 = document.getElementById("custom_close2");
let closebtn3 = document.getElementById("custom_close3");




let this_span = document.getElementsByClassName("close_ar")[0];
let bLine = document.getElementById("bLine");

document.body.appendChild(sidebar);
document.body.appendChild(sidebar1);
document.body.appendChild(sidebar2);
document.body.appendChild(sidebar3);

window.onload = function() {
    document.getElementById("custom_sidebar").focus();
    document.getElementById("sidebar1").focus();
};

window.addEventListener('click',function(event) {
  if (event.target == sidebarbtn){ 
      document.getElementById("custom_sidebar").style.width = "400px";
      
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("open_sidebar1")){ 
      document.getElementById("sidebar1").style.width = "400px";
      document.getElementById("custom_sidebar").style.width = "0";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("open_sidebar2")){ 
      document.getElementById("sidebar2").style.width = "400px";
      document.getElementById("custom_sidebar").style.width = "0";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("open_sidebar3")){ 
      document.getElementById("sidebar3").style.width = "400px";
      document.getElementById("custom_sidebar").style.width = "0";
  //document.getElementById("main").style.marginLeft = "250px";
}
});


window.addEventListener('click',function(event) {
  if (event.target == closebtn ){ 
       document.getElementById("custom_sidebar").style.width = "0";

}
});


window.addEventListener('click',function(event) {
  if (event.target == closebtn1){ 
       document.getElementById("sidebar1").style.width = "0";

}
});

window.addEventListener('click',function(event) {
  if (event.target == closebtn2){ 
       document.getElementById("sidebar2").style.width = "0";

}
});

window.addEventListener('click',function(event) {
  if (event.target == closebtn3){ 
       document.getElementById("sidebar3").style.width = "0";

}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("acess_home")){ 
      document.getElementById("sidebar1").style.width = "0";
      document.getElementById("custom_sidebar").style.width = "400px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("acess_refer")){ 
      document.getElementById("sidebar2").style.width = "400px";
      document.getElementById("sidebar1").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("acess_developer")){ 
      document.getElementById("sidebar3").style.width = "400px";
      document.getElementById("sidebar1").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("refer_home")){ 
      document.getElementById("sidebar2").style.width = "0";
      document.getElementById("custom_sidebar").style.width = "400px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("refer_acess")){ 
      document.getElementById("sidebar1").style.width = "400px";
      document.getElementById("sidebar2").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("refer_developer")){ 
      document.getElementById("sidebar3").style.width = "400px";
      document.getElementById("sidebar2").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("developer_home")){ 
      document.getElementById("sidebar3").style.width = "0";
      document.getElementById("custom_sidebar").style.width = "400px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("developer_acess")){ 
      document.getElementById("sidebar1").style.width = "400px";
      document.getElementById("sidebar3").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});

window.addEventListener('click',function(event) {
  if (event.target == document.getElementById("developer_refer")){ 
      document.getElementById("sidebar2").style.width = "400px";
      document.getElementById("sidebar3").style.width = "0px";
  //document.getElementById("main").style.marginLeft = "250px";
}
});


$( '#per_table').click(function () {
  if ( $( "#iFrameResizer0" ).is( ":hidden" ) ) {
    $( "#iFrameResizer0" ).slideDown( "slow" );

  } else {
    $( "#iFrameResizer0" ).slideUp("slow");
 
  }
});

$( '#gloss_table').click(function () {
  if ( $( "#gloss_table_put" ).is( ":hidden" ) ) {
    
    $( "#gloss_table_put" ).load("https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Organic_Chemistry_Glossary #a9abfa27-98d2-c6fa-0c61-a753f2b8dcb1");
    $( "#gloss_table_put" ).slideDown("slow");
  } else {
    $( "#gloss_table_put" ).slideUp("slow");
  }
});

$( '#ref_table').click(function () {
  if ( $( "#ref_table_put" ).is( ":hidden" ) ) {
    
    $( "#ref_table_put" ).slideDown("slow");
  } else {
    $( "#ref_table_put" ).slideUp("slow");
  }
});

$( '#phy_table').click(function () {
  if ( $( "#phy_table_put" ).is( ":hidden" ) ) {
    
    $( "#phy_table_put" ).load("https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions/Physical_Constants #pageText");
    $( "#phy_table_put" ).slideDown("slow");
  } else {
    $( "#phy_table_put" ).slideUp("slow");
  }
});


$( '#conv_table').click(function () {
  if ( $( "#conv_table_put" ).is( ":hidden" ) ) {
    
    $( "#conv_table_put" ).load("https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions #pageText");
    $( "#conv_table_put" ).slideDown("slow");
  } else {
    $( "#conv_table_put" ).slideUp("slow");
  }
});

$( '#conversion_table').click(function () {
  if ( $( "#conversion_table_put" ).is( ":hidden" ) ) {
    
    $( "#conversion_table_put" ).slideDown("slow");
  } else {
    $( "#conversion_table_put" ).slideUp("slow");
  }
});

function activateBeeLine() {
	const beelineELements = document.querySelectorAll(".mt-content-container p:not(.boxtitle)");
	
	const doBeeline = function (theme, action) {
		for (let i = 0; i < beelineELements.length; i++) {
			const beeline = new BeeLineReader(beelineELements[i], {
				theme: theme,
				skipBackgroundColor: true,
				handleResize: true,
				skipTags: ['svg', 'h1', 'h3', 'h3', 'h4', 'h3', 'style', 'script', 'blockquote'],
			});
			
			Cookies.set("beeline", theme, {domain: 'libretexts.org'});
			if (theme === "off") {
				beeline.uncolor();
				if (typeof ga === 'function') {
					ga('send', 'event', 'Beeline', 'disabled');
				}
			}
			else {
				beeline.color();
				if (typeof ga === 'function') {
					ga('send', 'event', 'Beeline', action, theme);
				}
			}
			
			
			const contentContainer = $('.elm-skin-container');
			if (theme === 'night_blues') {
				contentContainer.addClass('darkMode');
				localStorage.setItem('darkMode', true);
			}
			else {
				contentContainer.removeClass('darkMode');
				localStorage.setItem('darkMode', false);
			}
		}
	};
	
	setBeelineToggles();
	
	function setBeelineToggles() {
		const toggles = $('.beeline-toggles');
		
		if (toggles[0]) {
			const btns = toggles.find('button, a');
			
			btns.click(function (e) {
				if (!e.target.href)
					e.preventDefault();
				const theme = $(this).attr("data-color");
				if (!theme)
					return;
				btns.removeClass('active');
				btns.filter('a[data-color="' + theme + '"]').addClass('active');
				btns.filter('button[data-color="' + theme + '"]').addClass('active');
				
				doBeeline(theme, theme);
			});
		}
	};



		if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
			localStorage.setItem('darkMode', true);
		if (localStorage.getItem('darkMode') === 'true')
			$('.elm-skin-container').addClass('darkMode');



			if (window.beelineEnabled) {
				bL.innerHTML += `<div class="LTdropdown beeline-toggles" style="float:left; background-color: #d4d4d4; color:black"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div><div class="LTdropdown-content" style="right: 0">`;
				bL.innerHTML += `<a class="btn btn-large" style="display: flex" href="http://www.beelinereader.com/education/?utm_source=libretexts" target="_blank"
title="BeeLine helps you read on screen more easily by using a color gradient that pulls your eyes through the text. Try out the color schemes to find your favorite to use on LibreTexts. Be sure to check out BeeLine's apps and plugins, so you can read PDFs, Kindle books, and websites more easily!">
<img style="margin-right: 5px; width:25px; height: 25px" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png">About BeeLine</a>`;
				bL.innerHTML += `<a class="btn btn-large" data-color="bright">Bright</a>`;
				bL.innerHTML += `<a class="btn btn-large" data-color="dark">Dark</a>`;
				bL.innerHTML += `<a class="btn btn-large" data-color="blues">Blues</a>`;
				bL.innerHTML += `<a class="btn btn-large" data-color="gray">Gray</a>`;
				bL.innerHTML += `<a class="btn btn-large" data-color="night_blues">Inverted</a>`;
				bL.innerHTML += `<a class="btn btn-large active" data-color="off">Off</a>`;
				bL.innerHTML += `<a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;
				bL.innerHTML += `</div></div>`;
};


/*
if(window.beelineEnabled) {
    //bLine.innerHTML += <a class="btn btn-large" style="margin-top: 10px; margin-left: 10px;" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;
				
				bLine.innerHTML += `<div class="LTdropdown beeline-toggles" style="float:left; background-color: #d4d4d4; color:black"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div><div class="LTdropdown-content" style="right: 0">`;
				bLine.innerHTML += `<a class="btn btn-large" style="display: flex" href="http://www.beelinereader.com/education/?utm_source=libretexts" target="_blank"
title="BeeLine helps you read on screen more easily by using a color gradient that pulls your eyes through the text. Try out the color schemes to find your favorite to use on LibreTexts. Be sure to check out BeeLine's apps and plugins, so you can read PDFs, Kindle books, and websites more easily!">
<img style="margin-right: 5px; width:25px; height: 25px" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png">About BeeLine</a>`;
				
                bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="bright">Bright</a>`;
				bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="dark">Dark</a>`;
				bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="blues">Blues</a>`;
				bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="gray">Gray</a>`;
				bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="night_blues">Inverted</a>`;
				bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" data-color="off">Off</a>`;
	            bLine.innerHTML += `<a class="btn btn-large" style="height: 30px; line-height:inherit; margin-top: 10px; margin-left: 10px;" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;
				bLine.innerHTML += `</div></div>`;
			}*/
   



$('.changeMe').css("font-family", localStorage.getItem('font_family') );
console.log(localStorage.getItem('font_family') + ": INITIAL FONT");

$('.changeMe').css("margin-left", localStorage.getItem('page_width') + "px" );
console.log(localStorage.getItem('page_width') + ": INITIAL WIDTH");

$('.changeMe').css("margin-right", localStorage.getItem('page_width') + "px" );
console.log(localStorage.getItem('page_width') + ": INITIAL WIDTH");


$("#fs").change(function() {
    //alert($(this).val());
    var initial_data = $(this).val();
    $('.mt-content-container').css("font-family", initial_data);
    $("#fs").val(initial_data);
    
    
    localStorage.setItem('font_family', initial_data);
    var final_data = localStorage.getItem('font_family');
    console.log(final_data +": FINAL FONT");
});



$("#size").change(function() {
    var initial_data = $(this).val();
  
    
    //CHANGE CSS TO SIZE FUNC VALUE
    $('section.mt-content-container *').css("font-size", initial_data  + "%");
    //INPUT THAT AS A PLACE HOLDER VALUE 
    $("#size").val(initial_data);
    
    //LOG SIZE VALUE AFTER INPUT DATA
  
    localStorage.setItem('font_size', initial_data);
    var final_data = localStorage.getItem('font_size');
    console.log(final_data +": FINAL SIZE");
   
});


$("#width").change(function() {
    var initial_data = $(this).val();
    
    
    $('section.mt-content-container').css("margin-left", initial_data + "px");
    $('section.mt-content-container').css("margin-right", initial_data + "px");
    
     $("#width").val(initial_data);
    
    
     localStorage.setItem('page_width', initial_data);
    var final_data = localStorage.getItem('page_width');
    console.log(final_data +": FINAL WIDTH");
    
});


$("#fs2").change(function() {
    //alert($(this).val());
    var link = $(this).val();
    window.open(link, '_blank');
    
   
});

$('body').click(function (event) 
{
   if(!$(event.target).closest('#custom_sidebar').length && !$(event.target).is('#custom_sidebar')) {
     document.getElementById("custom_sidebar").style.width = "0";
   }     
});
$('body').click(function (event) 
{
   if(!$(event.target).closest('#sidebar1').length && !$(event.target).is('#sidebar1')) {
     document.getElementById("sidebar1").style.width = "0";
   }     
});
$('body').click(function (event) 
{
   if(!$(event.target).closest('#sidebar2').length && !$(event.target).is('#sidebar2')) {
     document.getElementById("sidebar2").style.width = "0";
   }     
});
$('body').click(function (event) 
{
   if(!$(event.target).closest('#sidebar3').length && !$(event.target).is('#sidebar3')) {
     document.getElementById("sidebar3").style.width = "0";
   }     
});




//------------------------------------------------------------------TOC CODE-----------------------------------------------------

window.addEventListener('load', TOC);

async function TOC() {
	let coverpage;
	let coverTitle;
	let content;
	if (!navigator.webdriver || !window.matchMedia('print').matches) {
		coverpage = await LibreTexts.getCoverpage();
		if (coverpage) {
			await makeTOC(coverpage, true);
		}
	}
	
	async function makeTOC(path, isRoot, full) {
		const origin = window.location.origin;
		path = path.replace(origin + "/", "");
		//get coverpage title & subpages;
		let info = LibreTexts.authenticatedFetch(path, 'info?dream.out.format=json');
		
		
		let response = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json');
		response = await response.json();
		info = await info;
		info = await info.json();
		coverTitle = info.title;
		return await subpageCallback(response, isRoot);
		
		async function subpageCallback(info, isRoot) {
			let subpageArray = info["page.subpage"];
			const result = [];
			const promiseArray = [];
			if (!subpageArray)
				return false;
			
			if (!subpageArray.length) {
				subpageArray = [subpageArray];
			}
			for (let i = 0; i < subpageArray.length; i++) {
				promiseArray[i] = subpage(subpageArray[i], i);
			}
			
			async function subpage(subpage, index) {
				let url = subpage["uri.ui"];
				let path = subpage.path["#text"];
				let currentPage = url === window.location.href;
				const hasChildren = subpage["@subpages"] === "true";
				let defaultOpen = window.location.href.includes(url) && !currentPage;
				let children = hasChildren ? undefined : [];
				if (hasChildren && (full || defaultOpen)) { //recurse down
					children = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json');
					children = await children.json();
					children = await
						subpageCallback(children, false);
				}
				result[index] = {
					title: currentPage ? subpage.title : `<a href="${url}">${subpage.title}</a>`,
					url: url,
					selected: currentPage,
					expanded: defaultOpen,
					children: children,
					lazy: !full
				};
			}
			
			await Promise.all(promiseArray);
			if (isRoot) {
				content = result;
				// console.log(content);
				initializeFancyTree();
			}
			return result;
		}
		
		function initializeFancyTree() {
			const target = $("#custom_target");
			if (content) {
				const button = $(".elm-hierarchy-trigger.mt-hierarchy-trigger");
				button.text("Contents");
				button.attr('id', "TOCbutton");
				button.attr('title', "Expand/Contract Table of Contents");
				button.addClass("toc-button");
				target.addClass("toc-hierarchy");
				// target.removeClass("elm-hierarchy mt-hierarchy");
				target.innerHTML = "";
				target.prepend(`<a href="${origin + "/" + path}"><h6>${coverTitle}</h6></a>`);
				target.fancytree({
					source: content,
					lazyLoad: function (event, data) {
						var dfd = new $.Deferred();
						let node = data.node;
						data.result = dfd.promise();
						makeTOC(node.data.url).then((result) => dfd.resolve(result));
					}
				})
			}
		}
	}
}







//------------------------------------------------------------------CONVERTER CODE-----------------------------------------------------


//
// --- JAVASCRIPT UNIT CONVERTER

// If you study this file, you'll see that all the important data (namely, unit names and conversion factors) are explicitly defined as JavaScript arrays under the "Global Variable & Data Definitions" heading (which should be right under these comments).

// This is done, because: a) I figured it's the fastest way to do it, and b) it keeps everything in one file, making local storage and usage a snap.

// If you wanna mess with these array definitions, keep in mind the following (better study the definitions first before you read this; otherwise skip it altogether):

// 1) The unit[i][j] and factor[i][j] arrays should have the same j-length and their elements should correspond to each other in the j dimension; i.e. unit[0][2] should define the name and factor[0][2] the conversion factor of the SAME unit.  Duh!...

// 2) In every property (i.e. the i-dimension of the unit and factor arrays) there should be defined a 'primary' or 'base' unit, i.e. one with a conversion factor of 1.  The definitions of the other (secondary) units should use this formula:

// 1 [Secondary unit] = [Secondary unit conversion factor] [Primary Unit]
//                                   ^
//  This goes in the factor array ___|
//
//  e.g.: 1 ft = 0.3048 m

// ====================================
//  Global Variable & Data Definitions
// ====================================
var property = new Array();
var unit = new Array();
var factor = new Array();

property[0] = "Acceleration";
unit[0] = new Array("Meter/sq.sec (m/sec^2)", "Foot/sq.sec (ft/sec^2)", "G (g)", "Galileo (gal)", "Inch/sq.sec (in/sec^2)");
factor[0] = new Array(1, .3048, 9.806650, .01, 2.54E-02);

property[1] = "Area";
unit[1] = new Array("Square meter (m^2)", "Acre (acre)", "Are", "Barn (barn)", "Hectare", "Rood", "Square centimeter", "Square kilometer", "Circular mil", "Square foot (ft^2)", "Square inch (in^2)", "Square mile (mi^2)", "Square yard (yd^2)");
factor[1] = new Array(1, 4046.856, 100, 1E-28, 10000, 1011.71413184285, .0001, 1000000, 5.067075E-10, 9.290304E-02, 6.4516E-04, 2589988, .8361274);

property[2] = "Torque";
unit[2] = new Array("Newton-meter (N m)", "Dyne-centimeter(dy cm)", "Kgrf-meter (kgf m)", "lbf-inch (lbf in)", "lbf-foot (lbf ft)");
factor[2] = new Array(1, .0000001, 9.806650, .1129848, 1.355818);

property[3] = "Electricity";
unit[3] = new Array("Coulomb (Cb)", "Abcoulomb", "Ampere hour (A hr)", "Faraday (F)", "Statcoulomb", "Millifaraday (mF)", "Microfaraday (mu-F)", "Picofaraday (pF)");
factor[3] = new Array(1, 10, 3600, 96521.8999999997, .000000000333564, 96.5219, 9.65219E-02, 9.65219E-05);

property[4] = "Energy";
unit[4] = new Array("Joule (J)", "BTU (mean)", "BTU (thermochemical)", "Calorie (SI) (cal)", "Calorie (mean)(cal)", "Calorie (thermo)", "Electron volt (eV)", "Erg (erg)", "Foot-pound force", "Foot-poundal", "Horsepower-hour", "Kilocalorie (SI)(kcal)", "Kilocalorie (mean)(kcal)", "Kilowatt-hour (kW hr)", "Ton of TNT", "Volt-coulomb (V Cb)", "Watt-hour (W hr)", "Watt-second (W sec)");
factor[4] = new Array(1, 1055.87, 1054.35, 4.1868, 4.19002, 4.184, 1.6021E-19, .0000001, 1.355818, 4.214011E-02, 2684077.3, 4186.8, 4190.02, 3600000, 4.2E9, 1, 3600, 1);

property[5] = "Force";
unit[5] = new Array("Newton (N)", "Dyne (dy)", "Kilogram force (kgf)", "Kilopond force (kpf)", "Kip (k)", "Ounce force (ozf)", "Pound force (lbf)", "Poundal");
factor[5] = new Array(1, .00001, 9.806650, 9.806650, 4448.222, .2780139, .4535924, .138255);

property[6] = "Force / Length";
unit[6] = new Array("Newton/meter (N/m)", "Pound force/inch (lbf/in)", "Pound force/foot (lbf/ft)");
factor[6] = new Array(1, 175.1268, 14.5939);

property[7] = "Length";
unit[7] = new Array("Meter (m)", "Angstrom (A')", "Astronomical unit (AU)", "Caliber (cal)", "Centimeter (cm)", "Kilometer (km)", "Ell", "Em", "Fathom", "Furlong", "Fermi (fm)", "Foot (ft)", "Inch (in)", "League (int'l)", "League (UK)", "Light year (LY)", "Micrometer (mu-m)", "Mil", "Millimeter (mm)", "Nanometer (nm)", "Mile (int'l nautical)", "Mile (UK nautical)", "Mile (US nautical)", "Mile (US statute)", "Parsec", "Pica (printer)", "Picometer (pm)", "Point (pt)", "Rod", "Yard (yd)");
factor[7] = new Array(1, 1E-10, 1.49598E11, .000254, .01, 1000, 1.143, 4.2323E-03, 1.8288, 201.168, 1E-15, .3048, .0254, 5556, 5556, 9.46055E+15, .000001, .0000254, .001, 1E-9, 1852, 1853.184, 1852, 1609.344, 3.08374E+16, 4.217518E-03, 1E-12, .0003514598, 5.0292, .9144);

property[8] = "Light";
unit[8] = new Array("Lumen/sq.meter (Lu/m^2)", "Lumen/sq.centimeter", "Lumen/sq.foot", "Foot-candle (ft-cdl)", "Foot-lambert", "Candela/sq.meter", "Candela/sq.centimeter", "Lux (lux)", "Phot");
factor[8] = new Array(1, 10000, 10.76391, 10.76391, 10.76391, 3.14159250538575, 31415.9250538576, 1, 10000);

property[9] = "Mass";
unit[9] = new Array("Kilogram (kgr)", "Gram (gr)", "Milligram (mgr)", "Microgram (mu-gr)", "Carat (metric)(ct)", "Hundredweight (long)", "Hundredweight (short)", "Pound mass (lbm)", "Pound mass (troy)", "Ounce mass (ozm)", "Ounce mass (troy)", "Slug", "Ton (assay)", "Ton (long)", "Ton (short)", "Ton (metric)", "Tonne");
factor[9] = new Array(1, .001, 1e-6, .000000001, .0002, 50.80235, 45.35924, .4535924, .3732417, .02834952, .03110348, 14.5939, .02916667, 1016.047, 907.1847, 1000, 1000);

property[10] = "Mass Flow";
unit[10] = new Array("Kilogram/second (kgr/sec)", "Pound mass/sec (lbm/sec)", "Pound mass/min (lbm/min)");
factor[10] = new Array(1, .4535924, .007559873);

property[11] = "Density & Mass capacity";
unit[11] = new Array("Kilogram/cub.meter", "Grain/galon", "Grams/cm^3 (gr/cc)", "Pound mass/cubic foot", "Pound mass/cubic-inch", "Ounces/gallon (UK,liq)", "Ounces/gallon (US,liq)", "Ounces (mass)/inch", "Pound mass/gal (UK,liq)", "Pound mass/gal (US,liq)", "Slug/cubic foot", "Tons (long,mass)/cub.yard");
factor[11] = new Array(1, .01711806, 1000, 16.01846, 27679.91, 6.236027, 7.489152, 1729.994, 99.77644, 119.8264, 515.379, 1328.939);

property[12] = "Power";
unit[12] = new Array("Watt (W)", "Kilowatt (kW)", "Megawatt (MW)", "Milliwatt (mW)", "BTU (SI)/hour", "BTU (thermo)/second", "BTU (thermo)/minute", "BTU (thermo)/hour", "Calorie (thermo)/second", "Calorie (thermo)/minute", "Erg/second", "Foot-pound force/hour", "Foot-pound force/minute", "Foot-pound force/second", "Horsepower(550 ft lbf/s)", "Horsepower (electric)", "Horsepower (boiler)", "Horsepower (metric)", "Horsepower (UK)", "Kilocalorie (thermo)/min", "Kilocalorie (thermo)/sec");
factor[12] = new Array(1, 1000, 1000000, .001, .2930667, 1054.35, 17.5725, .2928751, 4.184, 6.973333E-02, .0000001, .0003766161, .02259697, 1.355818, 745.7, 746, 9809.5, 735.499, 745.7, 69.7333, 4184);

property[13] = "Pressure & Stress";
unit[13] = new Array("Newton/sq.meter", "Atmosphere (normal)", "Atmosphere (techinical)", "Bar", "Centimeter mercury(cmHg)", "Centimeter water (4'C)", "Decibar", "Kgr force/sq.centimeter", "Kgr force/sq.meter", "Kip/square inch", "Millibar", "Millimeter mercury(mmHg)", "Pascal (Pa)", "Kilopascal (kPa)", "Megapascal (Mpa)", "Poundal/sq.foot", "Pound-force/sq.foot", "Pound-force/sq.inch (psi)", "Torr (mmHg,0'C)");
factor[13] = new Array(1, 101325, 98066.5, 100000, 1333.22, 98.0638, 10000, 98066.5, 9.80665, 6894757, 100, 133.3224, 1, 1000, 1000000, 47.88026, 47.88026, 6894.757, 133.322);

// !!! Caution: Temperature requires an increment as well as a multiplying factor
// !!! and that's why it's handled differently
// !!! Be VERY careful in how you change this behavior
property[14] = "Temperature";
unit[14] = new Array("Degrees Celsius ('C)", "Degrees Fahrenheit ('F)", "Degrees Kelvin ('K)", "Degrees Rankine ('R)");
factor[14] = new Array(1, 0.555555555555, 1, 0.555555555555);
tempIncrement = new Array(0, -32, -273.15, -491.67);

property[15] = "Time";
unit[15] = new Array("Second (sec)", "Day (mean solar)", "Day (sidereal)", "Hour (mean solar)", "Hour (sidereal)", "Minute (mean solar)", "Minute (sidereal)", "Month (mean calendar)", "Second (sidereal)", "Year (calendar)", "Year (tropical)", "Year (sidereal)");
factor[15] = new Array(1, 8.640E4, 86164.09, 3600, 3590.17, 60, 60, 2628000, .9972696, 31536000, 31556930, 31558150);

property[16] = "Velocity & Speed";
unit[16] = new Array("Meter/second (m/sec)", "Foot/minute (ft/min)", "Foot/second (ft/sec)", "Kilometer/hour (kph)", "Knot (int'l)", "Mile (US)/hour (mph)", "Mile (nautical)/hour", "Mile (US)/minute", "Mile (US)/second", "Speed of light (c)", "Mach (STP)(a)");
factor[16] = new Array(1, 5.08E-03, .3048, .2777778, .5144444, .44707, .514444, 26.8224, 1609.344, 299792458, 340.0068750);

property[17] = "Viscosity";
unit[17] = new Array("Newton-second/meter", "Centipoise", "Centistoke", "Sq.foot/second", "Poise", "Poundal-second/sq.foot", "Pound mass/foot-second", "Pound force-second/sq.foot", "Rhe", "Slug/foot-second", "Stoke");
factor[17] = new Array(1, .001, .000001, 9.290304E-02, .1, 1.488164, 1.488164, 47.88026, 10, 47.88026, .0001);

property[18] = "Volume & Capacity";
unit[18] = new Array("Cubic Meter (m^3)", "Cubic centimeter", "Cubic millimeter", "Acre-foot", "Barrel (oil)", "Board foot", "Bushel (US)", "Cup", "Fluid ounce (US)", "Cubic foot", "Gallon (UK)", "Gallon (US,dry)", "Gallon (US,liq)", "Gill (UK)", "Gill (US)", "Cubic inch (in^3)", "Liter (new)", "Liter (old)", "Ounce (UK,fluid)", "Ounce (US,fluid)", "Peck (US)", "Pint (US,dry)", "Pint (US,liq)", "Quart (US,dry)", "Quart (US,liq)", "Stere", "Tablespoon", "Teaspoon", "Ton (register)", "Cubic yard");
factor[18] = new Array(1, .000001, .000000001, 1233.482, .1589873, .002359737, .03523907, .0002365882, .00002957353, .02831685, .004546087, .004404884, .003785412, .0001420652, .0001182941, .00001638706, .001, .001000028, .00002841305, .00002957353, 8.8097680E-03, .0005506105, 4.7317650E-04, .001101221, 9.46353E-04, 1, .00001478676, .000004928922, 2.831685, .7645549);

property[19] = "Volume Flow";
unit[19] = new Array("Cubic meter/second", "Cubic foot/second", "Cubic foot/minute", "Cubic inches/minute", "Gallons (US,liq)/minute)");
factor[19] = new Array(1, .02831685, .0004719474, 2.731177E-7, 6.309020E-05);

// ===========
//  Functions
// ===========

function UpdateUnitMenu(propMenu, unitMenu) {
  // Updates the units displayed in the unitMenu according to the selection of property in the propMenu.
  var i;
  i = propMenu.selectedIndex;
  FillMenuWithArray(unitMenu, unit[i]);
}

function FillMenuWithArray(myMenu, myArray) {
  // Fills the options of myMenu with the elements of myArray.
  // !CAUTION!: It replaces the elements, so old ones will be deleted.
  var i;
  myMenu.length = myArray.length;
  for (i = 0; i < myArray.length; i++) {
    myMenu.options[i].text = myArray[i];
  }
}

function CalculateUnit(sourceForm, targetForm) {
  // A simple wrapper function to validate input before making the conversion
  var sourceValue = sourceForm.unit_input.value;

  // First check if the user has given numbers or anything that can be made to one...
  sourceValue = parseFloat(sourceValue);
  if (!isNaN(sourceValue) || sourceValue == 0) {
    // If we can make a valid floating-point number, put it in the text box and convert!
    sourceForm.unit_input.value = sourceValue;
    ConvertFromTo(sourceForm, targetForm);
  }
}

function ConvertFromTo(sourceForm, targetForm) {
  // Converts the contents of the sourceForm input box to the units specified in the targetForm unit menu and puts the result in the targetForm input box.In other words, this is the heart of the whole script...
  var propIndex;
  var sourceIndex;
  var sourceFactor;
  var targetIndex;
  var targetFactor;
  var result;

  // Start by checking which property we are working in...
  propIndex = document.property_form.the_menu.selectedIndex;

  // Let's determine what unit are we converting FROM (i.e. source) and the factor needed to convert that unit to the base unit.
  sourceIndex = sourceForm.unit_menu.selectedIndex;
  sourceFactor = factor[propIndex][sourceIndex];

  // Cool! Let's do the same thing for the target unit - the units we are converting TO:
  targetIndex = targetForm.unit_menu.selectedIndex;
  targetFactor = factor[propIndex][targetIndex];

  // Simple, huh? let's do the math: a) convert the source TO the base unit: (The input has been checked by the CalculateUnit function).

  result = sourceForm.unit_input.value;
  // Handle Temperature increments!
  if (property[propIndex] == "Temperature") {
    result = parseFloat(result) + tempIncrement[sourceIndex];
  }
  result = result * sourceFactor;

  // not done yet... now, b) use the targetFactor to convert FROM the base unit
  // to the target unit...
  result = result / targetFactor;
  // Again, handle Temperature increments!
  if (property[propIndex] == "Temperature") {
    result = parseFloat(result) - tempIncrement[targetIndex];
  }

  // Ta-da! All that's left is to update the target input box:
  targetForm.unit_input.value = result;
}

// This fragment initializes the property dropdown menu using the data defined above in the 'Data Definitions' section
window.onload = function(e) {
  FillMenuWithArray(document.property_form.the_menu, property);
  UpdateUnitMenu(document.property_form.the_menu, document.form_A.unit_menu);
  UpdateUnitMenu(document.property_form.the_menu, document.form_B.unit_menu)
}

// Restricting textboxes to accept numbers + navigational keys only
document.getElementByClass('numbersonly').addEventListener('keydown', function(e) {
  var key = e.keyCode ? e.keyCode : e.which;

  if (!([8, 9, 13, 27, 46, 110, 190].indexOf(key) !== -1 ||
      (key == 65 && (e.ctrlKey || e.metaKey)) || // Select All 
      (key == 67 && (e.ctrlKey || e.metaKey)) || // Copy
      (key == 86 && (e.ctrlKey || e.metaKey)) || // Paste
      (key >= 35 && key <= 40) || // End, Home, Arrows
      (key >= 48 && key <= 57 && !(e.shiftKey || e.altKey)) || // Numeric Keys
      (key >= 96 && key <= 105) // Numpad
      (key == 190) // Numpad
    )) e.preventDefault();
});