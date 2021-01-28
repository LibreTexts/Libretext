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


export default function NewUser(props) {
    const [user, setUser] = React.useState({username: 'hdagnew@ucdavis.edu'});
    
    function createTable() {
        return Object.entries(LibreTexts.libraries).map(([name, subdomain]) => <RenderRow key={subdomain} subdomain={subdomain}
                                                                                          libraryname={name}
                                                                                          user={user}/>)
    }
    
    function RenderRow(props) {
        const [libraryUser, setLibraryUser] = React.useState();
        
        useEffect(() => {
            getLibraryUser();
        },[])
        
        async function getLibraryUser() {
            //TODO: bounce off of elevate
            let libraryUsers = await LibreTexts.authenticatedFetch(`https://${props.subdomain}.libretexts.org/@api/deki/users/=${encodeURIComponent(encodeURIComponent(user.username))}?dream.out.format=json`)
            if (!libraryUsers.ok) {
                console.error(await libraryUsers.text())
                setLibraryUser(null);
                return;
            }
            setLibraryUser(await libraryUsers.json());
        }
        
        let skele = <Skeleton variant="text" animation="wave" width={100}
                              style={{display: 'inline-block'}}/>;
        let item;
        switch (libraryUser) {
            case undefined:
                item = skele;
                break;
            case null:
                item = <Button>Create</Button>;
                break;
            default:
                item = libraryUser['@id'];
        }
        
        return <TableRow>
            <TableCell><img src={`https://libretexts.org/img/LibreTexts/glyphs/${props.subdomain}.png`}
                            style={{verticalAlign: 'middle'}}/></TableCell>
            <TableCell>{props.libraryname}</TableCell>
            <TableCell>{item}</TableCell>
        </TableRow>
    }
    
    async function CreateUser(subdomain) {
        await LibreTexts.sendAPI('createUser', {
            payload: {
                subdomain, ...user
            }
        });
    }
    
    return (
        <div id="ManageUsers">
            <div className="topPanel">
                <TableContainer size="small" component={Paper}>
                    <Table size="small" style={{display: 'inline-table'}}>
                        <TableHead><TableRow>
                            <TableCell/>
                            <TableCell>Library</TableCell>
                            <TableCell>SSO</TableCell>
                        </TableRow></TableHead>
                        <TableBody>{createTable()}</TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    )
}
