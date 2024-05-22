import React from 'react';
import './TabsFooter.css';
import '../utils/Styles.css';

const TabsFooter = (props) => {
  // TODO: Icons for each tab
  return (
    <div className='TabsFooter'>
      {props.tabs.slice(0, props.tabs.length).map((type) => (
        <div
          key={type}
          onClick={() => props.setActiveTab(type)}
          className={
            'Button__primary Text__large ' +
            (props.activeTab === type ? 'TabsFooter__tab--active ' : ' ')
          }
          style={{ padding: '0.7rem 1.5rem' }}
        >
          {type}
        </div>
      ))}
    </div>
  );
};

export default TabsFooter;
