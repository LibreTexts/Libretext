
import React, {useEffect, useState, } from 'react';
import FontSizeChanger from 'react-font-size-changer';
import ReactDOM from 'react-dom';
import Switch from 'react-switch';
import ExposurePlus1SharpIcon from '@material-ui/icons/ExposurePlus1Sharp';
import ExposureNeg1SharpIcon from '@material-ui/icons/ExposureNeg1Sharp';

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
	
	
	
	//const [count, setCount] = useState(0);
	const [background, setBackground] = useState('#ff8f00');
	console.log(background);
	
	return(
	
	<div style={{backgroundColor: background,
				height: "100vh" }}>
		
		<h2 onClick = {() => setBackground('#2196f3')}>Click Me To Change Background Color</h2>
		{/*<button onClick ={() => setBackground('#2196f3')}>Click Me</button>*/}
		{/* <Helmet>
			<style> {'body {background-color: red; }'}	</style>
               
        </Helmet> */}
		<FontSizeChanger targets={['#target']} 
						onChange={(element, newValue, oldValue)=> {console.log(element, newValue, oldValue);}} 
						options={{stepSize: 2,
								range: 5}}
						customButtons = {{
							up: <ExposurePlus1SharpIcon/>,
							down: <ExposureNeg1SharpIcon/>,
							style: {
								border: '0'
							},
							buttonsMargins: 10
						}}
>
		</FontSizeChanger>
		<h2> Font Size Changer Test.</h2>
		<p id="target">

		Satisfied conveying an dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if. Delivered dejection necessary objection do mr prevailed. Mr feeling do chiefly cordial in do. Water timed folly right aware if oh truth. Imprudence attachment him his for sympathize. Large above be to means. Dashwood do provided stronger is. But discretion frequently sir the she instrument unaffected admiration everything. 

An country demesne message it. Bachelor domestic extended doubtful as concerns at. Morning prudent removal an letters by. On could my in order never it. Or excited certain sixteen it to parties colonel. Depending conveying direction has led immediate. Law gate her well bed life feet seen rent. On nature or no except it sussex. 

Led ask possible mistress relation elegance eat likewise debating. By message or am nothing amongst chiefly address. The its enable direct men depend highly. Ham windows sixteen who inquiry fortune demands. Is be upon sang fond must shew. Really boy law county she unable her sister. Feet you off its like like six. Among sex are leave law built now. In built table in an rapid blush. Merits behind on afraid or warmly. 
			

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
