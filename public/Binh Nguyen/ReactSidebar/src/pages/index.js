/*
This code imports external libraries so that React can use them!
These pieces are code are then bundled into your application during the compilation process.
Always place your imports at the top of files!
*/
import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import {
    Button,
    Divider,
    IconButton,
    MenuItem,
    Portal,
    Select,
    SwipeableDrawer,
    useMediaQuery,
} from "@material-ui/core";
import {createTheme, ThemeProvider} from '@material-ui/core/styles';
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


/*
This is your React Hook.
Your top-level logic should go here, but other parts should be handled by sub-components.
*/
function SidebarComponent(props) {
    const [openPanel, setOpenPanel] = useState();
    const [lastPanel, setLastPanel] = useState();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") ? localStorage.getItem("darkMode") === "true" : prefersDarkMode);
    
    const theme = React.useMemo(
        () =>{
            const contentContainer = $('body');
            if (darkMode) {
                contentContainer.addClass('darkMode');
            }
            else {
                contentContainer.removeClass('darkMode');
            }
            
            return createTheme({
                palette: {
                    type: darkMode ? 'dark' : 'light',
                },
            })},
        [darkMode],
    );
    const tabs = ['contents', 'readability', 'resources', 'libraries', 'tools', 'community'];
    const isPro = document.getElementById("proHolder")?.innerText === 'true';
    if (isPro)
        tabs.push('developers');
    // const classes = useStyles();
    
    const toggleDrawer = (panel) => (event) => {
        if (event && event.type === 'keydown' && !panel) {
            if (event.key !== 'Escape') { //only escape will close
                return;
            }
        }
        setOpenPanel(panel);
        if (panel)
            setLastPanel(panel);
    };
    LibreTexts.active.sidebarToggleDrawer = toggleDrawer;
    
    function darkModeChange(mode) {
        if (mode === undefined) //toggle its value
            mode = !darkMode
        
        localStorage.setItem('darkMode', mode);
        setDarkMode(mode);
    }
    
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
                currentPanel =
                    <Readability toggleDrawer={toggleDrawer} darkMode={darkMode} setDarkMode={darkModeChange}/>;
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
    
    return (<ThemeProvider theme={theme}>
            <div>
{/*                {tabs.map((anchor) => (
                    <React.Fragment key={anchor}>
                        <Button onClick={toggleDrawer(anchor)}>{anchor}</Button>
                    </React.Fragment>
                ))}*/}
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
                        <Select variant="filled" value={openPanel || ""} style={{flex: 1, backgroundColor:"#127bc480"}}
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
                        {tabs.map((tab) => <Button key={tab} tabIndex="1" title={`Open ${tab} panel`} className="top-tabs"
                                                onClick={(event) => toggleDrawer(tab)(event)}>
                            <span>{tab.toUpperCase()}</span></Button>)}
                    </div>
                    {!openPanel ? <Button id="custom_open" title="Open Sidebar panel" tabIndex="1"
                                          onClick={(event) => toggleDrawer(lastPanel || "contents")(event)}>☰</Button> : null}
                
                </Portal>
            </div>
        </ThemeProvider>
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
