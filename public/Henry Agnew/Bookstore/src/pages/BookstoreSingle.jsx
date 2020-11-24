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
import {ThemeProvider} from "@material-ui/styles";
import {grey} from "@material-ui/core/colors";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {IconFlagCA, IconFlagUS,} from 'material-ui-flags';
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";


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

function BookstoreSingle(props) {
	const [hardcover, setHardcover] = React.useState(false);
	const [color, setColor] = React.useState(false);
	const [shippingSurcharge, setShippingSurcharge] = React.useState(false);
	const [shippingSpeed, setShippingSpeed] = React.useState('MAIL');
	const [shippingData, setShippingData] = React.useState([]);
	const [shippingLocation, setShippingLocation] = React.useState('US');
	const [quantity, setQuantity] = React.useState(1);
	const [stripe, setStripe] = React.useState();
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [loaderProgress, setLoaderProgress] = React.useState(0);
	
	
	const fileSource = `https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Bookstore`;
	const APIendpoint = `https://api.libretexts.org/bookstore${window.location.href.includes('/beta/') ? '/beta' : ''}`
	let validPrice = shippingData.length;
	const classes = useStyles();
	
	
	const taxesMultiplier = 1.2;
	const HI_AK_surcharge = {name: 'Hawaii/Alaska', price: 4};
	const baseCost = (0.03 * props.item.numPages + 1.69) * taxesMultiplier; //cost from Lulu API
	let totalCost = baseCost;
	const colorCost = (props.item.numPages * 1.5 / 100) * taxesMultiplier; //cost from Lulu API
	if (hardcover)
		totalCost += 7.35 * taxesMultiplier;
	if (color)
		totalCost += colorCost;
	const bookCost = totalCost;
	totalCost *= quantity;
	if (shippingData.length) {
		for (const item of shippingData) {
			if (item.level === shippingSpeed) {
				totalCost += (parseFloat(item.cost_excl_tax) * taxesMultiplier);
				break;
			}
		}
	}
	totalCost += shippingSurcharge?.price || 0;
	
	useEffect(() => {
		(async function () {
			try {
				let pubKey = await fetch(APIendpoint + `/stripeInitialize`);
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
				let shipping;
				switch (shippingLocation) {
					case "CA":
						shipping = 'iso_country_code=CA';
						break;
					case "US":
					default:
						shipping = 'iso_country_code=US&state_code=US-CA';
				}
				shipping = await fetch(`https://api.lulu.com/print-shipping-options?${shipping}&quantity=${quantity}&pod_package_id=0850X1100BWSTDCW060UW444MXX`, {
					headers: {
						// 'Cache-Control': 'no-cache',
						'Content-Type': 'application/json'
					}
				});
				shipping = await shipping.json()
				shipping = shipping.results.sort((a, b) => b.cost_excl_tax - a.cost_excl_tax);
				setShippingData(shipping)
				setShippingSurcharge(false);
			} catch (e) {
				console.error(e)
			}
		})();
	}, [quantity, shippingLocation]);
	
	React.useEffect(() => {
		const timer = setInterval(() => {
			setLoaderProgress((prevProgress) => {
				let inc = Math.round(Math.random() * 20);
				return (prevProgress >= 100 ? 100 : prevProgress + inc)
			});
		}, 1200);
		return () => {
			clearInterval(timer);
		};
	}, []);
	
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
					{shippingData.map(item => {
						let localLevel = item.level;
						switch (localLevel) {
							case "GROUND_HD":
								localLevel = "GROUND_HOME";
								break;
							case "GROUND_BUS":
								localLevel = "GROUND_BUSINESS";
								break;
						}
						
						return <ToggleButton key={item.level} value={item.level}
						                     aria-label="list"
						                     style={{
							                     display: "flex",
							                     justifyContent: "space-between"
						                     }}>
							[Arrives in {item.total_days_min}-{item.total_days_max} days] <b>
							${(item.cost_excl_tax * taxesMultiplier + (shippingSurcharge?.price || 0)).toFixed(2)}</b>
							&nbsp;<i>{localLevel}</i>
						</ToggleButton>
					})}
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
		setLoaderProgress(0);
		return fetch(APIendpoint + '/create-lulu-checkout-session', {
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
				shippingLocation: shippingLocation,
				shippingSurcharge: shippingSurcharge
			}),
		}).then(function (result) {
			setIsProcessing(false);
			return result.json();
		});
	}
	
	const dark = localStorage.getItem('darkMode') === 'true';
	const theme = createMuiTheme({
		palette: {
			type: dark ? 'dark' : 'light',
			primary: {main: '#008000'},
			secondary: {main: '#127bc4'},
			default: grey,
		},
	});
	
	function renderShippingLocation() {
		return <Select value={shippingLocation} onChange={(event) => setShippingLocation(event.target.value)}>
			<MenuItem value={'US'}><IconFlagUS/>United States</MenuItem>
			<MenuItem value={'CA'}><IconFlagCA/>Canada</MenuItem>
		</Select>
	}
	
	return <ThemeProvider theme={theme}>
		<Paper className='orderForm' id='bookstoreSingle'>
			<div>
				<Paper className='bookstoreColumn'>
					<h3>{props.item.title}</h3>
					<img
						src={`https://${props.library}.libretexts.org/@api/deki/pages/${props.item.id}/files/=mindtouch.page%2523thumbnail`}/>
					<p>{props.item.author}</p>
					<p>{props.item.institution}</p>
					<p>Bookstore Identifier: {props.item.zipFilename}</p>
					<p>Number of pages: {props.item.numPages}</p>
					<Divider/>
					<div style={{display: "flex", justifyContent: 'space-around'}}>
						<Button onClick={() => setQuantityInternal(quantity - 1)}
						        color='secondary'><RemoveIcon/></Button>
						<TextField
							id="standard-quantity"
							label="Quantity"
							// helperText="Quantity limited to 1-1000"
							type="number"
							value={quantity}
							variant='outlined'
							InputLabelProps={{
								shrink: true,
							}}
							onChange={(e) => setQuantityInternal(parseInt(e.target.value))}
						/>
						<Button onClick={() => setQuantityInternal(quantity + 1)} color='secondary'><AddIcon/></Button>
					</div>
					{/*<p style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(props.item, null, 2)}</p>*/}
				</Paper>
				<Paper className='bookstoreColumn'>
					<h3>Select Printing Options</h3>
					<p>Base cost: ${baseCost.toFixed(2)}</p>
					<ToggleButtonGroup className={classes.flexToggleGroup}
					                   value={hardcover}
					                   exclusive
					                   onChange={(e, v) => {
						                   if (v !== null) setHardcover(v)
					                   }}>
						<ToggleButton value={false} aria-label="paperback cover option"
						              style={{alignItems: 'flex-start'}}>
							<img src={`${fileSource}/images/PB.jpg`}/>
							<div>Paperback</div>
						</ToggleButton>
						<ToggleButton value={true} aria-label="hardcover option" style={{alignItems: 'flex-start'}}>
							<img src={`${fileSource}/images/CW.jpg`}/>
							<div>Hardcover (+$8)</div>
						</ToggleButton>
					</ToggleButtonGroup>
					<Divider/>
					<ToggleButtonGroup
						className={classes.flexToggleGroup}
						value={color}
						exclusive
						onChange={(e, v) => {
							if (v !== null) setColor(v)
						}}>
						<ToggleButton value={false} aria-label="black and white option">
							Grayscale pages
						</ToggleButton>
						<ToggleButton value={true} aria-label="color option">
							Full Color pages (+${Math.ceil(colorCost)})
						</ToggleButton>
					</ToggleButtonGroup>
					<Divider/>
					<p>Subtotal: ${bookCost.toFixed(2)} x {quantity} = ${(bookCost * quantity).toFixed(2)}</p>
				</Paper>
				<Paper className='bookstoreColumn'>
					<div style={{display: "flex", justifyContent: "space-between"}}>
						<h3>Select Shipping Option</h3>{renderShippingLocation()}
					</div>
					{shippingLocation === "US" ?
						<FormControlLabel
							value="end"
							control={<Checkbox color="secondary" checked={Boolean(shippingSurcharge)} onChange={
								() => setShippingSurcharge(shippingSurcharge ? false : HI_AK_surcharge)
							}/>}
							label={`Hawaii/Alaska surcharge $${HI_AK_surcharge?.price}`}/> : null}
					{renderShipping()}
					<p>Shipping prices are calculated for
					   within {shippingLocation === "CA" ? 'Canada' : 'the United States'}. Contact us at
					   bookstore@libretexts.org for orders outside of this area.</p>
				</Paper>
			</div>
			
			<Button autoFocus color="primary" variant='contained' disabled={!validPrice}
			        style={{width: '80%', fontSize: 20, margin: '1% 10%'}}
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
				Buy Print Copy for ${(totalCost).toFixed(2)}
			</Button>
			<p style={{margin: '0 5%'}}>Final prices on the next page may be slightly different than this estimate due
			                            to localized printing costs. <Tooltip
					title={`Version ${new Date("REPLACEWITHDATE")}`}><span> Coded with ❤</span></Tooltip></p>
			
			<Dialog open={isProcessing} aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Verifying your Shopping Cart
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgressWithLabel value={loaderProgress} size={100}/>
				</DialogContent>
			</Dialog>
		</Paper>
	</ThemeProvider>
}

function BookstoreWrapper() {
	const [library, setLibrary] = React.useState(null);
	const [item, setItem] = React.useState(null);
	
	useEffect(() => {
		(async function () {
			let localLib, localItem, commonsEntries;
			try {
				[, localLib, localItem] = window.location.href.match(/\?([a-z]*)-([0-9]*$)/);
				setLibrary(localLib);
			} catch (e) {
				setLibrary('error');
				return;
			}
			
			try {
				//create path structure
				if (localLib === 'espanol') {
					try {
						let home = await fetch(`https://api.libretexts.org/DownloadsCenter/espanol/home.json`);
						home = await home.json();
						home = home.items.map(item => ({...item, subdomain: localLib}));
						commonsEntries = home;
					} catch (e) {
						console.error(e);
					}
				}
				else {
					try {
						let courses = fetch(`https://api.libretexts.org/DownloadsCenter/${localLib}/Courses.json`);
						let bookshelves = fetch(`https://api.libretexts.org/DownloadsCenter/${localLib}/Bookshelves.json`);
						[courses, bookshelves] = await Promise.all([courses, bookshelves]);
						[courses, bookshelves] = await Promise.all([courses.json(), bookshelves.json()]);
						courses = courses.items.map(item => ({...item, subdomain: localLib}));
						bookshelves = bookshelves.items.map(item => ({...item, subdomain: localLib}));
						commonsEntries = [...courses, ...bookshelves];
					} catch (e) {
						console.error(e);
					}
				}
				for (const entry of commonsEntries) {
					if (entry.id === localItem || entry.altID === localItem) {
						setItem(entry);
						return;
					}
				}
				setItem('error');
			} catch (e) {
				setItem('error');
			}
		})();
		
		
	}, []);
	
	if (library === 'error')
		return <h1>Bookstore error. Invalid querystring. Please try the buy-book link again.</h1>
	else if (item === 'error')
		return <h1>Bookstore error. Item not found in the LibreTexts Commons. Please use a valid buy-book link.</h1>
	else if (library && item) {
		const numPages = parseInt(item.numPages);
		if (numPages < 32)
			return <h1>Bookstore error. Book has less than 32 pages and is too small to print.</h1>
		else if (numPages > 800)
			return <h1>Bookstore error. Book has more than 800 pages and is too big to print.</h1>
		else
			return <BookstoreSingle library={library} item={item}/>
	}
	else
		return <h1>Loading Bookstore...</h1>
	
}

ReactDOM.render(<BookstoreWrapper/>, target);


function CircularProgressWithLabel(props) {
	return (
		<Box position="relative" display="inline-flex">
			<CircularProgress variant="static" {...props} />
			<Box
				top={0}
				left={0}
				bottom={0}
				right={0}
				position="absolute"
				display="flex"
				alignItems="center"
				justifyContent="center"
			>
				<Typography variant="caption" component="div" color="textSecondary">{`${Math.round(
					props.value,
				)}%`}</Typography>
			</Box>
		</Box>
	);
}