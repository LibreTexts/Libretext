import React, {useState} from 'react';
import RemixerFunctions from '../reusableFunctions';

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

export default function OptionsPanel(props){
	let [open, setOpen] = useState(false);
	
	
	
	function handleClose () {
		setOpen(false);
	}
	
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
	
	return <div style={{
		display: 'flex',
		flexDirection: 'column',
		background: '#f3f3f3',
		padding: 20,
		borderRadius: 10
	}}>
		Remixer Options
		<FormControlLabel
			control={
				<Switch
					checked={props.options.tutorial}
					onChange={event => changeOption('tutorial', event.target.checked)}
					color="primary"
					inputProps={{'aria-label': 'primary checkbox'}}
				/>}
			label="Show tutorial"/>
		<FormControlLabel
			control={
				<Switch
					checked={props.options.enableAutonumber}
					onChange={event => changeOption('enableAutonumber', event.target.checked)}
					color="primary"
					inputProps={{'aria-label': 'primary checkbox'}}
				/>}
			label="Enable Autonumber"/>
		<Button variant="contained" color="primary" disabled={!props.options.enableAutonumber}
		        onClick={() => setOpen(true)}>
			Autonumber Options
		</Button>
		<ButtonGroup
			variant="outlined"
			size="large"
			style={{marginTop:10}}
			aria-label="large contained secondary button group">
			<Tooltip title="This will save your work to a file that you can download to your computer.">
				<Button onClick={() => console.log(1)}>
					Save JSON
				</Button>
			</Tooltip>
			<Tooltip title="This will load a Remix from a file and replace your current workspace.">
				<Button onClick={() => console.log(2)}>
					Load JSON
				</Button>
			</Tooltip>
		</ButtonGroup>
		<Dialog
			onClose={handleClose}
			aria-labelledby="autonumber-dialog-title"
			open={open}
		>
			<DialogTitle id="autonumber-dialog-title" onClose={handleClose}>
				Autonumber Options
			</DialogTitle>
			<DialogContent style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
				<DialogContentText>
					These options affect how the Autonumber operates. When enabled, the Autonumberer
					automatically updates the Chapter and Page numbers based on any changes you make.
				</DialogContentText>
				<div style={{display: 'flex', justifyContent: 'space-between'}}>
					<TextField
						style={{margin: 0}}
						id="standard-number"
						label="Initial Chapter Number"
						type="number"
						margin="normal"
						value={props.options.autonumber.offset}
						onChange={event => changeOption('autonumber.offset', Math.max(event.target.value, 0))}
						variant="filled"/>
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
										value={props.options.autonumber.overwriteSuffix}
										onChange={event => changeOption('autonumber.overwriteSuffix', event.target.checked)}
									/>}
								label="Overwrite non-number titles"/>
						</Tooltip>
					</div>
				</div>
				<TextField
					select
					label="Chapter prefix"
					value={props.options.autonumber.chapterPrefix || ''}
					onChange={(event) => {
						changeOption('autonumber.chapterPrefix', event.target.value);
					}}
					helperText={`Pick an optional title prefix for your chapters (${props.options.autonumber.chapterPrefix || ''} 1:)`}
					margin="normal"
					variant="filled">
					<MenuItem value={false}>No Prefix</MenuItem>
					<MenuItem value='Chapter'>Chapter</MenuItem>
					<MenuItem value='Section'>Section</MenuItem>
				</TextField>
				<TextField
					select
					label="Page Prefix"
					value={props.options.autonumber.pagePrefix || ''}
					onChange={(event) => {
						changeOption('autonumber.pagePrefix', event.target.value);
					}}
					helperText={`Pick an optional title prefix for your pages (${props.options.autonumber.pagePrefix || ''} 1.1:)`}
					margin="normal"
					variant="filled">
					<MenuItem value={false}>No Prefix</MenuItem>
					<MenuItem value='Page'>Page</MenuItem>
					<MenuItem value='Topic'>Topic</MenuItem>
					<MenuItem value='Section'>Section</MenuItem>
				</TextField>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} color="primary">
					Done
				</Button>
			</DialogActions>
		</Dialog>
	</div>
}