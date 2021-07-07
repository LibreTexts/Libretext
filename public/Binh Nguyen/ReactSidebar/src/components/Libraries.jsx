import React from 'react';
import {Link, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";

export default function Libraries(props) {
    return (
        <List>
            {Object.entries(LibreTexts.libraries).map((entry, index) => (
                <LibraryItem key={entry[1]} text={entry[0]} subdomain={entry[1]}/>
            ))}
        </List>
    );
}

function LibraryItem(props) {
    return (
        <ListItem button key={props.text} component={Link} href={`https://${props.subdomain}.libretexts.org`}
                  rel="external nofollow"
                  target="_blank"
                  className="SidebarItem">
            <ListItemIcon><img className="icon" alt=""
                               src={`https://libretexts.org/img/LibreTexts/glyphs_blue/${props.subdomain}.png`}/></ListItemIcon>
            <ListItemText primary={props.text}/>
        </ListItem>)
}
