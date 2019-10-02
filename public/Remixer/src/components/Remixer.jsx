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
			undo: [],
			redo: [],
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
			state = {...state, ...JSON.parse(localStorage.getItem('RemixerState'))};
		}
		this.state = state;
	}
	
	updateRemixer = (newState, updateUndo) => {
		this.setState(newState);
		if (updateUndo) {
			//add to undo list
			let newUndo = {...this.state, ...newState}.RemixTree;
			newUndo = this.state.undo.concat(newUndo);
			if (newUndo.length > 50)
				newUndo.splice(0, newUndo.length - 50);
			this.setState({undo: newUndo});
			
			//reset redo
			this.setState({redo: []});
		}
		this.save({...this.state, ...newState});
	};
	
	save = (newState) => {
		let toSave = {...newState};
		delete toSave.undo;
		delete toSave.redo;
		localStorage.setItem('RemixerState', JSON.stringify(toSave));
		this.props.save();
	};
	
	undo = () => {
		let result = {
			redo: this.state.redo.concat(this.state.RemixTree),
			RemixTree: this.state.undo.pop(),
			undo: this.state.undo
		};
		
		this.setState(result);
	};
	
	redo = () => {
		let result = {
			undo: this.state.redo.concat(this.state.RemixTree),
			RemixTree: this.state.redo.pop(),
			redo: this.state.redo,
		};
		
		this.setState(result);
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
					<RemixerPanel {...this.state} updateRemixer={this.updateRemixer} undo={this.undo} redo={this.redo}/>
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