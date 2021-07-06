/*
This code imports external libraries so that React can use them!
These pieces are code are then bundled into your application during the compilation process.
Always place your imports at the top of files!
*/
import React, {useState} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import ReactDOM from 'react-dom';
import {Button, SwipeableDrawer, List, Divider, ListItem, ListItemIcon, ListItemText,} from "@material-ui/core";
import Readability from "../components/Readability.jsx";
import Resources from "../components/Resources.jsx";
import Tools from "../components/Tools.jsx";
import Libraries from "../components/Libraries.jsx";
import Community from "../components/Community.jsx";
import Developers from "../components/Developers.jsx";


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
        width: 250,
    },
    fullList: {
        width: 'auto',
    },
});

/*
This is your React Hook.
Your top-level logic should go here, but other parts should be handled by sub-components.
*/
function HelloWorld(props) {
    const [buttonText, setButtonText] = useState("Click me, please");
    const [numClicks, setNumClicks] = useState(0);
    
    const classes = useStyles();
    const [state, setState] = React.useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });
    
    const toggleDrawer = (anchor, open) => (event) => {
        if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        
        setState({...state, [anchor]: open});
    };
    
    const list = (anchor) => (
        <div
            className={clsx(classes.list, {
                [classes.fullList]: anchor === 'top' || anchor === 'bottom',
            })}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <Libraries/>
            <List>
                {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                    <ListItem button key={text}>
                        <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                        <ListItemText primary={text}/>
                    </ListItem>
                ))}
            </List>
            <Divider/>
            <List>
                {['All mail', 'Trash', 'Spam'].map((text, index) => (
                    <ListItem button key={text}>
                        <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                        <ListItemText primary={text}/>
                    </ListItem>
                ))}
            </List>
        </div>
    );
    
    return (<React.Fragment>
            <div>
                {['left', 'right', 'top', 'bottom'].map((anchor) => (
                    <React.Fragment key={anchor}>
                        <Button onClick={toggleDrawer(anchor, true)}>{anchor}</Button>
                        <SwipeableDrawer
                            anchor={anchor}
                            open={state[anchor]}
                            onClose={toggleDrawer(anchor, false)}
                            onOpen={toggleDrawer(anchor, true)}
                        >
                            {list(anchor)}
                        </SwipeableDrawer>
                    </React.Fragment>
                ))}
            </div>
            {/*<Readability/>*/}
            {/*<Resources/>*/}
            {/*<Tools/>*/}
            <Libraries/>
            <Community/>
            <Developers/>
        </React.Fragment>
    );
}


ReactDOM.render(<HelloWorld/>, target);
