import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


function Customization() {
	
	useEffect(() => { // initialization code
		if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
			localStorage.setItem('darkMode', true);
		if (localStorage.getItem('darkMode') === 'true')
			$('.elm-skin-container').addClass('darkMode');
	}, []);
	
	return <div></div>;
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