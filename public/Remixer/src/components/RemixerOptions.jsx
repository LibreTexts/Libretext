import React, {useState, useEffect} from 'react';
import RemixerFunctions from '../reusableFunctions';

import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import OptionsPanel from "./OptionsPanel.jsx";

export default function RemixerOptions(props) {
	let [institutions, setInstitutions] = useState(<MenuItem value=""><em>Loading</em></MenuItem>);
	
	useEffect(() => {
		getInstitutions().then();
	}, []);
	
	async function getInstitutions() {
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		
		const isDemonstration = RemixerFunctions.checkIfDemonstration();
		if (isDemonstration) {
			return <MenuItem key={`https://${subdomain}.libretexts.org/Workshops/Workshop_University`}
			                 value={`https://${subdomain}.libretexts.org/Workshops/Workshop_University`}>Workshop
			                                                                                             University</MenuItem>;
		}
		
		let response = await LibreTexts.authenticatedFetch('Courses', 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		const subpageArray = (response['@count'] === '1' ? [response['page.subpage']] : response['page.subpage']) || [];
		const result = [];
		// console.log(subpageArray);
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push(<MenuItem key={institution['uri.ui']}
			                      value={institution['uri.ui']}>{institution.title}</MenuItem>);
		}
		result.push(<MenuItem key="" value="">Not listed? Contact info@libretexts.org</MenuItem>);
		setInstitutions(result);
		props.updateRemixer({institution: result[0].props.value});
	};
	
	return <div style={{display: 'flex', margin: 10, alignItems: 'center'}}>
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			marginRight: 10,
			flex: 1
		}}><TextField
			label="LibreText name"
			margin="normal"
			variant="outlined"
			value={props.name || ""}
			onChange={(event) => {
				props.updateRemixer({name: event.target.value});
			}}
		/>
			<TextField
				select
				label="Institution"
				value={props.institution || ""}
				onChange={(event) => {
					props.updateRemixer({institution: event.target.value});
				}}
				helperText="Please select your institution"
				margin="normal"
				variant="outlined"
			>{institutions}
			</TextField>
		</div>
		<OptionsPanel {...props}/>
	</div>;
	
}