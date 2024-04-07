import React from 'react';
import './BasicTab.css';

const BasicTab = props => {
  // TODO: Add close button that switches to canvas
  return (
    <div className='BasicTab'>
      <h1 className='BasicTab__title'>{props.title}</h1>
      {props.children}
    </div>
  );
}

export default BasicTab;
