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
            else if (props.jobID.startsWith("QUICK")) {
                if (props.quickData)
                    await plotData(); //quick already has data retrieved, so we can use it immediately
                return;
            }
            
            let counter = 0;
            while (counter < 60) { //loop while simulation is processing
                counter++;
                if (!props.prevJob) //check immediately if using cached job
                    await sleep(5000);
                
                //check if job succeeded
                let response = await fetch(`${props.API_ENDPOINT}/runs/${props.jobID}`);
                if (!response.ok) {
                    continue;
                }
                response = await response.json();
                if (response.status === "SUCCEEDED") {
                    await plotData();
                    return;
                }
                else if (response.status === "FAILED") {
                    closeSnackbar()
                    enqueueSnackbar(`${response.status} ${response.id}`, {
                        variant: 'error',
                        autoHideDuration: 5000,
                    });
                    return;
                    // TODO: Have application reset when this error is thrown
                }
                else if (response.status !== "SUCCEEDED") {
                    closeSnackbar()
                    enqueueSnackbar(`${response.status} ${response.id}`, {
                        autoHideDuration: 5000,
                    });
                    continue;
                }
            }
            // simulation timed out
            closeSnackbar()
            enqueueSnackbar(`$TIMEOUT ERROR ${response.id}`, {
                variant: 'error',
                autoHideDuration: 5000,
            });
            // TODO: Have application reset when this error is thrown
            
        })()
    }, [props.jobID]);
    
    //export data in CSV format for user download
    function downloadData() {
        let data = resultsOBJ.map(label => label.label) + '\n';
        for (let index in resultsOBJ[0].values) {
            data += resultsOBJ.map(label => label.values[index]) + '\n'
        }
        
        fileDownload(data, 'simulation_data.csv')
    }
    
    async function plotData() {
        let response;
        
        //get results
        if (props.jobID.startsWith("QUICK")) { //data is passed through a prop for quick simulations
            response = props.quickData;
        }
        else {
            //need to fetch the data for slow simulations
            response = await fetch(`${props.API_ENDPOINT}/results/${props.jobID}?includeData=true`);
            response = await response.json();
            console.log(response);
            enqueueSnackbar(`Retrieved ${response.simId}`, {
                variant: 'success',
            });
        }
        
        //data parsing
        let data = response.outputs[0].data;
        let dataObj = {};
        for (let series of data) {
            dataObj[series.label] = series;
        }
        setResultsOBJ(data);
        
        const time_label = "time_tsk_0_0";
        
        let lineChartData = {
            labels: dataObj[time_label].values,
            datasets: [],
        };
        for (const dataset of data) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            
            if (dataset.label !== time_label)
                lineChartData.datasets.push({
                    label: dataset.label.replace("dataGen_tsk_0_0_", ""),
                    data: dataset.values,
                    fill: false,
                    pointStyle: 'circle',
                    radius: 1,
                    borderColor: `rgba(${r},${g},${b},0.3)`,
                });
        }
        
        setSimulationResults(lineChartData);
        console.log(lineChartData)
        setJobReady(true);
    }
    
    //requires a jobID to render
    if (!props.jobID)
        return null;
    else if (!jobReady) //waiting for job to process
        return <><p>Job ID: {props.jobID}</p><CircularProgress size={200}/></>
    else { //plot results
        return <>
            <p>Job ID: {props.jobID}</p>
            <Line data={simulationResults} options={{
                animation: false,
                parsing: false,
                plugins: {
                    decimation: { //TODO: Fix decimation as it is not working
                        enabled: true,
                        algorithm: "lttb",
                        samples: 100,
                        threshold: 100,
                    }
                },
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        label: function (tooltipItems, data) {
                            return tooltipItems.yLabel.toExponential(4);
                        }
                    }
                },
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

// sleep promise
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
