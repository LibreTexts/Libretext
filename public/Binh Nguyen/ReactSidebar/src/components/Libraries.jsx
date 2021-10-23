import React from 'react';
import {Link, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {LibraryItem} from "./Common.jsx";
import {TableOfContents} from "./Common.jsx";
import PropTypes from "prop-types";

export default function Libraries(props) {
    return (
	<List>
	{/*
	{Object.entries(LibreTexts.libraries).map((entry, index) => (
		<LibraryItem key={entry[1]} text={entry[0]} subdomain={entry[1]}/>
	    ))}
	*/}
	
	    <LibraryItem key="bio" text="Biology" subdomain="bio"/>
	    <LibraryItem key="biz" text="Business" subdomain="biz"/>
	    <LibraryItem key="chem" text="Chemistry" subdomain="chem"/>
	    <LibraryItem key="eng" text="Engineering" subdomain="eng"/>
	    <LibraryItem key="espanol" text="Espanol" subdomain="espanol"/>
	    <LibraryItem key="geo" text="Geosciences" subdomain="geo"/>
	    <LibraryItem key="human" text="Humanities" subdomain="human"/>
	    <LibraryItem key="k12" text="K12 Education" subdomain="k12"/>
	    <LibraryItem key="math" text="Mathematics" subdomain="math"/>
	    <LibraryItem key="med" text="Medicine" subdomain="med"/>
	    <LibraryItem key="phys" text="Physics" subdomain="phys"/>
	    <LibraryItem key="socialsci" text="Social Sciences" subdomain="socialsci"/>
	    <LibraryItem key="stats" text="Statistics" subdomain="stats"/>
	    <LibraryItem key="workforce" text="Workforce" subdomain="workforce"/>
	</List>
    );

}

