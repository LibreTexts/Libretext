
import React, {useEffect, useState } from 'react';
import Sidebar from 'react-sidebar';
import ReactDOM from 'react-dom';
import FontSizeChanger from 'react-font-size-changer';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import InputRange from 'react-input-range';
const target = document.createElement("div");

// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);



 
function Customization(){
	
	// useEffect(() => { // initialization code
	// 	if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
	// 		localStorage.setItem('darkMode', true);
	// 	if (localStorage.getItem('darkMode') === 'true')
	// 		$('.elm-skin-container').addClass('darkMode');
	// }, []);
	

	
	const [background, setBackground] = useState('#9ccc65');
	const [sidebarOpen, onSetOpen] = useState(false);
	const [_value, setValue] = useState('400');
	return(
	
	<div>
		
		<Sidebar 
			open={sidebarOpen} onSetOpen={onSetOpen}
			sidebar={<h3> Page Customization <br/>Adjust Text Size<br/>
				<FontSizeChanger targets={['#target']} 
						onChange={(element, newValue, oldValue)=> {console.log(element, newValue, oldValue);}} 
						options={{stepSize: 1,
								range: 3}}
						customButtons = {{
							up: <ZoomInIcon/>,
							down: <ZoomOutIcon/>,
							style: {
								border: '0',
								paddingTop: 30
							},
							buttonsMargins: 10
						}}>
				</FontSizeChanger><br/>
				Ajust Text Width<br/>
				{/* <input id="width" type="range" min="0" max="400" value="200" onChange ={ () => setpageWidth(value)}></input> */}
				<button onClick={ () => setValue(_value + 20)}>Increase Page Width</button><br/>
				<button onClick={ () => setValue(_value - 20)}>Decrease Page Width</button><br/>
				


		</h3>} 
			styles ={{sidebar: {background: "white", font: 'Roboto'}}}
		>
		
			<button onClick={ () => onSetOpen(true)}>Toggle Sidebar</button>
		
		</Sidebar>
		
		<p id="target" style={{paddingTop: 50, marginLeft: 0, marginRight: {_value}}}>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Porttitor eget dolor morbi non arcu risus quis varius. Non consectetur a erat nam at lectus urna duis. Tempus quam pellentesque nec nam aliquam sem et. Purus semper eget duis at. Cursus risus at ultrices mi tempus. Sollicitudin aliquam ultrices sagittis orci a scelerisque. Ut placerat orci nulla pellentesque dignissim enim sit amet. Molestie nunc non blandit massa enim nec. In nibh mauris cursus mattis. Tellus mauris a diam maecenas sed enim ut sem viverra. Vitae tortor condimentum lacinia quis vel eros donec. Fermentum odio eu feugiat pretium nibh. Mi sit amet mauris commodo quis imperdiet massa. Integer quis auctor elit sed. Feugiat in fermentum posuere urna nec. Pulvinar neque laoreet suspendisse interdum consectetur. Fringilla phasellus faucibus scelerisque eleifend. Massa tincidunt dui ut ornare lectus sit amet est. Volutpat consequat mauris nunc congue.

Fusce ut placerat orci nulla pellentesque dignissim enim. Amet est placerat in egestas. Hendrerit gravida rutrum quisque non tellus orci ac. Tellus pellentesque eu tincidunt tortor. Tempus egestas sed sed risus pretium quam vulputate. Blandit aliquam etiam erat velit scelerisque in dictum. Velit laoreet id donec ultrices tincidunt arcu non sodales. Lacus vel facilisis volutpat est velit egestas dui id. Tellus in metus vulputate eu scelerisque felis imperdiet. Aenean vel elit scelerisque mauris pellentesque pulvinar. Vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras. Aliquet lectus proin nibh nisl condimentum id venenatis a. Amet aliquam id diam maecenas ultricies. Quis hendrerit dolor magna eget. At tellus at urna condimentum mattis pellentesque id. Vel eros donec ac odio tempor orci dapibus ultrices in.

Nunc sed blandit libero volutpat sed cras. Mi proin sed libero enim sed faucibus turpis in eu. Id consectetur purus ut faucibus pulvinar elementum integer enim. Cursus vitae congue mauris rhoncus aenean vel. Metus vulputate eu scelerisque felis imperdiet proin. Justo eget magna fermentum iaculis eu non diam phasellus vestibulum. Ac turpis egestas maecenas pharetra convallis posuere. Blandit cursus risus at ultrices mi tempus imperdiet nulla malesuada. Elementum integer enim neque volutpat ac tincidunt vitae. Id diam maecenas ultricies mi eget mauris pharetra et. Nulla malesuada pellentesque elit eget gravida cum. At tempor commodo ullamcorper a lacus vestibulum sed arcu non. Accumsan lacus vel facilisis volutpat est velit egestas dui.

Urna id volutpat lacus laoreet non curabitur gravida. Pellentesque id nibh tortor id aliquet lectus proin nibh. Neque laoreet suspendisse interdum consectetur libero id faucibus nisl. Erat nam at lectus urna duis convallis convallis tellus. Eu turpis egestas pretium aenean pharetra. Integer eget aliquet nibh praesent tristique magna. Aliquet lectus proin nibh nisl condimentum id. Facilisis volutpat est velit egestas dui. Pretium aenean pharetra magna ac placerat vestibulum lectus. Consequat nisl vel pretium lectus quam. Leo integer malesuada nunc vel risus commodo viverra maecenas. Aliquam ut porttitor leo a diam sollicitudin.

Elementum nibh tellus molestie nunc non blandit massa enim nec. Est velit egestas dui id. Sapien nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Vitae et leo duis ut diam quam. Orci nulla pellentesque dignissim enim. Quam lacus suspendisse faucibus interdum posuere lorem ipsum dolor. Enim diam vulputate ut pharetra sit amet aliquam. Cras adipiscing enim eu turpis egestas pretium aenean pharetra. Odio eu feugiat pretium nibh ipsum consequat nisl vel pretium. Nam at lectus urna duis convallis convallis. Sit amet aliquam id diam maecenas ultricies. Elementum pulvinar etiam non quam lacus. Adipiscing tristique risus nec feugiat in fermentum posuere urna. Lacus viverra vitae congue eu. Risus feugiat in ante metus dictum at tempor commodo. Bibendum at varius vel pharetra vel turpis.
		</p>
		
		</div>
	);
 }

ReactDOM.render(<Customization/>, target);
