import React, {useState, useEffect} from 'react';
import Toggle from 'react-toggle';
import {FixedSizeList as List} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import fetch from "node-fetch";

export default function Importer(props) {
	const [counter, setCounter] = useState(0);
	const [state, setState] = useState('');
	const [results, setResults] = useState([]);
	const [files, setFiles] = useState([]);
	const [time, setTime] = useState(-1);
	const [url, setURL] = useState('');
	const [socket, setSocket] = useState(null);
	
	function getPanel() {
		switch (props.panel) {
			case "epub":
				return null;
			case "commoncartridge":
				return ;
			case "pdf":
				return null;
			case "pretext":
				return null;
			default:
				return null;
		}
	}
	
	useEffect(() => { //setup websocket
		let socket = io(props.devMode ? 'https://home.miniland1333.com/' : 'https://api.libretexts.org/', {path: '/import/ws'});
		socket.emitWait = async function (eventName, args) {
			return new Promise((resolve, reject) => {
				this.emit(eventName, args, (data) => resolve(data));
			});
		};
		socket.on('progress', (data) => {
			setCounter(data);
		});
		socket.on('getFiles', (data) => {
			setFiles(data);
		});
		socket.on('pages', (data) => {
			setResults(data.concat(results));
		});
		socket.on('setState', (data) => {
			switch (data.state) {
				case 'download':
					setCounter(0);
					break;
				case 'processing':
					setState('processing');
					setCounter(data.percentage);
					break;
				case 'done':
					setState('done');
					setTime(-1);
					setResults(data.log);
					break;
			}
		});
		socket.on('errorMessage', function (data) {
			if (!data.noAlert)
				alert(data.message || data);
			console.error(data.message || data);
		});
		setSocket(socket);
		
		return () => {
			socket.disconnect();
		};
	}, []);
	
	useEffect(() => { //timer
		const interval = setInterval(() => {
			if (time !== -1)
				setTime(time => time + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);
	
	return (
		<div id="CommonCartridge">
			<div className="topPanel">
				<div>
					{props.panel}
					<input placeholder="URL" onChange={(event) => {
					setURL(event.target.value);
				}}/>OR<br/>
					<input placeholder="URL" type='file' accept=".imscc,.zip" onChange={(event) => {
						let file = event.target.files[0];
						if (!file) {
							setURL('');
							return;
						}
						let reader = new FileReader();
						reader.onload = function (loadedEvent) {
							let arrayBuffer = loadedEvent.target.result;
							setURL({filename: file.name, buffer: arrayBuffer});
						};
						
						reader.readAsArrayBuffer(file);
						
					}}/>
					<div>
						<button onClick={sendRequest}>Send Request</button>
					</div>
				</div>
				<div>
					Text
				</div>
			</div>
			<div>
				{getStatusBar()}
				<div id="results">
					<AutoSizer disableHeight={true}>
						{({height, width}) => (
							<List
								className="List"
								height={Math.min(results.length * 40, 400)}
								itemCount={results.length}
								itemSize={15}
								width={width}
							>
								{({index, style}) => {
									let page = results[index];
									return <div style={style}
									            key={results.length - index}>{results.length - index} {'Pages '}
										<a target='_blank' href={page.url}>{page.path}</a></div>
								}}
							</List>
						)}
					</AutoSizer>
				</div>
			</div>
		</div>
	);
	
	function getStatusBar() {
		switch (state) {
			case 'download':
			case 'processing':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					<div>
						Import In Progress
						({counter}{state === 'download' ? ' %uploaded' : '%'})
					</div>
					<div className="spinner">
						<div className="bounce1"/>
						<div className="bounce2"/>
						<div className="bounce3"/>
					</div>
					<div>
						{`Time Elapsed: ${time} seconds`}
					</div>
				</div>;
			case 'done':
				return <p className="status" style={{backgroundColor: 'green'}}>Complete!</p>;
			default:
				return null;
		}
	}
	
	async function sendRequest() {
		setState('download');
		setTime(0);
		setCounter(0);
		let buffer = url.buffer;
		let inc = 5e+5;
		let end = buffer.byteLength;
		let index = 0;
		
		//buffer chunking over the network
		for (let start = 0; start <= end; start += inc) {
			let response = {};
			if (start === 0) {
				response = {
					user: document.getElementById('usernameHolder').innerText,
					status: 'start',
					type: 'CommonCartridge',
					filename: url.filename,
					length: Math.ceil(end / inc)
				};
			}
			response.buffer = buffer.slice(start, Math.min(start + inc, end));
			response.index = index++;
			await socket.emitWait('sendFile', response);
		}
	}
}