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
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Card from "@material-ui/core/Card";

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
	let root = `https://batch.libretexts.org/print/${props.format}/Finished/`;
	if (props.item.zipFilename)
		root += props.item.zipFilename.replace('/Full.pdf', '');
	
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};
	return (
		<div>
			<Button onClick={handleClickOpen}>Learn More</Button>
			<Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
				<DialogTitle id="customized-dialog-title" onClose={handleClose}>
					{props.item.title}
				</DialogTitle>
				<DialogContent dividers style={{whiteSpace: 'pre-wrap'}}>
					<Typography className='entryInstitution' gutterBottom>
						<img src={`https://libretexts.org/img/LibreTexts/glyphs/${props.item.subdomain}.png`}
						     className='libraryIcon' alt=""/>
						{props.item.institution || ''}
					</Typography>
					<Typography className='entryTitle'>
						{props.item.title}
					</Typography>
					<div key="front" className='textBack'>
						<a href={props.item.link} className={'mt-icon-hyperlink'} target='_blank'>Online</a>
						<a href={`${root}/Full.pdf`} className={'mt-icon-file-pdf'}
						   target='_blank'>PDF</a>
						<a href={`${root}/LibreText.imscc`} className={'mt-icon-graduation'}
						   target='_blank'>LMS</a>
						<a href={`${root}/Individual.zip`} className={'mt-icon-file-zip'}
						   target='_blank'>Individual ZIP</a>
						<a href={`https://libretexts.org/bookstore/single.html?${props.item.subdomain}-${props.item.id}`} className='mt-icon-cart2' target='_blank'>Buy Paper Copy</a>
						<a href={`${root}/Publication.zip`} className={'mt-icon-book3'}
						   target='_blank'>Print Book Files</a>
					</div>
					{JSON.stringify(props, null, 2)}
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={handleClose} color="primary">
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}