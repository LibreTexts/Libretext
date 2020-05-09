import React from 'react';
import Toggle from 'react-toggle';
import FindReplace from "../components/FindReplace";
import DeadLinks from "../components/DeadLinks";
import HeaderFix from "../components/HeaderFix";
import ForeignImage from "../components/ForeignImage";
import ReactDOM from 'react-dom';
import ConvertContainers from "../components/ConvertContainers";
import Multi from "../components/Multi";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			panel: 'FindAndReplace',
			devMode: localStorage.getItem('devMode'),
		}
	}
	
	render() {
		return <div className={'CenterContainer'}>
			<div className="navigationBar">
				<select onChange={this.setPanel} defaultValue={this.state.panel}>
					{/*<option value={'Revisions'}>Revision Log</option>*/}
					<option value={'FindAndReplace'}>Find and Replace</option>
					<option value={'DeadLinks'}>Dead link killer</option>
					<option value={'HeaderFix'}>Header Fixer</option>
					<option value={'ForeignImage'}>Foreign Image Importer</option>
					<option value={'ConvertContainers'}>Upgrade Containers</option>
					<option value={'Multistep Preset'}>Multistep Preset</option>
				</select>
				<div>
					<label style={{display: 'flex', alignItems: 'center'}}>
						<span style={{marginRight: '10px'}}>Dev Mode</span>
						<Toggle onChange={() => {
							if (this.state.devMode) {
								let answer = confirm('Exiting Dev mode will refresh the page. Confirm?');
								if (answer) {
									localStorage.removeItem('devMode');
									location.reload();
								}
							}
							else {
								let answer = prompt('Please enter in development user. This will refresh the page!');
								if (answer) {
									localStorage.setItem('devMode', answer);
									location.reload();
								}
							}
						}}
						        checked={Boolean(this.state.devMode)}/>
					</label>
				</div>
			</div>
			{this.getPanel()}
		</div>
	}
	
	getPanel() {
		switch (this.state.panel) {
			case "Revisions":
				return null;
			case "FindAndReplace":
				return <FindReplace devMode={this.state.devMode}/>;
			case "DeadLinks":
				return <DeadLinks devMode={this.state.devMode}/>;
			case "HeaderFix":
				return <HeaderFix devMode={this.state.devMode}/>;
			case "ForeignImage":
				return <ForeignImage devMode={this.state.devMode}/>;
			case "ConvertContainers":
				return <ConvertContainers devMode={this.state.devMode}/>;
			case "Multistep Preset":
				return <Multi devMode={this.state.devMode}/>;
		}
	}
	
	setPanel = (event) => {
		this.setState({panel: event.target.value});
	}
	
}


ReactDOM.render(<Dashboard/>, target);