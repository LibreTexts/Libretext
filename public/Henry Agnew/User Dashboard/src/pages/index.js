import React from 'react';
import ReactDOM from 'react-dom';
import {SnackbarProvider} from 'notistack';
import Info from "@material-ui/icons/Info";
import {AppBar, Tooltip} from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import {createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import NewUser from "../components/NewUser.jsx";
import GetGroupUsers from "../components/GetGroupUsers.jsx";
import DeactivateUsers from "../components/DeactivateUsers.jsx";

const target = document.createElement("div");


// noinspection JSValidateTypes
target.id = Math.random() * 100;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

export default function Dashboard() {
    const [value, setValue] = React.useState(0);
    const prefersDarkMode = localStorage.getItem('darkMode') === 'true';
    // || useMediaQuery('(prefers-color-scheme: dark)')
    
    const theme = React.useMemo(
        () =>
            createMuiTheme({
                palette: {
                    type: prefersDarkMode ? 'dark' : 'light',
                },
            }),
        [prefersDarkMode],
    );
    
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
                return <GetGroupUsers/>;
            case 2:
                return <DeactivateUsers/>;
        }
    }
    
    return <ThemeProvider theme={theme}>
        <SnackbarProvider anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}>
            <div id="UserDashboard" className={'CenterContainer'}>
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
        </SnackbarProvider>
    </ThemeProvider>
}

ReactDOM.render(<Dashboard/>, target);
