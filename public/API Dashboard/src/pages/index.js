import React from 'react';
import LibreText from "../components/LibreText";
import ReactDOM from 'react-dom';
import SearchField from "react-search-field";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Center extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			downloads: props.downloads
		}
	}
	
	onFilter(value) {
		value = value.toLowerCase();
		let result = [];
		if (!value) {
			result = this.props.downloads;
		}
		else {
			for (let i = 0; i < this.props.downloads.length; i++) {
				let item = this.props.downloads[i];
				if (item.title && item.title.toLowerCase().includes(value)
					|| item.author && item.author.toLowerCase().includes(value)
					|| item.institution && item.institution.toLowerCase().includes(value)) {
					result.push(item);
				}
			}
		}
		this.setState({downloads: result});
	}
	
	render() {
		let result = this.state.downloads.map((item, index) => <LibreText key={index} item={item}/>);
		return <div className={'CenterContainer'}>
			<SearchField
				placeholder="Search for a LibreText by Title, Author, or Institution"
				onChange={(v, e) => this.onFilter(v, e)}
				classNames="centerSearch"
			/>
			<div className={'Center'}>
				{result}</div>
		</div>
	}
	
}


ReactDOM.render(<Center/>, target);