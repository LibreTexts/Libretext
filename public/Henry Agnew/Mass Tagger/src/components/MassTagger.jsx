import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import {FixedSizeList as List} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Chip from '@material-ui/core/Chip';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {Button, LinearProgress} from "@material-ui/core";
import toCSV from "csv-parse/lib/sync";

/*
This component is receiving information from its parent through its "props"!
The file extension .jsx is for standalone React Components, compared to index.js
*/
export default function MassTagger(props) {
    const [newTags, setNewTags] = React.useState({});
    const [finishedTags, setFinishedTags] = React.useState();
    
    function setNewTag(id, value) {
        setNewTags({...newTags, [id]: value});
    }
    
    async function processCSV(event) {
        let file = event.target.files[0];
        if (!file) {
            return;
        }
        file = await file.text();
        file = toCSV(file, {
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
        
        //skip header line if present
        if (file?.[0]?.[1] && isNaN(file[0][1])) {
            file.shift();
        }
        
        const tags = {};
        let [subdomain] = LibreTexts.parseURL();
        file.forEach(entry => {
            
            let [, id, ...value] = entry;
            
            //basic validation
            if (!id)
                return;
            id = String(id);
            
            if (id.includes(','))
                id = id.split(',');
            else
                id = [id]
            
            //extract pageIDs
            id = id.filter(e => e).map(e => {
                e = e.trim();
                if (!e.includes("-")) {
                    return e;
                }
                else {
                    let [current, pageID] = e.split("-");
                    current = current.trim();
                    return current === subdomain ? pageID : false;
                }
            });
            
            // convert into array of tags
            if (!value)
                value = [];
            value = value.map(e => {
                if (e.includes(',')) {
                    return e.split(',');
                }
                else {
                    return e;
                }
            });
            value = value.flat();
            value = value.filter(e => e).map(e => e.trim()); // format tags
            
            for (let i of id) {
                if (tags[i]) {
                    tags[i] = tags[i].concat(value);
                }
                else {
                    tags[i] = value;
                }
            }
        })
        console.log(tags);
        
        setNewTags(tags);
    }
    
    const pageIDs = Object.keys(newTags);
    
    async function updateTags() {
        let result = {};
        for (const page in newTags) {
            if (!newTags[page])
                continue;
            
            await LibreTexts.sleep(2000);
            
            try {
                let oldTags = await LibreTexts.authenticatedFetch(page, 'tags?dream.out.format=json');
                oldTags = await oldTags.json();
                oldTags = !oldTags.tag.length ? [oldTags.tag] : oldTags.tag;
                oldTags = oldTags.map((t) => t["@value"]);
                
                let allTags = oldTags.concat(newTags[page]);
                let xmlTags = `<tags>${allTags.map(e => `<tag value="${e}"/>`)}</tags>`;
                
                let response = await LibreTexts.authenticatedFetch(page, 'tags?dream.out.format=json', null, {
                    method: "PUT",
                    body: xmlTags,
                    headers: {'content-type': 'application/xml; charset=utf-8'}
                });
                
                result[page] = response.status;
            } catch (e) {
                result[page] = `Error: ${e.message}`;
            }
            console.log(result);
            setFinishedTags({...result});
        }
        
    }
    
    if (!finishedTags)
        return (
            <div className='subComponent'>
                <Button
                    variant="contained"
                    component="label"
                >
                    Upload CSV
                    <input
                        type="file"
                        accept=".csv"
                        hidden
                        onChange={processCSV}
                        onClick={(event) => {
                            event.target.value = null
                        }}
                    />
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={updateTags}
                >
                    Update Tags
                </Button>
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell>Page ID ({pageIDs.length ?? 'Loading'})</TableCell>
                            <TableCell>New Tags</TableCell>
                            <TableCell>Existing Tags</TableCell>
                        </TableRow></TableHead>
                        <AutoSizer disableHeight={true}>
                            {({height, width}) => (
                                <List
                                    className="List"
                                    height={600}
                                    itemCount={pageIDs.length ?? 0}
                                    itemSize={60}
                                    width={width}
                                >
                                    {({index, style}) => {
                                        const pageID = pageIDs[index];
                                        return <tr key={index}
                                                   style={{...style, display: 'flex'}}><LibreTextPage
                                            pageID={pageID} newTags={newTags} setNewTag={setNewTag}/></tr>
                                    }}
                                </List>
                            )}
                        </AutoSizer>
                    </Table>
                </TableContainer>
            </div>
        );
    else {
        const percent = Object.entries(finishedTags).length / Object.entries(newTags).length * 100;
        return (
            <div className='subComponent'>
                <div>Processing tags {Math.trunc(percent)}%<LinearProgress color="secondary" variant="determinate"
                                                                           value={percent}/></div>
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell>Page ID ({pageIDs.length ?? 'Loading'})</TableCell>
                            <TableCell>Updated Tags</TableCell>
                        </TableRow></TableHead>
                        <AutoSizer disableHeight={true}>
                            {({height, width}) => (
                                <List
                                    className="List"
                                    height={600}
                                    itemCount={pageIDs.length ?? 0}
                                    itemSize={60}
                                    width={width}
                                >
                                    {({index, style}) => {
                                        const pageID = pageIDs[index];
                                        return <tr key={index}
                                                   style={{...style, display: 'flex'}}><LibreTextPage
                                            pageID={pageID}/></tr>
                                    }}
                                </List>
                            )}
                        </AutoSizer>
                    </Table>
                </TableContainer>
            </div>
        );
    }
    
    
}

function LibreTextPage(props) {
    let [oldTags, setOldTags] = React.useState([]);
    
    useEffect(() => {
        (async function () {
            let tags;
            try {
                tags = await LibreTexts.authenticatedFetch(props.pageID, 'tags?dream.out.format=json');
                tags = await tags.json();
                tags = !tags.tag.length ? [tags.tag] : tags.tag;
                tags = tags.map((t) => t["@value"]);
            } catch (e) {
                tags = "INVALID PAGE"
            }
            
            setOldTags(tags);
        })()
    }, []);
    
    function renderTags(tags) {
        if (!Array.isArray(tags)) {
            return tags;
        }
        else {
            return tags.map(t => <Chip variant="outlined" key={t} label={t}/>);
        }
    }
    
    return <>
        <div style={{flex: 1, textAlign: 'center'}}>
            {props.pageID}
        </div>
        {props.newTags ? <div style={{flex: 2}}>
            <Autocomplete
                multiple
                freeSolo
                value={props.newTags?.[props.pageID] ?? []}
                options={[]}
                onChange={(e, newValue) => {
                    props.setNewTag(props.pageID, newValue);
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({index})} />
                    ))
                }
                renderInput={(params) => (
                    <TextField {...params} variant="filled" label="New Tags" placeholder="Add tag"/>
                )}
            />
        </div> : null}
        <div style={{flex: 3, textAlign: 'center'}}>
            {renderTags(oldTags)}
        </div>
    </>
}
