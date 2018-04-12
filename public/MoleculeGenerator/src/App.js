import React, {Component} from 'react';
import ClipboardJS from "clipboard";

// If you use React Router, make this component
// render <Router> with your routes. Currently,
// only synchronous routes are hot reloaded, and
// you will see a warning from <Router> on every reload.
// You can ignore this warning. For details, see:
// https://github.com/reactjs/react-router/issues/2182
export default class App extends Component {
	constructor(props) {
		new ClipboardJS('#copy');
		super(props);
		this.state = {
			type: "GLmol"
		}
	}

	render() {
		return (<div style={{display: "flex", flexDirection: "column", padding:10, border: "5px solid " + this.getColor(), alignItems:"center"}}>
				<h1 style={{textAlign: "center"}}>Molecule Generator</h1>

				<div style={{display: "flex"}}>
					<div onClick={() => this.setState({type: "GLmol"})}>GLmol</div>
					<div onClick={() => this.setState({type: "3Dmol"})}>3Dmol</div>
					<div onClick={() => this.setState({type: "JSmol"})}>JSmol</div>
				</div>
				<div style={{margin:10, border:"2px solid red", whiteSpace:"pre", font:"100%/1.5 'Source Code Pro',monospace", padding:10, overflowX:"scroll", userSelect:"none", alignSelf:"normal"}}>
					{this.generateMolecule()}
				</div>
				<div id="copy" data-clipboard-text={this.generateMolecule()} onClick={()=>alert("Copied!\nPaste into a Dekiscript block!")}
				style={{backgroundColor:this.getColor(), padding:5, borderRadius:5}}>Copy to Clipboard</div>
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
		switch (this.state.type) {
			case "3Dmol":
				return "//3Dmol\n" +
					"<script src=\"https://libretexts.org/awesomefiles/3Dmol/3Dmol-nojquery.js\"></script>\n" +
					"\n" +
					"//Edit below\n" +
					"<div class=\"viewer_3Dmoljs\" ('data-id')=\"=1YCR\" ('data-select1')=\"chain:A\" ('data-select2')=\"chain:B\" ('data-style1')=\"cartoon:color=spectrum\" ('data-style2')=\"stick\" ('data-surface1')=\"opacity:.7;color:white\" style=\"height: 400px; width: 400px;\"></div>";
			case "GLmol":
				return "//GLmol\n" +
					"<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/GLmol/js/Three49custom.js\"></script>\n" +
					"<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/GLmol/js/GLmol.js\"></script>\n" +
					"\n" +
					"//Edit below\n" +
					"<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/GLmol/js/GLWrapper.js\" ('data-id')=\"=1ugu\" ('data-multiple')=\"true\"></script>";
			case "JSmol":
				return "//JSmol\n" +
					"<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/JSmol/JSmol.full.nojq.js\"></script>\n" +
					"\n" +
					"//Edit below\n" +
					"<script type=\"text/javascript\" src=\"https://libretexts.org/awesomefiles/JSmol/JSmolWrapper.js\" ('data-id')=\"=1blu\" ('data-cartoon')=\"true\"></script>";
		}
	}
}
