
	window.addEventListener("DOMContentLoaded", Sidebar);


	async function Sidebar() {
		if (window !== window.top)
			return;

		let param = getParam();
		let tabs = getData(param.pro, param.tabs);
		buildSidebar();
		activateBeeLine();
		TOC();
		if (param.ccalc) {
			SBCC = new SBconverterCalculator();
		}

		function getSidebar() {
			if (param.pro) {
				switch (param.library) {
					case "chem":
						return [tabs.header, tabs.home, tabs.resources[param.library], tabs.control, tabs.usage, tabs.developers, tabs.libreverse]
					default:
						return [tabs.headernr, tabs.home, tabs.control, tabs.usage, tabs.developers]
				}
			}

			else {

				switch (param.library) {
					case "chem":
						return [tabs.header, tabs.home, tabs.resources[param.library], tabs.control, tabs.usage]
					default:
						return [tabs.headernr, tabs.home, tabs.control, tabs.usage]
				}
			}
		}

		function getParam() {

			let type = $("#pageTagsHolder").text().includes('"article:topic"');
			let [library] = LibreTexts.parseURL();
			let pro = document.getElementById("proHolder").innerText === 'true';
			let tabs = JSON.parse(localStorage.getItem("addPanels")) === true;
			let ccalc = true;
			let param = {
				"type": type,
				"library": library,
				"pro": pro,
				"tabs": tabs,
				"ccalc": ccalc
			}

			return param

		}

		function buildSidebar() {
			let tabsSidebar = getSidebar();
			let sidebarDiv = document.createElement("div");
			
			$("body").append(sidebarDiv);
			sidebarDiv.id = "sidebarDiv";
			tabsSidebar = tabsSidebar.join("");
			$(sidebarDiv).append(tabsSidebar);
			if(param.tabs){
				$("#sb1, #sb2, #sb3, #sb4, #sb5, #sb6").hide();
				$("#sbHeader").switchClass("top-bar", "sbHeader");
				$("#openContents").switchClass("top-bar-unit", "top-tabs");
				$("#openResources").switchClass("top-bar-unit", "top-tabs");
				$("#openControl").switchClass("top-bar-unit", "top-tabs");
				$("#openUsage").switchClass("top-bar-unit", "top-tabs");
				$("#openDevelopers").switchClass("top-bar-unit", "top-tabs");
				$("#openLibreverse").switchClass("top-bar-unit", "top-tabs");
				$("#tabsTrue").addClass("simHover");
				$(".custom_sidebar").addClass("cspLeft");
			} else {
				$("body").append(tabs.open);
				$("#sbHeader, #sb1, #sb2, #sb3, #sb4, #sb5, #sb6").hide();
				$("#tabsFalse").addClass("simHover");
			}
			controlSidebar();
			switchSidebar(param.tabs);
			function switchSidebar(tabs) {
				if(tabs){
							// $("#sbHeader").click(function (){
							// 	$("#sbHeader").hide();
							// });

							$("#openContents").click(function () {
								$("#sb2, #sb3, #sb4, #sb5, #sb6").hide();
								$("#sb1").toggle("slide");
							}
							);
							$("#openResources").click(function () {
								$("#sb1, #sb3, #sb4, #sb5, #sb6").hide();
								$("#sb2").toggle("slide");
			
								if (!window.resourcesTabInitialized) {
									window.resourcesTabInitialized = true;
									delete document.getElementById('pubchemWidget').iFrameResizer
									delete document.getElementById('physicalConstantsWidget').iFrameResizer
									$('#pubchemWidget').attr('src', "https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=table&embed=true&hide_all_headings=true");
									iFrameResize({
										warningTimeout: 0,
										scrolling: 'omit',
										checkOrigin: ["https://pubchem.ncbi.nlm.nih.gov"]
									}, '#pubchemWidget');
									$('#physicalConstantsWidget').attr('src', "https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions/Physical_Constants?adaptView")
									iFrameResize({
										warningTimeout: 0,
										scrolling: 'omit',
										checkOrigin: ["https://chem.libretexts.org"]
									}, '#physicalConstantsWidget');
								}
							});
							$("#openControl").click(function () {
								$("#sb1, #sb2, #sb4, #sb5, #sb6").hide();
								$("#sb3").toggle("slide");
							});
							$("#openUsage").click(function () {
								$("#sb1, #sb2, #sb3, #sb5, #sb6").hide();
								$("#sb4").toggle("slide");
							});
							$("#openDevelopers").click(function () {
								$("#sb1, #sb2, #sb3, #sb4,#sb6").hide();
								$("#sb5").toggle("slide");
							});
							$("#openLibreverse").click(function () {
								$("#sb1, #sb2, #sb3, #sb4, #sb5").hide();
								$("#sb6").toggle("slide");
							});

							$("body").click(function (event) {
								if (!$(event.target).closest('#sidebarDiv').length && !$(event.target).is('#sidebarDiv')) {
									$("#sb1, #sb2, #sb3, #sb4, #sb5, #sb6").hide("slide");
								}
							});
				} else {
					

							$("#sbHeader").click(function (event){
								$("#sbHeader").hide();
								$("#sbHeader").show();
							});

							$("#openContents").click(function (event) {
								$("#sb2, #sb3, #sb4, #sb5, #sb6").hide();
								$("#sb1").show();
							});
							$("#openResources").click(function (event) {
								$("#sb1, #sb3, #sb4, #sb5, #sb6").hide();
								$("#sb2").show();
			
								if (!window.resourcesTabInitialized) {
									window.resourcesTabInitialized = true;
									delete document.getElementById('pubchemWidget').iFrameResizer
									delete document.getElementById('physicalConstantsWidget').iFrameResizer
									$('#pubchemWidget').attr('src', "https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=table&embed=true&hide_all_headings=true");
									iFrameResize({
										warningTimeout: 0,
										scrolling: 'omit',
										checkOrigin: ["https://pubchem.ncbi.nlm.nih.gov"]
									}, '#pubchemWidget');
									$('#physicalConstantsWidget').attr('src', "https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions/Physical_Constants?adaptView")
									iFrameResize({
										warningTimeout: 0,
										scrolling: 'omit',
										checkOrigin: ["https://chem.libretexts.org"]
									}, '#physicalConstantsWidget');
								}
							});
							$("#openControl").click(function (event) {
								$("#sb1, #sb2, #sb4, #sb5, #sb6").hide();
								$("#sb3").show();
							});
							$("#openUsage").click(function (event) {
								$("#sb1, #sb2, #sb3, #sb5, #sb6").hide();
								$("#sb4").show();
							});
							$("#openDevelopers").click(function (event) {
								$("#sb1, #sb2, #sb3, #sb4,#sb6").hide();
								$("#sb5").show();
							});
							$("#openLibreverse").click(function (event) {
								$("#sb1, #sb2, #sb3, #sb4, #sb5").hide();
								$("#sb6").show();
							});
							$("body").click(function (event) {

								if (!$(event.target).closest('#sidebarDiv').length && !$(event.target).is('#sidebarDiv')) {
									$("#sbHeader, #sb1, #sb2, #sb3, #sb4, #sb5, #sb6").hide("slide");


								}
							});
				}
				
			}

			function controlSidebar() {
				window.addEventListener('click', function (event) {
					if (event.target == document.getElementById("custom_open")) {
						$("#sb2, #sb3, #sb4, #sb5").hide();
						$("#sb1, #sbHeader").show("slide");
					}
				});


				$('#per_table').click(function () {
					if ($("#iFrameResizer0").is(":hidden")) {
						$("#iFrameResizer0").slideDown("slow");

					}
					else {
						$("#iFrameResizer0").slideUp("slow");

					}
				});

				$('#gloss_table').click(function () {
					if ($("#gloss_table_put").is(":hidden")) {

						$("#gloss_table_put").load("https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Organic_Chemistry_Glossary #a9abfa27-98d2-c6fa-0c61-a753f2b8dcb1");
						$("#gloss_table_put").slideDown("slow");
					}
					else {
						$("#gloss_table_put").slideUp("slow");
					}
				});

				$('#ref_table').click(function () {
					if ($("#ref_table_put").is(":hidden")) {

						$("#ref_table_put").slideDown("slow");
					}
					else {
						$("#ref_table_put").slideUp("slow");
					}
				});

				$('#phy_table').click(function () {
					if ($("#phy_table_put").is(":hidden")) {

						$("#phy_table_put").slideDown("slow");
					}
					else {
						$("#phy_table_put").slideUp("slow");
					}
				});


				$('#conv_table').click(function () {
					if ($("#conv_table_put").is(":hidden")) {

						$("#conv_table_put").load("https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions #pageText");
						$("#conv_table_put").slideDown("slow");
					}
					else {
						$("#conv_table_put").slideUp("slow");
					}
				});

				$('#conversion_table').click(function () {
					if ($("#conversion_table_put").is(":hidden")) {

						$("#conversion_table_put").slideDown("slow");
					}
					else {
						$("#conversion_table_put").slideUp("slow");
					}
				});

				$('#construction-guide').click(function () {
					if ($("#construction-guide-put").is(":hidden")) {

						$("#construction-guide-put").slideDown("slow");
					}
					else {
						$("#construction-guide-put").slideUp("slow");
					}
				});

				$('#library-guide').click(function () {
					if ($("#library-guide-put").is(":hidden")) {

						$("#library-guide-put").slideDown("slow");
					}
					else {
						$("#library-guide-put").slideUp("slow");
					}
				});

				if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
					localStorage.setItem('darkMode', true);
				if (localStorage.getItem('darkMode') === 'true')
					$('.elm-skin-container').addClass('darkMode');


				$("#size").change(function () {

					var initial_data = $(this).val();


					//CHANGE CSS TO SIZE FUNC VALUE
					$('section.mt-content-container p').css("font-size", initial_data + "rem");
					$("#size").val(initial_data);

					//LOG SIZE VALUE AFTER INPUT DATA

					localStorage.setItem('font_size', initial_data);


				});

				$("#slider-page-width").change(function () {
					var initial_data = $(this).val();

					$('section.mt-content-container').css("margin-left", initial_data + "px");
					$('section.mt-content-container').css("margin-right", initial_data + "px");

					$("#slider-page-width").val(initial_data);


					localStorage.setItem('page_width', initial_data);
				});

				$('a.toggler').click(function () {
					$(this).toggleClass('off');
					if ($('#toggler-text').text() === 'Full') {
						$('#toggler-text').text('Left');
						$('section.mt-content-container p').css("text-align", "Left");
					}
					else if ($('#toggler-text').text() === 'Left') {
						$('#toggler-text').text('Full');
						$('section.mt-content-container p').css("text-align", "justify");
					}
					else {

					}

				});
			}
		}


		function getData(pro, tabs) {


			return {

				"open": `<button id="custom_open"  >☰</button>`,
				"headernr": pro ? `<div id="sbHeader" class="top-bar" style="">
				<div id="openContents"  class="top-bar-unit">
					<h5  >Contents</h5>
				</div>

				<div id="openControl"  class="top-bar-unit">
					<h5 >Customize</h5>
				</div>
				<div  id="openUsage"  class="top-bar-unit">
					<h5 class="">Applications</h5>
				</div>
				<div id="openDevelopers"  class="top-bar-unit">
					<h5  class="">Developers</h5>
				</div>
		
				<div id="openLibreverse"  class="top-bar-unit">
					<h5  class="">LibreVerse</h5>
				</div>
				</div>`  : `<div id="sbHeader" class="top-bar" style="">
				<div id="openContents"  class="top-bar-unit">
					<h5  >Contents</h5>
				</div>

				<div id="openControl"  class="top-bar-unit">
					<h5 >Customize</h5>
				</div>

				<div  id="openUsage"  class="top-bar-unit">
					<h5 class="">Applications</h5>
				</div>
		
				<div id="openLibreverse"  class="top-bar-unit">
					<h5  class="">LibreVerse</h5>
				</div>
				</div>` ,
				"header": pro ? `<div id="sbHeader" class="top-bar" style="">
        <div id="openContents"  class="top-bar-unit">
			<h5  >Contents</h5>
		</div>
		<div  id="openResources" class="top-bar-unit">
            <h5 class="">Resources</h5>
		</div>
		<div id="openControl"  class="top-bar-unit">
			<h5 >Customize</h5>
		</div>
		<div  id="openUsage"  class="top-bar-unit">
            <h5 class="">Applications</h5>
		</div>
		<div id="openDevelopers"  class="top-bar-unit">
            <h5  class="">Developers</h5>
		</div>

		<div id="openLibreverse"  class="top-bar-unit">
            <h5  class="">LibreVerse</h5>
		</div>
        </div>` :  `<div id="sbHeader" class="top-bar" style="">
        <div id="openContents"  class="top-bar-unit">
			<h5  >Contents</h5>
		</div>
		<div  id="openResources" class="top-bar-unit">
            <h5 class="">Resources</h5>
		</div>
		<div id="openControl"  class="top-bar-unit">
			<h5 >Customize</h5>
		</div>
		<div  id="openUsage"  class="top-bar-unit">
            <h5 class="">Applications</h5>
		</div>

		<div id="openLibreverse"  class="top-bar-unit">
            <h5  class="">LibreVerse</h5>
		</div>
        </div>` ,
				"home": `<div id="sb1" class="custom_sidebar">
						<div class="custom_field_title"> <h3> Contents </h3> </div>
                        <div  class="" id="custom_target"></div>
					</div>`,

				"resources": {
					"chem": ` <div id="sb2"  class="custom_sidebar">
				<div class="custom_field_tile"> <h3> Resources </h3> </div>
    <div class="custom_field">
        
            <div class="custom_field">
                <iframe class="pubchem-widget" id="pubchemWidget" style=" width:100%; height: 400px; overflow: auto;" alt="The Periodic Table of the Elements showing all elements with their chemical symbols, atomic weight, and atomic number." style="border: 0px; width: 100%; height: 506px; overflow: auto;">
                </iframe>
            </div>         
        <a id="ref_table" target="_blank" >Reference Tables</a>
            <div id="ref_table_put" class="custom_field" style="display: none; background-color: white ">                
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Acid-Base_Indicators"> Acid-Base Indicators</a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Analytic_References"> Analytic References </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Analytic_References"> Atomic and Molecular properties </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Bulk_Properties"> Bulk properties </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Electrochemistry_Tables"> Electrochemistry Tables </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Equilibrium_Constants"> Equilibirum Constants </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Group_Theory_Tables"> Group Theory Tables </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Mathematical_Functions"> Mathematical Functions </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Nuclear_Tables"> Nuclear Tables </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Solvents"> Solvents </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Spectroscopic_Parameters"> Spectroscopic Parameters </a>
<a href="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Reference_Tables/Thermodynamics_Tables"> Thermodynamics Tables </a>

            </div>
         <a id="phy_table" target="_blank" >Physical Constants</a>
                <div  style="display: none;" id="phy_table_put" class="custom_field">
                   <iframe style="width: 480px;" id="physicalConstantsWidget" loading="lazy"></iframe>
                </div>

        <a id="conversion_table">Conversion Calculator</a>
        <div class="custom_field"  id="conversion_table_put" style="display:none;" >

                    <div class="converter-wrapper">
  

  <form name="property_form">
    <span>
      <select class="select-property" name="the_menu" size=1 onChange="SBCC.UpdateUnitMenu(this, document.form_A.unit_menu); SBCC.UpdateUnitMenu(this, document.form_B.unit_menu)">
      </select>
    </span>
  </form>

  <div class="converter-side-a">
    <form name="form_A" onSubmit="return false">
      <input type="number" id="numbersonly" class="numbersonly" name="unit_input" maxlength="20" value="0" onKeyUp="SBCC.CalculateUnit(document.form_A, document.form_B)">
      <span>
        <select name="unit_menu" onChange="SBCC.CalculateUnit(document.form_B, document.form_A)">
        </select>
      </span>
    </form>
  </div> <!-- /converter-side-a -->
  
 <div class="converter-equals">
   <p style="margin: 10px;">=</p>
 </div> <!-- /converter-side-a -->

  <div class="converter-side-b">
    <form name="form_B" onSubmit="return false">
      <input type="number" class="numbersonly" name="unit_input" maxlength="20" value="0" onkeyup="SBCC.CalculateUnit(document.form_B, document.form_A)">
      <span>
        <select name="unit_menu" onChange="SBCC.CalculateUnit(document.form_A, document.form_B)">
        </select>
      </span>
    </form>
  </div> <!-- /converter-side-b -->
</div><!-- /converter-wrapper -->

        </div>
    </div>
    
</div> `
				},
				"control": ` <div id="sb3"  class="custom_sidebar">
	<div class="custom_field_title"> <h3> Control </h3> </div>
    <div style="display: grid;" class="custom_field">
       
    </div>
    <!--<p class="h_ar">Font Size:</p>
    <div class="custom_field">   
       
        <input class="slider_ar" type="range" min=".4" max="1.8" value="1.1" step=".1" id="size"> 


    
    </div>-->
    <p class="h_ar">Page Width:</p>
<div class="custom_field">   
  <input class="slider_ar" type="range" min="0" max="450" value="0" step ="10" id="slider-page-width">
</div>
   <p class="h_ar">Text Align:</p>
    <div class="custom_field"> 
        <a id="toggler-text" href="#0" class="toggler">Full</a>
    </div>
   <p class="h_ar">Sidebar Layout:</p>
   <div style="margin-left: 10px;" id="sbLayout" class="custom_field">
	   <button id="tabsTrue" onclick="savePanel(true)">Side Panels</button>		
	   <button id="tabsFalse" onclick="savePanel(false)">Default Button</button>		
	</div>
   <p class="h_ar">Beeline Modes <a style="display:inline;" href="http://www.beelinereader.com/education/?utm_source=libretexts"><img style="position: absolute; margin-left: 5px; margin-top: 4px; width:20px; height: 20px;" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png"></a></p>
    <div class="BLtoggle" id="doBeeLine">

<a id ="dark-light" class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode</a>
      <a id="SB_Inverted" class="btn btn-large" data-color="night_blues">Inverted</a>
                <a id="SB_Bright" class="btn btn-large" data-color="dark">Bright</a>
                <a id="SB_Blues" class="btn btn-large" data-color="blues">Blues</a>
                <a id="SB_Grays" class="btn btn-large" data-color="gray">Grays</a>
				<a id="SB_Off" class="btn btn-large active" data-color="off">Off</a>
				<a onclick="rtdefault()" class="btn btn-large" >Default Settings</a>
                </div></div>
     </div>


   
</div>`,
				"usage": `<div id="sb4"  class="custom_sidebar">
			<div class="custom_field_title"> <h3> Usage </h3> </div>
    <div class="custom_field">
         <a onclick = "event.preventDefault(); buildcite()" href='#' class='mt-icon-quote'>&nbsp;Get Page Citation</a>
    </div>

    <div class="custom_field">
         <a onclick = "event.preventDefault(); attribution()" href='#' class='mt-icon-quote'>&nbsp;Get Page Attribution</a>
    </div>

    <div class="custom_field">
        <a href="https://twitter.com/LibreTexts?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" rel="external nofollow" target="_blank" class="mt-icon-twitter">&nbsp;Twitter</a>
    </div>

    <div class="custom_field">
        <a href="https://www.facebook.com/LibreTexts/" rel="external nofollow" target="_blank" class="mt-icon-facebook">&nbsp;Facebook</a>
    </div>

    <div class="custom_field">
            
    </div>

    <div class="custom_field">
        <a title="https://groups.io/g/LibreNet-Commons/topics" href="https://groups.io/g/LibreNet-Commons/topics" rel="external nofollow" target="_blank" class="link-https">LibreNet Commons</a>
    </div>

    <div class="custom_field">
        <a title="https://chem.libretexts.org/Under_Construction/Construction_Forums" href="https://chem.libretexts.org/Courses/Remixer_University/Discipline-Specific_Forums" rel="internal">Discipline Specific Forums</a>   
    </div>

    <div class="custom_field">
        <a href="https://www.youtube.com/channel/UCP7H_PcHpiINWs8qpg0JaNg" rel="external nofollow" target="_blank" class="link-https">YouTube Channel</a>
    </div>

    <div class="custom_field">
        <a href="https://blog.libretexts.org/" rel="external nofollow" target="_blank" class="link-https">Blog</a>
    </div>



</div>`,
				"developers": `<div id="sb5"  class="custom_sidebar">
			<div class="custom_field_title"> <h3> Developers </h3> </div>
    <div class="custom_field">
        <a onclick = "event.preventDefault(); cover(window.location.href)" href='#' class='mt-icon-book'>&nbsp;Get Cover</a>
        <a href="/Under_Construction/Sandboxes/Henry/Get_Contents?${document.getElementById('IDHolder').innerText}" class="mt-icon-edit-page" target="_blank">&nbsp;Get Contents</a>
        <a onclick = "event.preventDefault(); $('dd').show();" href='#' class='mt-icon-eye3'>&nbsp;Reveal Answers</a>
        <a onclick = "event.preventDefault(); LibreTexts.authenticatedFetch(null,'unorder',null,{method:'PUT'}); window.location.reload()" class="mt-icon-shuffle" href='#' >&nbsp;Unorder Page</a>
        <a id="construction-guide"  target="_blank" rel="internal" class="mt-icon-site-tools ">&nbsp;Construction Guide</a>
      
            <div id="construction-guide-put" class="custom_field" style="display: none; background-color: white ">                

<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/01%3A_LibreTexts_Fundamentals">Libretexts Fundamentals</a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/02%3A_A_Framework_for_Designing_Online_Texts"> Online Texts </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/03%3A_Basic_Editing"> Basic Editing </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/04%3A_Advanced_Editing"> Advanced Editing </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/05%3A_Interactive_Elements">Interactive Elements </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/06%3A_Contributing%2C_Harvesting%2C_and_Curating_Content"> Curating Content </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/07%3A_Remixing_Existing_Content"> Removing Content </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/08%3A_Disseminating_Texts_and_Course_Shells"> Course Shells </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/01%3A_LibreTexts_Fundamentals">Libretexts Fundamentals</a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/02%3A_A_Framework_for_Designing_Online_Texts"> Online Texts </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/03%3A_Basic_Editing"> Basic Editing </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/04%3A_Advanced_Editing"> Advanced Editing </a>
<a href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide/05%3A_Interactive_Elements">Interactive Elements </a>

         </div>        

<a title="https://groups.io/g/Libretexts-ConstructionForum" href="https://groups.io/g/Libretexts-ConstructionForum" rel="external nofollow" target="_blank"  class="mt-icon-archive">&nbsp;Construction Forum</a>
        <a href="https://blog.libretexts.org/2019/06/13/libretexts-offers-new-weekly-office-hours/" rel="external nofollow" target="_blank"  class="mt-icon-topic" >&nbsp;Office Hours</a>

    </div>
</div>`,
				"libreverse": `<div id="sb6"  class="custom_sidebar">
				<div class="custom_field_title"> <h3> LibreVerse </h3> 
				</div>
				<div class="custom_field">
				<a id="library-guide"  target="_blank" rel="internal" class="mt-icon-book">&nbsp;Libraries</a>
      
				<div id="library-guide-put" class="custom_field" style="display: none; background-color: white ">                
	
					<a href="https://bio.libretexts.org">Biology</a>
					<a href="https://biz.libretexts.org">Business</a>
					<a href="https://chem.libretexts.org">Chemistry</a>
					<a href="https://eng.libretexts.org">Engineering</a>
					<a href="https://espanol.libretexts.org">Espanol</a>
					<a href="https://geo.libretexts.org">Geography</a>
					<a href="https://human.libretexts.org">Humanities</a>
					<a href="https://math.libretexts.org">Mathematics</a>
					<a href="https://med.libretexts.org">Medicine</a>
					<a href="https://phys.libretexts.org">Physics</a>
					<a href="https://socialsci.libretexts.org">Social Sciences</a>
					<a href="https://stats.libretexts.org">Statistics</a>
					<a href="https://workforce.libretexts.org">Workforce</a>
					
				</div>  
				
				
				
				</div>
				</div>`


			}

		}
	}

	function activateBeeLine() {
		const beelineELements = document.querySelectorAll(".mt-content-container p:not(.boxtitle)");

		const doBeeline = function (theme, action) {
			for (let i = 0; i < beelineELements.length; i++) {
				const beeline = new BeeLineReader(beelineELements[i], {
					theme: theme,
					skipBackgroundColor: true,
					handleResize: true,
					skipTags: ['svg', 'h1', 'h3', 'h3', 'h4', 'h3', 'style', 'script', 'blockquote']
				});

				localStorage.setItem("beeline", theme, { domain: 'libretexts.org' });
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
			const toggles = $('.BLtoggle');

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
		}


	}

	function savePanel(_input){

		localStorage.setItem("addPanels", _input);
		location.reload();
	}

	class SBconverterCalculator {
		constructor() {
			this.property = new Array();
			this.unit = new Array();
			this.factor = new Array();

			this.property[0] = "Acceleration";
			this.unit[0] = new Array("Meter/sq.sec (m/sec^2)", "Foot/sq.sec (ft/sec^2)", "G (g)", "Galileo (gal)", "Inch/sq.sec (in/sec^2)");
			this.factor[0] = new Array(1, .3048, 9.806650, .01, 2.54E-02);

			this.property[1] = "Area";
			this.unit[1] = new Array("Square meter (m^2)", "Acre (acre)", "Are", "Barn (barn)", "Hectare", "Rood", "Square centimeter", "Square kilometer", "Circular mil", "Square foot (ft^2)", "Square inch (in^2)", "Square mile (mi^2)", "Square yard (yd^2)");
			this.factor[1] = new Array(1, 4046.856, 100, 1E-28, 10000, 1011.71413184285, .0001, 1000000, 5.067075E-10, 9.290304E-02, 6.4516E-04, 2589988, .8361274);

			this.property[2] = "Torque";
			this.unit[2] = new Array("Newton-meter (N m)", "Dyne-centimeter(dy cm)", "Kgrf-meter (kgf m)", "lbf-inch (lbf in)", "lbf-foot (lbf ft)");
			this.factor[2] = new Array(1, .0000001, 9.806650, .1129848, 1.355818);

			this.property[3] = "Electricity";
			this.unit[3] = new Array("Coulomb (Cb)", "Abcoulomb", "Ampere hour (A hr)", "Faraday (F)", "Statcoulomb", "Millifaraday (mF)", "Microfaraday (mu-F)", "Picofaraday (pF)");
			this.factor[3] = new Array(1, 10, 3600, 96521.8999999997, .000000000333564, 96.5219, 9.65219E-02, 9.65219E-05);

			this.property[4] = "Energy";
			this.unit[4] = new Array("Joule (J)", "BTU (mean)", "BTU (thermochemical)", "Calorie (SI) (cal)", "Calorie (mean)(cal)", "Calorie (thermo)", "Electron volt (eV)", "Erg (erg)", "Foot-pound force", "Foot-poundal", "Horsepower-hour", "Kilocalorie (SI)(kcal)", "Kilocalorie (mean)(kcal)", "Kilowatt-hour (kW hr)", "Ton of TNT", "Volt-coulomb (V Cb)", "Watt-hour (W hr)", "Watt-second (W sec)");
			this.factor[4] = new Array(1, 1055.87, 1054.35, 4.1868, 4.19002, 4.184, 1.6021E-19, .0000001, 1.355818, 4.214011E-02, 2684077.3, 4186.8, 4190.02, 3600000, 4.2E9, 1, 3600, 1);

			this.property[5] = "Force";
			this.unit[5] = new Array("Newton (N)", "Dyne (dy)", "Kilogram force (kgf)", "Kilopond force (kpf)", "Kip (k)", "Ounce force (ozf)", "Pound force (lbf)", "Poundal");
			this.factor[5] = new Array(1, .00001, 9.806650, 9.806650, 4448.222, .2780139, .4535924, .138255);

			this.property[6] = "Force / Length";
			this.unit[6] = new Array("Newton/meter (N/m)", "Pound force/inch (lbf/in)", "Pound force/foot (lbf/ft)");
			this.factor[6] = new Array(1, 175.1268, 14.5939);

			this.property[7] = "Length";
			this.unit[7] = new Array("Meter (m)", "Angstrom (A')", "Astronomical this.unit (AU)", "Caliber (cal)", "Centimeter (cm)", "Kilometer (km)", "Ell", "Em", "Fathom", "Furlong", "Fermi (fm)", "Foot (ft)", "Inch (in)", "League (int'l)", "League (UK)", "Light year (LY)", "Micrometer (mu-m)", "Mil", "Millimeter (mm)", "Nanometer (nm)", "Mile (int'l nautical)", "Mile (UK nautical)", "Mile (US nautical)", "Mile (US statute)", "Parsec", "Pica (printer)", "Picometer (pm)", "Point (pt)", "Rod", "Yard (yd)");
			this.factor[7] = new Array(1, 1E-10, 1.49598E11, .000254, .01, 1000, 1.143, 4.2323E-03, 1.8288, 201.168, 1E-15, .3048, .0254, 5556, 5556, 9.46055E+15, .000001, .0000254, .001, 1E-9, 1852, 1853.184, 1852, 1609.344, 3.08374E+16, 4.217518E-03, 1E-12, .0003514598, 5.0292, .9144);

			this.property[8] = "Light";
			this.unit[8] = new Array("Lumen/sq.meter (Lu/m^2)", "Lumen/sq.centimeter", "Lumen/sq.foot", "Foot-candle (ft-cdl)", "Foot-lambert", "Candela/sq.meter", "Candela/sq.centimeter", "Lux (lux)", "Phot");
			this.factor[8] = new Array(1, 10000, 10.76391, 10.76391, 10.76391, 3.14159250538575, 31415.9250538576, 1, 10000);

			this.property[9] = "Mass";
			this.unit[9] = new Array("Kilogram (kgr)", "Gram (gr)", "Milligram (mgr)", "Microgram (mu-gr)", "Carat (metric)(ct)", "Hundredweight (long)", "Hundredweight (short)", "Pound mass (lbm)", "Pound mass (troy)", "Ounce mass (ozm)", "Ounce mass (troy)", "Slug", "Ton (assay)", "Ton (long)", "Ton (short)", "Ton (metric)", "Tonne");
			this.factor[9] = new Array(1, .001, 1e-6, .000000001, .0002, 50.80235, 45.35924, .4535924, .3732417, .02834952, .03110348, 14.5939, .02916667, 1016.047, 907.1847, 1000, 1000);

			this.property[10] = "Mass Flow";
			this.unit[10] = new Array("Kilogram/second (kgr/sec)", "Pound mass/sec (lbm/sec)", "Pound mass/min (lbm/min)");
			this.factor[10] = new Array(1, .4535924, .007559873);

			this.property[11] = "Density & Mass capacity";
			this.unit[11] = new Array("Kilogram/cub.meter", "Grain/galon", "Grams/cm^3 (gr/cc)", "Pound mass/cubic foot", "Pound mass/cubic-inch", "Ounces/gallon (UK,liq)", "Ounces/gallon (US,liq)", "Ounces (mass)/inch", "Pound mass/gal (UK,liq)", "Pound mass/gal (US,liq)", "Slug/cubic foot", "Tons (long,mass)/cub.yard");
			this.factor[11] = new Array(1, .01711806, 1000, 16.01846, 27679.91, 6.236027, 7.489152, 1729.994, 99.77644, 119.8264, 515.379, 1328.939);

			this.property[12] = "Power";
			this.unit[12] = new Array("Watt (W)", "Kilowatt (kW)", "Megawatt (MW)", "Milliwatt (mW)", "BTU (SI)/hour", "BTU (thermo)/second", "BTU (thermo)/minute", "BTU (thermo)/hour", "Calorie (thermo)/second", "Calorie (thermo)/minute", "Erg/second", "Foot-pound force/hour", "Foot-pound force/minute", "Foot-pound force/second", "Horsepower(550 ft lbf/s)", "Horsepower (electric)", "Horsepower (boiler)", "Horsepower (metric)", "Horsepower (UK)", "Kilocalorie (thermo)/min", "Kilocalorie (thermo)/sec");
			this.factor[12] = new Array(1, 1000, 1000000, .001, .2930667, 1054.35, 17.5725, .2928751, 4.184, 6.973333E-02, .0000001, .0003766161, .02259697, 1.355818, 745.7, 746, 9809.5, 735.499, 745.7, 69.7333, 4184);

			this.property[13] = "Pressure & Stress";
			this.unit[13] = new Array("Newton/sq.meter", "Atmosphere (normal)", "Atmosphere (techinical)", "Bar", "Centimeter mercury(cmHg)", "Centimeter water (4'C)", "Decibar", "Kgr force/sq.centimeter", "Kgr force/sq.meter", "Kip/square inch", "Millibar", "Millimeter mercury(mmHg)", "Pascal (Pa)", "Kilopascal (kPa)", "Megapascal (Mpa)", "Poundal/sq.foot", "Pound-force/sq.foot", "Pound-force/sq.inch (psi)", "Torr (mmHg,0'C)");
			this.factor[13] = new Array(1, 101325, 98066.5, 100000, 1333.22, 98.0638, 10000, 98066.5, 9.80665, 6894757, 100, 133.3224, 1, 1000, 1000000, 47.88026, 47.88026, 6894.757, 133.322);

			this.property[14] = "Temperature";
			this.unit[14] = new Array("Degrees Celsius ('C)", "Degrees Fahrenheit ('F)", "Degrees Kelvin ('K)", "Degrees Rankine ('R)");
			this.factor[14] = new Array(1, 0.555555555555, 1, 0.555555555555);
			this.tempIncrement = new Array(0, -32, -273.15, -491.67);

			this.property[15] = "Time";
			this.unit[15] = new Array("Second (sec)", "Day (mean solar)", "Day (sidereal)", "Hour (mean solar)", "Hour (sidereal)", "Minute (mean solar)", "Minute (sidereal)", "Month (mean calendar)", "Second (sidereal)", "Year (calendar)", "Year (tropical)", "Year (sidereal)");
			this.factor[15] = new Array(1, 8.640E4, 86164.09, 3600, 3590.17, 60, 60, 2628000, .9972696, 31536000, 31556930, 31558150);

			this.property[16] = "Velocity & Speed";
			this.unit[16] = new Array("Meter/second (m/sec)", "Foot/minute (ft/min)", "Foot/second (ft/sec)", "Kilometer/hour (kph)", "Knot (int'l)", "Mile (US)/hour (mph)", "Mile (nautical)/hour", "Mile (US)/minute", "Mile (US)/second", "Speed of light (c)", "Mach (STP)(a)");
			this.factor[16] = new Array(1, 5.08E-03, .3048, .2777778, .5144444, .44707, .514444, 26.8224, 1609.344, 299792458, 340.0068750);

			this.property[17] = "Viscosity";
			this.unit[17] = new Array("Newton-second/meter", "Centipoise", "Centistoke", "Sq.foot/second", "Poise", "Poundal-second/sq.foot", "Pound mass/foot-second", "Pound force-second/sq.foot", "Rhe", "Slug/foot-second", "Stoke");
			this.factor[17] = new Array(1, .001, .000001, 9.290304E-02, .1, 1.488164, 1.488164, 47.88026, 10, 47.88026, .0001);

			this.property[18] = "Volume & Capacity";
			this.unit[18] = new Array("Cubic Meter (m^3)", "Cubic centimeter", "Cubic millimeter", "Acre-foot", "Barrel (oil)", "Board foot", "Bushel (US)", "Cup", "Fluid ounce (US)", "Cubic foot", "Gallon (UK)", "Gallon (US,dry)", "Gallon (US,liq)", "Gill (UK)", "Gill (US)", "Cubic inch (in^3)", "Liter (new)", "Liter (old)", "Ounce (UK,fluid)", "Ounce (US,fluid)", "Peck (US)", "Pint (US,dry)", "Pint (US,liq)", "Quart (US,dry)", "Quart (US,liq)", "Stere", "Tablespoon", "Teaspoon", "Ton (register)", "Cubic yard");
			this.factor[18] = new Array(1, .000001, .000000001, 1233.482, .1589873, .002359737, .03523907, .0002365882, .00002957353, .02831685, .004546087, .004404884, .003785412, .0001420652, .0001182941, .00001638706, .001, .001000028, .00002841305, .00002957353, 8.8097680E-03, .0005506105, 4.7317650E-04, .001101221, 9.46353E-04, 1, .00001478676, .000004928922, 2.831685, .7645549);

			this.property[19] = "Volume Flow";
			this.unit[19] = new Array("Cubic meter/second", "Cubic foot/second", "Cubic foot/minute", "Cubic inches/minute", "Gallons (US,liq)/minute)");
			this.factor[19] = new Array(1, .02831685, .0004719474, 2.731177E-7, 6.309020E-05);

			// This fragment initializes the this.property dropdown menu using the data defined above in the 'Data Definitions' section

			this.FillMenuWithArray(document.property_form.the_menu, this.property);
			this.UpdateUnitMenu(document.property_form.the_menu, document.form_A.unit_menu);
			this.UpdateUnitMenu(document.property_form.the_menu, document.form_B.unit_menu)

		}

		UpdateUnitMenu(propMenu, unitMenu) {
			// Updates the units displayed in the unitMenu according to the selection of this.property in the propMenu.
			var i;
			i = propMenu.selectedIndex;
			this.FillMenuWithArray(unitMenu, this.unit[i]);
		}

		FillMenuWithArray(myMenu, myArray) {
			// Fills the options of myMenu with the elements of myArray.
			// !CAUTION!: It replaces the elements, so old ones will be deleted.
			var i;
			myMenu.length = myArray.length;
			for (i = 0; i < myArray.length; i++) {
				myMenu.options[i].text = myArray[i];
			}
		}

		CalculateUnit(sourceForm, targetForm) {
			// A simple wrapper function to validate input before making the conversion
			var sourceValue = sourceForm.unit_input.value;

			// First check if the user has given numbers or anything that can be made to one...
			sourceValue = parseFloat(sourceValue);
			if (!isNaN(sourceValue) || sourceValue == 0) {
				// If we can make a valid floating-point number, put it in the text box and convert!
				sourceForm.unit_input.value = sourceValue;
				this.ConvertFromTo(sourceForm, targetForm);
			}
		}

		ConvertFromTo(sourceForm, targetForm) {
			// Converts the contents of the sourceForm input box to the units specified in the targetForm this.unit menu and puts the result in the targetForm input box.In other words, this is the heart of the whole script...
			var propIndex;
			var sourceIndex;
			var sourceFactor;
			var targetIndex;
			var targetFactor;
			var result;

			// Start by checking which this.property we are working in...
			propIndex = document.property_form.the_menu.selectedIndex;

			// Let's determine what this.unit are we converting FROM (i.e. source) and the this.factor needed to convert that this.unit to the base this.unit.
			sourceIndex = sourceForm.unit_menu.selectedIndex;
			sourceFactor = this.factor[propIndex][sourceIndex];

			// Cool! Let's do the same thing for the target this.unit - the units we are converting TO:
			targetIndex = targetForm.unit_menu.selectedIndex;
			targetFactor = this.factor[propIndex][targetIndex];

			// Simple, huh? let's do the math: a) convert the source TO the base this.unit: (The input has been checked by the CalculateUnit function).

			result = sourceForm.unit_input.value;
			// Handle Temperature increments!
			if (this.property[propIndex] == "Temperature") {
				result = parseFloat(result) + this.tempIncrement[sourceIndex];
			}
			result = result * sourceFactor;

			// not done yet... now, b) use the targetFactor to convert FROM the base this.unit
			// to the target this.unit...
			result = result / targetFactor;
			// Again, handle Temperature increments!
			if (this.property[propIndex] == "Temperature") {
				result = parseFloat(result) - this.tempIncrement[targetIndex];
			}

			// Ta-da! All that's left is to update the target input box:
			targetForm.unit_input.value = result;
		}

	}

	function rtdefault() {
		$('section.mt-content-container p').css("font-size", 1.1 + "rem");
		$("#size").val("1.1");
		$("#slider-page-width").val("0");
		$("#toggler-text").attr("class", "toggler");
		$('section.mt-content-container').css("margin-left", 0 + "px");
		$('section.mt-content-container').css("margin-right", 0 + "px");
		localStorage.setItem('page_width', 0);
		$('section.mt-content-container p').css("text-align", "justify");
	};

	async function TOC() {
		let coverpage;
		let coverTitle;
		let content;
		if (!navigator.webdriver || !window.matchMedia('print').matches) {
			coverpage = await LibreTexts.getCoverpage();
			if (coverpage)
				await makeTOC(coverpage, true);
			else
				await makeTOC('home', true);
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
							const dfd = new $.Deferred();
							let node = data.node;
							data.result = dfd.promise();
							makeTOC(node.data.url).then((result) => dfd.resolve(result));
						}
					})
				}
			}
		}
	}


