import React from 'react';
import RemixerPanel from './RemixerPanel.jsx';
import PublishPanel from './PublishPanel.jsx';
import RemixerFunctions from '../reusableFunctions';
import RemixerOptions from "./RemixerOptions.jsx";


export default class Remixer extends React.Component {
	constructor() {
		super();
		let state = {
			type: 'Remix',
			stage: 'Remixing',
			mode: RemixerFunctions.userPermissions(),
			defaultCopyMode: 'transclude',
			options: {
				tutorial: false,
				enableAutonumber: false,
				autonumber: {
					offset: 1,
					chapterPrefix: '',
					pagePrefix: '',
				},
				overwriteSuffix: false,
			},
			RemixTree: RemixerFunctions.generateDefault(5, 0),
		};
		if (localStorage.getItem('RemixerState')) {
			state = JSON.parse(localStorage.getItem('RemixerState'));
		}
		this.state = state;
	}
	
	updateRemixer = (newState, isMiniUpdate) => {
		this.setState(newState);
		this.save({...this.state, ...newState}, isMiniUpdate);
	};
	
	save = (newState, isMiniUpdate) => {
		localStorage.setItem('RemixerState', JSON.stringify(newState));
		//TODO isMiniUpdate will not affect undo/redo functionality
		
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