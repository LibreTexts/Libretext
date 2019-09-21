import React, {useState, useEffect} from 'react';
import RemixerFunctions from '../reusableFunctions';

import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import OptionsPanel from "./OptionsPanel.jsx";

export default function RemixerOptions(props) {
	let [institutions, setInstitutions] = useState([{url: '', title: <em>Loading</em>}]);
	
	useEffect(() => {
		getInstitutions().then();
	}, [props.mode]);
	
	async function getInstitutions() {
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		const result = [];
		
		const isDemonstration = RemixerFunctions.userPermissions() === 'Workshop';
		if (isDemonstration) {
			result.push({
				url: `https://${subdomain}.libretexts.org/Workshops/Workshop_University`,
				title: 'Workshop University'
			});
			setInstitutions(result);
			props.updateRemixer({institution: `https://${subdomain}.libretexts.org/Workshops/Workshop_University`});
			return result;
		}
		
		let response = await LibreTexts.authenticatedFetch('Courses', 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		const subpageArray = (response['@count'] === '1' ? [response['page.subpage']] : response['page.subpage']) || [];
		// console.log(subpageArray);
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push({url: institution['uri.ui'], title: institution.title});
		}
		result.push({url: '', title: 'Not listed? Contact info@libretexts.org'});
		setInstitutions(result);
		props.updateRemixer({institution: result[0].url});
	}
	
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
			>{institutions.map(elem => <MenuItem key={elem.url}
			                                     value={elem.url}>{elem.title}</MenuItem>)}
			</TextField>
		</div>
		<OptionsPanel {...props}/>
	</div>;
	
}