import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './TabPanel.css';
import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import ExtraPixelsPanel from './canvas/ExtraPixelsPanel.js';
import NFTMintingPanel from './nfts/NFTMintingPanel.js';
import Factions from './factions/Factions.js';
import { TimerInjector } from '../utils/TimerInjector.js';
import Quests from './quests/Quests.js';
import Voting from './voting/Voting.js';
import NFTs from './nfts/NFTs.js';
import Account from './account/Account.js';
import Templates from './templates/Templates.js';

const TabPanel = (props) => {
  return (
    <div className='TabPanel'>
      <CSSTransition
        in={
          props.showSelectedPixelPanel &&
          !(props.showExtraPixelsPanel || props.nftMintingMode) &&
          props.activeTab === 'Canvas'
        }
        timeout={300}
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
        timeout={300}
        classNames='list-transition'
        unmountOnExit
        appear
      >
        <ExtraPixelsPanel
          colorPixel={props.colorPixel}
          address={props.address}
          artPeaceContract={props.artPeaceContract}
          extraPixelsData={props.extraPixelsData}
          colors={props.colors}
          clearExtraPixels={props.clearExtraPixels}
          clearExtraPixel={props.clearExtraPixel}
          clearPixelSelection={props.clearPixelSelection}
          selectorMode={props.selectorMode}
          setSelectorMode={props.setSelectorMode}
          isEraserMode={props.isEraserMode}
          setIsEraserMode={props.setIsEraserMode}
          setIsExtraDeleteMode={props.setIsExtraDeleteMode}
          setSelectedColorId={props.setSelectedColorId}
          setLastPlacedTime={props.setLastPlacedTime}
          basePixelUp={props.basePixelUp}
          basePixelTimer={props.basePixelTimer}
          chainFaction={props.chainFaction}
          chainFactionPixels={props.chainFactionPixels}
          factionPixels={props.factionPixels}
          setChainFactionPixels={props.setChainFactionPixels}
          setFactionPixels={props.setFactionPixels}
          chainFactionPixelTimers={props.chainFactionPixelTimers}
          factionPixelTimers={props.factionPixelTimers}
          chainFactionPixelsData={props.chainFactionPixelsData}
          factionPixelsData={props.factionPixelsData}
          setChainFactionPixelsData={props.setChainFactionPixelsData}
          setFactionPixelsData={props.setFactionPixelsData}
          extraPixels={props.extraPixels}
          setPixelSelection={props.setPixelSelection}
          setExtraPixels={props.setExtraPixels}
          availablePixels={props.availablePixels}
          availablePixelsUsed={props.availablePixelsUsed}
          userFactions={props.userFactions}
        />
      </CSSTransition>
      <CSSTransition
        in={props.nftMintingMode}
        timeout={300}
        classNames='list-transition'
        unmountOnExit
        appear
      >
        <NFTMintingPanel
          setActiveTab={props.setActiveTab}
          address={props.address}
          artPeaceContract={props.artPeaceContract}
          setNftMintingMode={props.setNftMintingMode}
          nftSelectionStarted={props.nftSelectionStarted}
          setNftSelectionStarted={props.setNftSelectionStarted}
          nftSelected={props.nftSelected}
          setNftSelected={props.setNftSelected}
          queryAddress={props.queryAddress}
          nftPosition={props.nftPosition}
          nftWidth={props.nftWidth}
          nftHeight={props.nftHeight}
          setNotificationMessage={props.setNotificationMessage}
        />
      </CSSTransition>
      <SwitchTransition mode='out-in'>
        <CSSTransition
          key={props.activeTab}
          timeout={300}
          classNames='list-transition'
          unmountOnExit
          appear
        >
          <div>
            {props.activeTab === 'Quests' && (
              <div>
                <TimerInjector
                  address={props.address}
                  artPeaceContract={props.artPeaceContract}
                  gameEnded={props.gameEnded}
                >
                  {({ timeLeftInDay, newDayAvailable, startNextDay }) => (
                    <Quests
                      address={props.address}
                      artPeaceContract={props.artPeaceContract}
                      timeLeftInDay={timeLeftInDay}
                      newDayAvailable={newDayAvailable}
                      startNextDay={startNextDay}
                      setActiveTab={props.setActiveTab}
                      queryAddress={props.queryAddress}
                      setExtraPixels={props.setExtraPixels}
                      extraPixels={props.extraPixels}
                      gameEnded={props.gameEnded}
                    />
                  )}
                </TimerInjector>
              </div>
            )}
            {props.activeTab === 'Factions' && (
              <div>
                <Factions
                  address={props.address}
                  artPeaceContract={props.artPeaceContract}
                  queryAddress={props.queryAddress}
                  setActiveTab={props.setActiveTab}
                  chainFaction={props.chainFaction}
                  setChainFaction={props.setChainFaction}
                  userFactions={props.userFactions}
                  setUserFactions={props.setUserFactions}
                  setChainFactionPixels={props.setChainFactionPixels}
                  setFactionPixels={props.setFactionPixels}
                  chainFactionPixels={props.chainFactionPixels}
                  factionPixels={props.factionPixels}
                  chainFactionPixelData={props.chainFactionPixelData}
                  setChainFactionPixelsData={props.setChainFactionPixelsData}
                  factionPixelsData={props.factionPixelsData}
                  setFactionPixelsData={props.setFactionPixelsData}
                  setTemplateOverlayMode={props.setTemplateOverlayMode}
                  setOverlayTemplate={props.setOverlayTemplate}
                  isMobile={props.isMobile}
                  gameEnded={props.gameEnded}
                />
              </div>
            )}
            {props.activeTab === 'Vote' && (
              <div>
                <TimerInjector
                  address={props.address}
                  artPeaceContract={props.artPeaceContract}
                  gameEnded={props.gameEnded}
                >
                  {({ timeLeftInDay, newDayAvailable, startNextDay }) => (
                    <Voting
                      timeLeftInDay={timeLeftInDay}
                      newDayAvailable={newDayAvailable}
                      startNextDay={startNextDay}
                      setActiveTab={props.setActiveTab}
                      queryAddress={props.queryAddress}
                      address={props.address}
                      artPeaceContract={props.artPeaceContract}
                      isLastDay={props.isLastDay}
                      gameEnded={props.gameEnded}
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
                  address={props.address}
                  artPeaceContract={props.artPeaceContract}
                  canvasNftContract={props.canvasNftContract}
                  nftMintingMode={props.nftMintingMode}
                  setNftMintingMode={props.setNftMintingMode}
                  setActiveTab={props.setActiveTab}
                  latestMintedTokenId={props.latestMintedTokenId}
                  setLatestMintedTokenId={props.setLatestMintedTokenId}
                  queryAddress={props.queryAddress}
                  isMobile={props.isMobile}
                  gameEnded={props.gameEnded}
                />
              </div>
            )}
            {props.activeTab === 'Account' && (
              <div>
                <Account
                  usernameContract={props.usernameContract}
                  setActiveTab={props.setActiveTab}
                  queryAddress={props.queryAddress}
                  setConnected={props.setConnected}
                  address={props.address}
                  chain={props.chain}
                  connectWallet={props.connectWallet}
                  connectors={props.connectors}
                  isMobile={props.isMobile}
                  gameEnded={props.gameEnded}
                />
              </div>
            )}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default TabPanel;
