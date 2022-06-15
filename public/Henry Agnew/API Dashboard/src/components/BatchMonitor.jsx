import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Skeleton from '@material-ui/lab/Skeleton';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import TableBody from "@material-ui/core/TableBody";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Tooltip from "@material-ui/core/Tooltip";


export default function BatchMonitor(props) {
    const [batchData, setBatchData] = React.useState(initializeLibraryObject);
    const [toBatch, setToBatch] = React.useState(initializeLibraryObject);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [allBatch, setAllBatch] = React.useState({courses: 'unchecked', bookshelves: 'unchecked'});
    const batchEndpoint = 'https://batch.libretexts.org/print'
    const pathStyle = {cursor: 'pointer', userSelect: 'none'};
    
    useEffect(() => {
        //fetch data from previous batches
        async function fetchData() {
            const result = {};
            for (const key of Object.values(LibreTexts.libraries)) {
                //create path structure
                result[key] = {};
                if (key === 'espanol') {
                    try {
                        let home = await fetch(`https://api.libretexts.org/DownloadsCenter/espanol/home.json`);
                        home = await home.json();
                        result[key].home =
                            <Tooltip title={`Number of items: ${home.items.length}`}>{processTime(home)}</Tooltip>;
                    } catch (e) {
                        console.error(e);
                        result[key].home = false;
                    }
                }
                else {
                    try {
                        let courses = fetch(`https://api.libretexts.org/DownloadsCenter/${key}/Courses.json`);
                        let bookshelves = fetch(`https://api.libretexts.org/DownloadsCenter/${key}/Bookshelves.json`);
                        [courses, bookshelves] = await Promise.all([courses, bookshelves]);
                        if (courses.ok) {
                            courses = await courses.json();
                            result[key].courses = <Tooltip
                                title={`Number of items: ${courses.items.length}`}>{processTime(courses)}</Tooltip>;
                        }
                        else
                            result[key].courses = false;
                        
                        if (bookshelves.ok) {
                            bookshelves = await bookshelves.json();
                            result[key].bookshelves = <Tooltip
                                title={`Number of items: ${bookshelves.items.length}`}>{processTime(bookshelves)}</Tooltip>;
                        }
                        else
                            result[key].bookshelves = false;
                        
                    } catch (e) {
                        console.error(e);
                        result[key].courses = false;
                        result[key].bookshelves = false;
                    }
                }
            }
            setBatchData(result);
            
            function processTime(input) {
                if (!input || !input.timestamp)
                    return <span className='mt-icon-warning2' style={{color: 'red', fontWeight: 'bold'}}>Unknown</span>
                
                let days = Math.floor((new Date() - Date.parse(input.timestamp)) / 86400000);
                
                if (days <= 15)
                    return <span style={{color: 'green'}}>{days} Days</span>
                else if (days <= 30)
                    return <span style={{color: 'orange', fontWeight: 'bold'}}>{days} Days</span>
                else
                    return <span className='mt-icon-warning2'
                                 style={{color: 'red', fontWeight: 'bold'}}>{days} Days</span>
            }
        }
        
        fetchData();
    }, [])
    
    const changeCheckbox = (path, subdomain) => (event) => {
        toBatch[subdomain][path] = !toBatch[subdomain][path];
        
        //recalculate allBatch status for Courses and Bookshelves
        let totalRows = Object.values(LibreTexts.libraries).length;
        totalRows = {courses: totalRows, bookshelves: totalRows - 1};
        const number = {courses: 0, bookshelves: 0};
        for (let path of ['courses', 'bookshelves']) { //note variable scope overrides for path and subdomain!
            for (const subdomain of Object.values(LibreTexts.libraries)) {
                if (path === 'bookshelves' && toBatch[subdomain].bookshelves)
                    number[path]++;
                else if (toBatch[subdomain][path] || toBatch[subdomain].home)
                    number.courses++;
            }
            if (!number[path])
                allBatch[path] = 'unchecked';
            else if (number[path] === totalRows[path])
                allBatch[path] = 'checked';
            else
                allBatch[path] = 'indeterminate';
        }
        
        setToBatch({...toBatch});
        setAllBatch({...allBatch});
    }
    const changeAllCheckbox = (path) => (event) => {
        let currentStatus = allBatch[path];
        switch (currentStatus) {
            case 'checked':
            case 'indeterminate':
                allBatch[path] = 'unchecked';
                break;
            case 'unchecked':
                allBatch[path] = 'checked';
        }
        let booleanAllBatch = {
            courses: allBatch.courses !== 'unchecked',
            bookshelves: allBatch.bookshelves !== 'unchecked'
        }
        setToBatch(initializeLibraryObject(booleanAllBatch)); //reinitialize toBatch
        setAllBatch({...allBatch});
    }
    
    const requestBatch = (nocache) => (event) => {
        fetch(batchEndpoint + '/Refresh', {
            method: 'PUT',
            body: JSON.stringify({
                "libraries": toBatch,
                "nocache": nocache
            })
        }).then(async (data) => alert(await data.text()));
        setDialogOpen(false);
        
    }
    
    function createTable() {
        return Object.entries(LibreTexts.libraries).map(([name, subdomain]) => {
            return <TableRow key={subdomain}>
                <TableCell style={{textAlign: 'center'}}>
                    <img src={`https://libretexts.org/img/LibreTexts/glyphs/${subdomain}.png`}
                         style={{verticalAlign: 'middle'}}/>
                </TableCell>
                <TableCell>
                    {name}
                </TableCell>
                {renderInner()}
            </TableRow>
            
            function renderInner() {
                let skele = <Skeleton variant="text" animation="wave" width={100}
                                      style={{display: 'inline-block'}}/>;
                if (subdomain === 'espanol')
                    return <>
                        <TableCell onClick={changeCheckbox('home', subdomain)} style={pathStyle}>
                            <Checkbox checked={toBatch[subdomain]?.home}/>
                            Home
                        </TableCell>
                        <TableCell>
                            {batchData[subdomain]?.home || skele}
                        </TableCell>
                        <TableCell>
                        
                        </TableCell>
                        <TableCell>
                        
                        </TableCell>
                    </>
                else
                    return <>
                        <TableCell onClick={changeCheckbox('courses', subdomain)} style={pathStyle}>
                            <Checkbox checked={toBatch[subdomain]?.courses}/>
                            Courses
                        </TableCell>
                        <TableCell>
                            {batchData[subdomain]?.courses || skele}
                        </TableCell>
                        <TableCell onClick={changeCheckbox('bookshelves', subdomain)} style={pathStyle}>
                            <Checkbox checked={toBatch[subdomain]?.bookshelves}/>
                            Bookshelves
                        </TableCell>
                        <TableCell>
                            {batchData[subdomain]?.bookshelves || skele}
                        </TableCell>
                    </>
            }
        })
    }
    
    return (
        <div id="BatchMonitor">
            <div className="topPanel">
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell>
                                <Button variant="contained" color="primary"
                                        onClick={() => setDialogOpen(true)}>Batch</Button>
                            </TableCell>
                            <TableCell>Library</TableCell>
                            <TableCell onClick={changeAllCheckbox('courses')} style={pathStyle}>
                                <Checkbox checked={allBatch.courses === 'checked'}
                                          indeterminate={allBatch.courses === 'indeterminate'}/>
                                Courses
                            </TableCell>
                            <TableCell>Days since Batch</TableCell>
                            <TableCell onClick={changeAllCheckbox('bookshelves')} style={pathStyle}>
                                <Checkbox checked={allBatch.bookshelves === 'checked'}
                                          indeterminate={allBatch.bookshelves === 'indeterminate'}/>
                                Bookshelves
                            </TableCell>
                            <TableCell>Days since Batch</TableCell>
                        </TableRow></TableHead>
                        <TableBody>{createTable()}</TableBody>
                    </Table>
                </TableContainer>
            </div>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}
                    aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Send request to Batch</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do you want to send the Batch request as cache or nocache?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={requestBatch(true)} color="primary">
                        NoCache
                    </Button>
                    <Button onClick={requestBatch()} color="primary">
                        Cache
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
    
    function initializeLibraryObject(value = {courses: false, bookshelves: false}) {
        const result = {};
        for (const key of Object.values(LibreTexts.libraries)) {
            //create path structure
            result[key] = key === 'espanol' ? {home: value.courses} : {...value};
        }
        return result;
    }
}
