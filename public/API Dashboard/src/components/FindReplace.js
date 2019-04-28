import React from 'react';
import Toggle from 'react-toggle';


export default class FindReplace extends React.Component {
	constructor() {
		super();
		this.state = {
			root: "",
			find: "",
			replace: "",
			user: document.getElementById('usernameHolder').textContent,
			newlines: false,
			isWildcard: false,
			findOnly: false,
			
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
		this.socket.on('findReplaceDone', (data) => {
			this.setState({status: 'done', ID: data});
		});
		this.socket.on('revertDone', () => {
			alert(`Revert of ${this.state.ID} complete`);
			this.setState({status: 'reverted'});
		});
		this.socket.on('Body missing parameters', (data) => {
			alert(`The server has denied your request due to incomplete parameters. Please revise and try again\n${data}`)
		});
		this.socket.on('errorMessage', function (data) {
			if (!data.noAlert)
				alert(data.message || data);
			console.error(data.message || data);
		});
	}
	
	componentWillUnmount() {
		this.socket.disconnect();
	}
	
	
	verifyRequest() {
		let request = {
			root: this.state.root,
			user: this.state.user,
			find: this.state.find,
			replace: this.state.replace,
			newlines: this.state.newlines,
			isWildcard: this.state.isWildcard,
			findOnly: this.state.findOnly,
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
		else if (request.findOnly) {
			if (confirm(`The bot will find all pages with "${request.find}". No Changes will be made.`))
				this.sendRequest(request);
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
		let id = this.state.ID;
		if (!id) {
			id = prompt('Please enter in the id of the revision you would like to revert');
			if (!id)
				return false;
		}
		let request = {
			user: this.state.user,
			ID: id,
		};
		this.socket.emit('revert', request);
	}
	
	getStatus() {
		switch (this.state.status) {
			case 'working':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					Find{this.state.findOnly ? '' : ' and Replace'} In Progress
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
			<div id="FindReplace">
				<div className="topPanel">
					<div><input placeholder="URL" onChange={(event) => {
						this.setState({root: event.target.value})
					}}/>
						<input placeholder="Find" onChange={(event) => {
							this.setState({find: event.target.value})
						}}/>
						<input placeholder="Replace" onChange={(event) => {
							this.setState({replace: event.target.value})
						}}/>
						<div>
							<button onClick={() => this.verifyRequest()}>Verify Request</button>
							<button onClick={() => this.revert()}>Revert Request {this.state.ID}</button>
						</div>
					</div>
					<div>
						<label>
							<Toggle onChange={() => this.setState({isWildcard: !this.state.isWildcard})}
							        defaultChecked={this.state.isWildcard}/>
							<span>Enable Wildcards (? or *)</span>
						</label>
						<label>
							<Toggle onChange={() => this.setState({newlines: !this.state.newlines})}
							        defaultChecked={this.state.newlines}/>
							<span>Enable Newlines (\n)</span>
						</label>
						<label>
							<Toggle onChange={() => this.setState({findOnly: !this.state.findOnly})}
							        defaultChecked={this.state.findOnly}/>
							<span>Find pages but do not modify (read only mode)</span>
						</label>
					</div>
				</div>
				
				<div>
					{this.getStatus()}
					<div id="results">
						{this.state.results.map((page, index) => <div
							key={this.state.results.length - index}>{this.state.results.length - index} {this.state.findOnly ? 'Found ' : 'Modified '}
							<a target='_blank' href={page.url}>{page.path}</a></div>)}
					</div>
				</div>
			</div>
		)
	}
}