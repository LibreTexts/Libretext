import React from 'react';
import LibreText from "../components/LibreText";
import ReactDOM from 'react-dom';
import Skeleton from '@material-ui/lab/Skeleton';
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import CssBaseline from '@material-ui/core/CssBaseline';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Center extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			downloads: [],
			searchArray: [],
			institutions: [],
			selectedInstitution: ''
		}
	}
	
	async componentDidMount() {
		let subdomain = window.location.origin.split("/")[2].split(".")[0];
		let one = subdomain === 'espanol' ? fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/home.json`)
			: fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/Courses.json`);
		let two = fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/Bookshelves.json`);
		let downloads = [];
		one = await one;
		two = await two;
		one = one.ok ? await one.json() : [];
		two = two.ok ? await two.json() : [];
		
		if (one.items)
			one = one.items;
		if (two.items)
			two = two.items;
		
		downloads = downloads.concat(one, two);
		downloads = downloads.filter((text) => text.link && (!text.link.includes('Remixer_University') || text.title === "LibreTexts Construction Guide"));
		if (!JSON.parse(document.getElementById("proHolder").innerText))
			downloads = downloads.filter((text) => !text.tags.includes('luluPro'));
		
		let institutions = new Set(downloads.map(option => {
			if (option.institution)
				return option.institution.trim();
		}));
		institutions.delete(undefined);
		institutions = Array.from(institutions).sort();
		let authors = new Set(downloads.map(option => {
			if (option.author)
				return option.author.trim();
		}));
		authors.delete(undefined);
		authors = Array.from(authors).sort();
		
		this.setState({downloads: downloads, searchArray: downloads, institutions: institutions, authors: authors});
	}
	
	componentDidUpdate(prevProps, prevState, snapshot) {
		
		if (this.state.selectedInstitution !== prevState.selectedInstitution) {
			let value = this.state.selectedInstitution;
			let result = [];
			if (!value) {
				result = this.state.downloads;
			}
			else {
				value = value.toLowerCase();
				for (let item of this.state.downloads)
					if (item.title && item.title.toLowerCase().includes(value)
						|| item.author && item.author.toLowerCase().includes(value)
						|| item.institution && item.institution.toLowerCase().includes(value)) {
						result.push(item);
					}
			}
			this.setState({searchArray: result});
		}
	}
	
	
	render() {
		let result;
		if (!this.state.downloads.length) {
			result = [...Array(20)].map((item, index) =>
				<Skeleton variant="rect" key={index}
				          width={118} height={210}
				          style={{margin: 10}}/>)
			return <div className={'CenterContainer'}>
				<div className={'Center'}>
					{result}</div>
			</div>
		}
		else {
			result = this.state.searchArray.map((item, index) => <LibreText key={index} item={item}
			                                                                format={this.state.format}/>);
			
			return <>
				{/*<CssBaseline/>*/}
				<div className={'CenterContainer'}>
					<div style={{display: 'flex', backgroundColor: '#0f67a6', flexWrap: 'wrap'}}>
						<Autocomplete
							id="title-demo" freeSolo
							className='CommonsAutocomplate'
							options={this.state.downloads}
							getOptionLabel={(option) => option.title || 'N/A'}
							renderInput={(params) => <TextField {...params} label="Title" variant="filled"/>}
						/>
						{/*<IconButton type="submit" aria-label="search">
					<SearchIcon />
				</IconButton>*/}
						<Autocomplete
							id="institution-demo"
							className='CommonsAutocomplate'
							options={this.state.institutions}
							renderInput={(params) => <TextField {...params} label="Institution" variant="filled"/>}
							onChange={(event, newValue) => this.setState({selectedInstitution: newValue})}
						/>
						<Autocomplete
							id="author-demo"
							className='CommonsAutocomplate'
							options={this.state.authors}
							renderInput={(params) => <TextField {...params} label="Authors" variant="filled"/>}
						/>
						<Autocomplete
							multiple
							id="libraries-demo"
							className='CommonsAutocomplate'
							options={Object.entries(LibreTexts.libraries)}
							disableCloseOnSelect
							limitTags={3}
							getOptionLabel={(option) => option[0]}
							renderOption={(option, {selected}) => (
								<React.Fragment>
									<Checkbox
										style={{marginRight: 8}}
										checked={selected}
									/>
									<img src={`https://libretexts.org/img/LibreTexts/glyphs/${option[1]}.png`}
									     style={{verticalAlign: 'middle'}}/>
									{option[0]}
								</React.Fragment>
							)}
							renderInput={(params) => (
								<TextField {...params} variant="filled" label="Libraries" placeholder="+"/>
							)}
						/>
					</div>
					<div className={'Center'}>
						{result}</div>
				</div>
			</>
		}
	}
	
}


ReactDOM.render(<Center/>, target);