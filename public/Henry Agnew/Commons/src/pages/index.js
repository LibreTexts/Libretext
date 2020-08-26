import React from 'react';
import LibreText from "../components/LibreText.jsx";
import ReactDOM from 'react-dom';
import Skeleton from '@material-ui/lab/Skeleton';
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Chip from "@material-ui/core/Chip";
import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Commons extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			downloads: [],
			institutions: [],
			selectedInstitution: this.props.data.inst || ''
		}
	}
	
	updateParent = (newState) => {
		this.setState(newState);
	};
	
	async getEntriesJSON(subdomains) {
		if (subdomains === 'all')
			subdomains = Object.values(LibreTexts.libraries);
		else if (!subdomains || !subdomains.length) {
			[subdomains] = LibreTexts.parseURL();
		}
		
		if (!Array.isArray(subdomains))
			subdomains = [subdomains];
		//TODO: Finish implementation
		let downloads = [];
		for (let key of subdomains) {
			key = LibreTexts.libraries[key] || key;
			if (!Object.values(LibreTexts.libraries).includes(key)) {
				console.error(`Invalid library ${key}`);
				continue;
			}
			//create path structure
			if (key === 'espanol') {
				try {
					let home = await fetch(`https://api.libretexts.org/DownloadsCenter/espanol/home.json`);
					home = await home.json();
					home = home.items.map(item => ({...item, subdomain: key}));
					downloads = downloads.concat(home);
				} catch (e) {
					console.error(e);
				}
			}
			else {
				try {
					let courses = fetch(`https://api.libretexts.org/DownloadsCenter/${key}/Courses.json`);
					let bookshelves = fetch(`https://api.libretexts.org/DownloadsCenter/${key}/Bookshelves.json`);
					[courses, bookshelves] = await Promise.all([courses, bookshelves]);
					[courses, bookshelves] = await Promise.all([courses.json(), bookshelves.json()]);
					courses = courses.items.map(item => ({...item, subdomain: key}));
					bookshelves = bookshelves.items.map(item => ({...item, subdomain: key}));
					downloads = downloads.concat(courses, bookshelves);
				} catch (e) {
					console.error(e);
				}
			}
			
		}
		
		downloads = downloads.filter((text) => text.link && (!text.link.includes('Remixer_University') || text.title === "LibreTexts Construction Guide"));
		// if (!JSON.parse(document.getElementById("proHolder").innerText))
		// 	downloads = downloads.filter((text) => !text.tags.includes('luluPro'));
		let institutions = new Set(downloads.map(option => {
			if (option.institution)
				return option.institution.trim();
		}));
		institutions.delete(undefined);
		institutions = Array.from(institutions).sort();
		this.setState({downloads: downloads, institutions: institutions});
	}
	
	componentDidMount() {
		this.getEntriesJSON(this.props.data.libraries);
	}
	
	componentDidUpdate(prevProps, prevState, snapshot) {
		if (JSON.stringify(this.state.selectedLibraries) !== JSON.stringify(prevState.selectedLibraries)) {
			this.getEntriesJSON(this.state.selectedLibraries);
		}
	}
	
	render() {
		let result;
		if (!this.state.downloads.length) {
			result = [...Array(20)].map((item, index) =>
				<Skeleton variant="rect" key={index}
				          width={220} height={220}
				          style={{margin: 10}}/>)
			return <div className={'CenterContainer'}>
				<div className={'Center'}>
					{result}</div>
			</div>
		}
		else {
			
			//filtering entries and autocomplete options based on inputs
			let selectedInstitution = this.state.selectedInstitution;
			let selectedAuthor = this.state.selectedAuthor;
			let selectedTitle = this.state.selectedTitle;
			let result = this.state.downloads;
			if (selectedInstitution) { //institution filter
				let temp = [];
				selectedInstitution = selectedInstitution.toLowerCase();
				for (let item of result)
					if (item.title && item.title.toLowerCase().includes(selectedInstitution)
						|| item.author && item.author.toLowerCase().includes(selectedInstitution)
						|| item.institution && item.institution.toLowerCase().includes(selectedInstitution))
						temp.push(item);
				
				result = temp;
			}
			
			//authors handling
			let authors = new Set(result.map(option => {
				if (option.author)
					return option.author.trim();
			}));
			authors.delete(undefined);
			authors = Array.from(authors).sort();
			const authorError = selectedAuthor && !authors.includes(selectedAuthor);
			if (selectedAuthor && !authorError) { //author filter
				let temp = [];
				selectedAuthor = selectedAuthor.toLowerCase();
				for (let item of result)
					if (item.author && item.author.toLowerCase().includes(selectedAuthor)) {
						temp.push(item);
					}
				result = temp;
			}
			
			//title handling
			let titles = new Set(result.map(option => {
				if (option.title)
					return option.title.trim();
			}));
			titles.delete(undefined);
			titles = Array.from(titles).sort();
			let titleError = false;
			if (selectedTitle && selectedTitle.length) { //title and tag filter
				let temp = [];
				for (let item of result)
					if ((item.title && selectedTitle.includes(item.title))
						|| (item.tags && item.tags.some(r => selectedTitle.includes(r)))) {
						temp.push(item); //matching title or tag
					}
				if (temp.length)
					result = temp;
				else
					titleError = true; //don't make any changes if failed
			}
			
			//transform entries into React elements
			result = result.map((item, index) => <LibreText key={index} item={item}
			                                                format={this.state.format}/>);
			
			return <>
				{/*backgroundColor: '#0f67a6'*/}
				<div className={'CenterContainer'}>
					<div style={{display: 'flex', flexWrap: 'wrap'}}>
						<Autocomplete
							id="institution-demo"
							className='CommonsAutocomplete'
							limitTags={1}
							options={this.state.institutions}
							value={this.state.selectedInstitution || null}
							renderInput={(params) => <TextField {...params} label="Institution" variant="filled"/>}
							onChange={(event, newValue) => this.setState({selectedInstitution: newValue})}
						/>
						<Autocomplete
							id="author-demo"
							className='CommonsAutocomplete'
							limitTags={1}
							options={authors}
							value={this.state.selectedAuthor || null}
							renderInput={(params) => <TextField {...params} label="Authors" variant="filled"
							                                    error={authorError}/>}
							onChange={(event, newValue) => this.setState({selectedAuthor: newValue})}
						/>
						<Autocomplete
							id="title-demo"
							freeSolo
							multiple
							limitTags={1}
							filterSelectedOptions
							className='CommonsAutocomplete'
							options={titles}
							value={this.state.selectedTitle || []}
							renderInput={(params) => <TextField {...params} label="Title or Tag" variant="filled"
							                                    error={titleError}/>}
							onChange={(event, newValue) => this.setState({selectedTitle: newValue})}
						/>
						<Button variant="contained"
						        onClick={() => this.setState({libraryDialog: true})}>Libraries</Button>
						{this.state.libraryDialog ?
							<LibraryDialog {...this.state} updateParent={this.updateParent}/> : null}
						<div style={{width: '100%', padding: 10, display: 'flex', justifyContent: 'space-evenly'}}>
							{Object.keys(LibreTexts.libraries).map((option) => <Lib key={option} option={option}/>)}
						</div>
					</div>
					<div className={'Center'}>
						{result}</div>
				</div>
			</>
		}
	}
}

function LibraryDialog(props) {
	const [selectedLibraries, setSelectedLibraries] = React.useState(props.selectedLibraries || []);
	const allLibraries = Object.keys(LibreTexts.libraries);
	
	return <Dialog open={true} onClose={() => props.updateParent({libraryDialog: false})}
	               aria-labelledby="form-dialog-title">
		<DialogTitle id="form-dialog-title">Select the libraries you want</DialogTitle>
		<DialogContent>
			<DialogContentText>
				Type or use the dropdown to select which subjects you want to search in. You can use the select all
				button to search everything.
			</DialogContentText>
			<Autocomplete
				multiple
				id="libraries-demo"
				className='CommonsAutocomplete'
				options={allLibraries}
				value={selectedLibraries}
				disableCloseOnSelect
				limitTags={3}
				onChange={(event, newValue) => setSelectedLibraries(newValue)}
				renderOption={(option, {selected}) => (
					<React.Fragment>
						<Checkbox
							style={{marginRight: 8}}
							checked={selected}
						/>
						<img src={`https://libretexts.org/img/LibreTexts/glyphs/${LibreTexts.libraries[option]}.png`}
						     style={{verticalAlign: 'middle'}}/>
						{option}
					</React.Fragment>
				)}
				renderInput={(params) => (
					<TextField {...params} variant="filled" label="Selected Libraries"/>
				)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip
							variant="outlined"
							key={index}
							avatar={<Avatar
								src={`https://libretexts.org/img/LibreTexts/glyphs/${LibreTexts.libraries[option]}.png`}/>}
							label={option}
							{...getTagProps({index})}
						/>
					))
				}
			/>
		</DialogContent>
		<DialogActions>
			<Button onClick={() => props.updateParent({libraryDialog: false, selectedLibraries: allLibraries})}
			        color="primary">
				Select All
			</Button>
			<Button onClick={() => props.updateParent({libraryDialog: false, selectedLibraries: selectedLibraries})}
			        color="primary">
				Done
			</Button>
		</DialogActions>
	</Dialog>
}

function Lib(props) {
	const [clicked, setClicked] = React.useState(false);
	return <IconButton style={{width: 32, height: 32}} onClick={() => setClicked(!clicked)}>
		<img
			src={`https://libretexts.org/img/LibreTexts/glyphs${clicked ? '' : '_blue'}/${LibreTexts.libraries[props.option]}.png`}
			style={{verticalAlign: 'middle'}}/>
	</IconButton>
}

ReactDOM.render(<Commons data={document.currentScript.dataset}/>, target);