import React from 'react';
const fileDownload = require('js-file-download');

export default function GetGroupUsers(props){
    
    async function getUsers(groupname, filetype) {
        let data = await LibreTexts.sendAPI(`getUsers/${groupname}.${filetype}`);
        fileDownload(await data.text(), `${groupname}.${filetype}`);
    }
    return <>
        <button onClick={()=>getUsers('Developer','csv')}>Download Developer</button>
        <button onClick={()=>getUsers('BasicUser','csv')}>Download BasicUser</button>
    </>
}
