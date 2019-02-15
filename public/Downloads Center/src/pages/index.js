import React from 'react';
import LibreText from "../components/LibreText";
import "../styles/LibreText.css";


const downloads = ['https://batch.libretexts.org/print/Finished/chem-UC%20Davis!%20General%20Chemistry%202B%20Honors-091260a309e829cd',
'https://batch.libretexts.org/print/Finished/chem-CHEM%20309!%20General-228a2a7730157a20',
'https://batch.libretexts.org/print/Finished/chem-CHEM%20300%20-%20Beginning%20Chemistry-4b02c975ba581ff9',
'https://batch.libretexts.org/print/Finished/chem-Organic%20Chemistry-33d990177292e61e'];

export default class Center extends React.Component {
	render() {
		let result = downloads.map((url,index)=><LibreText key={index} url={url}/>);
		return <div className={'Center'}>{result}</div>
	}
	
}