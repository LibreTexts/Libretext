import React, {Component} from 'react';
import ClipboardJS from "clipboard";
import InputField from "./InputField.js";
import "./all.css";

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
			path: window.location.host === "localhost" ? "http://localhost:3000/public" : "https://awesomefiles.libretexts.org/",
			options: {prefix: "$"},
		};
		mainApp = this;
	}

	componentDidMount() {
		this.sample();
	}


	componentDidUpdate() {
		this.sample();
	}

	onChange = (field, value) => {
		let update = this.state.options;
		update[field] = value;
		// if (!this.state.options[field] || this.state.options[field] !== value) {
			mainApp.setState({options: update});
		// }
	};

	render() {
		const example = {"$": "caffeine or 2-propanol", "=": "2POR", ":": "2519"};
		// noinspection JSJQueryEfficiency
		// document.addEventListener("GLzoom", (e) => this.onChange("defaultZoom", Math.round(e.detail)));
		return (<div style={{
				display: "flex",
				flexDirection: "column",
				padding: 10,
				border: "5px solid " + this.getColor(),
				alignItems: "center",
				backgroundColor: "#f6f6f6"
			}}>
				<h1 style={{textAlign: "center"}}>Molecule Generator</h1>

				{/*				<div style={{display: "flex", justifyContent: "space-evenly", width: "100%"}}>
					<div onClick={() => this.setState({type: "GLmol"})} style={{backgroundColor: "dodgerblue"}}>GLmol
					</div>
					<div onClick={() => this.setState({type: "3Dmol"})} style={{backgroundColor: "green"}}>3Dmol</div>
					<div onClick={() => this.setState({type: "JSmol"})} style={{backgroundColor: "orange"}}>JSmol</div>
				</div>*/}
				<div style={{display: "flex", flexDirection: "column"}}>
					<div>For molecules enter its common or IUPAC name. <br/>
						If it does not show up try to find it at &nbsp;
						<a href={"https://pubchem.ncbi.nlm.nih.gov/"}>https://pubchem.ncbi.nlm.nih.gov/</a>
						&nbsp; or for proteins at &nbsp;
						<a href={"https://www.rcsb.org/"}>https://www.rcsb.org/</a>
						&nbsp; to find a molecule ID number.<br/><br/>
					</div>
					<select onChange={(e) => this.onChange("prefix", e.target.value)}>
						{$.map([{title: "common or IUPAC molecule name", prefix: "$"},
								{title: "www.rcsb.org PDB ID", prefix: "="},
								{title: "pubchem.ncbi.nlm.nih.gov CID", prefix: ":"}],
							(option, index) =>
								<option key={index} value={option.prefix}>{option.title}</option>)}
					</select>
					<input onChange={(e) => {
						this.onChange("id", e.target.value);
					}}
					       placeholder={"ex. " + example[this.state.options.prefix]}/>
					<br/><br/>
					<button onClick={() => $(".help").slideToggle()}>Show/Hide Help</button>
					<img className={"help"} style={{display: "none"}}
					     src={"https://awesomefiles.libretexts.org/Molecules/MoleculeGenerator/help.png"}/>
					<button className={"help"} style={{display: "none"}} onClick={() => $(".help").slideUp()}>Hide
						Help
					</button>

				</div>
				<div style={{
					display: this.state.options.id ? "flex" : "none",
					padding: 10,
					marginTop: 20,
					alignItems: "center",
					borderTop: "2px solid " + this.getColor(),
					alignSelf: "stretch"
				}}>
					<div style={{width: "250px", marginRight: "20px"}}>
						{$.map(GLoptions, (object, key) => <InputField key={key} item={key} options={object}
						                                               color={this.getColor()}
						                                               onChange={this.onChange}/>)}
					</div>
					<div style={{flex: 1, padding: 5}}>
						{/*<ScriptTag src={this.state.path + "/JSmol/JSmolWrapper.js"} data-id="=1ugu"/>*/}
						<div id="sample" style={{marginBottom: "10px"}}>
						</div>
						<div style={{
							marginBottom: 10,
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
						<div id="copy" data-clipboard-text={this.generateMolecule()}
						     onClick={() => alert("Copied!\nPaste into a Dekiscript block and enable the correct tag.")}
						     style={{
							     backgroundColor: this.getColor(),
							     padding: 5,
							     borderRadius: 5,
							     textAlign: "center",
							     fontSize: "20px",
						     }}>Copy {this.state.type} to
							Clipboard
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
				if (letter === letter.toUpperCase()) {
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
			outputString += "('data-id')=\"" + options["prefix"] + options["id"] + "\" ";
			for (let key in options) {
				if (options.hasOwnProperty(key) && (allowedOptions[key] !== undefined || !["id", "prefix"].includes(key))) {

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
				return "//Make sure to tag the \"Embed GLmol\" tag to \"yes\"  under 'Page settings' at top of page to work\n" + "<script type=\"text/javascript\" src=(GLmolPath) " + generateOptions(this.state.options, GLoptions) + "></script>";
			case "JSmol":
				return "//Make sure to tag the \"Embed JSmol\" tag to \"yes\"  under 'Page settings' at top of page to work\n" + "<script type=\"text/javascript\" src=(JSmolPath) ('data-id')=\"=1blu\" ('data-cartoon')=\"true\"></script>";
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
				sampleContent.src = this.state.path + "/Molecules/GLmol/js/GLWrapper.js";
				sampleContent = this.processDataset(this.state.options, GLoptions, sampleContent);
				// sampleContent.dataset.id = "=1ugu";
				break;
			case "JSmol":
				sampleContent.src = this.state.path + "/Molecules/JSmol/JSmolWrapper.js";
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
			if (options.hasOwnProperty(key) && (allowedOptions[key] !== undefined || !["id", "prefix"].includes(key))) {

				if (options[key]) {
					sampleContent.dataset[key] = options[key];
				}
			}
		}
		sampleContent.dataset["id"] = options["prefix"] + options["id"];
		return sampleContent;
	}
}
const GLoptions = {
	height: {name: "Custom height", help: "", type: "text", placeholder: "ex. 10px, 50%, or 75vw"},
	width: {name: "Custom width", help: "", type: "text", placeholder: "ex. 10px, 50%, or 75vw"},
	hetatmMode: {
		name: "Heteroatoms style",
		help: "",
		type: ["ballAndStick2", "stick", "line", "icosahedron", "sphere", "ballAndStick"]
	},
	border: {name: "Show border", help: "", type: "bool"},
	label: {name: "Show GLmol label", help: "", type: "bool"},
	multiple: {name: "Multiple molecules", help: "", type: "bool"},
	spin: {name: "Enable spinning", help: "", type: "bool"},
	speed: {name: "Spin speed", help: "", type: "text", placeholder: "any number"},
	// defaultZoom: {name: "Default Zoom", help: "", type: "text", placeholder: "zoom molecule to set", disabled: true},
	note1: {name: "The below options are only useful for proteins", type: "note"},
	mainchain: {
		name: "Mainchain style",
		help: "",
		type: ["thickRibbon", "ribbon", "strand", "chain", "cylinderHelix", "tube", "bonds", "none"]
	},
	colormode: {name: "Mainchain color", help: "", type: ["chainbow", "chain", "b", "polarity", "ss"]},
	sidechains: {name: "Show sidechains", help: "", type: "bool"},
	roughBeta: {name: "Rough Beta sheets", help: "", type: "bool"},
	baseHetatmMode: {name: "Base heteroatoms style", help: "", type: ["line", "stick", "polygon", "none"]},
	nonbonded: {name: "Show nonbonded", help: "", type: ["none", "sphere", "cross"]},
	// projectionmode: {name:"", help:"", type:["perspective", "orthoscopic"]},
	unitcell: {name: "Show as unitcell", help: "", type: "bool"},
	bioassembly: {name: "Show as bioassembly", help: "", type: "bool"},
	crystalpacking: {name: "Show as crystal packing", help: "", type: "bool"},
	// symmetry: {name:"", help:"", type:"bool"},
};
