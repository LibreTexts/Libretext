import React from 'react';

export default function Layout({ children }) {
  return (
    <div style={{backgroundColor:"lightblue"}}>
      <h1>Hello, World!</h1>
      {children}
    </div>
  );
}
