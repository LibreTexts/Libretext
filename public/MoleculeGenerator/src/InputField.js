import React, {Component} from 'react';

export default class InputField extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		if(this.props.options==="bool"){
			return <div>{this.props.item}:<input type="checkbox" onChange={(e)=>this.props.onChange(this.props.item, e.target.checked)}/></div>;
		}
		else if(Array.isArray( this.props.options)){
			return <div>{this.props.item}: <select  onChange={(e)=>this.props.onChange(this.props.item, e.target.value)}>
				{$.map( this.props.options,(option, index)=><option key={index}>{option}</option>)}
			</select></div>;
		}
		return <div>{this.props.item}: <input onChange={(e)=>this.props.onChange(this.props.item, e.target.value)}/></div>;
	}
}
