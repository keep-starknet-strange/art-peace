import React from 'react';
import './BasicTab.css';
import '../utils/Styles.css';

const BasicTab = (props) => {
  return (
    <div className='BasicTab'>
      <h1 className='Text__xlarge Heading__main BasicTab__title'>
        {props.title}
      </h1>
      {props.children}
      <p
        className='Button__close BasicTab__close'
        onClick={() => props.setActiveTab('Canvas')}
      >
        X
      </p>
    </div>
  );
};

export default BasicTab;
