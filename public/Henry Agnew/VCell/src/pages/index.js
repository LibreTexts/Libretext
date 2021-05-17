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

const AVOGADRO = 6.02214076E23;
//TODO fix CORS issue. Currently using a proxy
const API_ENDPOINT = `https://run.api.biosimulations.dev`;

/*
This code injects your React code into the webpage.
*/
const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);
const dataset = document.currentScript.dataset;

/*
React Hook for creating OMEX files based on user inputs and then submitting the jobs to runBioSimulations
*/
function VCellReactHook(props) {
    const [omex, setOmex] = React.useState();
    const [omexFile, setOmexFile] = React.useState(dataset.omex);
    const [species, setSpecies] = React.useState([]);
    const [jobID, setJobID] = React.useState();
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    function updateSpecies(event, key) {
        let updated = {...species[key]};
        let newValue = event.target.value * AVOGADRO;
        newValue = Math.max(0, newValue);
        
        updated.initialAmount = newValue;
        species[key] = updated;
        setSpecies(species);
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
    }
    
    //modify omex file and submit to runBioSimulations
    async function submitOmex() {
        const sbmlFile = Object.keys(omex.files).find(key => key.endsWith('.xml') && key !== 'manifest.xml');
        let sbml = await omex.file(sbmlFile).async('text');
        
        //substitute modified species values into XML
        let temp = Object.values(species).map(sp => {
            return {"_attributes": sp};
        });
        temp = convert.js2xml({listOfSpecies: {species: temp}}, {compact: true, spaces: 2});
        console.log(temp);
        sbml = sbml.replace(/<listOfSpecies>[\s\S]*?<\/listOfSpecies>/, temp);
        // console.log(sbml);
        await omex.file(sbmlFile, sbml);
        setOmex(omex);
        // return;
        
        //send data to runBioSimulations API
        const formData = new FormData();
        const name = `LT-${Math.round(Math.random() * 1E10)}`; //-${omexFile.match(/(?<=\/)[^\/]*?\.omex/)?.[0] || 'test.omex'}
        // console.log(filename);
        const runMetadata = {"name": name, "email": null, "simulator": "vcell", "simulatorVersion": "7.3.0.07"};
        formData.append('file', await omex.generateAsync({type: 'blob'}), 'test.omex');
        formData.append('simulationRun', JSON.stringify(runMetadata));
        
        let response = await fetch(`${API_ENDPOINT}/run`, {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            response = await response.json();
            enqueueSnackbar(`Job ${response.id} successfully submitted!`, {
                variant: 'success',
            });
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
    
    //primary render method
    //TODO: Make flex more mobile-friendly
    return (
        <div id="biosimulation-render-container" style={{display: 'flex'}}>
            <div style={{flex: 1}}>
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
                {!dataset.omex ? <Button onClick={loadOmex} variant="contained">
                    Load File
                </Button> : null}
                <Button onClick={submitOmex} variant="contained" color="primary">Submit OMEX</Button>
            </div>
            <div style={{flex: 2}}>
                <GraphResults jobID={jobID} API_ENDPOINT={API_ENDPOINT} />
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
        {/*TODO: make units flexible*/}
        <TableCell>moles per liter</TableCell>
    </TableRow>;
}


ReactDOM.render(<SnackbarProvider anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
}}><VCellReactHook/></SnackbarProvider>, target);
