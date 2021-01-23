import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import TableBody from "@material-ui/core/TableBody";
import Button from "@material-ui/core/Button";


export default function DeactivateUsers(props) {
    const [users, setUsers] = React.useState([]);
    const [subdomain] = LibreTexts.parseURL();
    useEffect(() => {
        //fetch data from previous batches
        async function fetchData() {
            let response = await fetch(`https://${subdomain}.libretexts.org/@api/deki/users?verbose=false&limit=all&dream.out.format=json`);
            response = await response.json();
            response = response.user;
            let never = [];
            response = response.filter(item => item['@id'] > 2 && item.status === 'active')
            response.forEach(item => {
                if (!item['date.lastlogin']) {
                    never.push(item.username)
                    item['date.lastlogin'] = item['date.created']
                }
                item.id =item['@id'];
                item.deleted = false;
            });
            console.log(never);
            response = response.filter(item => new Date(item['date.lastlogin']) < new Date('1/1/20'))
            response = response.sort((a, b) => new Date(a['date.lastlogin']) - new Date(b['date.lastlogin']));
            response = response.slice(0, 1000); //TODO replace with pagination
            setUsers(response);
        }
        
        fetchData();
    }, [])
    
    function UserRow(prop) {
        const user = prop.user;
        return <TableRow key={user.id} style={{textDecoration: user.deleted ? 'line-through' : undefined, color:'red'}}>
            <TableCell style={{textAlign: 'center'}}>
                {user.username}
            </TableCell>
            <TableCell>
                {user['date.lastlogin']}
            </TableCell>
        </TableRow>
    }
    
    async function purgeUsers() {
        for (let user of users) {
            const id = user['@id'];
/*            await fetch(`https://${subdomain}.libretexts.org/@api/deki/users/${id}`, {
                method: 'PUT',
                headers: {'content-type': 'application/xml; charset=utf-8'},
                body: `<user><status>inactive</status></user>`
            })*/
            user.deleted = true;
            setUsers(users);
            console.log(`Deleted ${id}`)
            await LibreTexts.sleep(2000);
            // return;
        }
    }
    
    return (
        <div id="BatchMonitor">
            <div className="topPanel">
                This tool is used to deactivate all counts that have been unused for over a year.
                <Button onClick={purgeUsers} color="secondary"
                        variant="contained">PURGE {users.length} accounts</Button>
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell>Username ({users.length})</TableCell>
                            <TableCell>Last Login</TableCell>
                        </TableRow></TableHead>
                        <TableBody>{users.map(user=><UserRow key={user.id} user={{...user}}/>)}</TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    )
}
