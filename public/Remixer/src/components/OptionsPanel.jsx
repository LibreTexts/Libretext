import React from 'react';
import RemixerFunctions from '../reusableFunctions';

import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';

export default class OptionsPanel extends React.Component {
	constructor() {
		super();
		this.state = {
			institution: "",
			open: false,
			institutions: <MenuItem value=""><em>Loading</em></MenuItem>
		}
	}
	
	componentDidMount() {
		this.getInstitutions();
	}
	
	changeOption = (option, value) => {
		let newOptions = {...this.props.options, [option] : value};
		this.props.updateRemixer({options: newOptions});
	};
	
	render() {
		return <div style={{display: 'flex', margin: 10}}>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				marginRight: 10,
				flex: 1
			}}><TextField
				label="LibreText name"
				margin="normal"
				variant="outlined"
				value={this.props.name || ""}
				onChange={(event) => {
					this.props.updateRemixer({name: event.target.value});
				}}
			/>
				<TextField
					select
					label="Institution"
					value={this.props.institution || ""}
					onChange={(event) => {
						this.props.updateRemixer({institution: event.target.value});
					}}
					helperText="Please select your institution"
					margin="normal"
					variant="outlined"
				>{this.state.institutions}
				</TextField>
			</div>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				background: '#f3f3f3',
				padding: 20
			}}>
				Remixer Options
				<FormControlLabel
					control={
						<Switch
							color="primary"
							inputProps={{'aria-label': 'primary checkbox'}}
						/>}
					label="Show tutorial"/>
				<FormControlLabel
					control={
						<Switch
							checked={this.props.options.enableAutonumber}
							onChange={event => this.changeOption('enableAutonumber', event.target.checked)}
							color="primary"
							inputProps={{'aria-label': 'primary checkbox'}}
						/>}
					label="Enable Autonumber"/>
				<Button variant="contained" color="primary" disabled={!this.props.options.enableAutonumber} onClick={() => this.setState({open: true})}>
					Autonumber Options
				</Button>
				<Dialog
					onClose={this.handleClose}
					aria-labelledby="autonumber-dialog-title"
					open={this.state.open}
				>
					<DialogTitle id="autonumber-dialog-title" onClose={this.handleClose}>
						Autonumber Options
					</DialogTitle>
					<DialogContent>
						<DialogContentText>
							Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac
							facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum
							at eros.
						</DialogContentText>
						<FormControlLabel
							control={
								<Switch
									color="primary"
									inputProps={{'aria-label': 'primary checkbox'}}
								/>}
							label="Ignore Suffix"/>
					</DialogContent>
					<DialogActions>
						<Button onClick={this.handleClose} color="primary">
							Done
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		</div>;
	}
	
	getInstitutions = async () => {
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		
		const isDemonstration = RemixerFunctions.checkIfDemonstration();
		if (isDemonstration) {
			return <MenuItem key={`https://${subdomain}.libretexts.org/Workshops/Workshop_University`}
			                 value={`https://${subdomain}.libretexts.org/Workshops/Workshop_University`}>Workshop
			                                                                                             University</MenuItem>;
		}
		
		let response = await LibreTexts.authenticatedFetch('Courses', 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		const subpageArray = (response['@count'] === '1' ? [response['page.subpage']] : response['page.subpage']) || [];
		const result = [];
		// console.log(subpageArray);
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push(<MenuItem key={institution['uri.ui']}
			                      value={institution['uri.ui']}>{institution.title}</MenuItem>);
		}
		result.push(<MenuItem key="" value="">Not listed? Contact info@libretexts.org</MenuItem>);
		this.setState({institutions: result});
		this.props.updateRemixer({institution: result[0].props.value});
	};
	
	
	handleClose = () => {
		this.setState({open: false});
	};
}