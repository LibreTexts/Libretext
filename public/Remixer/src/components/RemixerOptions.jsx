import React, {useEffect, useState} from 'react';

import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import OptionsPanel from "./OptionsPanel.jsx";
import {Tooltip} from "@material-ui/core";

export default function RemixerOptions(props) {
	let [institutions, setInstitutions] = useState([{url: '', title: <em>Loading</em>}]);
	
	useEffect(() => {
		getInstitutions().then();
	}, [props.permission]);
	
	async function getInstitutions() {
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		const result = [{
			url: `https://${subdomain}.libretexts.org/Sandboxes`,
			title: 'Your Personal Sandbox'
		}];
		
		/*switch (RemixerFunctions.userPermissions()) {
			case 'Basic':*/
		setInstitutions(result);
		props.updateRemixer({institution: result[0].url});
		return result;
		/*result.push({
			url: `https://${subdomain}.libretexts.org/Courses/Remixer_University`,
			title: 'Remixer University'
		});
		setInstitutions(result);
		props.updateRemixer({institution: result[0].url});
		return result;*/
		// }
		
		
		/*let response = await LibreTexts.authenticatedFetch('Courses', 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		const subpageArray = (response['@count'] === '1' ? [response['page.subpage']] : response['page.subpage']) || [];
		// console.log(subpageArray);
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			if (!institution.title.includes('Remixer University'))
				result.push({url: institution['uri.ui'], title: institution.title});
		}
		result.push({url: '', title: 'Not listed? Contact info@libretexts.org'});
		setInstitutions(result);
		props.updateRemixer({institution: result[0].url});*/
	}
	
	let title = props.RemixTree.title;
	title = title && title !== "New Untitled Remix" ? title : '';
	
	return <div style={{display: 'flex', margin: 10, alignItems: 'center', color: 'black'}}>
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			marginRight: 10,
			flex: 1
		}}><TextField
			label="Remix name"
			margin="normal"
			variant="outlined"
			value={title}
			helperText={props.mode === 'Remix' ? 'Your Remix will be saved to your personal sandbox.' : null}
			onChange={(event) => {
				const tempTree = props.RemixTree;
				tempTree.title = event.target.value;
				props.updateRemixer({RemixTree: tempTree});
			}}
		/>
			{props.permission !== 'Basic' ? <TextField
				select
				id='defaultCopyMode'
				label="Default Copy Mode"
				value={props.defaultCopyMode}
				onChange={(event) => {
					props.updateRemixer({defaultCopyMode: event.target.value});
				}}
				helperText="Choose the default copy mode. This can be overridden when editing an individual page."
				margin="normal"
				variant="outlined"
			>
				<MenuItem value='transclude'>
					<Tooltip
						title="In copy-transclude mode, pages will be automatically updated from the source (Recommended)">
						<div>Copy-Transclude (Recommended)</div>
					</Tooltip>
				</MenuItem>
				<MenuItem value='fork'>
					<Tooltip
						title="In copy-fork mode, pages will be duplicated from the source. This allows for customization but means that the page won't automatically update from the source">
						<div>Copy-Fork</div>
					</Tooltip>
				</MenuItem>
				{props.permission === 'Admin' ?
					<MenuItem value='full'>
						<Tooltip
							title="[Only for Admins] Copy-full mode duplicates a page along with all of the images and attachments on it. Best for cross-library migrations.">
							<div>Copy-Full [Only for Admins]</div>
						</Tooltip>
					</MenuItem>
					: null}
			</TextField> : null}
		</div>
		<OptionsPanel {...props}/>
	</div>;
	
}