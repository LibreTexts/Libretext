import React from 'react';
import FindReplace from "../components/FindReplace";
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Dashboard extends React.Component {
	constructor(props) {
		super(props);
	}
	
	
	render() {
		return <div className={'CenterContainer'}>
			<FindReplace/>
		</div>
	}
	
}


ReactDOM.render(<Dashboard/>, target);