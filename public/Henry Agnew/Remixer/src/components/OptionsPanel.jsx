import React, {useState} from 'react';

import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import {useSnackbar} from 'notistack';
import Paper from "@material-ui/core/Paper";
import RemixerFunctions from "../reusableFunctions";

export default function OptionsPanel(props) {
	let [autonumberOpen, setAutonumberOpen] = useState(false);
	let [fileOpen, setFileOpen] = useState(false);
	let [file, setFile] = useState();
	const {enqueueSnackbar} = useSnackbar();
	
	
	function handleAutonumberClose() {
		setAutonumberOpen(false);
	}
	
	function handleFileClose() {
		setFileOpen(false);
	}
	
	function saveJSON() {
		let temp = {...props};
		delete temp.undoArray;
		delete temp.redoArray;
		
		let data = new Blob([JSON.stringify(temp, null, 2)], {type: 'application/json;charset=utf-8'});
		const fileNameToSaveAs = `${props.RemixTree.title || 'Unnamed Remix'}-${props.institution.match(/(?<=\/)[^/]*?$/)[0]}.${props.mode.toLowerCase()}`;
		
		RemixerFunctions.downloadFile(data, fileNameToSaveAs);
		
	}
	
	function loadJSON() {
		$("#fileToLoad").click();
		const fileToLoad = document.getElementById("fileToLoad").files[0];
		if (fileToLoad) {
			setFile(fileToLoad);
			setFileOpen(true);
		}
		$("#fileToLoad").val("");
	}
	
	let loadFile = (optionsOverwrite) => () => { //example of a curried function
		const fileReader = new FileReader();
		fileReader.onload = function (fileLoadedEvent) {
			let textFromFileLoaded = fileLoadedEvent.target.result;
			try {
				if (file.name.endsWith('.libremap')
					|| file.name.endsWith('.remix')
					|| file.name.endsWith('reremix')
					|| file.name.endsWith('.librelog')) {
					textFromFileLoaded = JSON.parse(textFromFileLoaded);
					if (!optionsOverwrite)
						delete textFromFileLoaded.options;
					delete textFromFileLoaded.permission;
					delete textFromFileLoaded.user;
					let [current] = LibreTexts.parseURL();
					if (textFromFileLoaded && textFromFileLoaded.href && textFromFileLoaded.mode === 'ReRemix' && !textFromFileLoaded.href.startsWith(`https://${current}.libretexts.org`)) {
						//ReRemixes must be on their original library
						const destination = textFromFileLoaded.href;
						if (confirm(`The ReRemixer requires you to use the library originally used to create this file. Would you like to navigate to ${destination}?`))
							window.location.href = destination;
						else {
							enqueueSnackbar(`ReRemix originally created at ${destination}. Please use that library instead!`, {
								variant: 'error',
								anchorOrigin: {
									vertical: 'bottom',
									horizontal: 'right',
								},
							});
						}
						setFile();
						setFileOpen(false);
						return;
					}
					
					props.updateRemixer(textFromFileLoaded);
					enqueueSnackbar(`Loaded ${file.name} successfully!`, {
						variant: 'success',
						anchorOrigin: {
							vertical: 'bottom',
							horizontal: 'right',
						},
					});
				}
				else if (file.name.endsWith('.csv')) {
					enqueueSnackbar(`I don't know what to do with ${file.name}`, {
						variant: 'warning',
						anchorOrigin: {
							vertical: 'bottom',
							horizontal: 'right',
						},
					});
				}
				else {
					enqueueSnackbar(`Invalid file ${file.name}`, {
						variant: 'error',
						anchorOrigin: {
							vertical: 'bottom',
							horizontal: 'right',
						},
					});
				}
			} catch (err) {
				alert("Invalid File!");
			}
			setFile();
			setFileOpen(false);
		};
		fileReader.readAsText(file, "UTF-8");
	};
	
	let changeOption = (option, value) => {
		let newOptions = {...props.options};
		if (option.includes('.')) {
			let [mainOption, suboption] = option.split('.');
			newOptions[mainOption][suboption] = value;
		}
		else
			newOptions[option] = value;
		
		props.updateRemixer({options: newOptions});
	};
	
	return <Paper style={{
		display: 'flex',
		flexDirection: 'column',
		padding: 20,
	}}>
		Remixer Options
		<FormControlLabel
			control={
				<Switch
					checked={props.options.tutorial}
					onChange={(e, value) => changeOption('tutorial', value)}
					color="primary"
					inputProps={{'aria-label': 'primary checkbox'}}
				/>}
			label="Show tutorial"/>
		<FormControlLabel
			control={
				<Switch
					checked={props.options.enableAutonumber}
					onChange={(e, value) => {
						changeOption('enableAutonumber', value)
					}}
					color="primary"
					inputProps={{'aria-label': 'primary checkbox'}}
				/>}
			label="Enable Autonumber"/>
		<Button variant="contained" color="primary" disabled={!props.options.enableAutonumber}
		        onClick={() => setAutonumberOpen(true)}>
			Autonumber Options
		</Button>
		<ButtonGroup
			variant="outlined"
			size="large"
			style={{marginTop: 10}}
			aria-label="large contained secondary button group">
			<Tooltip title="This will save your work to a file that you can download to your computer.">
				<Button onClick={saveJSON}>
					Save Map
				</Button>
			</Tooltip>
			<Tooltip title="This will load a Remix from a file and replace your current workspace.">
				<Button onClick={() => $("#fileToLoad").click()}>
					Load Map
				</Button>
			</Tooltip>
		</ButtonGroup>
		<input type="file" id="fileToLoad" accept=".libremap,.csv, .remix, .reremix, .librelog" onChange={loadJSON}
		       style={{position: "absolute", display: "none", width: 0, height: 0}}/>
		<Dialog // Dialog for Autonumber Options
			onClose={handleAutonumberClose}
			aria-labelledby="autonumber-dialog-title"
			open={autonumberOpen}
		>
			<DialogTitle id="autonumber-dialog-title" onClose={handleAutonumberClose}>
				Autonumber Options
			</DialogTitle>
			<DialogContent style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
				<DialogContentText>
					These options affect how the Autonumber operates. When enabled, the Autonumberer
					automatically updates the Chapter and Page numbers based on any changes you make.
				</DialogContentText>
				<TextField
					select
					label="Chapter prefix"
					value={props.options.autonumber.chapterPrefix}
					onChange={(e) => {
						changeOption('autonumber.chapterPrefix', e.target.value);
					}}
					helperText={`Pick an optional title prefix for your chapters (${props.options.autonumber.chapterPrefix} 1:)`}
					margin="normal"
					variant="filled">
					<MenuItem value=''>No Prefix</MenuItem>
					<MenuItem value='Chapter'>Chapter</MenuItem>
					<MenuItem value='Section'>Section</MenuItem>
					<MenuItem value='Unit'>Unit</MenuItem>
				</TextField>
				<TextField
					select
					label="Page Prefix"
					value={props.options.autonumber.pagePrefix}
					onChange={(e) => {
						changeOption('autonumber.pagePrefix', e.target.value);
					}}
					helperText={`Pick an optional title prefix for your pages (${props.options.autonumber.pagePrefix} 1.1:)`}
					margin="normal"
					variant="filled">
					<MenuItem value=''>No Prefix</MenuItem>
					<MenuItem value='Page'>Page</MenuItem>
					<MenuItem value='Topic'>Topic</MenuItem>
					<MenuItem value='Section'>Section</MenuItem>
					<MenuItem value='Lesson'>Lesson</MenuItem>
				</TextField>
				<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20}}>
					<TextField
						style={{margin: 0, width: '48%'}}
						id="standard-number"
						label="Initial Chapter Number"
						type="number"
						margin="normal"
						value={props.options.autonumber.offset}
						onChange={event => changeOption('autonumber.offset', Math.max(event.target.value, 0))}
						variant="filled"/>
					<TextField
						style={{margin: 0, width: '48%'}}
						id="standard-number"
						label="Initial Topic Number"
						type="number"
						margin="normal"
						value={props.options.autonumber.topicStart}
						onChange={event => changeOption('autonumber.topicStart', Math.max(event.target.value, 0))}
						variant="filled"/>
				</div>
				<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20}}>
					<Tooltip
						title={`All pages shallower than ${props.options.autonumber.guideDepth} will be categories, all pages at this depth will be guides, and all deeper will be topics.`}>
						<TextField
							style={{margin: 0, width: '50%'}}
							id="standard-number"
							label="Guide Depth"
							helperText={`This determines the tree depth at which the pages are automatically guides.`}
							type="number"
							margin="normal"
							value={props.options.autonumber.guideDepth}
							onChange={event => changeOption('autonumber.guideDepth', Math.max(event.target.value, 0))}
							variant="filled"/>
					</Tooltip>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						background: '#e8e8e8',
						padding: 5,
						borderRadius: 5
					}}>
						<Tooltip title="Renumbers pages previously indexed with letters (11.E: => 11.10:)">
							<FormControlLabel
								style={{display: 'flex', alignItems: 'center', margin: '0 5px 0 0'}}
								control={
									<Switch
										color="primary"
										inputProps={{'aria-label': 'primary checkbox'}}
										checked={props.options.autonumber.overwriteSuffix}
										onChange={(e, value) => changeOption('autonumber.overwriteSuffix', value)}
									/>}
								label="Overwrite non-number titles"/>
						</Tooltip>
					</div>
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleAutonumberClose} color="primary">
					Done
				</Button>
			</DialogActions>
		</Dialog>
		<Dialog //Dialog for file loading
			onClose={handleFileClose}
			aria-labelledby="autonumber-dialog-title"
			open={fileOpen}
		>
			<DialogTitle id="autonumber-dialog-title" onClose={handleFileClose}>
				Confirm loading previous Remix
			</DialogTitle>
			<DialogContent style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
				<DialogContentText>
					Loading a Remix from a file <b>will clear your workspace</b> and then load the file's contents.
					If you are
					currently working on something in your workspace, please save your work to a file first before
					continuing. When loading a Remix, you can optionally load the options that you were using when
					the
					file was saved.
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleFileClose} color="primary">
					Cancel
				</Button>
				<Button onClick={loadFile(true)} color="primary">
					Load Remix and previous Options
				</Button>
				<Button onClick={loadFile()} color="primary" autoFocus>
					Load Just Remix
				</Button>
			</DialogActions>
		</Dialog>
	</Paper>
}