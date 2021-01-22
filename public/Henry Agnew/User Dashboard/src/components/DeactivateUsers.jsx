import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Table from "@material-ui/core/Table";
import TableHead from '@material-ui/core/TableHead';
import TableBody from "@material-ui/core/TableBody";


export default function DeactivateUsers(props) {
	const [users, setUsers] = React.useState([]);
	
	useEffect(() => {
		//fetch data from previous batches
		async function fetchData() {
			let response = await fetch(`https://chem.libretexts.org/@api/deki/users?verbose=false&limit=all&dream.out.format=json`);
			response = await response.json();
			response = response.user;
			response = response.filter(item=>item['date.lastlogin']);
			response = response.sort((a,b)=>new Date(a['date.lastlogin']) - new Date(b['date.lastlogin']));
			setUsers(response);
		}
		
		fetchData();
	}, [])
	
	function createTable() {
		return users.map((user) => {
			return <TableRow key={user.email}>
				<TableCell style={{textAlign: 'center'}}>
					{user.email}
				</TableCell>
				<TableCell>
					{user['date.lastlogin']}
				</TableCell>
			</TableRow>
		})
	}
	
	return (
		<div id="BatchMonitor">
			<div className="topPanel">
				<TableContainer size="small" component={Paper}>
					<Table size="small" style={{display: 'inline-table'}}>
						<TableHead><TableRow>
							<TableCell>Username</TableCell>
							<TableCell>Last Login</TableCell>
						</TableRow></TableHead>
						<TableBody>{createTable()}</TableBody>
					</Table>
				</TableContainer>
			</div>
		</div>
	)
}
