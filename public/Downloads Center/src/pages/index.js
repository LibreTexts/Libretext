import React from 'react';
import LibreText from "../components/LibreText";
// import "../styles/DownloadsCenter.css";
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);



class Center extends React.Component {
	render() {
		let result = downloads.map((item, index) => <LibreText key={index} item={item}/>);
		return <div className={'Center'}>{result}</div>
	}
	
}

ReactDOM.render(<Center/>, target);