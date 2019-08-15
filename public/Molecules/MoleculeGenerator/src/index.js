import {AppContainer} from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';


const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

const render = Component =>
	ReactDOM.render(
		<AppContainer>
			<Component/>
		</AppContainer>,
		target
	);

render(App);
if (module.hot) module.hot.accept('./App', () => render(App));
