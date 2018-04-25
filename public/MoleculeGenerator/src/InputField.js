import React, {Component} from 'react';

export default class InputField extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		if(this.props.options==="bool"){
			return <div>{this.props.item}:<input type="checkbox"/></div>;
		}
		else if(Array.isArray( this.props.options)){
			return <div>{this.props.item}: <select>
				{$.map( this.props.options,(option, index)=><option key={index}>{option}</option>)}
			</select></div>;
		}
		return <div>{this.props.item}: {this.props.options}<input/></div>;
	}
}
