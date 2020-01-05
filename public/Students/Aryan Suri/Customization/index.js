import React, {useState} from 'react';
import ReactDOM from 'react-dom';

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);


function Customization () {
	
	return <div></div>;
}


ReactDOM.render(<Customization/>, target);