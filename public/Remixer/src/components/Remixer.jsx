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
			undoArray: [],
			redoArray: [],
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
			currentlyActive: '',
		};
		if (localStorage.getItem('RemixerState')) {
			state = {...state, ...JSON.parse(localStorage.getItem('RemixerState'))};
		}
		this.state = state;
	}
	
	updateRemixer = (newState, updateUndo) => {
		if (updateUndo) {
			//add to undo list
			let newUndo = this.state.RemixTree;
			console.log(newUndo);
			newUndo = this.state.undoArray.concat(JSON.parse(JSON.stringify(newUndo)));
			if (newUndo.length > 50)
				newUndo.splice(0, newUndo.length - 50);
			this.setState({undoArray: newUndo});
			//reset redo
			this.setState({redoArray: []});
		}
		this.setState(newState);
		this.save({...this.state, ...newState});
	};
	
	save = (newState) => {
		let toSave = {...newState};
		delete toSave.undoArray;
		delete toSave.redoArray;
		localStorage.setItem('RemixerState', JSON.stringify(toSave));
		this.props.save();
	};
	
	undo = () => {
		let result = {
			redoArray: this.state.redoArray.concat(JSON.parse(JSON.stringify(this.state.RemixTree))),
			RemixTree: this.state.undoArray.pop(),
			undoArray: this.state.undoArray
		};
		
		this.setState(result);
		this.save({...this.state, ...result});
	};
	
	redo = () => {
		let result = {
			undoArray: this.state.undoArray.concat(JSON.parse(JSON.stringify(this.state.RemixTree))),
			RemixTree: this.state.redoArray.pop(),
			redoArray: this.state.redoArray,
		};
		
		this.setState(result);
		this.save({...this.state, ...result});
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