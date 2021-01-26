import React from 'react';
import ReactDOM from 'react-dom';
import DeactivateUsers from "../components/DeactivateUsers.jsx";
import Info from "@material-ui/icons/Info";
import {Tooltip} from "@material-ui/core";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

export default function Dashboard () {
		return <div className={'CenterContainer'}>
			<div className="navigationBar">
				<div style={{flex: 1}}><Tooltip placement="right"
				                                title={`Version ${new Date("REPLACEWITHDATE")}\nMade with ❤`}>
					<Info/>
				</Tooltip></div>
			</div>
			<DeactivateUsers/>
		</div>
}

ReactDOM.render(<Dashboard/>, target);
