import React from 'react';
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import { TableOfContents } from "./Common.jsx";
import IframeResizer from "iframe-resizer-react";

export default function Resources(props) {
    const [expanded, setExpanded] = React.useState('panel1');

    const handleChange = (panel) => (_e, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    let [subdomain] = LibreTexts.parseURL();
    switch (subdomain) {
        case "bio":
            return (
                <>
                    <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Reference Tables</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableOfContents
                                coverpageURL="https://bio.libretexts.org/Learning_Objects/Reference" />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Physical Constants</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://bio.libretexts.org/Learning_Objects/Reference/Physical_Constants_and_Conversion_of_Units?adaptView"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                </>
            );
        case "chem":
            return (
                <>
                    <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Periodic Table</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <IframeResizer
                                src="https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=table&embed=true&hide_all_headings=true"
                                loading="lazy"
                                alt="The Periodic Table of the Elements showing all elements with their chemical symbols, atomic weight, and atomic number.">
                            </IframeResizer>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Reference Tables</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableOfContents
                                coverpageURL="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference" />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Physical Constants</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions/Physical_Constants?adaptView"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Scientific Calculator</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://www.desmos.com/scientific"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                </>
            );
        case 'stats':
            return (
                <>
                    <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Interactive Calculators</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://stats.libretexts.org/Learning_Objects/02%3A_Interactive_Statistics/46%3A__Links_to_the_Calculators?adaptView"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                </>
            );
        default:
            return (
                <>
                    <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Physical Constants</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://chem.libretexts.org/Bookshelves/Ancillary_Materials/Reference/Units_and_Conversions/Physical_Constants?adaptView"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                        >
                            <Typography>Scientific Calculator</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <iframe
                                src="https://www.desmos.com/scientific"
                                loading="lazy" />
                        </AccordionDetails>
                    </Accordion>
                </>
            );
    }


}

function ConversionCalculator(props) {
    return (
        <div style={{ display: 'none' }} id=" conversion_table_put" className=" converter-wrapper">
            <form name=" property_form">
                <span>
                    <select className=" select-property" name=" the_menu" size={1}
                        onchange=" CONVERSION_CALCULATOR.UpdateUnitMenu
                        (this, document.form_A.unit_menu); CONVERSION_CALCULATOR.UpdateUnitMenu(this, document.form_B.unit_menu)">
                    </select>
                </span>
            </form>
            <div className="converter-side-a">
                <form name="form_A" onsubmit="return false">
                    <input type="text" className="numbersonly" name="unit_input" maxLength={20} defaultValue={0}
                        onkeyup="CONVERSION_CALCULATOR.CalculateUnit(document.form_A, document.form_B)" />
                    <span>
                        <select name="unit_menu"
                            onchange="CONVERSION_CALCULATOR.CalculateUnit(document.form_B, document.form_A)">
                        </select>
                    </span>
                </form>
            </div>
            {/* /converter-side-a */}
            <div className="converter-equals">
                <p>=</p>
            </div>
            {/* /converter-side-a */}
            <div className="converter-side-b">
                <form name="form_B" onsubmit="return false">
                    <input type="text" className="numbersonly" name="unit_input" maxLength={20} defaultValue={0}
                        onkeyup="CONVERSION_CALCULATOR.CalculateUnit(document.form_B, document.form_A)" />
                    <span>
                        <select name="unit_menu"
                            onchange="CONVERSION_CALCULATOR.CalculateUnit(document.form_A, document.form_B)">
                        </select>
                    </span>
                </form>
            </div>
            {/* /converter-side-b */}
        </div>)
}
