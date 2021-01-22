import React from 'react';
import ReactDOM from 'react-dom';
import DeactivateUsers from "../components/DeactivateUsers.jsx";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

export default function Dashboard () {
		return <div className={'CenterContainer'}>
			<div className="navigationBar">
			</div>
			<DeactivateUsers/>
		</div>
}

ReactDOM.render(<Dashboard/>, target);
