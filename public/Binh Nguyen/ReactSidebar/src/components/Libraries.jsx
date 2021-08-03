import React from 'react';
import {Link, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {LibraryItem} from "./Common.jsx";

export default function Libraries(props) {
    return (
        <List>
            {Object.entries(LibreTexts.libraries).map((entry, index) => (
                <LibraryItem key={entry[1]} text={entry[0]} subdomain={entry[1]}/>
            ))}
        </List>
    );
}
