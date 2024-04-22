import React from 'react';
import './TabPanel.css';

import Quests from './quests/Quests.js';
import Voting from './Voting.js';
import Templates from './templates/Templates.js';
import NFTs from './nfts/NFTs.js';
import Account from './Account.js';

const TabPanel = props => {
  return (
    <div className='TabPanel'>
      { props.activeTab === 'Quests' && <Quests /> }
      { props.activeTab === 'Vote' && <Voting /> }
      { props.activeTab === 'Templates' && <Templates setTemplateCreationMode={props.setTemplateCreationMode} setTemplateImage={props.setTemplateImage} setTemplateColorIds={props.setTemplateColorIds} /> }
      { props.activeTab === 'NFTs' && <NFTs nftSelectionMode={props.nftSelectionMode} setNftSelectionMode={props.setNftSelectionMode} /> }
      { props.activeTab === 'Account' && <Account /> }
    </div>
  );
}

export default TabPanel;
