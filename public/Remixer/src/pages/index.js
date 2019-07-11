import React from 'react';
import ReactDOM from 'react-dom';
import Remixer from "../components/Remixer.jsx";
import ReRemixer from "../components/ReRemixer.jsx";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			panel: 'Remixer'
		}
	}
	
	render() {
		return <div className={'CenterContainer'}>
			<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
			<div className="navigationBar">
				<Select onChange={this.setPanel} value={this.state.panel}>
					<MenuItem  value={'Remixer'}>Remixer</MenuItem >
					<MenuItem  value={'Re-Remixer'}>Re-Remixer</MenuItem >
				</Select>
			</div>
			{this.getPanel()}
		</div>
	}
	
	getPanel() {
		switch (this.state.panel) {
			case "Remixer":
				return <Remixer/>;
			case "Re-Remixer":
				return <ReRemixer/>;
		}
	}
	
	setPanel = (event) => {
		this.setState({panel: event.target.value});
	}
	
}


ReactDOM.render(<Dashboard/>, target);