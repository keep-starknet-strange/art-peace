import React from 'react';
import './TabPanel.css';

import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import ExtraPixelsPanel from './canvas/ExtraPixelsPanel.js';
import Factions from './factions/Factions.js';
import Quests from './quests/Quests.js';
import Voting from './voting/Voting.js';
import NFTs from './nfts/NFTs.js';
import Account from './account/Account.js';
import Templates from './templates/Templates.js';

const TabPanel = (props) => {
  return (
    <div className='TabPanel'>
      {props.showSelectedPixelPanel && (
        <SelectedPixelPanel
          selectedPositionX={props.selectedPositionX}
          selectedPositionY={props.selectedPositionY}
          clearPixelSelection={props.clearPixelSelection}
          pixelPlacedBy={props.pixelPlacedBy}
        />
      )}
      {props.showExtraPixelsPanel && (
        <ExtraPixelsPanel
          extraPixelsData={props.extraPixelsData}
          colors={props.colors}
          clearExtraPixels={props.clearExtraPixels}
          clearExtraPixel={props.clearExtraPixel}
          clearPixelSelection={props.clearPixelSelection}
        />
      )}
      {props.activeTab === 'Quests' && (
        <Quests
          timeLeftInDay={props.timeLeftInDay}
          setActiveTab={props.setActiveTab}
        />
      )}
      {props.activeTab === 'Factions' && (
        <Factions setActiveTab={props.setActiveTab} />
      )}
      {props.activeTab === 'Vote' && (
        <Voting
          timeLeftInDay={props.timeLeftInDay}
          setActiveTab={props.setActiveTab}
        />
      )}
      {props.activeTab === 'Templates' && (
        <Templates
          setTemplateCreationMode={props.setTemplateCreationMode}
          setTemplateImage={props.setTemplateImage}
          setTemplateColorIds={props.setTemplateColorIds}
          setActiveTab={props.setActiveTab}
        />
      )}
      {props.activeTab === 'NFTs' && (
        <NFTs
          nftMintingMode={props.nftMintingMode}
          setNftMintingMode={props.setNftMintingMode}
          setActiveTab={props.setActiveTab}
        />
      )}
      {props.activeTab === 'Account' && (
        <Account setActiveTab={props.setActiveTab} />
      )}
    </div>
  );
};

export default TabPanel;
