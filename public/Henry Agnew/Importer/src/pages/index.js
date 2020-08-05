import React, {useState} from 'react';
import Toggle from 'react-toggle';
import Importer from "../components/Importer.jsx";
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

function Dashboard() {
	const [panel, setPanel] = useState('epub');
	const devMode = localStorage.getItem('devMode');
	
	return <div className={'CenterContainer'}>
		<div className="navigationBar">
			<select onChange={(event) => {
				setPanel(event.target.value);
			}} defaultValue={panel}>
				{/*<option value={'Revisions'}>Revision Log</option>*/}
				<option value={'epub'}>Import EPUB</option>
				<option value={'commoncartridge'}>Import Common Cartridge</option>
				<option value={'libremap'}>Import into LibreMaps</option>
				{/*<option value={'pdf'}>Import PDF</option>*/}
				<option value={'pretext'}>Import PreTeXt</option>
			</select>
			<div>
				<label style={{display: 'flex', alignItems: 'center'}}>
					<span style={{marginRight: '10px'}}>Dev Mode</span>
					<Toggle onChange={() => {
						if (devMode) {
							let answer = confirm('Exiting Dev mode will refresh the page. Confirm?');
							if (answer) {
								localStorage.removeItem('devMode');
								location.reload();
							}
						}
						else {
							let answer = prompt('Please enter in development user. This will refresh the page!');
							if (answer) {
								localStorage.setItem('devMode', answer);
								location.reload();
							}
						}
					}}
					        checked={Boolean(devMode)}/>
				</label>
			</div>
		</div>
		<Importer panel={panel} devMode={devMode}/>
	</div>;
}


ReactDOM.render(<Dashboard/>, target);