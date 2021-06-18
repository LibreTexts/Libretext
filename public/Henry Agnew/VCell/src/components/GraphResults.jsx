import React, {useEffect, useState} from 'react';
import {CircularProgress} from "@material-ui/core";
import {Line} from 'react-chartjs-2';
import {useSnackbar} from 'notistack';
import Button from "@material-ui/core/Button";
import fileDownload from 'js-file-download';
/*
This component is receiving information from its parent through its "props"!
The file extension .jsx is for standalone React Components, compared to index.js
*/
export default function GraphResults(props) {
    const [jobReady, setJobReady] = useState(false);
    const [simulationResults, setSimulationResults] = useState();
    const [resultsOBJ, setResultsOBJ] = useState({});
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
                if (response.status === "FAILED") {
                    closeSnackbar()
                    enqueueSnackbar(`${response.status} ${response.id}`, {
                        variant: 'error',
                        autoHideDuration: 5000,
                    });
                    return;
                }
                else if (response.status !== "SUCCEEDED") {
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
                response = await fetch(`${props.API_ENDPOINT}/results/${props.jobID}?includeData=false`);
                response = await response.json();
                console.log(response);
                enqueueSnackbar(`Retrieved ${response.simId}`, {
                    variant: 'success',
                });
                
                function precise(inputArray) {
                    return inputArray.map(x => Number.parseFloat(x).toPrecision(4));
                }
                
                //data parsing
                let data = response.outputs[0].data;
                let dataObj = {};
                for (let series of data) {
                    dataObj[series.label] = series;
                }
                setResultsOBJ(data);
                
                let lineChartData = {
                    labels: precise(dataObj.t.values),
                    datasets: [],
                };
                for (const dataset of data) {
                    const r = Math.floor(Math.random() * 256);
                    const g = Math.floor(Math.random() * 256);
                    const b = Math.floor(Math.random() * 256);
                    
                    if (dataset.label !== 't')
                        lineChartData.datasets.push({
                            label: dataset.label,
                            data: precise(dataset.values),
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
    
    function downloadData() {
        let data = resultsOBJ.map(label => label.label) + '\n';
        for (let index in resultsOBJ[0].values) {
            data += resultsOBJ.map(label => label.values[index]) + '\n'
        }
        
        fileDownload(data, 'simulation_data.csv')
    }
    
    //requires a jobID to render
    if (!props.jobID)
        return null;
    else if (!jobReady) //waiting for job to process
        return <CircularProgress size={200}/>
    else { //plot results
        return <><Line data={simulationResults} options={{
            scales: {
                xAxes: [{
                    labelString: 'time (seconds)',
                    ticks: {
                        stepSize: 1,
                        precision: 2,
                        maxTicksLimit: 10,
                        // callback: (label) => Number.parseFloat(label).toPrecision(2)
                    }
                }],
                yAxes: [{
                    id: 'y-axis-0',
                    type: 'linear',
                    ticks: {
                        precision: 3,
                        maxTicksLimit: 6,
                        callback: (label) => Number.parseFloat(label).toPrecision(4)
                    }
                }],
            }
        }
        }/>
            <Button onClick={downloadData} variant="contained">Download CSV</Button>
        </>;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
