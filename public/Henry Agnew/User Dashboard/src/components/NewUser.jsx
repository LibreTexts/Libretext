import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Skeleton from '@material-ui/lab/Skeleton';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import TableBody from "@material-ui/core/TableBody";
import Button from "@material-ui/core/Button";
import {Divider, MenuItem, Select, Switch, TextField} from "@material-ui/core";
import PresentToAll from "@material-ui/icons/PresentToAll";
import useKeypress from 'react-use-keypress';
import {Autocomplete} from "@material-ui/lab";
import SystemUpdateAlt from "@material-ui/icons/SystemUpdateAlt";
import AddCircle from "@material-ui/icons/AddCircle";
import Chip from "@material-ui/core/Chip";


export default function NewUser() {
    const [user, setUser] = React.useState({username: 'hdagnew@ucdavis.edu', role: 'viewer'});
    const libraries = Object.entries(LibreTexts.libraries);
    
    useKeypress('Enter', () => {
        // Do something when the user has pressed the Enter key
        search();
    });
    
    function setUserValue(event, key) {
        user[key] = key === 'sso' ? event?.target?.checked : event?.target?.value;
        console.log(key, user[key], user);
        setUser({...user});
    }
    
    function search() {
        let value = document.getElementById('dashboardUsername').value;
        value = value?.trim();
        console.log(value.split('\t'));
        
        value = value?.split('\t');
        if (value?.length && !value[0].includes('@')) { //remove timestamp if present
            value.shift();
        }
        
        if (value?.[0]?.includes?.('@')) { //if first item is an email
            if (value.length === 1) { //only email
                setUser({...user, username: value[0], email: value[0]})
            }
            else {
                setUser({
                    ...user,
                    username: value[0],
                    email: value[0],
                    name: value?.[1],
                    sso: false,
                    role: 'viewer',
                    groups: []
                })
            }
            document.getElementById('dashboardUsername').value = value[0];
        }
    }
    
    function trimEntry(e) {
        e.preventDefault();
        let value = e.clipboardData.getData('text/plain');
        value = value?.trim();
        document.getElementById('dashboardUsername').value = value;
    }
    
    return <div id="ManageUsers">
        <div className="topPanel">
            <TableContainer size="small" component={Paper} style={{maxHeight: '70vh'}}>
                <Table stickyHeader size="small" style={{display: 'inline-table'}}>
                    <TableHead><TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell/>
                        <TableCell>Email</TableCell>
                        <TableCell>Display Name</TableCell>
                        <TableCell>SSO</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Groups</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        <TableCell>
                            <TextField id='dashboardUsername' label="Username" variant="filled" onPaste={trimEntry}/>
                            <Button color="primary" variant="contained" onClick={search}>SEARCH</Button>
                        </TableCell>
                        <TableCell/>
                        <TableCell><TextField label="Email" variant="filled" value={user.email}
                                              onChange={(e) => setUserValue(e, 'email')}/></TableCell>
                        <TableCell><TextField label="Name" variant="filled" value={user.name}
                                              onChange={(e) => setUserValue(e, 'name')}/></TableCell>
                        <TableCell><Switch checked={Boolean(user?.sso)}
                                           onChange={(e) => setUserValue(e, 'sso')}/></TableCell>
                        <TableCell><Select value={user?.role} onChange={(e) => setUserValue(e, 'role')}>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="developer">Developer</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                            ))}
                        </Select></TableCell>
                        <TableCell>
                            <Autocomplete
                                multiple
                                id="tags-filled"
                                options={[]}
                                onChange={(e) => setUserValue(e, 'groups')}
                                freeSolo
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} variant="filled" label="Groups" placeholder="Group names"/>
                                )}
                            /></TableCell>
                    </TableBody>
                </Table>
            </TableContainer>
            <Divider/>
            <TableContainer size="small" component={Paper} style={{maxHeight: '70vh'}}>
                <Table stickyHeader size="small" style={{display: 'inline-table'}}>
                    <TableHead><TableRow>
                        <TableCell/>
                        <TableCell>Library</TableCell>
                        <TableCell>ID</TableCell>
                        {/*<TableCell>Active</TableCell>*/}
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Display Name</TableCell>
                        <TableCell>SSO</TableCell>
                        <TableCell>Groups</TableCell>
                        <TableCell>Reuse Settings</TableCell>
                        <TableCell>Apply Settings</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {libraries.map(([name, subdomain]) =>
                            <RenderRow key={subdomain} subdomain={subdomain} libraryname={name}
                                       user={user}/>)}</TableBody>
                </Table>
            </TableContainer>
        </div>
    </div>
}

function RenderRow(props) {
    const [libraryUser, setLibraryUser] = React.useState();
    // const [ready, setReady] = React.useState(false);
    
    const ready = props?.user?.email === libraryUser?.email;
    
    useEffect(() => {
        getLibraryUser();
    }, [props.user.username])
    
    async function getLibraryUser() {
        setLibraryUser(undefined);
        let libraryUsers = await LibreTexts.sendAPI('manageUser/get', {
            payload: {
                subdomain: props.subdomain, ...props.user
            }
        });
        
        if (!libraryUsers.ok) {
            setLibraryUser(null);
            return;
        }
        let result = await libraryUsers.json();
        let groups = result.groups;
        if (groups.group) {
            groups = groups.group.length ? groups.group : [groups.group];
            groups = groups.map((prop) => prop['groupname']);
        }
        else groups = []
        if (result?.['permissions.user']?.role?.['#text'] === 'Admin')
            groups.push('Admin')
        
        result.groups = groups;
        
        setLibraryUser(result);
    }
    
    async function CreateUser(subdomain) {
        prompt(`Please type "${subdomain}" to create the user ${props.user.username}`)
        /*        await LibreTexts.sendAPI('manageUser/create', {
                    payload: {
                        subdomain, ...user
                    }
                });*/
    }
    
    let innerCells;
    switch (libraryUser) {
        case undefined:
            innerCells = <TableCell colSpan={8}>{<Skeleton variant="text" animation="wave"/>}</TableCell>;
            break;
        case null:
            innerCells =
                <TableCell colSpan={8}>
                    <Button variant="contained" color="primary" disabled={!ready} startIcon={<AddCircle/>}
                            style={{width: '100%'}} onClick={() => CreateUser(props.subdomain)}>Create New
                                                                                                Account</Button></TableCell>;
            break;
        default:
            innerCells = <>
                <TableCell>{libraryUser?.['@id']}</TableCell>
                <TableCell>{libraryUser?.username}</TableCell>
                <TableCell>{libraryUser?.email}</TableCell>
                <TableCell>{libraryUser?.fullname}</TableCell>
                {/*<TableCell><Switch checked={libraryUser?.status === 'active'}/></TableCell>*/}
                <TableCell><Switch checked={libraryUser?.['service.authentication']?.['@id'] === '3'}/></TableCell>
                <TableCell>{JSON.stringify(libraryUser?.groups)}</TableCell>
                <TableCell><Button variant="contained" startIcon={<PresentToAll/>}>Reuse</Button></TableCell>
                <TableCell>
                    <Button variant="contained" disabled={!ready} color="primary"
                            startIcon={<SystemUpdateAlt/>}>Apply</Button>
                </TableCell>
            </>
    }
    
    return <TableRow>
        <TableCell>
            <img src={`https://libretexts.org/img/LibreTexts/glyphs/${props.subdomain}.png`}
                 style={{verticalAlign: 'middle'}}/></TableCell>
        <TableCell>{props.libraryname}</TableCell>
        {innerCells}
    </TableRow>
}
