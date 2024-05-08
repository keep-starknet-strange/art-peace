import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
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
          selectorMode={props.selectorMode}
          setSelectorMode={props.setSelectorMode}
          isEraserMode={props.isEraserMode}
          setIsEraserMode={props.setIsEraserMode}
        />
      </CSSTransition>
      <SwitchTransition mode='out-in'>
        <CSSTransition
          key={props.activeTab}
          timeout={400}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <div>
            {props.activeTab === 'Quests' && (
              <div>
                <TimerInjector>
                  {({ timeLeftInDay }) => (
                    <Quests
                      timeLeftInDay={timeLeftInDay}
                      setActiveTab={props.setActiveTab}
                    />
                  )}
                </TimerInjector>
              </div>
            )}
            {props.activeTab === 'Factions' && (
              <div>
                <Factions setActiveTab={props.setActiveTab} />
              </div>
            )}
            {props.activeTab === 'Vote' && (
              <div>
                <TimerInjector>
                  {({ timeLeftInDay }) => (
                    <Voting
                      timeLeftInDay={timeLeftInDay}
                      setActiveTab={props.setActiveTab}
                    />
                  )}
                </TimerInjector>
              </div>
            )}
            {props.activeTab === 'Templates' && (
              <div>
                <Templates
                  setTemplateCreationMode={props.setTemplateCreationMode}
                  setTemplateImage={props.setTemplateImage}
                  setTemplateColorIds={props.setTemplateColorIds}
                  setActiveTab={props.setActiveTab}
                />
              </div>
            )}
            {props.activeTab === 'NFTs' && (
              <div>
                <NFTs
                  nftMintingMode={props.nftMintingMode}
                  setNftMintingMode={props.setNftMintingMode}
                  setActiveTab={props.setActiveTab}
                />
              </div>
            )}
            {props.activeTab === 'Account' && (
              <div>
                <Account setActiveTab={props.setActiveTab} />
              </div>
            )}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default TabPanel;
