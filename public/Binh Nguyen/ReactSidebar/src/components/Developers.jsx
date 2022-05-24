import React from 'react';
import {Button, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {IconLink, LibraryItem, TableOfContents} from "./Common.jsx";
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {saveAs} from 'file-saver';

export default function Developers(props) {
    let tags = document.getElementById('pageTagsHolder').innerText;
    const allowMatter = tags.includes('coverpage:yes') || tags.includes('coverpage:toc');
    
    return (<List>
	 
	    <Accordion className="SidebarItem">
		<AccordionSummary
		    expandIcon={<ExpandMoreIcon/>}
		    aria-controls="panel1a-content"
		>
		    <ListItemLink href="https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide" target="_blank">
			<ListItemIcon className="mt-icon-site-tools"></ListItemIcon>
			<ListItemText primary="Construction Guide"/>
		    </ListItemLink>
		</AccordionSummary>
		<AccordionDetails>
		    <TableOfContents
			coverpageURL={"https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide"}/>
		</AccordionDetails>
	    </Accordion>

	    
            <IconLink title="Get Text Cover" icon="mt-icon-book" onClick={() => {
                cover(window.location.href)
            }}/>
            <IconLink title="Reveal Answers" icon="mt-icon-eye3" onClick={() => {
                $('dd').show();
            }}/>
            <IconLink title="Reset Page Order" icon="mt-icon-shuffle" onClick={() => {
                LibreTexts.authenticatedFetch(null, 'unorder', null, {method: 'PUT'});
                window.location.reload();
            }}/>
            <IconLink title="Get PageIDs" icon="mt-icon-flow-cascade" onClick={() => {
                LibreTexts.getSubpages().then(data => {
                    data = JSON.stringify(data).match(/"id":"\d+"/g);
                    if (data) {
                        data = data.map(e => e.match(/"id":"(\d+)"/)[1]);
                    }
                    else {
                        data = [document.getElementById("IDHolder")?.innerText];
                    }
                    let [subdomain] = LibreTexts.parseURL();
                    data = data.map(e => subdomain + "-" + e);
                    navigator.clipboard.writeText(data.join(", "))
                    console.log(data.join(", "));
                    alert("Copied pageIDs to the clipboard");
                })
            }}/>
	    <IconLink title="Generate MassTagger CSV" icon="mt-icon-csv" onClick={async ()=>{
                let response = await LibreTexts.getSubpages();
                let pages = addLinks(response);
                function addLinks(current) {
                    let array = [current];
                    if (current?.children?.length) {
                        current.children.forEach((child) => {
                            if (child.title === 'Front Matter' || child.title === 'Back Matter')
                                return;
                            array = array.concat(addLinks(child));
                        });
                    }
                    return array;
                }
                pages = pages.map(e=>`"${e.title}",${e.id}`);
                pages.unshift('Page title, Page ID, Page tag(s)');
                let [subdomain] = LibreTexts.parseURL();
                saveAs(new Blob([pages.join('\n')],{type:"text/csv;charset=utf-8"}),`masstagger-${subdomain}-${response.id}.csv`);
            }}/>
            {allowMatter ? <IconLink title="Generate Front/Back Matter" icon="mt-icon-book2" onClick={() => {
                batch(window.location.href, '&createMatterOnly=true');
            }}/> : null}
            <IconLink title="Construction Forum" icon="mt-icon-archive"
                      href="https://groups.io/g/Libretexts-ConstructionForum"/>
            
            <IconLink title="Jupyter Hub" icon="fas fa-square-root-alt" href="https://jupyter.libretexts.org/hub/login"/>

            <IconLink title="RealTime Mathjax" icon="fas fa-square-root-alt"
                      href="https://chem.libretexts.org/Under_Construction/Development_Details/Misc_Pages/Realtime_MathJax"/>

	    <Button id="referenceModalBtn" onClick={(event) => {
		document.getElementById("referenceModal").style.display = "block"
	    }}>Reference Manager</Button>
        </List>
    );
}

function ListItemLink(props) {
  return <ListItem button component="a" {...props} />;
}
