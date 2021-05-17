import React from 'react';
import ReactDOM from 'react-dom';
import Remixer from "../components/Remixer.jsx";

import {SnackbarProvider} from 'notistack';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

function Dashboard() {
    
    return <div id='Remixer' className={'CenterContainer'}>
        <SnackbarProvider maxSnack={3}>
            <Remixer/>
        </SnackbarProvider>
    </div>
}

window.addEventListener('load', () => { //Remixer has successfully loaded
    let loaded = document.getElementById('loadingRemixer');
    if (loaded?.style) loaded.style.visibility = "hidden"
})

ReactDOM.render(<Dashboard/>, target);
