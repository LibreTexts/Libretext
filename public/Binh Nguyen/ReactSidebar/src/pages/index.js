/*
This code imports external libraries so that React can use them!
These pieces are code are then bundled into your application during the compilation process.
Always place your imports at the top of files!
*/
import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import {Button, Divider, IconButton, MenuItem, Portal, Select, SwipeableDrawer,} from "@material-ui/core";
import Contents from "../components/Contents.jsx";
import Readability from "../components/Readability.jsx";
import Resources from "../components/Resources.jsx";
import Libraries from "../components/Libraries.jsx";
import Tools from "../components/Tools.jsx";
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


// const useStyles = makeStyles({
//     list: {
//         width: 400,
//         overflowY: "auto",
//         maxWidth: "90vw",
//     },
// });

/*
This is your React Hook.
Your top-level logic should go here, but other parts should be handled by sub-components.
*/
function SidebarComponent(props) {
    const [openPanel, setOpenPanel] = useState();
    const [lastPanel, setLastPanel] = useState();
    const tabs = ['contents', 'readability', 'resources', 'libraries', 'tools', 'community'];
    const isPro = document.getElementById("proHolder")?.innerText === 'true';
    if (isPro)
        tabs.push('developers');
    // const classes = useStyles();
    
    const toggleDrawer = (panel) => (event) => {
        if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setOpenPanel(panel);
        if (panel)
            setLastPanel(panel);
    };
    LibreTexts.active.sidebarToggleDrawer = toggleDrawer;
    
    const list = () => {
        let currentPanel;
        switch (openPanel) {
            case "contents":
                currentPanel = <Contents toggleDrawer={toggleDrawer}/>;
                break;
            case "resources":
                currentPanel = <Resources toggleDrawer={toggleDrawer}/>;
                break;
            case "readability":
                currentPanel = <Readability toggleDrawer={toggleDrawer}/>;
                break;
            case "tools":
                currentPanel = <Tools toggleDrawer={toggleDrawer}/>;
                break;
            case "libraries":
                currentPanel = <Libraries toggleDrawer={toggleDrawer}/>;
                break;
            case "community":
                currentPanel = <Community toggleDrawer={toggleDrawer}/>;
                break;
            case "developers":
                currentPanel = <Developers toggleDrawer={toggleDrawer}/>;
                break;
            case undefined:
            case false:
                break;
            default:
                alert(`${openPanel} not implemented`);
        }
        
        return <div
            style={{
                width: 500,
                overflowY: "auto",
                maxWidth: "90vw",
            }}
            role="presentation"
            // onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            {currentPanel}
        </div>
    };
    
    return (<React.Fragment>
            <div>
                {tabs.map((anchor) => (
                    <React.Fragment key={anchor}>
                        <Button onClick={toggleDrawer(anchor)}>{anchor}</Button>
                    </React.Fragment>
                ))}
                <div id="sidebarDiv"/>
                <SwipeableDrawer
                    id="LibreTextsSidebar"
                    anchor={'left'}
                    open={Boolean(openPanel)}
                    onClose={toggleDrawer(false)}
                    disableSwipeToOpen={true}
                    onOpen={() => {
                    }}>
                    <div style={{display: "flex"}}>
                        <Select variant="filled" value={openPanel || ""} style={{flex: 1}}
                                onChange={(event) => toggleDrawer(event.target.value)(event)}>
                            {tabs.map((tab) => <MenuItem value={tab} key={tab}>{tab.toUpperCase()}</MenuItem>)}
                        </Select>
                        <IconButton onClick={toggleDrawer(false)} title="Close Sidebar panel">
                            <ChevronLeftIcon/>
                        </IconButton>
                    </div>
                    <Divider/>
                    {list()}
                </SwipeableDrawer>
                <Portal>
                    <div id="sbHeader" className="sbHeader">
                        {tabs.map((tab) => <div key={tab} className="top-tabs"
                                                onClick={(event) => toggleDrawer(tab)(event)}>
                            {tab.toUpperCase()}</div>)}
                    </div>
                    {!openPanel ? <button id="custom_open"  title="Open Sidebar panel"
                                         onClick={(event) => toggleDrawer(lastPanel || "contents")(event)}>☰</button> : null}
                
                </Portal>
            </div>
        </React.Fragment>
    );
}

if (localStorage.getItem("beeline") === null || localStorage.getItem("beeline") === "null") {
    localStorage.setItem("beeline", "off");
}
if (!localStorage.getItem("glossarizerType") || localStorage.getItem("beeline") === "null") {
    localStorage.setItem("glossarizerType", "textbook");
}
window.addEventListener("load", () => {
    if (Sidebar && !LibreTexts.active.sidebar) {
        LibreTexts.active.sidebar = true;
        Sidebar();
    }
});

window.Sidebar = function () {
    ReactDOM.render(<SidebarComponent/>, target);
}
