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
		return (
			<div className='Text' onMouseEnter={()=>this.handleClick(true)} onMouseLeave={()=>this.handleClick(false)}>
			<ReactCardFlip isFlipped={this.state.isFlipped}>
				<div key="back" className='side'>
					{this.props.item.name}
				</div>
				
				
				<div key="front" className='side'>
					<a href={`${this.props.item.url}/Full.pdf`} target='_blank'>Full</a>
					<a href={`${this.props.item.url}/imsmanifest.xml`} target='_blank'>LMS</a>
					<a href={`${this.props.item.url}/LuluCover.pdf`} target='_blank'>Cover</a>
					<a href={`${this.props.item.url}/Lulu.pdf`} target='_blank'>Lulu</a>
				</div>
			</ReactCardFlip>
			</div>
		)
	}
}