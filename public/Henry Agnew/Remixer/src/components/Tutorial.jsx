import React, {useEffect} from 'react';

import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
	root: {
		width: '100%',
	},
	heading: {
		fontSize: theme.typography.pxToRem(15),
		flexBasis: '33.33%',
		flexShrink: 0,
	},
	secondaryHeading: {
		fontSize: theme.typography.pxToRem(15),
		color: theme.palette.text.secondary,
	},
}));


export default function Tutorial() {
	const [panel, setPanel] = React.useState(0);
	const [panels, setPanels] = React.useState([]);
	
	useEffect(() => {
		getTutorialPages();
		async function getTutorialPages(){
			let response = await LibreTexts.authenticatedFetch('Under_Construction/Development_Details/OER_Remixer/Mini-Tutorial', 'subpages?dream.out.format=json', 'chem')
			response = await response.json();
			response = response['page.subpage'];
			for (let i = 0; i < response.length; i++) {
				response[i] = LibreTexts.getAPI(response[i]['uri.ui'], true);
			}
			response = await Promise.all(response);
			setPanels(response);
		}
	}, []);
	
	function getPanel() {
		if (panels.length <= panel)
			return null;
		let currentPanel = panels[panel];
		return <div dangerouslySetInnerHTML={{__html: currentPanel.content.body[0]}}/>
	}
	
	return <>
		<select className='LTFormSubdomain' value={panel} onChange={(e) => setPanel(Number(e.target.value))}>
			{panels.map((step, index) => <option value={index} key={index}>{step.title}</option>)}
		</select>
		<div id='LTTutorial' style={{padding: 20, width: 'auto', overflow: 'auto', color: 'black'}}>
			{getPanel()}
		</div>
	</>
}