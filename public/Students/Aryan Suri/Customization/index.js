
import React, {useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import FontSizeChanger from 'react-font-size-changer';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';

const target = document.createElement("div");

// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);



 
 function Customization(){
	
	useEffect(() => { // initialization code
		if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
			localStorage.setItem('darkMode', true);
		if (localStorage.getItem('darkMode') === 'true')
			$('.elm-skin-container').addClass('darkMode');
	}, []);
	

	
	const [background, setBackground] = useState('#9ccc65');
	console.log(background);
	
	

	return(
	
	<div style={{backgroundColor: background,
				height: "100vh" ,
				padding: 50}}>
		
		
		{/*<button onClick ={() => setBackground('#2196f3')}>Click Me</button>*/}
		{/* <Helmet>
			<style> {'body {background-color: red; }'}	</style>
               
        </Helmet> */}
		
		<span>
			
			<FontSizeChanger targets={['#target']} 
						onChange={(element, newValue, oldValue)=> {console.log(element, newValue, oldValue);}} 
						options={{stepSize: 1,
								range: 3}}
						customButtons = {{
							up: <ZoomInIcon/>,
							down: <ZoomOutIcon/>,
							style: {
								border: '0',
								padding: 5
							},
							buttonsMargins: 10
						}}
>
		</FontSizeChanger></span>
		<h2 onClick = { () => setBackground('#2196f3')}> Font Size Changer Test.</h2>
		<p id="target">
		Ku um nachmittag knabenhaft fluchtigen. Gesicht nur unrecht familie braunen vor melodie. Es tanzmusik mudigkeit nachgehen verodeten ri. Bin getrunken die klimperte unbemerkt gestrigen bis. Ers sieht man fromm leise szene gro litze waren. Bandes baumen vom bleibt halfte fur fruhen war freude sag. Mundart spatzen erzahlt was fingern gut solchen. 

Feld tun ihn tief ist ruth froh funf. Glaubs schale lernen ist her. Was mir gro faden miene ungut gehts neues sieht. Se pa kennet la lustig lassig pa lauter. All richten der besorgt schritt sie her. Vorbeugte duftenden bi schonheit zu erstaunen. Handen sofort wu pa wasser. 

Ordentlich getunchten in flusterton en grashalden. Jeder es indem ob euren. Litze buben so nahen es du wills mager se. Sieben pfeife ja da langst hellen. Angenommen bescheiden besonderes in am em verschwand aufzulosen da. Fu an es unwissend zu liebhaben argerlich schleiche ausdenken. Geh nah kraftlos gegenden launisch verwohnt nur schweren prachtig. Familie stimmts die gefreut sto steilen preisen gesicht. 

Feierabend messingnen grasgarten zu la. Ture sehr mann hort ich mut dem. Du laut bist es eben hier trug. Grundstuck ab zu he lattenzaun dazwischen schuchtern so. Vor hab heimweh gerbers und samstag. Madchens gemessen in blaulich so hindurch liebsten. Hob mehr see man laut hand seid dort ehe moge. 

Zuhorte erstieg fremder mu in er es. La immer nahen so ihnen ja. Zinnerne es schlafen wirklich ku gepflegt leuchter er verstand in. Weibern ob da endlich gelesen. Esse eben hat bin fur vorn haar lich ists. Familien ri indessen brannten begierig herunter sprachen je. Lauf chen se da ri mu ruth. Offnung tadelte meister trocken brachte he so en stiefel. 

Ihr vorsichtig wohnzimmer getunchten das bescheiden begleitete. Konnen neu fraget lag groben gefuhl gro uns. Ei te wu la ortes sogar mager gutes bello. Gepfiffen an schwachem gestrigen em angerufen. Weg hellen gerade kinder ihn schade mut. Indes nur tur dahin anzug orten feuer indem. 

Bett em ziel furs will paar an se so. Vor lampchen gelandes ans sichtbar gebrauch ich. Der leuchtturm angenommen kindlichen ist bin fluchtigen. Ernsthaft hemdarmel erstaunen eia das einfacher. Begleitete zaunpfahle dammerigen wir tat bin. Stellte klopfen dus ten kam schlank schlich. Ein ist orte und herd auch wies. 

Wachsam wer schones barbele gewogen ein eigenes. Pa en so bist ja eile hals sein euer. Bett und sage weg mirs gelt fur dort. Kartoffeln halboffene ob ungerechte vertreiben lehrlingen te. Brotkugeln vorpfeifen neidgefuhl zu erhaltenen so es nachtessen geheiratet. Wollen herauf leisen rothfu freude aus nah. Gerbers unrecht te in zwiebel an. 

Brachte dus gerbers stickig die. Sprach heimat und ruhmte zeitig eck wichse. So da frei ob brot da alte sage dran. Eia zog darin mir genie der dahin denen. Um erschrak gelandes ja la arbeiter he. Zu leuchtete es ja flanierte kraftiger. 

Se dort denk er kein. Verstand was ihm kindbett gelandes ein. Weiterhin erstaunen schneider als schonheit aufstehen kam. Las man grausam man wimpern gesicht zwingen manchen steilen. Zart mu gern ja dame sies. Augenblick verstehsts em bi aufmerksam bangigkeit. 


		</p>
		
		</div>
	);
 }



//will likely need to "change public/Students/Henry Agnew/BeeLine/beeline-integration.js"
/*//Beeline
innerHTML += `<div class="LTdropdown beeline-toggles" style="float:left; background-color: #d4d4d4; color:black"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div><div class="LTdropdown-content" style="right: 0">`;
innerHTML += `<a class="btn btn-large" style="display: flex" href="http://www.beelinereader.com/education/?utm_source=libretexts" target="_blank"
title="BeeLine helps you read on screen more easily by using a color gradient that pulls your eyes through the text. Try out the color schemes to find your favorite to use on LibreTexts. Be sure to check out BeeLine's apps and plugins, so you can read PDFs, Kindle books, and websites more easily!">
<img style="margin-right: 5px; width:25px; height: 25px" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png">About BeeLine</a>`;
innerHTML += `<a class="btn btn-large" data-color="bright">Bright</a>`;
innerHTML += `<a class="btn btn-large" data-color="dark">Dark</a>`;
innerHTML += `<a class="btn btn-large" data-color="blues">Blues</a>`;
innerHTML += `<a class="btn btn-large" data-color="gray">Gray</a>`;
innerHTML += `<a class="btn btn-large" data-color="night_blues">Inverted</a>`;
innerHTML += `<a class="btn btn-large active" data-color="off">Off</a>`;
innerHTML += `<a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;*/


ReactDOM.render(<Customization/>, target);
