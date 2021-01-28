import React from 'react';
import ReactDOM from 'react-dom';
import DeactivateUsers from "../components/DeactivateUsers.jsx";
import Info from "@material-ui/icons/Info";
import {AppBar, Tooltip} from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import NewUser from "../components/NewUser.jsx";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

export default function Dashboard() {
    const [value, setValue] = React.useState(0);
    
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    
    function a11yProps(index) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }
    
    function getComponent() {
        switch (value) {
            case 0:
                return <NewUser/>;
            case 1:
                return null;
            case 2:
                return <DeactivateUsers/>;
        }
    }
    
    return <div className={'CenterContainer'}>
        {/*variant="fullWidth"*/}
        <AppBar position="static" className="navigationBar">
            <Tooltip placement='right' title={`Version ${new Date("REPLACEWITHDATE")}\nMade with ❤`}>
                <Info/>
            </Tooltip>
            <Tabs value={value} onChange={handleChange} variant="fullWidth">
                <Tab label="Create/Modify Accounts" {...a11yProps(0)} />
                <Tab label="Get Group Users" {...a11yProps(1)} />
                <Tab label="Deactivate Accounts" {...a11yProps(2)} />
            </Tabs>
        </AppBar>
        {getComponent()}
    </div>
}

ReactDOM.render(<Dashboard/>, target);
