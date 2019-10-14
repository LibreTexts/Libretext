import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import Remixer from "../components/Remixer.jsx";
import ReRemixer from "../components/ReRemixer.jsx";

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {SnackbarProvider} from 'notistack';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

function Dashboard() {
	let [panel, setPanel] = useState('Remixer');
	let [lastSave, setLastSave] = useState('');
	
	function getPanel() {
		switch (panel) {
			case "Remixer":
				return <Remixer save={save}/>;
			case "Re-Remixer":
				return <ReRemixer save={save}/>;
		}
	}
	
	function save() {
		let today = new Date();
		setLastSave(`Autosaved @ ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}`);
	}
	
	return <div id='Remixer' className={'CenterContainer'}>
		<SnackbarProvider maxSnack={3}>
			<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"/>
			<div className="navigationBar" style={{justifyContent: 'space-between'}}>
				<Select onChange={(e) => setPanel(e.target.value)} value={panel}>
					<MenuItem value={'Remixer'}>Remixer</MenuItem>
					<MenuItem value={'Re-Remixer'}>Re<sup>2</sup>mixer</MenuItem>
				</Select>
				<span>{lastSave}</span>
			</div>
			{getPanel()}
		</SnackbarProvider>
	</div>
}


ReactDOM.render(<Dashboard/>, target);