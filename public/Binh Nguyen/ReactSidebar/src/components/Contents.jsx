import React from 'react';
import {TableOfContents} from "./Common.jsx";
import PropTypes from "prop-types";
import {List} from "@material-ui/core";

export default function Contents(props) {
    return (<List style={{padding:8}}>
        <TableOfContents coverpageURL={''}/>
    </List>);
}
