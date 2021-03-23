import React, { useState, useEffect } from 'react';
import {CircularProgress} from "@material-ui/core";

/*
This component is receiving information from its parent through its "props"!
The file extension .jsx is for standalone React Components, compared to index.js
*/
export default function SubComponent(props) {
    const [jobReady, setJobReady] = useState(false);
    
    useEffect(() => {
        (async function(){
            setJobReady(false);
            if (!props.jobID)
                return;
    
            let counter = 0;
            while (counter < 12) {
                counter++;
                await sleep(5000);
        
                //check if job succeeded
                let response = await fetch(`https://home.miniland1333.com/proxy/run/${props.jobID}`);
                if (!response.ok) {
                    continue;
                }
                response = await response.json();
                if (response.status !== "SUCCEEDED")
                    continue;
        
                //get logs
                /*response = await fetch(`https://home.miniland1333.com/proxy/logs/${props.jobID}`);
                response = await response.text();
                console.log(response);*/
                
                
                //get results
                response = await fetch(`https://home.miniland1333.com/proxy/results/${props.jobID}?sparse=false`);
                response = await response.json();
                console.log(response);
                alert(`Retrieved ${props.jobID}`);
                setJobReady(true);
                break;
            }
        })()
    }, [props.jobID]);
    
    //prop requires a jobID to render
    if (!props.jobID)
        return null;
    else if (!jobReady)
        return <CircularProgress size={300}/>
    else
        return (
            <div className='subComponent'>
                <h2>I'm a subcomponent! I am being passed parts of my parent's state using props!</h2>
                <h3>Number of Clicks: {props.number}</h3>
            </div>
        );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
