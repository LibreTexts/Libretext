import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import {makeStyles} from '@material-ui/core/styles';
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import CircularProgress from "@material-ui/core/CircularProgress";


const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

const useStyles = makeStyles({
	flexToggleGroup: {
		display: 'flex',
		'& .MuiToggleButtonGroup-grouped': {
			flex: 1
		}
	},
});

function LuluStandalone(props) {
	const [hardcover, setHardcover] = React.useState(false);
	const [color, setColor] = React.useState(false);
	const [shippingSpeed, setShippingSpeed] = React.useState('MAIL');
	const [shippingData, setShippingData] = React.useState([]);
	const [quantity, setQuantity] = React.useState(1);
	const [stripe, setStripe] = React.useState();
	const [isProcessing, setIsProcessing] = React.useState(false);
	
	
	let source = `https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Commons`
	let validPrice = shippingData.length;
	const classes = useStyles();
	
	
	
	let totalCost = 0.03 * props.item.numPages + 1.69;
	const colorCost = props.item.numPages * 1.5 / 100;
	if (hardcover)
		totalCost += 7.35
	if (color)
		totalCost += colorCost;
	totalCost *= quantity;
	if (shippingData.length) {
		for (const item of shippingData) {
			if (item.level === shippingSpeed) {
				totalCost += parseFloat(item.cost_excl_tax);
				break;
			}
		}
	}
	
	useEffect(() => {
		(async function () {
			try {
				let pubKey = await fetch(`/stripeInitialize`);
				pubKey = await pubKey.json()
				window.config = pubKey;
				setStripe(Stripe(pubKey.publicKey));
			} catch (e) {
				console.error(e)
			}
		})();
	}, []);
	
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
				<ToggleButtonGroup
					className={classes.flexToggleGroup}
					orientation="vertical"
					value={shippingSpeed}
					exclusive
					onChange={(e, v) => {
						if (v !== null) setShippingSpeed(v)
					}}>
					{shippingData.map(item => <ToggleButton key={item.level} value={item.level} aria-label="list"
					                                        style={{display: "flex", justifyContent: "space-between"}}>
						{item.level} [{item.total_days_min}-{item.total_days_max} days] ${item.cost_excl_tax}
					</ToggleButton>)}
				</ToggleButtonGroup>
			</>
		}
	}
	
	function setQuantityInternal(newQuant) {
		if (newQuant > 1000)
			newQuant = 1000;
		if (newQuant > 0) {
			setQuantity(newQuant);
			setShippingData([]);
		}
	}
	
	function createCheckoutSession() {
		setIsProcessing(true);
		return fetch('/create-lulu-checkout-session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				shoppingCart: [{
					metadata: props.item,
					hardcover: hardcover,
					color: color,
					quantity: quantity,
				}],
				shippingSpeed: shippingSpeed,
			}),
		}).then(function (result) {
			setIsProcessing(false);
			return result.json();
		});
	}
	
	return <Paper className='orderForm'>
		<div style={{display: "flex", flexWrap: "wrap", padding: 20,}}>
			<div style={{display: "flex", flexDirection: "column", flex: 1}}>
				<img
					src={`https://${props.library}.libretexts.org/@api/deki/pages/${props.item.id}/files/=mindtouch.page%2523thumbnail`}/>
				<h2>{props.item.title} - Print Edition</h2>
				<h3><a href={props.item.link}>Link to the always Free Online Edition</a></h3>
				<h3>Item [{props.item.zipFilename}]. Number of pages: {props.item.numPages}</h3>
				{/*<p style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(props.item, null, 2)}</p>*/}
			</div>
			<Paper style={{display: "flex", flexDirection: "column", margin: 10, padding: 10}}>
				<ToggleButtonGroup className={classes.flexToggleGroup}
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
					className={classes.flexToggleGroup}
					value={color}
					exclusive
					onChange={(e, v) => {
						if (v !== null) setColor(v)
					}}>
					<ToggleButton value={false} aria-label="black and white option">
						Black and White
					</ToggleButton>
					<ToggleButton value={true} aria-label="color option">
						Color (+${Math.ceil(colorCost)})
					</ToggleButton>
				</ToggleButtonGroup>
				<Divider/>
				<div style={{display: "flex", justifyContent: 'space-around'}}>
					<Button onClick={() => setQuantityInternal(quantity - 1)} color='secondary'
					        variant='contained'><RemoveIcon/></Button>
					<TextField
						id="standard-quantity"
						label="Quantity"
						// helperText="Quantity limited to 1-1000"
						type="number"
						value={quantity}
						InputLabelProps={{
							shrink: true,
						}}
						onChange={(e) => setQuantityInternal(e.target.value)}
					/>
					<Button onClick={() => setQuantityInternal(quantity + 1)} color='secondary'
					        variant='contained'><AddIcon/></Button>
				</div>
			</Paper>
			<Paper style={{display: "flex", flexDirection: "column", margin: 10, padding: 10}}>
				<h3>Shipping Speed</h3>
				{renderShipping()}
				<p>Shipping currently only available to the continental US (US-48)</p>
			</Paper>
		</div>
		<p>Finalized prices will be calculated on the next page. These may be slightly different than this estimate.</p>
		<Button autoFocus color="primary" variant='contained' disabled={!validPrice} style={{width: '100%'}}
		        onClick={() => {
			        createCheckoutSession().then(function (data) {
				        if (data && data.sessionId)
					        stripe.redirectToCheckout({
						        sessionId: data.sessionId,
					        })
						        .then(function (result) {
							        if (result.error) {
								        alert(result.error.message);
							        }
						        });
			        });
		        }}>
			Buy for ${(totalCost).toFixed(2)}
		</Button>
		<Dialog open={isProcessing} aria-labelledby="form-dialog-title">
			<DialogTitle id="form-dialog-title">Verifying your Shopping Cart
			</DialogTitle>
			<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
				<CircularProgress size={100}/>
			</DialogContent>
		</Dialog>
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