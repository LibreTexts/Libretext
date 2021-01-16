import React, {useEffect} from 'react';
import TablePagination from '@material-ui/core/TablePagination';
import {Accordion, AccordionDetails, AccordionSummary, Divider, TextField} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Skeleton from "@material-ui/lab/Skeleton";
import {FixedSizeList} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Button from "@material-ui/core/Button";

export default function RevisionLog() {
    // const user = document.getElementById('usernameHolder').textContent;
    const [user, setUser] = React.useState('admin');
    const [fetchResult, setFetchResult] = React.useState([]);
    const [searchId, setSearchId] = React.useState('');
    
    useEffect(() => {
        (async function () {
            let response = await fetch(`https://api.libretexts.org/bot/Logs/Users/${user}.csv`);
            if (!response.ok) {
                setFetchResult([]);
                return false;
            }
            response = await response.text()
            response = response.split(',')
            setFetchResult(response);
        })();
    }, [user])
    
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    let result = [...fetchResult].reverse();
    const firstIndex = rowsPerPage * page;
    const lastIndex = firstIndex + rowsPerPage;
    const totalCount = fetchResult.length;
    result = result.slice(firstIndex, lastIndex);
    result = result.filter((item) => item);
    
    result = result.map((item) => <RevisionEntry key={item} item={item} user={user}/>);
    
    return <div id="RevisionLog">
        <div className="topPanel">
            <div className="Center">
                <div style={{display: 'flex'}}>
                    <TextField label="Username" variant="filled" error={!totalCount} value={user}/>
                    <TextField label="BOT ID (optional)" variant="filled" error={!totalCount}/>
                    <Button color="primary" variant="contained">SEARCH</Button>
                </div>
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onChangePage={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
                {result}
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onChangePage={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </div>
        </div>
    </div>
}

function RevisionEntry(props) {
    const [expanded, setExpanded] = React.useState(false);
    const [fetchResult, setFetchResult] = React.useState(false);
    useEffect(() => {
        fetchJob();
    }, [props, expanded])
    
    function getColor(status) {
        switch (status) {
            case 'completed':
                return 'black'
            case 'reverted':
                return 'crimson'
            case 'restored':
                return 'green'
        }
    }
    
    async function fetchJob() {
        let response = await fetch(`https://api.libretexts.org/bot/Logs/Completed/${props.user}/${props.item}.json`);
        if (response.ok) {
            response = await response.json()
            
            //data processing zone
            if (response?.params?.multi?.body)
                delete response.params.multi.body
            if (!response?.pages?.length)
                response.pages = []
            // response.pages = response.pages.map(item => item.url);
            
            setFetchResult(response);
        }
    }
    
    let skele = <Skeleton variant="text" animation="wave" width={100}
                          style={{display: 'inline-block'}}/>; //placeholder while loading
    function revertHandler() {
        
        fetchJob();
    }
    
    return <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
            style={{color: getColor(fetchResult.status)}}
        >
            <table style={{width: '100%', tableLayout: 'fixed'}}>
                <tbody>
                <tr>
                    <td><b>{props.item}</b></td>
                    <td>{fetchResult?.jobType || skele}</td>
                    <td>{fetchResult?.status || skele}</td>
                </tr>
                <tr>
                    <td>{fetchResult?.timestamp ? new Date(fetchResult?.timestamp).toLocaleString() : skele}</td>
                    <td>Library: {fetchResult?.subdomain || skele} <img
                        src={`https://libretexts.org/img/LibreTexts/glyphs/${fetchResult?.subdomain}.png`}
                        style={{verticalAlign: 'middle'}}/></td>
                    <td>Pages: {fetchResult?.pages?.length ?? skele}</td>
                </tr>
                </tbody>
            </table>
        </AccordionSummary>
        {fetchResult && <AccordionDetails style={{whiteSpace: 'pre-wrap', flexDirection: 'column'}}>
            <Divider/>
            <div>
                <h3>Job Parameters</h3>
                {/*{fetchResult && JSON.stringify(fetchResult, null, 2)}*/}
                <div>Last
                     Action: {fetchResult?.lastAction ? new Date(fetchResult?.lastAction).toLocaleString() : 'None'}
                    <Button color="primary" variant="contained"
                            onClick={revertHandler}>{fetchResult?.status === 'reverted' ? 'Restore' : 'Revert'}</Button>
                </div>
                
                <div>{JSON.stringify(fetchResult?.params, null, 2) || skele}</div>
            </div>
            <Divider/>
            <h3>Affected pages ({fetchResult?.pages?.length})</h3>
            <AutoSizer disableHeight={true}>
                {({height, width}) => (
                    <FixedSizeList
                        className="List"
                        height={Math.min(fetchResult?.pages?.length * 40, 400)}
                        itemCount={fetchResult?.pages?.length || 0}
                        itemSize={15}
                        width={width}
                    >
                        {({index, style}) => {
                            let page = fetchResult.pages[index];
                            return <div style={{...style, width: 'unset'}} key={index}><a target='_blank'
                                                                                          href={page.url}>{page.path}</a>
                            </div>
                        }}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </AccordionDetails>}
    </Accordion>
}
