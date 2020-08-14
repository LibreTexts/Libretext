/*
This code imports external libraries so that React can use them!
These pieces are code are then bundled into your application during the compilation process.
Always place your imports at the top of files!
*/
import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import SubComponent from "../components/SubComponent.jsx";

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
function HelloWorld(props) {
	const [buttonText, setButtonText] = useState("Click me, please");
	const [numClicks, setNumClicks] = useState(0);
	
	return (<React.Fragment>
			<button onClick={() => {
				setNumClicks(numClicks + 1);
				setButtonText(`Thanks, I've been clicked ${numClicks + 1} times!`)
			}}>
				{buttonText}
			</button>
			<SubComponent number={numClicks}/>
		</React.Fragment>
	);
}


ReactDOM.render(<HelloWorld/>, target);