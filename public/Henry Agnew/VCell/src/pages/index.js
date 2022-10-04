import React from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import convert from 'xml-js';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import GraphResults from "../components/GraphResults.jsx";
import Button from "@material-ui/core/Button";
import {SnackbarProvider, useSnackbar} from 'notistack';
import {Accordion, AccordionDetails, AccordionSummary, Tooltip} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";


/*
This code injects your React code into the webpage.
*/
const target = document.createElement("div");
target.id = String(Math.random() * 100);
document.currentScript.parentNode.insertBefore(target, document.currentScript);
const dataset = document.currentScript.dataset;


const AVOGADRO = 6.02214076E23;
const SLOW_API_ENDPOINT = `https://api.biosimulations.org`;
const QUICK_API_ENDPOINT = `https://combine.api.biosimulations.dev`; // eventually replace .dev with .org once endpoint is publicly released
const isQuick = Boolean(dataset.quick);
const API_ENDPOINT = isQuick ? QUICK_API_ENDPOINT : SLOW_API_ENDPOINT; //currently defaults to slow
const simulator = dataset.simulator || "vcell";

let prevjobid = undefined;
if (!isQuick) { // only allowed for slow jobs
    prevjobid = dataset.prevjobid?.trim() || undefined
}

/*
React Hook for creating OMEX files based on user inputs and then submitting the jobs to runBioSimulations
*/
function VCellReactHook(props) {
    const [omex, setOmex] = React.useState();
    const [omexFile, setOmexFile] = React.useState(dataset.omex);
    const [species, setSpecies] = React.useState([]);
    const [jobID, setJobID] = React.useState(prevjobid);
    const [prevJob, clearPrevJob] = React.useState(Boolean(prevjobid));
    const [quickData, setQuickData] = React.useState();
    const [parameters, setParameters] = React.useState([]);
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    function updateSpecies(event, key) { //updates a species concentration based on user input
        let updated = {...species[key]};
        let newValue = event.target.value * AVOGADRO;
        newValue = Math.max(0, newValue); //species amounts must be non-negative
        
        updated.initialAmount = newValue;
        species[key] = updated;
        setSpecies(species);
    }
    
    function updateParameter(event, key) { //updates a parameter based on user input
        let updated = {...parameters[key]};
        
        //TODO: Maybe add parameter validation?
        updated.value = event.target.value;
        parameters[key] = updated;
        setParameters(parameters);
    }
    
    React.useEffect(() => {
        if (dataset.omex) //auto-initialize if data-omex specified
            loadOmex()
    }, [])
    
    //load omex file for editing
    async function loadOmex() {
        let file = omexFile;
        if (!dataset.omex) {
            file = prompt('Enter the url to your OMEX file', file);
            setOmexFile(file);
        }
        
        let zip;
        try {
            if (file.includes('libretexts.org/@api/deki/files/'))
                //LibreTexts-specific file fetching
                zip = await LibreTexts.authenticatedFetch(file);
            else
                zip = await fetch(file);
        } catch (err) {
            enqueueSnackbar(`Could not get file ${file}`, {variant: "error"});
            return;
        }
        
        zip = await zip.arrayBuffer();
        zip = await JSZip.loadAsync(zip);
        setOmex(zip);
        let sbml = Object.keys(zip.files).find(key => key.endsWith('.xml') && key !== 'manifest.xml');
        sbml = await zip.file(sbml).async('text');
        sbml = convert.xml2js(sbml, {compact: true});
        console.log(sbml);
        
        //extract species from listOfSpecies
        //allows script to modify these values
        const speciesObject = {};
        sbml.sbml.model.listOfSpecies.species.forEach(specie => {
            speciesObject[specie['_attributes'].id] = specie['_attributes'];
        });
        setSpecies(speciesObject);
        //extract parameters so they can also be user-modified
        const parametersObject = {};
        sbml.sbml.model.listOfParameters.parameter.forEach(parameter => {
            parametersObject[parameter['_attributes'].id] = parameter['_attributes'];
        });
        setParameters(parametersObject);
    }
    
    //modify omex file and submit to runBioSimulations
    async function submitOmex() {
        if (!omex) {
            loadOmex();
            return false;
        }
        const sbmlFile = Object.keys(omex.files).find(key => key.endsWith('.xml') && key !== 'manifest.xml');
        let sbml = await omex.file(sbmlFile).async('text');
        
        //substitute modified species values into XML
        let temp = Object.values(species).map(sp => {
            return {"_attributes": sp};
        });
        temp = convert.js2xml({listOfSpecies: {species: temp}}, {compact: true, spaces: 2});
        console.log(temp);
        sbml = sbml.replace(/<listOfSpecies>[\s\S]*?<\/listOfSpecies>/, temp);
        
        temp = Object.values(parameters).map(sp => {
            return {"_attributes": sp};
        });
        temp = convert.js2xml({listOfParameters: {parameter: temp}}, {compact: true, spaces: 2});
        console.log(temp);
        sbml = sbml.replace(/<listOfParameters>[\s\S]*?<\/listOfParameters>/, temp);
        // console.log(sbml);
        await omex.file(sbmlFile, sbml);
        setOmex(omex);
        // return;
        
        //send data to runBioSimulations API
        const formData = new FormData();
        const name = `LT-${Math.round(Math.random() * 1E10)}`; //-${omexFile.match(/(?<=\/)[^\/]*?\.omex/)?.[0] || 'test.omex'}
        
        if (!isQuick) { // default to slow simulation handling
            // console.log(filename);
            const runMetadata = {"name": name, "email": null, "simulator": simulator, "simulatorVersion": "latest"};
            formData.append('file', await omex.generateAsync({type: 'blob'}), 'test.omex');
            formData.append('simulationRun', JSON.stringify(runMetadata));
            
            //start the simulation
            closeSnackbar()
            let response = await fetch(`${API_ENDPOINT}/runs`, {
                method: 'POST',
                body: formData
            });
            //simulation will continue processing in the background. <GraphResults> will listen for completion
            if (response.ok) {
                response = await response.json();
                enqueueSnackbar(`Job ${response.id} successfully submitted!`, {
                    variant: 'info',
                });
                clearPrevJob(undefined);
                setQuickData(undefined);
                console.log(`JOB ID: ${response.id}`);
                setJobID(response.id);
            }
            else {
                response = await response.json();
                enqueueSnackbar(`Error encountered: ${JSON.stringify(response)}`, {
                    variant: 'error',
                });
            }
            console.log(response);
        }
        else {
            formData.append('simulator', "tellurium"); //TODO: replace tellurium with variable
            formData.append('_type', "SimulationRun");
            // formData.append('archiveUrl', "https://bio.libretexts.org/@api/deki/files/38382/test.omex");
            formData.append('archiveFile', await omex.generateAsync({type: 'blob'}), 'test.omex');
            formData.append('archiveFile', '');
            formData.append('environment', JSON.stringify({
                "_type": "Environment",
                "variables": []
            }))
            
            //submit simulation
            let quickResponse = fetch(`${API_ENDPOINT}/run/run`, {
                method: 'POST',
                body: formData,
                "headers": {
                    "accept": "application/json",
                },
            });
            const submittedId = enqueueSnackbar(`QUICK simulation successfully submitted!`, {
                variant: 'info'
            });
            
            quickResponse = await quickResponse // wait for it to finish
            closeSnackbar(submittedId)
            if (quickResponse.ok) {
                quickResponse = await quickResponse.json(); //results will be in this json
                if (quickResponse.log.status === "SUCCEEDED") {
                    enqueueSnackbar(`QUICK plot`, {
                        variant: 'success',
                    });
                }
                else {
                    enqueueSnackbar(`${quickResponse.log.exception.type}: ${quickResponse.log.exception.message}`, {
                        variant: 'error',
                    });
                    console.error(quickResponse.log.exception.message)
                }
                clearPrevJob(undefined);
                setQuickData(quickResponse); //TODO: Think of a better way to pass data to the Graph subcomponent
                setJobID(`QUICK-${Math.round(Math.random() * 1E10)}`);
            }
            else {
                quickResponse = await quickResponse.json();
                enqueueSnackbar(`Error encountered: ${JSON.stringify(quickResponse)}`, {
                    variant: 'error',
                });
            }
            console.log(quickResponse);
        }
    }
    
    //primary render method
    //TODO: Make flex more mobile-friendly
    //TODO: add attributions for VCell and run.biosimulators.org
    return (
        <div id="biosimulation-render-container" style={{display: 'flex'}}>
            <div style={{flex: 2}}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >Species conditions
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Species</TableCell>
                                        <TableCell>Initial Conditions</TableCell>
                                        <TableCell>Units</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(species).map(([key, value]) => <SpeciesRow key={key} specie={value}
                                                                                               onChange={updateSpecies}/>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >Parameters
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Parameter</TableCell>
                                        <TableCell>Value</TableCell>
                                        <TableCell>Units</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(parameters).map(([key, value]) => <ParameterRow key={key}
                                                                                                    parameter={value}
                                                                                                    onChange={updateParameter}/>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
                
                {!dataset.omex ? <Button onClick={loadOmex} variant="contained">
                    Load File
                </Button> : null}
                <Button onClick={submitOmex} variant="contained" color="primary">Submit OMEX</Button>
                <Tooltip title={`Version ${new Date("REPLACEWITHDATE")}. Coded with ❤`}>
                    <p>Simulation ran using {isQuick ? <><a target='_blank' href='https://vcell.org/'>VCell</a> & <a
                        target='_blank' href='https://tellurium.analogmachine.org/'>Tellurium</a></> : simulator} and
                       powered by <a target="_blank"
                                     href="https://run.biosimulations.org">https://run.biosimulations.org</a>
                    </p></Tooltip>
            </div>
            <div style={{flex: 2}}>
                <GraphResults jobID={jobID} API_ENDPOINT={API_ENDPOINT} prevJob={prevJob} quickData={quickData}/>
            </div>
        </div>
    );
}

//each Specie gets a SpeciesRow so its initialAmount can be user-modified
function SpeciesRow(props) {
    if (props?.specie?.initialAmount === undefined)
        return null;
    
    return <TableRow key={props.specie.id}>
        <TableCell scope="row">
            {props.specie.id}
        </TableCell>
        <TableCell>
            <TextField type="number"
                       variant="filled"
                       defaultValue={(props.specie.initialAmount / AVOGADRO).toPrecision(4)}
                       onChange={(e) => props.onChange(e, props.specie.id)}
            />
        </TableCell>
        {/*<TableCell>{props.specie.substanceUnits}</TableCell>*/}
        {/*TODO: make units flexible. Waiting on VCell 7.5.0*/}
        <TableCell>moles per liter</TableCell>
    </TableRow>;
}

//each Specie gets a SpeciesRow so its initialAmount can be user-modified
function ParameterRow(props) {
    if (props?.parameter?.value === undefined)
        return null;
    
    return <TableRow key={props.parameter.id}>
        <TableCell scope="row">
            {props.parameter.id}
        </TableCell>
        <TableCell>
            <TextField type="number"
                       variant="filled"
                       defaultValue={(props.parameter.value)}
                       onChange={(e) => props.onChange(e, props.parameter.id)}
            />
        </TableCell>
        {/*TODO: make units flexible. Waiting on VCell 7.5.0*/}
        <TableCell>{props.parameter.units}</TableCell>
    </TableRow>;
}


ReactDOM.render(<SnackbarProvider anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
}}><VCellReactHook/></SnackbarProvider>, target);
