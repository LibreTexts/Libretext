import {Link, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import React, {useEffect} from "react";
import PropTypes from 'prop-types';
import {createHash} from 'crypto';


export function IconLink(props) {
    return (
        <ListItem button key={props.title} component={Link} href={props.href}
                  onClick={props.onClick}
                  rel="external nofollow"
                  target="_blank"
                  className="SidebarItem">
            <ListItemIcon className={props.icon || ""}/>
            <ListItemText primary={props.title}/>
        </ListItem>)
}
IconLink.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string,
    icon: PropTypes.string,
    onClick: PropTypes.func,
}

export function TableOfContents(props) {
    
    //create hash to use as the id
    let hash = createHash('sha256');
    hash.update(props.coverpageURL);
    hash = hash.digest('hex');
    
    
    useEffect(()=>{
        LibreTexts.TOC("https://chem.libretexts.org/Courses/Remixer_University/LibreTexts_Construction_Guide", `#${hash}`);
    },[props.coverpageURL])
    
    return (<div id={hash}/>)
}
TableOfContents.propTypes = {
    coverpageURL: PropTypes.string.isRequired,
}
