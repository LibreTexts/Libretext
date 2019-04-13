import React from 'react';


export default class FindReplace extends React.Component {
	constructor() {
		super();
		this.state = {
			root: "",
			find: "",
			replace: "",
			user: document.getElementById('userEmailHolder').textContent
		};
		
	}
	
	render() {
		return (
			<div>
			Hi
			</div>
		)
	}
}