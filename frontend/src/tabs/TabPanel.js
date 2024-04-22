import React from 'react';
import './TabPanel.css';

import Quests from './quests/Quests.js';
import Voting from './Voting.js';
import Templates from './Templates.js';
import NFTs from './NFTs.js';
import Account from './Account.js';

const TabPanel = props => {
  return (
    <div className="TabPanel">
      {props.activeTab === "Quests" && (
        <Quests timeLeftInDay={props.timeLeftInDay} />
      )}
      {props.activeTab === "Vote" && (
        <Voting timeLeftInDay={props.timeLeftInDay} />
      )}
      {props.activeTab === "Templates" && <Templates />}
      {props.activeTab === "NFTs" && <NFTs />}
      {props.activeTab === "Account" && <Account />}
    </div>
  );
}

export default TabPanel;
