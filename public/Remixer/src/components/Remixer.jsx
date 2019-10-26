import React from 'react';
import RemixerPanel from './RemixerPanel.jsx';
import PublishPanel from './PublishPanel.jsx';
import RemixerFunctions from '../reusableFunctions';
import RemixerOptions from "./RemixerOptions.jsx";
import ReRemixerPanel from "./ReRemixerPanel.jsx";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";


export default class Remixer extends React.Component {
	constructor(props) {
		super(props);
		const defaultState = {
			mode: 'Remix',
			stage: 'Remixing',
			permission: RemixerFunctions.userPermissions(),
			defaultCopyMode: 'transclude',
			undoArray: [],
			redoArray: [],
			options: {
				tutorial: false,
				enableAutonumber: true,
				autonumber: {
					guideDepth: 1,
					offset: 1,
					chapterPrefix: '',
					pagePrefix: '',
				},
				overwriteSuffix: false,
			},
			swapDialog: false,
			RemixTree: RemixerFunctions.generateDefault(5, 0),
			currentlyActive: '',
		};
		let state = defaultState;
		if (localStorage.getItem('RemixerState')) {
			state = {
				...state, ...JSON.parse(localStorage.getItem('RemixerState')),
				permission: RemixerFunctions.userPermissions()
			};
		}
		if (!this.allowedReRemixer(state.permission) && state.mode === 'ReRemix') { //prevent insecure access
			state = defaultState;
			alert('You do not currently have permission to access the ReRemixer.');
		}
		if (state.type) {
			state.permission = state.mode;
			state.mode = state.type;
			delete state.type;
		}
		this.state = state;
	}
	
	allowedReRemixer(permission = this.state.permission) {
		return permission === 'Admin';
	}
	
	updateRemixer = (newState, updateUndo) => {
		if (updateUndo) {
			//add to undo list
			let newUndo = this.state.RemixTree;
			newUndo = this.state.undoArray.concat(JSON.parse(JSON.stringify(newUndo)));
			if (newUndo.length > 50)
				newUndo.splice(0, newUndo.length - 50);
			this.setState({undoArray: newUndo});
			//reset redo
			this.setState({redoArray: []});
		}
		let today = new Date();
		newState['lastSaved'] = `Autosaved @ ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}`;
		this.setState(newState);
		this.save({...this.state, ...newState});
	};
	
	save = (newState) => {
		let toSave = {...newState};
		delete toSave.undoArray;
		delete toSave.redoArray;
		localStorage.setItem('RemixerState', JSON.stringify(toSave));
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
	
	
	handleSwap = (doSwap) => {
		let result = {swapDialog: false};
		if (doSwap === true) {
			result = {
				...result, ...{
					mode: this.state.swapDialog,
					undoArray: [],
					redoArray: [],
					currentlyActive: '',
					RemixTree: RemixerFunctions.generateDefault(0,0)
				}
			};
			switch (this.state.swapDialog) {
				case 'Remix':
					result.stage = 'Remixing';
					break;
				case 'ReRemix':
					result.stage = 'ReRemixing';
					break;
			}
		}
		this.setState(result);
	}
	
	render() {
		// console.log(this.state, 'Rerender');
		return <>
			<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"/>
			<div className="navigationBar" style={{justifyContent: 'space-between'}}>
				<Select onChange={(e) => this.setState({swapDialog: e.target.value})} value={this.state.mode}>
					<MenuItem value={'Remix'}>Remixer</MenuItem>
					{this.allowedReRemixer() ?
						<MenuItem value={'ReRemix'}>ReRemixer</MenuItem> : null}
				</Select>
				<span>{this.state.lastSave}</span>
			</div>
			
			{this.renderState()}
			
			<Dialog open={this.state.swapDialog && this.state.swapDialog !== this.state.mode} onClose={this.handleSwap}
			        aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Want to swap Remixer modes?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						This action will clear your work in the {this.state.mode} Panel and your undo history. Consider
						saving your
						current workspace to a file with the "Save File" button.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleSwap} color="primary">
						Cancel
					</Button>
					<Button onClick={() => this.handleSwap(true)} color="primary">
						Swap to {this.state.swapDialog} mode
					</Button>
				</DialogActions>
			</Dialog>
		</>;
	}
	
	renderState() {
		switch (this.state.stage) {
			case 'ReRemixing':
				return <>
					<ReRemixerPanel {...this.state} updateRemixer={this.updateRemixer}/>
				</>;
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