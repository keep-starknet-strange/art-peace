import React from 'react';
import './TabPanel.css';
import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import ExtraPixelsPanel from './canvas/ExtraPixelsPanel.js';
import Factions from './factions/Factions.js';
import { TimerInjector } from '../utils/TimerInjector.js';
import Quests from './quests/Quests.js';
import Voting from './voting/Voting.js';
import NFTs from './nfts/NFTs.js';
import Account from './account/Account.js';
import Templates from './templates/Templates.js';

const TabPanel = (props) => {
  // TODO: Speed up timer injection by using a context
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
          setSelectedColorId={props.setSelectedColorId}
          basePixelUp={props.basePixelUp}
          factionPixels={props.factionPixels}
          extraPixels={props.extraPixels}
          availablePixels={props.availablePixels}
          availablePixelsUsed={props.availablePixelsUsed}
        />
      )}
      {props.activeTab === 'Quests' && (
        <TimerInjector>
          {({ timeLeftInDay }) => (
            <Quests
              timeLeftInDay={timeLeftInDay}
              setActiveTab={props.setActiveTab}
            />
          )}
        </TimerInjector>
      )}
      {props.activeTab === 'Factions' && (
        <Factions setActiveTab={props.setActiveTab} />
      )}
      {props.activeTab === 'Vote' && (
        <TimerInjector>
          {({ timeLeftInDay }) => (
            <Voting
              timeLeftInDay={timeLeftInDay}
              setActiveTab={props.setActiveTab}
            />
          )}
        </TimerInjector>
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
        <Account
          setActiveTab={props.setActiveTab}
          connected={props.connected}
          address={props.address}
          setupStarknet={props.setupStarknet}
        />
      )}
    </div>
  );
};

export default TabPanel;
