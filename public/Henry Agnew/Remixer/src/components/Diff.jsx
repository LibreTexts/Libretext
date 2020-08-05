const React = require('react');
const createClass = require('create-react-class');
const PropTypes = require('prop-types');
const jsdiff = require('diff');

const fnMap = {
	'chars': jsdiff.diffChars,
	'words': jsdiff.diffWords,
	'sentences': jsdiff.diffSentences,
	'json': jsdiff.diffJson
};

export default function Diff (props){
	const diff = fnMap[props.type](props.inputA, props.inputB);
	const result = diff.map(function (part, index) {
		const spanStyle = {
			backgroundColor: part.added ? 'lightgreen' : part.removed ? 'salmon' : ''
		};
		return <span key={index} style={spanStyle}>{part.value}</span>
	});
	return (
		<pre className='diff-result'>
        {result}
      </pre>
	);
}

Diff.defaultProps = {
	inputA: '',
	inputB: '',
	type: 'chars'
}