/*
This code imports external libraries so that React can use them!
These pieces are code are then bundled into your application during the compilation process.
Always place your imports at the top of files!
*/
import React, {useState} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import ReactDOM from 'react-dom';
import {Button, Divider, IconButton, SwipeableDrawer,} from "@material-ui/core";
import Libraries from "../components/Libraries.jsx";
import Community from "../components/Community.jsx";
import Developers from "../components/Developers.jsx";
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';


/*
This code injects your React code into the webpage.
*/
const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


const useStyles = makeStyles({
    list: {
        width: 400,
        overflowY: "auto",
        maxWidth: "90vw",
    },
});

/*
This is your React Hook.
Your top-level logic should go here, but other parts should be handled by sub-components.
*/
function Sidebar(props) {
    const [openPanel, setOpenPanel] = useState();
    
    const classes = useStyles();
    
    const toggleDrawer = (anchor) => (event) => {
        if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setOpenPanel(anchor);
    };
    
    const list = () => {
        let currentPanel;
        switch (openPanel) {
            case "library":
                currentPanel = <Libraries/>;
                break;
            case "community":
                currentPanel = <Community/>;
                break;
            case "developers":
                currentPanel = <Developers/>;
                break;
        }
        
        return <div
            className={clsx(classes.list)}
            role="presentation"
            // onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            {currentPanel}
        </div>
    };
    
    return (<React.Fragment>
            <div>
                {['library', 'community', 'developers'].map((anchor) => (
                    <React.Fragment key={anchor}>
                        <Button onClick={toggleDrawer(anchor)}>{anchor}</Button>
                    </React.Fragment>
                ))}
                <SwipeableDrawer
                    id="LibreTextsSidebar"
                    anchor={'left'}
                    open={Boolean(openPanel)}
                    onClose={toggleDrawer(false)}
                    disableSwipeToOpen={true}
                    onOpen={() => {
                    }}>
                    <div className={classes.drawerHeader}>
                        <IconButton onClick={toggleDrawer(false)}>
                            {openPanel}
                            <ChevronLeftIcon/>
                        </IconButton>
                    </div>
                    <Divider/>
                    {list()}
                </SwipeableDrawer>
            </div>
        </React.Fragment>
    );
}

if (localStorage.getItem("beeline") === null || localStorage.getItem("beeline") === "null") {
    localStorage.setItem("beeline", "off");
}
window.addEventListener("load", () => {
    if (Sidebar && !LibreTexts.active.sidebar) {
        LibreTexts.active.sidebar = true;
        Sidebar();
    }
});

window.Sidebar = async function () {
    ReactDOM.render(<Sidebar/>, target);
}
