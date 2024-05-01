import React from 'react';
import { CSSTransition } from 'react-transition-group';
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
        <CSSTransition
          in={props.showSelectedPixelPanel}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <SelectedPixelPanel
            selectedPositionX={props.selectedPositionX}
            selectedPositionY={props.selectedPositionY}
            clearPixelSelection={props.clearPixelSelection}
            pixelPlacedBy={props.pixelPlacedBy}
          />
        </CSSTransition>
      )}
      {props.showExtraPixelsPanel && (
        <CSSTransition
          in={props.showExtraPixelsPanel}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <ExtraPixelsPanel
            extraPixelsData={props.extraPixelsData}
            colors={props.colors}
            clearExtraPixels={props.clearExtraPixels}
            clearExtraPixel={props.clearExtraPixel}
            clearPixelSelection={props.clearPixelSelection}
          />
        </CSSTransition>
      )}
      {props.activeTab === 'Quests' && (
        <CSSTransition
          in={props.activeTab === 'Quests'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <TimerInjector>
            {({ timeLeftInDay }) => (
              <Quests
                timeLeftInDay={timeLeftInDay}
                setActiveTab={props.setActiveTab}
              />
            )}
          </TimerInjector>
        </CSSTransition>
      )}
      {props.activeTab === 'Factions' && (
        <CSSTransition
          in={props.activeTab === 'Factions'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <Factions setActiveTab={props.setActiveTab} />
        </CSSTransition>
      )}
      {props.activeTab === 'Vote' && (
        <CSSTransition
          in={props.activeTab === 'Vote'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <TimerInjector>
            {({ timeLeftInDay }) => (
              <Voting
                timeLeftInDay={timeLeftInDay}
                setActiveTab={props.setActiveTab}
              />
            )}
          </TimerInjector>
        </CSSTransition>
      )}
      {props.activeTab === 'Templates' && (
        <CSSTransition
          in={props.activeTab === 'Templates'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <Templates
            setTemplateCreationMode={props.setTemplateCreationMode}
            setTemplateImage={props.setTemplateImage}
            setTemplateColorIds={props.setTemplateColorIds}
            setActiveTab={props.setActiveTab}
          />
        </CSSTransition>
      )}
      {props.activeTab === 'NFTs' && (
        <CSSTransition
          in={props.activeTab === 'NFTs'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <NFTs
            nftMintingMode={props.nftMintingMode}
            setNftMintingMode={props.setNftMintingMode}
            setActiveTab={props.setActiveTab}
          />
        </CSSTransition>
      )}
      {props.activeTab === 'Account' && (
        <CSSTransition
          in={props.activeTab === 'Account'}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
          exit={true}
        >
          <Account setActiveTab={props.setActiveTab} />
        </CSSTransition>
      )}
    </div>
  );
};

export default TabPanel;
