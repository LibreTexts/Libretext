import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";

const styles = (theme) => ({
	root: {
		margin: 0,
		padding: theme.spacing(2),
	},
	closeButton: {
		position: 'absolute',
		right: theme.spacing(1),
		top: theme.spacing(1),
		color: theme.palette.grey[500],
	},
});

const DialogTitle = withStyles(styles)((props) => {
	const {children, classes, onClose, ...other} = props;
	return (
		<MuiDialogTitle disableTypography className={classes.root} {...other}>
			<Typography variant="h6">{children}</Typography>
			{onClose ? (
				<IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
					<CloseIcon/>
				</IconButton>
			) : null}
		</MuiDialogTitle>
	);
});

const DialogContent = withStyles((theme) => ({
	root: {
		padding: theme.spacing(2),
	},
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
	root: {
		margin: 0,
		padding: theme.spacing(1),
	},
}))(MuiDialogActions);

export default function CustomizedDialogs(props) {
	const [open, setOpen] = React.useState(false);
	const [hardcover, setHardcover] = React.useState(false);
	const [color, setColor] = React.useState(false);
	let source = `https://test.libretexts.org/hagnew/development/public/Henry%20Agnew/Commons`
	
	let totalCost = 0.03 * props.item.numPages + 1.69;
	const colorCost = props.item.numPages * 1.5 / 100;
	if (hardcover)
		totalCost += 7.35
	if (color)
		totalCost += colorCost;
	
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};
	return (
		<div>
			<Button onClick={handleClickOpen}>[{props.item.numPages}] Buy for
				${(0.03 * props.item.numPages + 1.69).toFixed(2)}</Button>
			<Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
				<DialogTitle id="customized-dialog-title" onClose={handleClose}>
					{props.item.title}
				</DialogTitle>
				{/*<DialogContent dividers style={{whiteSpace: 'pre-wrap'}}>
					{JSON.stringify(props, null, 2)}
				</DialogContent>*/}
				<DialogContent className='orderForm'>
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
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={handleClose} color="primary">
						Add to Cart (${(totalCost).toFixed(2)})
					</Button>
					<Button autoFocus onClick={handleClose} color="primary">
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}