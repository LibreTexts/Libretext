import React, {useState} from 'react';

/*
This component is receiving information from its parent through its "props"!
The file extension .jsx is for standalone React Components, compared to index.js
*/
export default function SubComponent(props) {
	return (
		<div className='subComponent'>
		<h2>I'm a subcomponent! I am being passed parts of my parent's state using props!</h2>
			<h3>Number of Clicks: {props.number}</h3>
		</div>
	);
}
