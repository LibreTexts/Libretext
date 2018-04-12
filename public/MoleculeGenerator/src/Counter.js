import React, { Component } from 'react';

export default class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = { counter: 0 };
  }

  componentDidMount() {
    this.interval = setInterval(this.tick.bind(this), 1000);
  }

  tick() {
    this.setState({ counter: this.state.counter + 1 });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    var result =[];
    for(var i=1; i<=this.state.counter; i++){
      result.push(<div>{i}</div>);
  }
    return <h2>Counter: {this.state.counter}{result}</h2>;
  }
}
