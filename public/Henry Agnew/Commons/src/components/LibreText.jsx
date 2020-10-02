import React, {useEffect} from 'react';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import {withStyles} from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";

export default function LibreText(props) {
	const [open, setOpen] = React.useState(false);
	const [pageData, setPageData] = React.useState(undefined);
	let root = `https://batch.libretexts.org/print/Letter/Finished/`;
	const thumbnail = `https://${props.item.subdomain}.libretexts.org/@api/deki/pages/${props.item.altID || props.item.id}/files/=mindtouch.page%2523thumbnail`
	if (props.item.zipFilename)
		root += props.item.zipFilename.replace('/Full.pdf', '');
	
	
	const handleClickOpen = () => {
		const fetchData = async () => {
			const result = await LibreTexts.getAPI(props.item.link)
			setPageData(result);
			setOpen(true);
		};
		fetchData();
	};
	const handleClose = () => {
		setOpen(false);
	};
	
	return <div className='Text CommonsEntry'>
		<Card className='textSide' onClick={handleClickOpen}>
			<img loading="lazy" className='coverImage' alt=""
			     onError={(e) => {
				     e.target.onerror = null;
				     e.target.src = 'https://chem.libretexts.org/@api/deki/files/239314/default.png';
				     // e.target.style.display = 'none'
			     }}
			     src={thumbnail}/>
			
			<div className='entryContent'>
				<CardContent>
					<Typography className='entryInstitution' gutterBottom>
						<img src={`https://libretexts.org/img/LibreTexts/glyphs/${props.item.subdomain}.png`}
						     className='libraryIcon' alt=""/>
						{props.item.location === 'Courses' ? props.item.institution : ''}
					</Typography>
					<Typography className='entryTitle'>
						{props.item.title}
					</Typography>
				</CardContent>
			</div>
			<Typography className='entryAuthor'>
				{props.item.author || ''}
			</Typography>
		</Card>
		<LearnMore {...props}/>
	</div>;
	
	function LearnMore(props) {
		const summary = pageData?.properties?.find(item => item.name === "mindtouch.page#overview")?.value;
		
		useEffect(() => {
			if (open)
				LibreTexts.TOC(props.item.link, "#Commons-TOC");
		}, []);
		
		return (
			<Dialog id="Commons-Learn-More" onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
				<DialogTitle onClose={handleClose}>
					{props.item.title}
				</DialogTitle>
				<DialogContent dividers
				               style={{
					               whiteSpace: 'pre-wrap',
					               display: 'flex',
					               overflowY: "auto",
					               justifyContent: 'space-around'
				               }}>
					<Card style={{padding: 10, minWidth: '33%', overflowX: "auto"}}>
						<div>
							<Typography className='entryInstitution' gutterBottom>
								<img
									src={`https://libretexts.org/img/LibreTexts/glyphs/${props.item.subdomain}.png`}
									className='libraryIcon' alt=""/>
								{props.item.institution || ''}
							</Typography>
							<img loading={"lazy"} className='coverImage' alt=""
							     onError={(e) => {
								     e.target.onerror = null;
								     e.target.src = 'https://chem.libretexts.org/@api/deki/files/239314/default.png';
								     // e.target.style.display = 'none'
							     }}
							     src={thumbnail}/>
							
							<Typography className='entryTitle'>
								{props.item.title}
							</Typography>
						</div>
						<div key="front" className='textBack'>
							<a href={props.item.link} className={'mt-icon-hyperlink'} target='_blank'>View Online</a>
							<a href={`${root}/Full.pdf`} className={'mt-icon-file-pdf'}
							   target='_blank'>Download PDF</a>
							<a href={`${root}/LibreText.imscc`} className={'mt-icon-graduation'}
							   target='_blank'>LMS</a>
							<a href={`${root}/Individual.zip`} className={'mt-icon-file-zip'}
							   target='_blank'>Individual ZIP</a>
							<a href={`https://libretexts.org/bookstore/single.html?${props.item.subdomain}-${props.item.id}`}
							   className='mt-icon-cart2' target='_blank'>Buy Print Copy</a>
							<a href={`${root}/Publication.zip`} className={'mt-icon-book3'}
							   target='_blank'>Print Book Files</a>
						</div>
					
					</Card>
					<div style={{padding: 10, fontSize: "large", overflowX: "auto"}}>
						<Accordion defaultExpanded={summary}>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon/>}
								aria-controls="panel1a-content">
								<Typography>Summary</Typography>
							</AccordionSummary>
							<AccordionDetails style={{overflowX: "auto"}}>
								<Typography>
									{summary || "No Summary Given"}
								</Typography>
							</AccordionDetails>
						</Accordion>
						<Accordion>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon/>}
								aria-controls="panel2a-content">
								<Typography>Table of Contents</Typography>
							</AccordionSummary>
							<AccordionDetails style={{overflowX: "auto"}}>
								<div id="Commons-TOC"></div>
							</AccordionDetails>
						</Accordion>
						<Accordion>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon/>}
								aria-controls="panel3a-content">
								<Typography>Book Preview</Typography>
							</AccordionSummary>
							<AccordionDetails style={{overflowX: "auto"}}>
								<a href={`${root}/Full.pdf`} className={'mt-icon-file-pdf'}
								   target='_blank'>Download Full PDF
								<iframe src={`${root}/Full.pdf?view=true`} height={500}/>
								</a>
							</AccordionDetails>
						</Accordion>
						{/*<Accordion>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon/>}
								aria-controls="panel3a-content">
								<Typography>More Details</Typography>
							</AccordionSummary>
							<AccordionDetails style={{overflowX: "auto"}}>
								{JSON.stringify(pageData, null, 2)}
							</AccordionDetails>
						</Accordion>*/}
					</div>
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={handleClose} color="primary">
						Close
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

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