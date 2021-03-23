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
import SubComponent from "../components/SubComponent.jsx";

const AVOGADRO = 6.02214076E23;

/*
This code injects your React code into the webpage.
*/
const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

/*
React Hook for creating OMEX files based on user inputs and then submitting the jobs to runBioSimulations
*/
function VCellReactHook(props) {
    const [omex, setOmex] = React.useState();
    const [omexFile, setomexFile] = React.useState('https://chem.libretexts.org/@api/deki/files/364064/test.omex?origin=mt-web');
    const [species, setSpecies] = React.useState([]);
    const [jobID, setJobID] = React.useState();
    
    function updateSpecies(event, key) {
        let updated = {...species[key]};
        let newValue = event.target.value * AVOGADRO;
        newValue = Math.max(0, newValue);
        
        updated.initialAmount = newValue;
        species[key] = updated;
        setSpecies(species);
    }
    
    async function createOmex() {
        const sbmlFile = Object.keys(omex.files).find(key => key.endsWith('.xml') && key !== 'manifest.xml');
        let sbml = await omex.file(sbmlFile).async('text');
        // sbml = convert.xml2js(sbml, {compact: false});
        
        //TODO get this to work in non-compact mode
        //add back _attributes nested key
        let temp = Object.values(species).map(sp => {
            return {"_attributes": sp};
        });
        temp = convert.js2xml({listOfSpecies: {species: temp}}, {compact: true, spaces: 2});
        
        // sbml = convert.js2xml(sbml, {compact: false});
        console.log(temp);
        sbml.replace(/<listOfSpecies>[\s\S].*?<\/listOfSpecies>/, temp);
        
        await omex.file(sbmlFile, sbml);
        setOmex(omex);
        // return;
        
        //send data to runBioSimulations API
        const formData = new FormData();
        const runMetadata = {"name": "hello", "email": null, "simulator": "vcell", "simulatorVersion": "7.3.0.07"};
        formData.append('file', await omex.generateAsync({type: 'blob'}), 'test.omex');
        formData.append('simulationRun', JSON.stringify(runMetadata));
        
        let response = await fetch(`https://home.miniland1333.com/proxy/run`, {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            response = await response.json();
            alert(`Job ${response.id} successfully submitted!`);
            setJobID(response.id);
        }
        else {
            response = await response.json();
            alert(`Error encountered: ${JSON.stringify(response)}`);
        }
        console.log(response);
    }
    
    //primary render method
    return (<React.Fragment>
            <button onClick={async () => {
                prompt('Enter the url to your OMEX file', omexFile);
                let zip = await LibreTexts.authenticatedFetch(omexFile);
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
                sbml.sbml.model.listOfSpecies.species.forEach(specie => speciesObject[specie['_attributes'].id] = specie['_attributes']);
                setSpecies(speciesObject);
            }}>
                Load File
            </button>
            <button onClick={createOmex}>Create OMEX</button>
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
            <SubComponent jobID={jobID}/>
        </React.Fragment>
    );
}

// *6.022E23*1E6

function SpeciesRow(props) {
    if (!props?.specie?.initialAmount)
        return null;
    
    return <TableRow key={props.specie.id}>
        <TableCell scope="row">
            {props.specie.id}
        </TableCell>
        <TableCell>
            <TextField type="number"
                       variant="filled"
                       defaultValue={props.specie.initialAmount / AVOGADRO}
                       onChange={(e) => props.onChange(e, props.specie.id)}
            />
        </TableCell>
        {/*<TableCell>{props.specie.substanceUnits}</TableCell>*/}
        <TableCell>moles per liter</TableCell>
    </TableRow>;
}


ReactDOM.render(<VCellReactHook/>, target);
