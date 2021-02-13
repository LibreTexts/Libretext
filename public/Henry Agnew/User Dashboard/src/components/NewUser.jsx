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
import {Divider, Switch, TextField} from "@material-ui/core";
import PresentToAll from "@material-ui/icons/PresentToAll";
import useKeypress from 'react-use-keypress';
import {Autocomplete} from "@material-ui/lab";
import SystemUpdateAlt from "@material-ui/icons/SystemUpdateAlt";
import AddCircle from "@material-ui/icons/AddCircle";
import Chip from "@material-ui/core/Chip";
import * as PropTypes from "prop-types";


class GroupsIO extends React.Component {
    render() {
        return null;
    }
}

GroupsIO.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        groups: PropTypes.any,
        email: PropTypes.string,
        sso: PropTypes.bool,
        username: PropTypes.string
    })
};
export default function NewUser() {
    const [user, setUser] = React.useState({username: '', email: '', name: '', sso: false, groups: []});
    const libraries = Object.entries(LibreTexts.libraries);
    
    useKeypress('Enter', () => {
        // Do something when the user has pressed the Enter key
        search();
    });
    
    function setUserValue(event, key) {
        //groups handling
        if (key === 'groups') {
            let groups = event.newValue;
            let currentValue = event?.target?.value || event?.target?.innerText;
            groups.delete = function (target) {
                const index = this.findIndex((e) => e === target)
                if (index >= 0)
                    this.splice(index, 1);
            }
            
            //currentValue replaces existing value
            if (currentValue === 'Admin') {
                groups.delete('Developer')
                groups.delete('BasicUser')
            }
            else if (currentValue === 'Developer') {
                groups.delete('Admin')
                groups.delete('BasicUser')
            }
            else if (currentValue === 'BasicUser') {
                groups.delete('Admin')
                groups.delete('Developer')
            }
            
            //prevent conflicting values
            if (groups.includes('Admin')) {
                groups.delete('Developer')
                groups.delete('BasicUser')
            }
            else if (groups.includes('Developer')) {
                groups.delete('BasicUser')
            }
            
            groups.sort();
            user[key] = groups;
        }
        else
            user[key] = key === 'sso' ? event?.target?.checked : event?.target?.value;
        
        // console.log(key, user[key], user);
        setUser({...user});
    }
    
    function reuse(input) {
        // console.log(input)
        const copy = JSON.parse(JSON.stringify(input));
        delete copy?.id;
        setUser(copy);
    }
    
    function search() {
        let value = document.getElementById('dashboardUsername').value;
        value = value?.trim();
        console.log(value.split('\t'));
        
        value = value?.split('\t');
        if (value?.length > 1 && !value[0].includes('@')) { //remove timestamp if present
            value.shift();
        }
        const isEmail = value[0].includes('@') ? value[0] : '';
        
        if (value) { //if first item is an email
            if (value?.[0]?.startsWith('admin')) {
                alert('User Admin is restricted.');
            }
            else if (value.length === 1) { //only email
                setUser({...user, username: value[0], email: isEmail})
            }
            else {
                setUser({
                    ...user,
                    username: value[0],
                    email: isEmail,
                    name: value?.[1],
                    sso: false,
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
                        <TableCell>Groups</TableCell>
                    </TableRow></TableHead>
                    <TableBody><TableRow>
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
                        <TableCell>
                            <Autocomplete
                                multiple
                                id="tags-filled"
                                options={['Developer', 'BasicUser']}
                                value={user?.groups || []}
                                onChange={(e, newValue) => {
                                    e.newValue = newValue;
                                    setUserValue(e, 'groups');
                                }}
                                freeSolo
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} variant="filled" label="Groups" placeholder="Group names"/>
                                )}
                            /></TableCell></TableRow>
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
                        <GroupsIO user={user}/>
                        {libraries.map(([libraryname, subdomain]) =>
                            <RenderRow key={subdomain} subdomain={subdomain} libraryname={libraryname}
                                       user={user} reuse={reuse}/>)}</TableBody>
                </Table>
            </TableContainer>
        </div>
    </div>
}

function RenderRow(props) {
    const [libraryUser, setLibraryUser] = React.useState();
    
    let ready = props?.user?.username && props?.user?.email;
    
    useEffect(() => {
        getLibraryUser();
    }, [props.user.username])
    
    async function getLibraryUser() {
        if (!props?.user?.username) {
            setLibraryUser(null);
            return;
        }
        
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
        let groups = result.groups.map((prop) => prop.name);
        if (result?.['permissions.user']?.role?.['#text'] === 'Admin')
            groups.push('Admin')
        groups.sort();
        
        setLibraryUser({
            id: result?.id,
            username: result.username,
            email: result.email,
            name: result.fullname,
            sso: result['service.authentication']?.['@id'] === '3',
            groups: groups,
        });
    }
    
    async function manageUser(alreadyExists) {
        const subdomain = props.subdomain;
        
        if (!ready) {
            alert("This is an error! Please alert the developer as you should not be see seeing this.");
            return false;
        }
        const approve = alreadyExists === true || subdomain === prompt(`Please type "${subdomain}" to create the user ${props.user.username}`).trim()
        if (approve) {
            await LibreTexts.sendAPI('manageUser/create', {
                payload: {
                    subdomain, ...props.user
                }
            });
            getLibraryUser();
        }
        else {
            alert('Failed to create. Try again!')
        }
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
                            style={{width: '100%'}} onClick={manageUser}>Create New
                                                                         Account</Button></TableCell>;
            break;
        default:
            const copy = {...libraryUser};
            delete copy?.id;
            ready = ready && JSON.stringify(copy) !== JSON.stringify(props?.user)
            innerCells = <>
                <TableCell>{libraryUser?.id}</TableCell>
                <TableCell>{libraryUser?.username}</TableCell>
                <TableCell>{libraryUser?.email}</TableCell>
                <TableCell>{libraryUser?.name}</TableCell>
                {/*<TableCell><Switch checked={libraryUser?.status === 'active'}/></TableCell>*/}
                <TableCell><Switch checked={libraryUser?.sso}/></TableCell>
                <TableCell>{JSON.stringify(libraryUser?.groups)}</TableCell>
                <TableCell><Button variant="contained" startIcon={<PresentToAll/>}
                                   onClick={() => props.reuse(libraryUser)}>Reuse</Button></TableCell>
                <TableCell>
                    <Button variant="contained" disabled={!ready} color="primary" onClick={() => manageUser(true)}
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
