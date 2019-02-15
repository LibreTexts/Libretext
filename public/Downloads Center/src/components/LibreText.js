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
					Chemistry 2BH,
					Delmar Larsen,
					University of California, Davis
				</div>
				
				
				<div key="front" className='side'>
					This is the back of the card.
				</div>
			</ReactCardFlip>
			</div>
		)
	}
}