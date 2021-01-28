import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import Button from "@material-ui/core/Button";
import * as PropTypes from "prop-types";
import {LinearProgress} from "@material-ui/core";
import {FixedSizeList as List} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";


export default function DeactivateUsers(props) {
    const [users, setUsers] = React.useState([]);
    const [total, setTotal] = React.useState();
    const [subdomain] = LibreTexts.parseURL();
    
    useEffect(() => {
        //fetch data from previous batches
        async function fetchData() {//
            let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/users?verbose=false&limit=all&dream.out.format=json`);
            response = await response.json();
            response = response.user;
            response = response.filter(item => item['@id'] > 2 && item.status === 'active')
            response.forEach(item => {
                if (!item['date.lastlogin']) {
                    item['date.lastlogin'] = item['date.created']
                }
                item.id = item['@id'];
            });
            response = response.filter(item => new Date() - new Date(item['date.lastlogin']) > 6.307e+10) //older than 2 years
            response = response.sort((a, b) => new Date(a['date.lastlogin']) - new Date(b['date.lastlogin']));
            setTotal(response.length);
            setUsers(response);
        }
        
        fetchData();
    }, [])
    
    
    async function purgeUsers() {
        const fullArray = JSON.parse(JSON.stringify(users));
        const workingArray = JSON.parse(JSON.stringify(users));
        for (const currentUser of fullArray) {
            const id = currentUser['@id'];
            await fetch(`https://${subdomain}.libretexts.org/@api/deki/users/${id}`, {
                method: 'PUT',
                headers: {'content-type': 'application/xml; charset=utf-8'},
                body: `<user><status>inactive</status></user>`
            })
            workingArray.shift()
            setUsers([...workingArray]);
            console.log(`Deactivated ${id}`)
            await LibreTexts.sleep(50);
        }
    }
    
    function getProgress() {
        if (!users?.length)
            return <div>Retrieving users for {subdomain}<br/><LinearProgress color="primary"/></div>;
        else {
            const percent = (total - users.length) / total * 100;
            return <div>{subdomain} {Math.trunc(percent)}%<LinearProgress color="secondary" variant="determinate"
                                                                          value={percent}/></div>
        }
    }
    
    return (
        <div id="Deactivate">
            <div className="topPanel">
                <div>This tool is used to deactivate all counts that have been unused for over two years. Accounts will be
                     moved from active to inactive status, but will not be deleted.
                    <Button onClick={purgeUsers} color="secondary"
                            variant="contained">DEACTIVATE {users.length} accounts</Button></div>
                {getProgress()}
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell>Username ({users.length})</TableCell>
                            <TableCell>Last Login</TableCell>
                        </TableRow></TableHead>
                        <AutoSizer disableHeight={true}>
                            {({height, width}) => (
                                <List
                                    className="List"
                                    height={500}
                                    itemCount={users.length}
                                    itemSize={40}
                                    width={width}
                                >
                                    {({index, style}) => {
                                        let user = users[index];
                                        return <tr key={user.id}
                                                   style={{...style, display: 'flex'}}>
                                            <div style={{flex: 1, textAlign: 'center'}}>
                                                {user.username}
                                            </div>
                                            <div style={{flex: 1}}>
                                                {user['date.lastlogin']}
                                            </div>
                                        </tr>
                                    }}
                                </List>
                            )}
                        </AutoSizer>
                    </Table>
                </TableContainer>
            </div>
        </div>
    )
}
