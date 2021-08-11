import {Link, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import React, {useEffect} from "react";
import PropTypes from 'prop-types';
import {createHash} from 'crypto';
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import AccordionDetails from "@material-ui/core/AccordionDetails";


export function IconLink(props) {
    return (<>
        <ListItem button key={props.title} component={Link} href={props.href}
                  onClick={props.onClick}
                  rel="external nofollow"
                  target="_blank"
                  className="SidebarItem">
            <ListItemIcon className={props.icon || ""}/>
            <ListItemText primary={props.title}/>
        
        </ListItem>
        {props.children}
    </>)
}

IconLink.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string,
    icon: PropTypes.string,
    onClick: PropTypes.func,
}

export function LibraryItem(props) {
    let URLname = 'https://chem.libretexts.org'
    if (props.subdomain == 'espanol' || props.subdomain == 'query') {
	URLname = `https://${props.subdomain}.libretexts.org/home`
    }
    else {
	URLname = `https://${props.subdomain}.libretexts.org/Bookshelves/`
    }
    return (<>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`${props.text}`}
          id={props.text}
        >
	  <ListItem button key={props.text} component={Link} href={`https://${props.subdomain}.libretexts.org`}
                  rel="external nofollow"
                  target="_blank"
                  className="SidebarItem">
            <ListItemIcon><img className="icon" alt=""
                               src={`https://libretexts.org/img/LibreTexts/glyphs_blue/${props.subdomain}.png`}/></ListItemIcon>
            <ListItemText primary={props.text}/>
        </ListItem>
        </AccordionSummary>
        <AccordionDetails>
	    <TableOfContents coverpageURL={URLname}/>
        </AccordionDetails>
      </Accordion>
	</>
    )
}

export function TableOfContents(props) {
    
    //create hash to use as the id
    let hash = createHash('sha256');
    hash.update(props.coverpageURL);
    hash = hash.digest('hex');
    
    
    useEffect(() => {
        LibreTexts.TOC(props.coverpageURL, `#${hash}`);
    }, [props.coverpageURL])
    
    return (<div id={hash}/>)
}

TableOfContents.propTypes = {
    coverpageURL: PropTypes.string.isRequired,
}
