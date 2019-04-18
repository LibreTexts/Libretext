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
				Work in progress
				<input placeholder="URL"/>
				<input placeholder="Find"/>
				<input placeholder="Replace"/>
				<button>Verify Request</button>
			</div>
		)
	}
}