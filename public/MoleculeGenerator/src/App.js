import React, {Component} from 'react';
import ScriptTag from 'react-script-tag';
import ClipboardJS from "clipboard";
import InputField from "./InputField.js";

// If you use React Router, make this component
// render <Router> with your routes. Currently,
// only synchronous routes are hot reloaded, and
// you will see a warning from <Router> on every reload.
// You can ignore this warning. For details, see:
// https://github.com/reactjs/react-router/issues/2182
var mainApp;
export default class App extends Component {
	constructor(props) {
		new ClipboardJS('#copy');
		super(props);
		this.state = {
			type: "GLmol",
			path: window.location.host === "localhost" ? "http://localhost:3000/public" : "https://libretexts.org/awesomefiles",
			options: {}
		}
		mainApp = this;
	}

	componentDidMount() {
		this.sample();
	}


	componentDidUpdate() {
		this.sample();
	}

	onChange(field, value) {
		let update = mainApp.state.options;
		update[field] = value;
		mainApp.setState({options: update});
	}

	render() {
		return (<div style={{
				display: "flex",
				flexDirection: "column",
				padding: 10,
				border: "5px solid " + this.getColor(),
				alignItems: "center"
			}}>
				<h1 style={{textAlign: "center"}}>Molecule Generator</h1>

				<div style={{display: "flex", justifyContent: "space-evenly", width: "100%"}}>
					<div onClick={() => this.setState({type: "GLmol"})} style={{backgroundColor: "dodgerblue"}}>GLmol
					</div>
					{/*<div onClick={() => this.setState({type: "3Dmol"})} style={{backgroundColor: "green"}}>3Dmol</div>*/}
					{/*<div onClick={() => this.setState({type: "JSmol"})} style={{backgroundColor: "orange"}}>JSmol</div>*/}
				</div>
				<div style={{
					display: "flex",
					padding: 10,
					alignItems: "center"
				}}>
					<div>
						<h1>
							ID:
							<input onBlur={(e) => this.onChange("id", e.target.value)}/>
						</h1>
						{$.map(GLoptions, (object, key) => <InputField key={key} item={key} options={object}
						                                               onChange={this.onChange}/>)}
						<div id="copy" data-clipboard-text={this.generateMolecule()}
						     onClick={() => alert("Copied!\nPaste into a Dekiscript block and enable the correct tag.")}
						     style={{
							     backgroundColor: this.getColor(),
							     padding: 5,
							     borderRadius: 5
						     }}>Copy {this.state.type} to
							Clipboard
						</div>
					</div>
					<div style={{flex:1}}>
						{/*<ScriptTag src={this.state.path + "/JSmol/JSmolWrapper.js"} data-id="=1ugu"/>*/}
						<div id="sample">
						</div>
						<div style={{
							margin: 10,
							border: "2px solid red",
							// whiteSpace: "pre",
							font: "100%/1.5 'Source Code Pro',monospace",
							padding: 10,
							overflowX: "scroll",
							userSelect: "none",
							alignSelf: "normal",
						}}>
							{this.generateMolecule()}
						</div>
					</div>
				</div>
			</div>
		);
	}

	getColor() {
		switch (this.state.type) {
			case "3Dmol":
				return "green";
			case "GLmol":
				return "dodgerblue";
			case "JSmol":
				return "orange";
		}
	}

	generateMolecule() {
		function processKey(key) {
			let returnString = "";
			for (let i = 0; i < key.length; i++) {
				let letter = key.charAt(i);
				if (letter == letter.toUpperCase()) {
					returnString += "-" + letter.toLowerCase();
				}
				else {
					returnString += letter;
				}
			}
			return returnString;
		}

		function generateOptions(options, allowedOptions) {
			let outputString = "";
			for (let key in options) {
				if (allowedOptions[key] !== undefined || key === "id") {

					if (options[key]) {
						outputString += "('data-" + processKey(key) + "')=\"" + options[key] + "\" ";
					}
				}
			}
			return outputString;
		}

		switch (this.state.type) {
			case "3Dmol":
				return "//Make sure to tag the \"Embed 3Dmol\" tag to \"yes\"  under 'Page settings' at top of page to work\n" + "<div class=\"viewer_3Dmoljs\" ('data-id')=\"=1YCR\" ('data-select1')=\"chain:A\" ('data-select2')=\"chain:B\" ('data-style1')=\"cartoon:color=spectrum\" ('data-style2')=\"stick\" ('data-surface1')=\"opacity:.7;color:white\" style=\"height: 400px; width: 400px;\"></div>";
			case "GLmol":
				return "//Make sure to tag the \"Embed GLmol\" tag to \"yes\"  under 'Page settings' at top of page to work\n" + "<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/GLmol/js/GLWrapper.js\" " + generateOptions(this.state.options, GLoptions) + "></script>";
			case "JSmol":
				return "//Make sure to tag the \"Embed JSmol\" tag to \"yes\"  under 'Page settings' at top of page to work\n" + "<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/JSmol/JSmolWrapper.js\" ('data-id')=\"=1blu\" ('data-cartoon')=\"true\"></script>";
		}
	}

	sample() {
		let sampleContent = document.createElement("script");

		console.log(this.state.type);
		switch (this.state.type) {
			case "3Dmol":
				sampleContent = document.createElement("div");
				sampleContent.classList.add("viewer_3Dmoljs");

				sampleContent.dataset.id = "=1YCR";
				sampleContent.dataset.select1 = "chain:A";
				sampleContent.dataset.select2 = "chain:B";
				sampleContent.dataset.style1 = "cartoon:color=spectrum";
				sampleContent.dataset.style2 = "stick";
				sampleContent.dataset.surface1 = "opacity:.7;color:white";

				sampleContent.style.height = "400px";
				sampleContent.style.width = "400px";
				break;
			case "GLmol":
				sampleContent.src = this.state.path + "/GLmol/js/GLWrapper.js";
				sampleContent = this.processDataset(this.state.options, GLoptions, sampleContent);
				// sampleContent.dataset.id = "=1ugu";
				break;
			case "JSmol":
				sampleContent.src = this.state.path + "/JSmol/JSmolWrapper.js";
				sampleContent.dataset.id = "=1blu";
				break;
		}

		const sample = document.getElementById("sample");
		sample.innerHTML = "";
		sample.appendChild(sampleContent);


		switch (this.state.type) {
			case "3Dmol":
				$3Dmol.autoload();
				break;
		}
	}

	processDataset(options, allowedOptions, sampleContent) {
		for (let key in options) {
			if (allowedOptions[key] !== undefined || key === "id") {

				if (options[key]) {
					sampleContent.dataset[key] = options[key];
				}
			}
		}
		return sampleContent;
	}
}
const GLoptions = {
	height: "text",
	width: "text",
	border: "bool",
	label: "bool",
	multiple: "bool",
	colormode: ["chainbow", "chain", "b", "polarity", "ss"],
	mainchain: ["thickRibbon", "ribbon", "strand", "chain", "cylinderHelix", "tube", "bonds", "none"],
	sidechains: "bool",
	roughBeta: "bool",
	hetatmMode: ["ballAndStick2", "stick", "line", "icosahedron", "sphere", "ballAndStick"],
	baseHetatmMode: ["line", "stick", "polygon", "none"],
	nonbonded: ["none", "sphere", "cross"],
	projectionmode: ["perspective", "orthoscopic"],
	unitcell: "bool",
	bioassembly: "bool",
	crystalpacking: "bool",
	symmetry: "bool",
	spin: "bool",
	speed: "integer"
};
