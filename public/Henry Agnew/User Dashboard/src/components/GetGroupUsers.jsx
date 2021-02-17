import React from 'react';
import {Table, TableBody, TableRow} from "@material-ui/core";
import TableCell from "@material-ui/core/TableCell";

const fileDownload = require('js-file-download');

export default function GetGroupUsers(props) {
    return <Table>
        <TableBody>
            <GetGroup group="Developer"/>
            <GetGroup group="BasicUser"/>
        </TableBody>
    </Table>
}

function GetGroup(props) {
    async function getUsers(filetype) {
        let data = await LibreTexts.sendAPI(`getUsers/${props.group}.${filetype}`);
        fileDownload(await data.text(), `${props.group}.${filetype}`);
    }
    
    return <TableRow>
        <TableCell>{props.group}</TableCell>
        <TableCell>
            <button onClick={() => getUsers('csv')}>Download CSV</button>
        </TableCell>
        <TableCell>
            <button onClick={() => getUsers('json')}>Download JSON</button>
        </TableCell>
    </TableRow>
    
}
