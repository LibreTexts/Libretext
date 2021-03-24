import React, {useEffect, useState} from 'react';
import {CircularProgress} from "@material-ui/core";
import {Line} from 'react-chartjs-2';
import {useSnackbar} from 'notistack';

/*
This component is receiving information from its parent through its "props"!
The file extension .jsx is for standalone React Components, compared to index.js
*/
export default function GraphResults(props) {
    const [jobReady, setJobReady] = useState(false);
    const [simulationResults, setSimulationResults] = useState();
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    useEffect(() => {
        (async function () {
            setJobReady(false);
            if (!props.jobID)
                return;
            
            let counter = 0;
            while (counter < 12) {
                counter++;
                await sleep(5000);
                
                //check if job succeeded
                let response = await fetch(`${props.API_ENDPOINT}/run/${props.jobID}`);
                if (!response.ok) {
                    continue;
                }
                response = await response.json();
                if (response.status !== "SUCCEEDED") {
                    closeSnackbar()
                    enqueueSnackbar(`${response.status} ${response.id}`, {
                        variant: 'info',
                        autoHideDuration: 5000,
                    });
                    continue;
                }
                
                //get logs
                /*response = await fetch(`https://home.miniland1333.com/proxy/logs/${props.jobID}`);
                response = await response.text();
                console.log(response);*/
                
                
                //get results
                response = await fetch(`https://home.miniland1333.com/proxy/results/${props.jobID}?sparse=false`);
                response = await response.json();
                console.log(response);
                enqueueSnackbar(`Retrieved ${response.simId}`, {
                    variant: 'success',
                });
                
                function precise(inputArray) {
                    return inputArray.map(x => Number.parseFloat(x).toPrecision(4));
                }
                
                //data parsing
                let data = response.reports[0].data;
                let lineChartData = {
                    labels: precise(data.t),
                    datasets: [],
                };
                for (const dataset in data) {
                    const r = Math.floor(Math.random() * 256);
                    const g = Math.floor(Math.random() * 256);
                    const b = Math.floor(Math.random() * 256);
                    
                    if (dataset !== 't')
                        lineChartData.datasets.push({
                            label: dataset,
                            data: precise(data[dataset]),
                            fill: false,
                            pointStyle: 'circle',
                            radius: 1,
                            borderColor: `rgba(${r},${g},${b},0.3)`,
                        });
                }
                
                setSimulationResults(lineChartData);
                console.log(lineChartData)
                setJobReady(true);
                break;
            }
        })()
    }, [props.jobID]);
    
    //prop requires a jobID to render
    if (!props.jobID)
        return null;
    else if (!jobReady)
        return <CircularProgress size={200}/>
    else {
        return <Line data={simulationResults} options={{
            scales: {
                yAxes: [{
                    type: 'linear',
                    ticks: {
                        precision: 4,
                        maxTicksLimit: 6,
                        callback: (label) => Number.parseFloat(label).toPrecision(4)
                    }
                }],
            }
        }
        }/>;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
