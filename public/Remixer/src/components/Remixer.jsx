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
import {createMuiTheme} from '@material-ui/core/styles';
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import {blue, grey} from "@material-ui/core/colors";
import {Switch} from "@material-ui/core";


export default class Remixer extends React.Component {
	constructor(props) {
		super(props);
		const defaultState = {
			mode: 'Remix',
			stage: 'Remixing',
			permission: RemixerFunctions.userPermissions(), //nonpermanent
			user: document.getElementById('usernameHolder').innerText, //nonpermanent
			href: window.location.href, //nonpermanent
			defaultCopyMode: 'transclude',
			undoArray: [],
			redoArray: [],
			options: {
				tutorial: false,
				enableAutonumber: true,
				autonumber: {
					guideDepth: 1,
					topicStart: 1,
					offset: 1,
					chapterPrefix: '',
					pagePrefix: '',
					overwriteSuffix: false,
				},
			},
			swapDialog: false,
			RemixTree: RemixerFunctions.generateDefault(5, 0),
			currentlyActive: '',
		};
		const [current] = LibreTexts.parseURL();
		if (defaultState.permission !== 'Demonstration')
			LibreTexts.sendAPI('createSandbox', {
				username: document.getElementById('usernameHolder').innerText,
				id: document.getElementById('userIDHolder').innerText,
				subdomain: current,
			}).then();
		let state = defaultState;
		if (localStorage.getItem('RemixerState')) {
			state = {
				...state, ...JSON.parse(localStorage.getItem('RemixerState')),
				permission: RemixerFunctions.userPermissions(), //nonpermanent
				user: document.getElementById('usernameHolder').innerText, //nonpermanent
				href: window.location.href, //nonpermanent
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
		switch (permission) {
			case "Admin":
			case "Pro":
			case "Basic":
				return true;
			default:
				return false;
		}
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
		newState.name = undefined;
		newState['lastSaved'] = (new Date()).toISOString();
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
					RemixTree: RemixerFunctions.generateDefault(0, 0)
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
	};
	
	render() {
		// console.log(this.state, 'Rerender');
		const dark = localStorage.getItem('darkMode') === 'true';
		const theme = createMuiTheme({
			palette: {
				type: dark ? 'dark' : 'light',
				primary: blue,
				secondary: {main: '#008000'},
				default: grey,
			},
		});
		return <ThemeProvider theme={theme}>
			<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"/>
			<div className="navigationBar" style={{justifyContent: 'center'}}>
				<div style={{fontSize: '130%'}}>New Remix
					{this.allowedReRemixer() ?
						<>
							<Switch
								onClick={(e) => this.setState({swapDialog: this.state.mode === 'ReRemix' ? 'Remix' : 'ReRemix'})}
								checked={this.state.mode === 'ReRemix'} color="default"/>
							
							Edit Remix</> : null}
				</div>
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
		</ThemeProvider>;
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