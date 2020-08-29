import React from 'react';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";

export default function LibreText(props) {
	let root = `https://batch.libretexts.org/print/${props.format}/Finished/`;
	if (props.item.zipFilename)
		root += props.item.zipFilename.replace('/Full.pdf', '');
	
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
				<a href={`https://chem.libretexts.org/Courses/Remixer_University/Bookstore_Single?${props.item.subdomain}-${props.item.id}`}><Button>Test
					Buy Book</Button></a>
				{/*<Lulu {...props}/>*/}
			
			</CardActions>
			{/*<div key="front" className='textSide textBack'>
						<a href={props.item.link} className={'mt-icon-hyperlink'} target='_blank'>Online</a>
						<a href={`${root}/Full.pdf`} className={'mt-icon-file-pdf'}
						   target='_blank'>PDF</a>
						<a href={`${root}/LibreText.imscc`} className={'mt-icon-graduation'}
						   target='_blank'>LMS</a>
						{isAdmin ? <a onClick={() => {
							if (confirm('This will compile all of the pages and will take quite a while. Are you sure?')) {
								batch(props.item.link)
							}
						}} href='#' className={'mt-icon-spinner6'}>Compile Full</a> : ''}
						<a href={`${root}/Individual.zip`} className={'mt-icon-file-zip'}
						   target='_blank'>Individual ZIP</a>
						{bookstore ?
							<a href={bookstore} className='mt-icon-cart2' target='_blank'>Buy Paper Copy</a> : ''}
						<a href={`${root}/Publication.zip`} className={'mt-icon-book3'}
						   target='_blank'>Print Book Files</a>
					</div>*/}
		</Card>
	</div>
}
