import React from 'react';
import ReactCardFlip from 'react-card-flip';


export default class LibreText extends React.Component {
	constructor() {
		super();
		this.state = {isFlipped: true};
		this.handleClick = this.handleClick.bind(this);
		
	}
	
	handleClick(state) {
		this.setState({isFlipped: !state});
	}
	
	render() {
		let isAdmin = document.getElementById('adminHolder').textContent;
		
		let root = `https://batch.libretexts.org/print/${this.props.format}/Finished/`;
		if (this.props.item.zipFilename)
			root += this.props.item.zipFilename.replace('/Full.pdf', '');
		
		let bookstore = this.props.item.tags.find(elem => elem.startsWith('store:'));
		if (bookstore)
			bookstore = bookstore.split('store:')[1];
		
		return (
			<div className='Text' onMouseEnter={() => this.handleClick(true)}
			     onMouseLeave={() => this.handleClick(false)}>
				<ReactCardFlip isFlipped={this.state.isFlipped}>
					<div key="back" className='textSide textFront' style={this.borderStripe()}>
						<div style={{flex: 2}} className='headerFit'>{this.props.item.title}
						</div>
						<div style={{flex: 1}}><i>{this.props.item.author || ''}</i>{this.props.item.institution || ''}
						</div>
					</div>
					
					
					<div key="front" className='textSide textBack'>
						<a href={this.props.item.link} className={'mt-icon-hyperlink'} target='_blank'>Online</a>
						<a href={`${root}/Full.pdf`} className={'mt-icon-file-pdf'}
						   target='_blank'>PDF</a>
						<a href={`${root}/LibreText.imscc`} className={'mt-icon-graduation'}
						   target='_blank'>LMS</a>
						{isAdmin ? <a onClick={() => {
							if (confirm('This will compile all of the pages and will take quite a while. Are you sure?')) {
								batch(this.props.item.link)
							}
						}} href='#' className={'mt-icon-spinner6'}>Compile Full</a> : ''}
						<a href={`${root}/Individual.zip`} className={'mt-icon-file-zip'}
						   target='_blank'>Individual ZIP</a>
						{bookstore ?
							<a href={bookstore} className='mt-icon-cart2' target='_blank'>Buy Paper Copy</a> : ''}
						<a href={`${root}/Publication.zip`} className={'mt-icon-book3'}
						   target='_blank'>Print Book Files</a>
					</div>
				</ReactCardFlip>
			</div>
		)
	}
	
	borderStripe() {
		let color = '#0a446c';
		if (this.props.item.tags.includes('luluPro'))
			color = 'orange';
		else if (this.props.item.link.includes('/Courses/'))
			color = 'yellowgreen';
		else if (this.props.item.link.includes('/Bookshelves/'))
			color = 'slategrey';
		
		return {borderRightColor: color};
	}
}