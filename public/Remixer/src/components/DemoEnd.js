import RemixerFunctions from "../reusableFunctions";
import React from "react";
import SaveAlt from "@material-ui/icons/SaveAlt";
import Button from "@material-ui/core/Button";


export default function DemoEnd(props) {
	return <div id='LTForm' className='RemixerPanel'>
		<h2>Thanks for trying out the OER Remixer in Demonstration mode!<br/>
		
			We recommend saving your work to your computer.<br/>
			
			If you are interested, contact us to get a free account using the button below so that you can publish your
			own LibreText!
		</h2>
		
		<div className="LTFormHeader"
		     style={{backgroundColor: RemixerFunctions.userPermissions(true).color, justifyContent: "space-between"}}>
			<Button variant="contained" onClick={() => props.updateRemixer({stage: 'Remixing'})}>Return to
				Remixer</Button>
			<a href='mailto:info@libretexts.org?subject=Remixer%20Account%20Request'><Button variant="contained">Request
				an account</Button></a>
			<Button variant="contained" color="secondary" onClick={saveJSON}>Save to Computer<SaveAlt/></Button>
		</div>
	</div>;
	
	
	function saveJSON() {
		let temp = {...props};
		delete temp.undoArray;
		delete temp.redoArray;
		
		let data = new Blob([JSON.stringify(temp, null, 2)], {type: 'application/json;charset=utf-8'});
		const fileNameToSaveAs = `${props.RemixTree.title || 'Unnamed Remix'}-${props.institution.match(/(?<=\/)[^/]*?$/)[0]}.${props.mode.toLowerCase()}`;
		
		RemixerFunctions.downloadFile(data, fileNameToSaveAs);
		
	}
}