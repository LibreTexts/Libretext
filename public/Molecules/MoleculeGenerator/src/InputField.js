import React, {Component} from 'react';
import Toggle from 'react-toggle'

export default class InputField extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.options.type === "bool") {
			return <div className="molOption"
			            style={{display: "flex", justifyContent: "space-between"}}>
				<div>
					{/*<i className="material-icons help" style={{color:this.props.color}}>help</i>*/}
					{this.props.options.name}:
				</div>
				<Toggle onChange={(e) => this.props.onChange(this.props.item, e.target.checked)}/></div>;
		}
		else if (this.props.options.type === "note") {
			return <div className="molOption">
				<div style={{textAlign: "center", borderBottom: "1px solid gray"}}>
					{this.props.options.name}
				</div>
			</div>
		}
		else if (Array.isArray(this.props.options.type)) {
			return <div className="molOption">
				<div>
					{/*<i className="material-icons help" style={{color:this.props.color}}>help</i>*/}
					{this.props.options.name}:
				</div>
				<select
					onChange={(e) => this.props.onChange(this.props.item, e.target.value)}>
					{$.map(this.props.options.type, (option, index) => <option key={index}>{option}</option>)}
				</select></div>;
		}
		else {
			return <div className="molOption">
				<div>
					{/*<i className="material-icons help" style={{color:this.props.color}}>help</i>*/}
					{this.props.options.name}:
				</div>
				<input placeholder={this.props.options.placeholder} disabled={this.props.options.disabled}
				       onChange={(e) => this.props.onChange(this.props.item, e.target.value)}/></div>;
		}
	}
}
