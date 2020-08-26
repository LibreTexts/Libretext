import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";


const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

function LuluStandalone(props) {
	const [hardcover, setHardcover] = React.useState(false);
	const [color, setColor] = React.useState(false);
	const [shippingSpeed, setShippingSpeed] = React.useState('MAIL');
	const [shippingData, setShippingData] = React.useState([]);
	const [quantity, setQuantity] = React.useState(1);
	let source = `https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Commons`
	let validPrice = shippingData.length;
	
	let totalCost = 0.03 * props.item.numPages + 1.69;
	const colorCost = props.item.numPages * 1.5 / 100;
	if (hardcover)
		totalCost += 7.35
	if (color)
		totalCost += colorCost;
	if (shippingData.length) {
		for (const item in shippingData) {
			if (item.level === shippingSpeed) {
				totalCost += item.cost_excl_tax;
				break;
			}
		}
	}
	
	useEffect(() => {
		(async function () {
			try {
				let shipping = await fetch(`https://api.lulu.com/print-shipping-options?iso_country_code=US&state_code=US-CA&quantity=${quantity}&pod_package_id=0850X1100BWSTDCW060UW444MXX`, {
					headers: {
						// 'Cache-Control': 'no-cache',
						'Content-Type': 'application/json'
					}
				});
				shipping = await shipping.json()
				shipping = shipping.results.sort((a, b) => b.cost_excl_tax - a.cost_excl_tax);
				setShippingData(shipping)
			} catch (e) {
				console.error(e)
			}
		})();
	}, [quantity]);
	
	function renderShipping() {
		if (!shippingData.length)
			return <>
				<p>Loading shipping information...</p>
			</>;
		else {
			return <>
				<h3>Shipping Speed</h3>
				<ToggleButtonGroup
				orientation="vertical"
				value={shippingSpeed}
				exclusive
				onChange={(e, v) => {
					if (v !== null) setShippingSpeed(v)
				}}>
				{shippingData.map(item => <ToggleButton key={item.level} value={item.level} aria-label="list">
					{item.level} {item.total_days_min} {item.total_days_max} ${item.cost_excl_tax}
				</ToggleButton>)}
			</ToggleButtonGroup>
				<p>Shipping currently only available to the continental US (US-48)</p>
			</>
		}
	}
	
	function setQuantityInternal(newQuant) {
		if (newQuant > 0)
			setQuantity(newQuant);
		setShippingData([]);
	}
	
	return <Paper className='orderForm'>
		<div style={{display: "flex", padding: 10,}}>
			<div style={{display: "flex", flexDirection: "column"}}>
				<img
					src={`https://${props.library}.libretexts.org/@api/deki/pages/${props.item.id}/files/=mindtouch.page%2523thumbnail`}/>
			</div>
			<Paper style={{display: "flex", flexDirection: "column", margin: 10, padding: 10}}>
				<ToggleButtonGroup
					value={hardcover}
					exclusive
					onChange={(e, v) => {
						if (v !== null) setHardcover(v)
					}}>
					<ToggleButton value={false} aria-label="paperback cover option">
						<img src={`${source}/images/PB.webp`}/>
						<p>Paperback</p>
					</ToggleButton>
					<ToggleButton value={true} aria-label="hardcover option">
						<img src={`${source}/images/CW.webp`}/>
						<p>Hardcover (+$7)</p>
					</ToggleButton>
				</ToggleButtonGroup>
				<ToggleButtonGroup
					value={color}
					exclusive
					onChange={(e, v) => {
						if (v !== null) setColor(v)
					}}
					style={{display: 'block'}}>
					<ToggleButton value={false} aria-label="black and white option">
						Black and White
					</ToggleButton>
					<ToggleButton value={true} aria-label="color option">
						Color (+${Math.ceil(colorCost)})
					</ToggleButton>
				</ToggleButtonGroup>
				<div>
					<Button onClick={() => setQuantityInternal(quantity - 1)}>-</Button>
					<TextField
						id="standard-number"
						label="Number"
						type="number"
						value={quantity}
						InputLabelProps={{
							shrink: true,
						}}
						onChange={(e) => setQuantityInternal(e.target.value)}
					/>
					<Button onClick={() => setQuantityInternal(quantity + 1)}>+</Button>
				</div>
				{renderShipping()}
			</Paper>
		</div>
		<Button autoFocus color="primary" variant='contained' disabled={!validPrice}>
			Buy for ${(totalCost).toFixed(2)}
		</Button>
		<p>Finalized prices will be calculated on the next page. These may be slightly different than this estimate.</p>
	</Paper>
	
}


ReactDOM.render(<LuluStandalone library={'chem'} item={{
	"zipFilename": "chem-8787",
	"title": "CHEM 300\nBeginning Chemistry",
	"id": "8787",
	"institution": "Sacramento City College",
	"link": "https://chem.libretexts.org/Courses/Sacramento_City_College/SCC%3A_CHEM_300_-_Beginning_Chemistry/SCC%3A_CHEM_300_-_Beginning_Chemistry_(Alviar-Agnew)",
	"tags": ["article:topic-category", "coverpage:yes", "lulu@CHEM 300\\\\Beginning Chemistry@@Sacramento City College@Beginning Chemistry", "luluCover@https://chem.libretexts.org/@api/deki/files/207535/SCC-LOGO-HORIZONTAL-COLOR.png", "showtoc:no", "store:https://books.libretexts.org/collections/sacramento-city-college/products/scc-chem-300-general-organic-and-biochemistry-bennett"],
	"failed": false,
	"numPages": 589,
	"subdomain": "chem"
}}/>, target);