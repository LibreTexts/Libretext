import React, {useState, useEffect} from 'react';
import Toggle from 'react-toggle';
import {FixedSizeList as List} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import fetch from "node-fetch";

export default function Importer(props) {
	const [counter, setCounter] = useState(0);
	const [state, setState] = useState('');
	const [results, setResults] = useState([]);
	const [file, setFile] = useState();
	const [files, setFiles] = useState([]);
	const [seconds, setSeconds] = useState(-1);
	const [url, setURL] = useState('');
	const [socket, setSocket] = useState(null);
	const [finished, setFinished] = useState('');
	const [subdomain, setSubdomain] = useState(LibreTexts.extractSubdomain());
	const user = document.getElementById('usernameHolder').innerText;
	
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
		socket.on('listFiles', (data) => {
			let tempFiles = data;
			setFiles(data);
		});
		socket.on('pages', (data) => {
			setResults(results => data.concat(results));
		});
		socket.on('setState', async (data) => {
			setState(data.state);
			switch (data.state) {
				case 'downloadDone':
					setSeconds(-1);
					setFile(data.filename);
					break;
				case 'done':
					setSeconds(-1);
					setResults(data.log);
					setFinished(data.url);
					break;
			}
		});
		socket.on('errorMessage', function (data) {
			if (!data.noAlert)
				alert(data.message || data);
			console.error(data.message || data);
		});
		setSocket(socket);
		socket.emit('listFiles', {user: user, type: props.panel});
		
		return () => {
			socket.disconnect();
		};
	}, []);
	
	useEffect(() => { //timer
		const interval = setInterval(() => {
			setSeconds(seconds => seconds !== -1 ? seconds + 1 : seconds);
		}, 1000);
		return () => clearInterval(interval);
	}, []);
	
	useEffect(() => {
		if (socket)
			socket.emit('listFiles', {user: user, type: props.panel});
		setSeconds(-1);
		setFile('');
		setState('');
		setURL('');
	}, [props.panel]);
	
	return (
		<div id="CommonCartridge">
			{getDownloadBar()}
			<div className="topPanel">
				<div>
					<h3>{getName()}</h3>
					<h4>Step 1: Send a file to the server</h4>
					<input placeholder="URL of File" value={typeof url === 'string' ? url : 'File Chosen'}
					       onChange={(event) => {
						       setURL(event.target.value);
					       }}/>OR<br/>
					<input placeholder="Upload a file" type='file' accept={acceptableFiles().join()}
					       onChange={(event) => {
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
						<button onClick={sendFile}>Upload file</button>
					</div>
				</div>
				<div>
					<h4>Step 2: Select file to process.</h4>
					Uploaded Files are flushed nightly!
					<select onChange={(event) => setFile(event.target.value)} value={file}>
						<option disabled value=''>Upload{files.length ? ' or Select' : ''} a file</option>
						{files.map(file => <option key={file}>{file}</option>)}</select>
					<select onChange={(event) => setSubdomain(event.target.value)} value={subdomain}>
						{Object.keys(LibreTexts.libraries).map(function (key, index) {
							return <option value={LibreTexts.libraries[key]} key={key}>{key}</option>;
						})}
					</select>
					<button onClick={sendImport}>Import {file} into {subdomain}</button>
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
									            // key={results.length - index}>{results.length - index} Created {page.type}&nbsp;
									            key={results.length - index}>{results.length - index} Created {page.type}&nbsp;
										<a target='_blank' href={page.url}>{page.title}</a></div>
								}}
							</List>
						)}
					</AutoSizer>
				</div>
			</div>
		</div>
	);
	
	function getDownloadBar() {
		switch (state) {
			case 'download':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					<div>
						Upload In Progress
						({counter} Received)
					</div>
					<div className="spinner">
						<div className="bounce1"/>
						<div className="bounce2"/>
						<div className="bounce3"/>
					</div>
					<div>
						{`Time Elapsed: ${seconds} seconds`}
					</div>
				</div>;
			case 'downloadDone':
				return <p className="status" style={{backgroundColor: 'green'}}>Upload Complete!</p>;
			case 'downloadFail':
				return <p className="status" style={{backgroundColor: 'red'}}>Upload Failed! Please try a different
				                                                              url</p>;
			default:
				return null;
		}
	}
	
	function getStatusBar() {
		switch (state) {
			case 'processing':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					<div>
						Import In Progress
						({counter.percentage})<br/>
						{counter.pages}
					</div>
					<div className="spinner">
						<div className="bounce1"/>
						<div className="bounce2"/>
						<div className="bounce3"/>
					</div>
					<div>
						{`Time Elapsed: ${seconds} seconds`}<br/>
						{`Time Remaining: ${counter.eta}`}
					</div>
				</div>;
			case 'done':
				return <div className="status"
				            style={{backgroundColor: 'green', display: 'flex', flexDirection: 'column'}}>Import
				                                                                                         Complete! View
				                                                                                         your results
				                                                                                         here <a
						target='_blank'
						href={finished}>{finished}</a>
				</div>;
			default:
				return null;
		}
	}
	
	async function sendFile() {
		if (!isReady()) {
			alert('Please wait for the current process to finish...');
			return;
		}
		
		setSeconds(0);
		setCounter(0);
		if (typeof url === "string") {
			let response = {
				user: user,
				url: url,
				type: props.panel,
			};
			setState('download');
			socket.emit('downloadFile', response);
		}
		else if (typeof url === "object" && url.buffer) {
			let buffer = url.buffer;
			let inc = 5e+5;
			let end = buffer.byteLength;
			let index = 0;
			
			//buffer chunking over the network
			for (let start = 0; start <= end; start += inc) {
				let response = {
					user: user,
					type: props.panel,
					filename: url.filename,
					length: Math.ceil(end / inc)
				};
				if (start === 0) {
					setState('download');
					response.status = 'start';
				}
				response.buffer = buffer.slice(start, Math.min(start + inc, end));
				response.index = index++;
				await socket.emitWait('sendFile', response);
			}
		}
	}
	
	async function sendImport() {
		if (!isReady()) {
			alert('Please wait for the current process to finish...');
			return;
		}
		else if (!file) {
			alert('Please select a file first');
			return;
		}
		let filetype = file.match(/.[A-z]*?$/);
		if (filetype && acceptableFiles().includes(filetype[0])) {
			let response = {
				user: user,
				filename: file,
				type: props.panel,
				subdomain: subdomain
			};
			socket.emit('import', response);
			setState('processing');
			setCounter({
				percentage: 0,
				pages: `0 / Calculating`,
				eta: 'Calculating',
			});
			setSeconds(0);
			setResults([]);
		}
		else {
			alert(`${file} is not of acceptable filetype [${acceptableFiles().join(', ')}]`);
		}
		
	}
	
	function getName() {
		switch (props.panel) {
			case "epub":
				return 'EPUB';
			case "commoncartridge":
				return 'Common Cartridge';
			case 'libremap':
				return 'Excel to LibreMap';
			case "pdf":
				return 'PDF';
			case "pretext":
				return 'PreTeXt';
			default:
				return null;
		}
	}
	
	function acceptableFiles() {
		switch (props.panel) {
			case 'epub':
				return [".epub"];
			case 'commoncartridge':
				return [".imscc", ".zip"];
			case 'libremap':
				return [".xlsx"];
			case "pretext":
				return [".zip"];
			default:
				return [];
		}
	}
	
	function isReady() {
		switch (state) {
			case '':
			case 'done':
			case 'downloadDone':
			case 'downloadFail':
				return true;
			default:
				return props.devMode;
		}
	}
}