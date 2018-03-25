import React       from "react";
import ReactDOM    from "react-dom";
import math, {map} from "mathjs";
import capitalize  from "capitalize"
import BigNumber   from "bignumber.js"
/*
*
* use the degree character (°) for degrees in temperature ✓
* use superscript for the volume units (or unicode superscript instead)? The same for angstrom (Å)? ✓
* Perhaps a different approach for sig figs is needed. Can you cap them to just 5 like in Halas' site? ✓
*
*
* For energy we need something more expanded like: http://halas.rice.edu/conversions
* For length, we need to add some astronomy based scales (or a new AstroLength Converter) that includes parsecs and light years
* Perhaps atomic units too.
*/

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

class Converter extends React.Component {
	constructor() {
		super();
		this.state = {
			Unit: null,
			last: "",
			sigFigs: 1,
			setup: 'howtoberandom',
			showExtra: false,
		};
		switch (this.state.setup) {
			case "energy":
				math.createUnit({
					cal: '4.184 J',
					kcal: '4184 J',
				});
				break;
			case "astro":
				math.createUnit({
					au: '149597870700 m',
					ly: '9.4607e15 m',
					pc: '3.0857e16 m',
				});
				break;
			default:
				break;
		}
	}
	
	updateUnit(value, unit) {
		let _value = value, _unit = unit;
		if (_value) {
			let n = BigNumber(_value);
			
			this.setState({
				Unit: math.unit(_value, _unit),
				last: _unit,
				sigFigs: Converter.getSigFigs(_value),
			});
		}
	}
	
	render() {
		return <div>
			<h3>{capitalize('howtoberandom')} Converter</h3>
			{map(this.props.list, (element, index) =>
				<Unit key={index} element={element} index={index}
				      onChange={(value, unit) => this.updateUnit(value, unit)} Unit={this.state.Unit}
				      last={this.state.last} sigFigs={this.state.sigFigs} setup={this.state.setup}/>)
			}
			{this.state.showExtra && this.props.extra.length
				? map(this.props.extra, (element, index) =>
					<Unit key={index} element={element} index={index}
					      onChange={(value, unit) => this.updateUnit(value, unit)} Unit={this.state.Unit}
					      last={this.state.last} sigFigs={this.state.sigFigs} setup={this.state.setup}/>) : null
			}
			{this.props.extra.length ?
			 <div style={{display: "inline-block", backgroundColor: "#30b3f6", textAlign: "center", padding:5, borderRadius:5}}
			      onClick={() => this.setState({showExtra: !this.state.showExtra})}>Show {this.state.showExtra ? "less" : "more"} units</div> : null}
		</div>
	}
	
	static getSigFigs(value) {
		let n = value;
		if (!n.includes(".")) { //whole number
			// noinspection EqualityComparisonWithCoercionJS
			if (n == 0) {
				return 10;
			}
			
			n = n.replace(/0+$/, '');
		}
		return Math.min((n + '').replace('.', '').replace('-', '').length, 100);
	}
}

class Unit extends React.Component {
	constructor() {
		super();
		this.state = {
			value: "",
		};
	}
	
	newUnit(input) {
		this.setState({value: input.target.value});
		switch (this.props.element) {
			case "nm":
				this.props.onChange((1.9864456e-25 /input.target.value).toString(), "J");
				break;
			default:
				this.props.onChange(input.target.value, this.props.element);
		}
	};
	
	convert() {
		if (this.props.last === this.props.element) {
			return this.state.value;
		}
		if (this.props.Unit) {
			let number;
			
			if (this.props.setup === "energy") {
				switch (this.props.element) {
					case "nm":
						number = 1.9864456e-25 / (this.props.Unit.toNumeric("J") * 10.0e9);
						break;
					default:
						number = this.props.Unit.toNumeric(this.props.element);
				}
			}
			else {
				number = this.props.Unit.toNumeric(this.props.element);
			}
			
			if (number >= 10000 || number < 1.0e-4) {
				return number.toExponential(5);
			}
			else {
				return number.toFixed(5)
			}
		}
		
		else {
			return "";
		}
	};
	
	name() {
		let unit = this.props.element;
		
		switch (unit) {
			case "degC":
				return "°C";
			case "degF":
				return "°F";
			case "angstrom":
				return "Å";
			case "m3":
				return <span>m<sup>3</sup></span>;
			case "cm3":
				return <span>cm<sup>3</sup></span>;
			default:
				return unit;
		}
	};
	
	render() {
		return <div style={{display: "inline-block", minWidth: 210, paddingRight: 10}}>
			<input style={{display: "inline-block", width: 160}} onChange={(e) => this.newUnit(e)} type="number"
			       value={this.convert()}/>
			<div style={{display: "inline-block", wordWrap: "normal"}}>
				{this.name()}
			</div>
		</div>
	}
}

ReactDOM.render(<Converter list={["whimsical"]} extra={["literature"]}/>, target);