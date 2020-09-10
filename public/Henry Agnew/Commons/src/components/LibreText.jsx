import React from 'react';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import LearnMore from "./LearnMore.jsx";

export default function LibreText(props) {
	
	let bookstore = props.item.tags.find(elem => elem.startsWith('store:'));
	if (bookstore)
		bookstore = bookstore.split('store:')[1];
	
	return <div className='Text CommonsEntry'>
		<Card className='textSide'>
			<img loading={"lazy"} className='coverImage' alt=""
			     onError={(e) => {
				     e.target.onerror = null;
				     e.target.style.display = 'none'
			     }}
			     src={`https://${props.item.subdomain}.libretexts.org/@api/deki/pages/${props.item.id}/files/=mindtouch.page%2523thumbnail`}/>
			
			<div className='entryContent'>
				<CardContent>
					<Typography className='entryInstitution' gutterBottom>
						<img src={`https://libretexts.org/img/LibreTexts/glyphs/${props.item.subdomain}.png`}
						     className='libraryIcon' alt=""/>
						{props.item.institution || ''}
					</Typography>
					<Typography className='entryTitle'>
						{props.item.title}
					</Typography>
				</CardContent>
			</div>
			<Typography className='entryAuthor'>
				{props.item.author || ''}
			</Typography>
			<CardActions>
				<LearnMore {...props}/>
			
			</CardActions>
		</Card>
	</div>
}
