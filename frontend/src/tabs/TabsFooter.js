import React from 'react';
import './TabsFooter.css';
import logo from '../resources/logo.png';

const TabsFooter = props => {

  return (
    <div className="TabsFooter">
      <div key={props.tabs[0]} onClick={() => props.setActiveTab(props.tabs[0])} className="TabsFooter__main">
        { props.getDeviceTypeInfo().isDesktopOrLaptop &&
          <img src={logo} alt="logo" className="TabsFooter__logo" />
        }
        <div className={"TabsFooter__tab " + (props.activeTab === props.tabs[0] ? 'TabsFooter__tab--active ' : ' ') + (props.getDeviceTypeInfo().isPortrait ? 'TabsFooter__tab--portrait' : ' ')}>Canvas</div>
      </div>

      {props.tabs.slice(1, props.tabs.length).map((type) => (
          <div
            key={type}
            onClick={() => props.setActiveTab(type)}
            className={"TabsFooter__tab " + (props.activeTab === type ? 'TabsFooter__tab--active ' : ' ') + (props.getDeviceTypeInfo().isPortrait ? 'TabsFooter__tab--portrait' : '')}
          >
            {type}
          </div>
        ))}
    </div>
  );
}

export default TabsFooter;
