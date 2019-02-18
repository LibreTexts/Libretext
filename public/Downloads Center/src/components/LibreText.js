import React from 'react';
import ReactCardFlip from 'react-card-flip';


export default class LibreText extends React.Component {
	constructor() {
		super();
		this.state = {isFlipped: true};
		this.handleClick = this.handleClick.bind(this);
		
	}
	
	handleClick(state) {
		if (!this.props.item.title.toLowerCase().includes('coming soon'))
			this.setState({isFlipped: !state});
	}
	
	render() {
		if (this.props.item.finished)
			this.props.item.finished = this.props.item.finished.replace('/Full.pdf', '');
		return (
			<div className='Text' onMouseEnter={() => this.handleClick(true)}
			     onMouseLeave={() => this.handleClick(false)}>
				<ReactCardFlip isFlipped={this.state.isFlipped}>
					<div key="back" className='textSide textFront'>
						<div style={{flex: 2}}><h5>{this.props.item.title}</h5></div>
						<div style={{flex: 1}}>{this.props.item.author || ''}<br/>{this.props.item.institution || ''}
						</div>
					</div>
					
					
					<div key="front" className='textSide textBack'>
						<a href={this.props.item.url} className={'mt-icon-hyperlink'} target='_blank'>Online</a>
						<a href={`${this.props.item.finished}/Full.pdf`} className={'mt-icon-file-pdf'}
						   target='_blank'>PDF</a>
						<a href={`${this.props.item.finished}/imsmanifest.xml`} className={'mt-icon-graduation'}
						   target='_blank'>LMS</a>
						<a href={`${this.props.item.finished}/Individual.zip`} className={'mt-icon-file-zip'}
						   target='_blank'>Individual ZIP</a>
						<a href={`${this.props.item.finished}/Publication.zip`} className={'mt-icon-book3'}
						   target='_blank'>Print
						                   Book
						                   Files</a>
					</div>
				</ReactCardFlip>
			</div>
		)
	}
}