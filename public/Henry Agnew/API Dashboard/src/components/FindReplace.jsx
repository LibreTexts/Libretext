import React from 'react';
import Toggle from 'react-toggle';
import {FixedSizeList} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {RevertButton} from "./RevisionLog.jsx";


export default class FindReplace extends React.Component {
    constructor() {
        super();
        this.state = {
            root: "",
            find: "",
            replace: "",
            user: document.getElementById('usernameHolder').textContent,
            presets: [],
            regex: false,
            summaries: false,
            findOnly: false,
            
            results: [],
            status: '',
            counter: 0,
            ID: '',
            time: -1,
            timer: setInterval(() => {
                if (this.state.time != -1) {
                    this.setState({time: this.state.time + 1})
                }
            }, 1000)
        };
        
    }
    
    componentDidMount() {
        this.socket = io(this.props.devMode ? 'https://home.miniland1333.com/' : 'https://api.libretexts.org/', {path: '/bot/ws'});
        this.socket.on('pages', (data) => {
            // console.log(data);
            let tempResults = data.concat(this.state.results);
            this.setState({results: tempResults});
        });
        this.socket.on('setState', (data) => {
            switch (data.state) {
                case 'starting':
                    this.setState({ID: data.ID, counter: 0});
                    break;
                case 'getSubpages':
                    this.setState({status: 'getSubpages', counter: data.numPages});
                    break;
                case 'processing':
                    this.setState({status: 'processing', counter: data.percentage});
                    break;
                case 'done':
                    this.setState({status: 'done', ID: data.ID, time: -1, results: data.log});
                    break;
            }
        });
        this.socket.on('Body missing parameters', (data) => {
            alert(`The server has denied your request due to incomplete parameters. Please revise and try again\n${data}`)
        });
        this.socket.on('errorMessage', function (data) {
            if (!data.noAlert)
                alert(data.message || data);
            console.error(data.message || data);
        });
        fetch(`https://chem.libretexts.org/@api/deki/pages/155916/contents`, {headers: {'cache-control': 'no-cache'}})
            .then(async (response) => {
                if (!response.ok)
                    console.error('Cannot get API Dashboard Presets');
                else {
                    let presets = await response.text();
                    presets = presets.match(/(?<=var presets = )\[[\S\s]*?](?=;)/)[0];
                    presets = LibreTexts.decodeHTML(presets);
                    presets = presets.replace(/\\/g, "\\\\");
                    presets = presets.replace(/\\"/g, "\"");
                    try {
                        presets = JSON.parse(presets);
                        this.setState({presets: presets})
                    } catch (e) {
                        alert(e);
                    }
                }
            })
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
            regex: this.state.regex,
            summaries: this.state.summaries,
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
        this.setState({status: 'getSubpages', results: [], ID: '', time: 0});
        this.socket.emit('findReplace', request);
    }
    
    getStatus() {
        switch (this.state.status) {
            case 'getSubpages':
            case 'processing':
                return <div className="status" style={{backgroundColor: 'orange'}}>
                    <div>
                        Find{this.state.findOnly ? '' : ' and Replace'} In Progress
                        ({this.state.counter}{this.state.status === 'getSubpages' ? ' pages to process' : '%'})
                    </div>
                    <div className="spinner">
                        <div className="bounce1"/>
                        <div className="bounce2"/>
                        <div className="bounce3"/>
                    </div>
                    <div>
                        {`Request ID: ${this.state.ID}`}<br/>
                        {`Time Elapsed: ${this.state.time} seconds`}
                    </div>
                </div>;
            case 'done':
                return <p className="status" style={{backgroundColor: 'green'}}>Complete!</p>;
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
                        <input placeholder="Basic Find or /Regex/" value={this.state.find}
                               onChange={(event) => {
                                   let find = event.target.value;
                                   let isRegex = Boolean(find.match(/^\/[\s\S]*\/$/));
                                   this.setState({find: find, regex: isRegex});
                            
                               }}/>
                        <input placeholder="Replace" value={this.state.replace}
                               onChange={(event) => {
                                   this.setState({replace: event.target.value})
                               }}/>
                        <div>
                            <button onClick={() => this.verifyRequest()}>Verify Request</button>
                            <RevertButton id={this.state.ID}/>
                        </div>
                    </div>
                    <div>
                        <select style={{marginBottom: '20px'}} onChange={(e) => {
                            let value = e.target.value;
                            if (value) {
                                value = JSON.parse(value);
                                let find = value.find;
                                let isRegex = Boolean(find.match(/^\/[\s\S]*\/$/));
                                this.setState({find: find, replace: value.replace, regex: isRegex})
                            }
                        }}>
                            <option value="">Select a Find/Replace Preset</option>
                            <option value={JSON.stringify({
                                find: '',
                                replace: ''
                            })}>Blank
                            </option>
                            {
                                this.state.presets.map((preset) => <option key={preset.text} value={JSON.stringify({
                                    find: preset.find,
                                    replace: preset.replace
                                })}>{preset.text}
                                </option>)
                            }
                        </select>
                        <label>
                            <Toggle
                                onClick={() => alert(this.state.regex ? 'Remove /backslaskes/ around your query to disable Regex.' : 'Add /backslaskes/ around your query to enable Regex!')}
                                checked={this.state.regex} onChange={() => {
                            }}/>
                            <span>Use Regular Expressions (Regex)</span>
                        </label>
                        <label>
                            <Toggle
                                onClick={() => {
                                    if (!this.state.summaries)
                                        alert('Warning, Page Summaries do not have a Reversion History.\nUse with caution!');
                                    this.setState({summaries: !this.state.summaries})
                                }}
                                checked={this.state.summaries} onChange={() => {
                            }}/>
                            <span>Also Find/Replace Page Summaries</span>
                        </label>
                        <label>
                            <Toggle onChange={() => this.setState({findOnly: !this.state.findOnly})}
                                    checked={this.state.findOnly}/>
                            <span>Find pages but do not modify (read only mode)</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    {this.getStatus()}
                    <div id="results">
                        <AutoSizer disableHeight={true}>
                            {({height, width}) => (
                                <FixedSizeList
                                    className="List"
                                    height={380}
                                    itemCount={this.state.results.length}
                                    itemSize={20}
                                    width={width}
                                >
                                    {({index, style}) => {
                                        let page = this.state.results[index];
                                        return <div style={style}
                                                    key={this.state.results.length - index}>{this.state.results.length - index} {this.state.findOnly ? 'Found ' : 'Modified '}
                                            <a target='_blank' href={page.url}>{page.path}</a></div>
                                    }}
                                </FixedSizeList>
                            )}
                        </AutoSizer>
                    </div>
                </div>
            </div>
        )
    }
}
