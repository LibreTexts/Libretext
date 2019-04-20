import React from 'react';


export default class FindReplace extends React.Component {
	constructor() {
		super();
		this.state = {
			root: "",
			find: "",
			replace: "",
			user: document.getElementById('userEmailHolder').textContent,
			results: [],
			status: '',
			ID: '',
		};
		
	}
	
	componentDidMount() {
		this.socket = io('https://api.libretexts.org/', {path: '/bot/ws'});
		this.socket.on('page', (data) => {
			// console.log(data);
			let tempResults = this.state.results;
			tempResults.unshift(data);
			this.setState({results: tempResults});
		});
		this.socket.on('findReplaceID', (data) => {
			this.setState({ID: data});
		});
		this.socket.on('findReplaceDone', () => {
			this.setState({status: 'done'});
		});
		this.socket.on('revertDone', () => {
			alert(`Revert of ${this.state.ID} complete`);
			this.setState({status: 'reverted'});
		});
		this.socket.on('Body missing parameters', (data) => {
			alert(`The server has denied your request due to incomplete parameters. Please revise and try again\n${data}`)
		});
	}
	
	verifyRequest() {
		let request = {
			root: this.state.root,
			user: this.state.user,
			find: this.state.find,
			replace: this.state.replace,
		};
		
		if (!request.find || !request.root) {
			alert(`Missing ${!request.root ? 'URL' : 'Find search term'}`);
			return false;
		}
		if (request.find.length < 5) {
			let answer = prompt(`Warning, you are using a short search term! Please use a longer search term or retype "${request.find}" to unsafely proceed`);
			if (answer === request.find) {
				this.sendRequest(request);
			}
			else if (answer && answer !== request.find) {
				alert('Search term did not match...Cancelling');
			}
		}
		else if (confirm(`The bot will replace "${request.find}" with "${request.replace}". Click OK to proceed.`)) {
			this.sendRequest(request);
		}
	}
	
	sendRequest(request) {
		this.setState({status: 'working', results: [], ID: ''});
		this.socket.emit('findAndReplace', request);
	}
	
	revert() {
		if (!this.state.ID) {
			alert('No ID!');
			return false;
		}
		let request = {
			user: this.state.user,
			ID: this.state.ID,
		};
		this.socket.emit('revert', request);
	}
	
	getStatus() {
		switch (this.state.status) {
			case 'working':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					Find and Replace In Progress
					<div className="spinner">
						<div className="bounce1"/>
						<div className="bounce2"/>
						<div className="bounce3"/>
					</div>
					{`Request ID: ${this.state.ID}`}
				</div>;
			case 'done':
				return <p className="status" style={{backgroundColor: 'green'}}>Complete!</p>;
			case 'reverted':
				return <p className="status" style={{backgroundColor: 'grey'}}>Reverted {this.state.ID}</p>;
			default:
				return null;
		}
	}
	
	render() {
		return (
			<div>
				Find and Replace
				<input placeholder="URL" onChange={(event) => {
					this.setState({root: event.target.value})
				}}/>
				<input placeholder="Find" onChange={(event) => {
					this.setState({find: event.target.value})
				}}/>
				<input placeholder="Replace" onChange={(event) => {
					this.setState({replace: event.target.value})
				}}/>
				<button onClick={() => this.verifyRequest()}>Verify Request</button>
				{this.state.ID && this.state.status === 'done' ?
					<button onClick={() => this.revert()}>Revert Request {this.state.ID}</button> : null}
				{this.getStatus()}
				<div id="results">
					{this.state.results.map((page, index) => <div
						key={this.state.results.length - index}>{this.state.results.length - index} Modified <a
						target='_blank' href={'/' + page}>{page}</a></div>)}
				</div>
			</div>
		)
	}
}