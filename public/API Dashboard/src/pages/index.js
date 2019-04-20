import React from 'react';
import FindReplace from "../components/FindReplace";
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


class Dashboard extends React.Component {
	constructor(props) {
		super(props);
	}
	
	componentDidMount() {
		const socket = io('https://api.libretexts.org/', {path: '/bot/ws'});
		socket.on('connect', function () {
		});
		socket.on('welcome', function (data) {
			console.log(data);
		});
		socket.on('errorMessage', function (data) {
			console.error(data);
			alert(data);
		});
		socket.on('disconnect', function () {
		});
	}
	
	render() {
		return <div className={'CenterContainer'}>
			<FindReplace/>
		</div>
	}
	
}


ReactDOM.render(<Dashboard/>, target);