import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import Paper from "@material-ui/core/Paper";
import {makeStyles} from '@material-ui/core/styles';
import {ThemeProvider} from "@material-ui/styles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {grey} from "@material-ui/core/colors";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";


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
const urlParams = new URLSearchParams(window.location.search);
const orderID = urlParams.get('order');

const steps = [{status: 'VERIFIED', name: 'RECEIVED', message: 'Order received by LibreTexts'},
	{status: 'CREATED', name: 'UPLOADED TO LULU', message: 'Order uploaded to Lulu for publishing'},
	{status: 'UNPAID', name: 'WAITING MANUAL APPROVAL', message: 'Waiting on manual approval before proceeding'},
	// {status: 'PAYMENT_IN_PROGRESS', name: 'PAYMENT CONFIRMATION'},
	// {status: 'PRODUCTION_DELAYED', name: 'PRE-PRODUCTION VERIFICATION'},
	{status: 'PRODUCTION_READY', message: 'Order queued for printing'},
	{status: 'IN_PRODUCTION'},
	{status: 'SHIPPED'}];


export default function GetOrder(props) {
	const [order, setOrder] = React.useState();
	
	useEffect(() => {
		(async function () {
			try {
				if (orderID) {
					let session = await fetch(`https://api.libretexts.org/bookstore/get-order?sessionId=${orderID}`);
					session = await session.json();
					
					switch (session.status) {
						case 'PAYMENT_IN_PROGRESS':
						case 'PRODUCTION_DELAYED':
							session.status = 'PRODUCTION_READY';
							break;
					}
					
					setOrder(session);
				}
			} catch (e) {
				console.log('Error when fetching Checkout session', e);
			}
		})();
	}, []);
	
	const dark = localStorage.getItem('darkMode') === 'true';
	const theme = createMuiTheme({
		palette: {
			type: dark ? 'dark' : 'light',
			primary: {main: '#008000'},
			secondary: {main: '#127bc4'},
			default: grey,
		},
	});
	if (!orderID) {
		return <h1>No order ID found. Please add ?order=[[[orderID]]] to the url to pull up your order.
		</h1>
	}
	else if (!order)
		return <h1>Fetching Order {orderID}</h1>
	else {
		const selected = steps.find(item => item.status === order.status);
		const selectedIndex = steps.findIndex(item => item.status === order.status);
		if (!selected)
			return <ThemeProvider theme={theme}>
				<Paper id='GetOrder'>
					<h2>An error has been found with your order lookup.</h2>
					<h3><b>{order.lulu.status.name}:</b> <i>{order.lulu.status.message}</i></h3>
					<p>If this is not expected, please contact info@libretexts.org to resolve this issue. Please
						include your order ID [{orderID}] as part of your email.</p>
				</Paper>
			</ThemeProvider>
		else
			return <ThemeProvider theme={theme}>
				<Paper id='GetOrder'>
					<Stepper activeStep={selectedIndex} alternativeLabel>
						{steps.map((item) => {
							let label = item.name || item.status;
							label = label.replace(/_/g, ' ');
							return <Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						})}
					</Stepper>
					<h2>{selected.message || order.lulu.status.message}</h2>
					<pre>
				{JSON.stringify(order, null, 2)}
			</pre>
				</Paper>
			</ThemeProvider>
	}
}


ReactDOM.render(<GetOrder/>, target);