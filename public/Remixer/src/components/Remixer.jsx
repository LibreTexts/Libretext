import React from 'react';
import RemixerPanel from './RemixerPanel.jsx';
import PublishPanel from './PublishPanel.jsx';
import RemixerFunctions from '../reusableFunctions';
import RemixerOptions from "./RemixerOptions.jsx";


export default class Remixer extends React.Component {
	constructor() {
		super();
		
		this.state = {
			stage: 'Remixing',
			mode: 'Pro',
			options: {
				tutorial: false,
				enableAutonumber: true,
				autonumber: {offset: 1},
			},
			RemixTree: RemixerFunctions.generateDefault(5, 0),
		};
	}
	
	async componentDidMount() {
		if (localStorage.getItem('RemixerState')) {
			let state = JSON.parse(localStorage.getItem('RemixerState'));
			this.setState(state);
		}
	}
	
	updateRemixer = (newState) => {
		this.setState(newState);
		this.save({...this.state, ...newState});
	};
	
	save = (newState) => {
		localStorage.setItem('RemixerState', JSON.stringify(newState));
		this.props.save();
	};
	
	render() {
		window['developmentRemixer'] = this.state;
		// console.log(this.state, 'Rerender');
		return <>{this.renderState()}</>;
	}
	
	renderState() {
		switch (this.state.stage) {
			case 'Remixing':
				return <>
					<RemixerOptions {...this.state} updateRemixer={this.updateRemixer}/>
					<RemixerPanel {...this.state} updateRemixer={this.updateRemixer}/>
				</>;
			case 'Publishing':
				return <>
					<PublishPanel {...this.state} updateRemixer={this.updateRemixer}/>
				</>;
			default:
				return <div>Default</div>;
		}
	}
}