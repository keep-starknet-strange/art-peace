import React, { useState } from 'react';
import './Tabs.css';
import logo from './logo.png';

const Tabs = () => {

  const types = ['Canvas', 'Quests', 'Vote', 'Templates', 'NFTs'];
  const [activeTab, setTab] = useState(types[0]);

  return (
    <div className="Tabs">
      <div key={types[0]} onClick={() => setTab(types[0])} className={"Tabs__main " + (activeTab === types[0] ? 'Tabs__tab--active' : '')}>
        <img src={logo} alt="logo" className="Tabs__logo" />
        <div className="Tabs__tab">Canvas</div>
      </div>

      {types.slice(1, types.length).map((type) => (
          <div
            key={type}
            onClick={() => setTab(type)}
            className={"Tabs__tab " + (activeTab === type ? 'Tabs__tab--active' : '')}
          >
            {type}
          </div>
        ))}
    </div>
  );
}

export default Tabs;
