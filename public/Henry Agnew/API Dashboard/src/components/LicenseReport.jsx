import React from 'react';
import Toggle from 'react-toggle';
import Link from '@material-ui/core/Link';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';


export default class LicenseReport extends React.Component {
    constructor() {
        super();
        this.state = {
            root: "",
            user: document.getElementById('usernameHolder').textContent,
            createReportPage: true,
            generateReportPDF: true,
            reportData: {},
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
        // this.socket = io(this.props.devMode ? '<dev endpoint>' : 'https://api.libretexts.org/', {path: '/bot/ws'});
        this.socket = io('https://api.libretexts.org/', {path: '/bot/ws'});
        this.socket.on('setState', (data) => {
            switch (data.state) {
                case 'starting':
                    this.setState({ID: data.ID, counter: 0, time: 0});
                    break;
                case 'gettingSubpages':
                    this.setState({status: 'gettingSubpages'});
                    break;
                case 'gotSubpages':
                    this.setState({status: 'gotSubpages'});
                    break;
                case 'processPages':
                    this.setState({status: 'processPages'});
                    break;
                case 'processing':
                    this.setState({status: 'processing', counter: data.percentage});
                    break;
                case 'processedPages':
                    this.setState({status: 'processedPages', counter: 100});
                    break;
                case 'postProcessing':
                    this.setState({status: 'postProcessing'});
                    break;
                case 'postProcessed':
                    this.setState({status: 'postProcessed'});
                    break;
                case 'formattingReport':
                    this.setState({status: 'formattingReport'});
                    break;
                case 'formattedReport':
                    this.setState({status: 'formattedReport'});
                    break;
                case 'updatingReportPage':
                    this.setState({status: 'updatingReportPage'});
                    break;
                case 'updatedReportPage':
                    this.setState({status: 'updatedReportPage'});
                    break;
                case 'generatingPDF':
                    this.setState({status: 'generatingPDF'});
                    break;
                case 'generatedPDF':
                    this.setState({status: 'generatedPDF'});
                    break;
                case 'done':
                    this.setState({status: 'done', ID: data.ID, time: -1});
                    break;
            }
        });
        this.socket.on('licenseReportData', (data) => {
            this.setState({reportData: data});
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
        let confMsg = `The bot will gather information on the content's licensing and save it to the server.`;
        let request = {
            root: this.state.root,
            user: this.state.user,
            createReportPage: this.state.createReportPage,
            generateReportPDF: this.state.generateReportPDF
        };
        if (!request.root) {
            alert(`Missing URL`);
            return false;
        }
        else if (request.createReportPage === true && request.generateReportPDF === true) {
            confMsg += ` A report page WILL be created in the LibreText and a PDF version WILL be attached to the coverpage. Click OK to proceed.`;
            if (confirm(confMsg)) this.sendRequest(request);
        }
        else if (request.createReportPage === true && request.generateReportPDF === false) {
            confMsg += ` A report page WILL be created in the LibreText. A PDF version will NOT be attached. Click OK to proceed.`;
            if (confirm(confMsg)) this.sendRequest(request);
        }
        else if (request.createReportPage === false && request.generateReportPDF === true) {
            confMsg += ` A report page will NOT be created in the LibreText. A PDF version WILL be attached to the coverpage. Click OK to proceed.`;
            if (confirm(confMsg)) this.sendRequest(request);
        }
        else { // read-only mode
            confMsg += ` No changes will be made to the LibreText itself. Click OK to proceed.`;
            if (confirm(confMsg)) this.sendRequest(request);
        }
    }

    sendRequest(request) {
        this.socket.emit('licenseReport', request);
    }

    getStatus() {
        switch (this.state.status) {
            case 'starting':
                return <p className="status" style={{backgroundColor: 'orange'}}>Spawning bot...</p>;
            case 'gettingSubpages':
                return <p className="status" style={{backgroundColor: 'orange'}}>Gathering pages...</p>;
            case 'gotSubpages':
                return <p className="status" style={{backgroundColor: 'orange'}}>Got pages...</p>;
            case 'processPages':
                return <p className="status" style={{backgroundColor: 'orange'}}>Preparing to process pages...</p>;
            case 'processing':
                return <div className="status" style={{backgroundColor: 'orange'}}>
                    <div>
                        Page Processing in Progress
                        ({this.state.counter}%)
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
            case 'processedPages':
                return <p className="status" style={{backgroundColor: 'orange'}}>Processed pages. Preparing to gather data...</p>;
            case 'postProcessing':
                return <p className="status" style={{backgroundColor: 'orange'}}>Gathering licensing data...</p>;
            case 'postProcessed':
                return <p className="status" style={{backgroundColor: 'orange'}}>Gathered licensing data.</p>;
            case 'formattingReport':
                return <p className="status" style={{backgroundColor: 'orange'}}>Formatting report...</p>;
            case 'formattedReport':
                return <p className="status" style={{backgroundColor: 'orange'}}>Formatted report.</p>;
            case 'updatingReportPage':
                return <p className="status" style={{backgroundColor: 'orange'}}>Updating the report page in the LibreText...</p>;
            case 'updatedReportPage':
                return <p className="status" style={{backgroundColor: 'orange'}}>Updated the report page.</p>;
            case 'generatingPDF':
                return <p className="status" style={{backgroundColor: 'orange'}}>Generating report PDF and attaching to coverpage...</p>;
            case 'generatedPDF':
                return <p className="status" style={{backgroundColor: 'orange'}}>Generated and attached report PDF.</p>;
            case 'done':
                return <p className="status" style={{backgroundColor: 'green'}}>Complete!</p>;
            default:
                return null;
        }
    }

    buildTreeRecursive(pages) {
        let builtItems = [];
        if (pages && Array.isArray(pages)) {
            pages.forEach((page, idx) => {
                let prefix = page.id || 'childpage';
                let newTreeItem = (
                    <TreeItem nodeId={`${prefix}-${idx}`} key={`${prefix}-${idx}`} label={
                        <span>{page.title} {page.license?.label &&
                            <span> — <Link href={page.license?.link} target='_blank' rel='noopener noreferrer'>{page.license?.label} {page.license?.version}</Link></span>
                        }</span>
                    }>
                        {(page.children && Array.isArray(page.children)) &&
                            this.buildTreeRecursive(page.children).map((item) => {
                                return item;
                            })
                        }
                    </TreeItem>
                );
                builtItems.push(newTreeItem);
            });
        }
        return builtItems;
    }

    buildSpecialRestrictions(specialRestrictions) {
        if (Array.isArray(specialRestrictions)) {
            let restrString = '';
            let restrCount = 0;
            if (specialRestrictions.includes('noncommercial')) {
                if (restrCount > 0) restrString += `, `;
                restrString += `Noncommercial`;
                restrCount++;
            }
            if (specialRestrictions.includes('noderivatives')) {
                if (restrCount > 0) restrString += `, `;
                restrString += `No Derivatives`;
                restrCount++;
            }
            if (specialRestrictions.includes('fairuse')) {
                if (restrCount > 0) restrString += `, `;
                restrString += `Fair Use`;
                restrCount++;
            }
            return restrString;
        }
        return '';
    }

    render() {
        return (
            <div id="LicenseReport">
                <div className="topPanel">
                    <div><input placeholder="URL" onChange={(event) => {
                        this.setState({root: event.target.value})
                    }}/>
                        <div>
                            <button onClick={() => this.verifyRequest()}>Verify Request</button>
                        </div>
                    </div>
                    <div>
                        <label>
                            <Toggle onChange={() => this.setState({createReportPage: !this.state.createReportPage})}
                                    defaultChecked={this.state.createReportPage}/>
                            <span>Generate Report in LibreText (uncheck to use read-only mode)</span>
                        </label>
                        <label>
                            <Toggle onChange={() => this.setState({generateReportPDF: !this.state.generateReportPDF})}
                                    defaultChecked={this.state.generateReportPDF}/>
                            <span>Attach PDF report to coverpage (uncheck to use read-only mode)</span>
                        </label>
                    </div>
                </div>

                <div>
                    {this.getStatus()}
                    {(this.state.status === 'done') &&
                        <div>
                            <Typography variant='h2'>Content Licensing</Typography>
                            <Typography variant='h3'>Overview</Typography>
                            <Typography variant='body1'><strong>Resource Title:</strong> <Link href={this.state.reportData?.text?.url} target='_blank' rel='noopener noreferrer'>{this.state.reportData?.text?.title}</Link></Typography>
                            <Typography variant='body1'><strong>Webpages:</strong> {this.state.reportData?.text?.totalPages}</Typography>
                            {(Array.isArray(this.state.reportData?.meta?.specialRestrictions) && this.state.reportData.meta.specialRestrictions.length > 0) &&
                                <Typography variant='body1'><strong>Applicable Restrictions:</strong> {this.buildSpecialRestrictions(this.state.reportData.meta.specialRestrictions)}</Typography>
                            }
                            <Typography variant='body1'><strong>All licenses found:</strong></Typography>
                            {(this.state.reportData?.meta?.licenses && Array.isArray(this.state.reportData.meta.licenses)) &&
                                <ul>
                                    {this.state.reportData.meta.licenses.map((item, idx) => {
                                        return (
                                            <li key={idx}><Typography variant='body1'><Link href={item.link} target='_blank' rel='noopener noreferrer'>{item.label} {item.version}</Link>: {item.percent}% ({item.count} {item.count > 1 ? 'pages' : 'page'})</Typography></li>
                                        )
                                    })}
                                </ul>
                            }
                            <Typography variant='h3'>By Page</Typography>
                            {(this.state.reportData?.text) &&
                                <TreeView
                                    aria-label='Table of Contents Navigator'
                                    defaultCollapseIcon={<ExpandMoreIcon />}
                                    defaultExpandIcon={<ChevronRightIcon />}
                                    sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                                >
                                    <TreeItem nodeId="root-1" key="root-1" label={
                                        <span>{this.state.reportData?.text?.title} - <Link href={this.state.reportData?.text?.license?.link} target='_blank' rel='noopener noreferrer'>{this.state.reportData?.text?.license?.label} {this.state.reportData?.text?.license?.version}</Link></span>
                                    }>
                                        {(this.state.reportData?.text?.children && Array.isArray(this.state.reportData.text.children)) &&
                                            this.buildTreeRecursive(this.state.reportData.text.children).map((item) => {
                                                return item;
                                            })
                                        }
                                    </TreeItem>
                                </TreeView>
                            }
                        </div>
                    }
                </div>
            </div>
        )
    }
}
