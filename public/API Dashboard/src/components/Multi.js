import React from 'react';
import Toggle from 'react-toggle';
import {FixedSizeList as List} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import fetch from "node-fetch";


export default class Multi extends React.Component {
    constructor() {
        super();
        this.state = {
            root: "",
            user: document.getElementById('usernameHolder').textContent,
            presets: [],
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
        fetch(`https://chem.libretexts.org/@api/deki/pages/215677/contents?mode=raw`, {headers: {'cache-control': 'no-cache'}})
            .then(async (response) => {
                if (!response.ok)
                    console.error('Cannot get API Dashboard Multistep Presets');
                else {
                    let presets = await response.text();
                    presets = LibreTexts.decodeHTML(presets);
                    presets = presets.match(/<p class="mt-script-comment">(.*?)<\/p>[\s\S]*?var presets = ([\s\S]*?);<\/pre>/g) || [];
                    presets = presets.map(item => {
                        item = item.match(/<p class="mt-script-comment">(.*?)<\/p>[\s\S]*?var presets = ([\s\S]*?);<\/pre>/);
                        if (!item)
                            return null;

                        let body = item[2];
                        body = LibreTexts.decodeHTML(body);
                        body = body.replace(/\\/g, "\\\\");
                        body = body.replace(/\\"/g, "\"");
                        try {
                            body = JSON.parse(body);
                            return {name: item[1], body: body}
                        } catch (e) {
                            alert(e);
                            return null;
                        }
                    })
                    presets = presets.filter((item) => item);
                    this.setState({presets: presets});
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
            multi: this.state.multi,
            multiName: this.state.multiName,
            findOnly: this.state.findOnly,
        };

        if (!request.root) {
            alert(`Missing URL`);
            return false;
        }
        else if (!request.multi) {
            alert(`Please select a multistep preset`);
            return false;
        }
        if (request.findOnly) {
            if (confirm(`The bot will find all pages with this ${this.state.multi.length} step preset. No Changes will be made.`))
                this.sendRequest(request);
        } else if (confirm(`The bot will perform this ${this.state.multi.length} step preset. Click OK to proceed.`)) {
            this.sendRequest(request);
        }
    }

    sendRequest(request) {
        this.setState({status: 'getSubpages', results: [], ID: '', time: 0});
        this.socket.emit('multipreset', request);
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
                        <div>
                            <button onClick={() => this.verifyRequest()}>Verify Request</button>
                            <button onClick={() => this.revert()}>Revert Request {this.state.ID}</button>
                        </div>
                    </div>
                    <div>
                        <select style={{marginBottom: '20px'}} onChange={(e) => {
                            let value = e.target.value;
                            if (value) {
                                value = JSON.parse(value);
                                this.setState({multi: value, multiName: e.target.key});
                            } else
                                this.setState({multi: undefined});
                        }}>
                            <option value="">Select a Multistep Preset</option>
                            {
                                this.state.presets.map((preset) =>
                                    <option key={preset.name} value={JSON.stringify(preset.body)}>{preset.name}
                                    </option>)
                            }
                        </select>
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
                                <List
                                    className="List"
                                    height={Math.min(this.state.results.length * 40, 400)}
                                    itemCount={this.state.results.length}
                                    itemSize={15}
                                    width={width}
                                >
                                    {({index, style}) => {
                                        let page = this.state.results[index];
                                        return <div style={style}
                                                    key={this.state.results.length - index}>{this.state.results.length - index} {this.state.findOnly ? 'Found ' : 'Modified '}
                                            <a target='_blank' href={page.url}>{page.path}</a></div>
                                    }}
                                </List>
                            )}
                        </AutoSizer>
                    </div>
                </div>
            </div>
        )
    }
}