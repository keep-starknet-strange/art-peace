import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAccount, useContract, useNetwork } from '@starknet-react/core';
import './App.css';
import CanvasContainer from './canvas/CanvasContainer.js';
import PixelSelector from './footer/PixelSelector.js';
import TabsFooter from './footer/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom } from './utils/Window.js';
import { backendUrl, wsUrl, devnetMode } from './utils/Consts.js';
import logo from './resources/logo.png';
import canvasConfig from './configs/canvas.config.json';
import { fetchWrapper } from './services/apiService.js';
import art_peace_abi from './contracts/art_peace.abi.json';
import username_store_abi from './contracts/username_store.abi.json';

function App() {
  // Window management
  usePreventZoom();

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-width: 1224px)'
  });
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' });
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' });
  // TODO: height checks ?

  const getDeviceTypeInfo = () => {
    return {
      isDesktopOrLaptop: isDesktopOrLaptop,
      isBigScreen: isBigScreen,
      isTabletOrMobile: isTabletOrMobile,
      isPortrait: isPortrait,
      isRetina: isRetina
    };
  };

  // Starknet wallet
  const { account, address } = useAccount();
  const { chain } = useNetwork();
  const [queryAddress, setQueryAddress] = useState('0');
  useEffect(() => {
    if (address && devnetMode) {
      setQueryAddress(
        '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0'
      );
    } else {
      setQueryAddress(address ? address.slice(2) : '0');
    }
  }, [address]);

  // Contracts
  // TODO: art peace abi & contract address should be in a config
  const { contract: artPeaceContract } = useContract({
    address:
      '0x02e3f41bd135e60c72ebfe57e8964ecc58dbb8f8679b1b4cffeaf5e45ab1defa',
    abi: art_peace_abi
  });
  const { contract: usernameContract } = useContract({
    address:
      '0x00a22891d623bff245535dfbfa2f0db1002a62ef4bd5d405bd1f5712e9df85cd',
    abi: username_store_abi
  });

  // Websocket
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    share: false,
    shouldReconnect: () => true
  });
  const [latestMintedTokenId, setLatestMintedTokenId] = useState(null);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: 'subscribe',
        data: {
          channel: 'general'
        }
      });
    }
  }, [readyState]);

  useEffect(() => {
    if (lastJsonMessage) {
      // Check the message type and handle accordingly
      if (lastJsonMessage.messageType === 'colorPixel') {
        colorPixel(lastJsonMessage.position, lastJsonMessage.color);
      } else if (
        lastJsonMessage.messageType === 'nftMinted' &&
        activeTab === 'NFTs'
      ) {
        // TODO: Compare to user's address
        if (lastJsonMessage.minter === queryAddress) {
          setLatestMintedTokenId(lastJsonMessage.token_id);
        }
      }
    }
  }, [lastJsonMessage]);

  // Colors
  const staticColors = canvasConfig.colors;
  const [colors, setColors] = useState([]);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        let getColorsEndpoint = backendUrl + '/get-colors';
        let response = await fetch(getColorsEndpoint);
        let colors = await response.json();
        if (colors.error) {
          setColors(staticColors);
          console.error(colors.error);
          return;
        }
        if (colors.data) {
          setColors(colors.data);
        }
      } catch (error) {
        setColors(staticColors);
        console.error(error);
      }
    };

    fetchColors();
  }, []);

  // Canvas
  const width = canvasConfig.canvas.width;
  const height = canvasConfig.canvas.height;

  const canvasRef = useRef(null);
  const extraPixelsCanvasRef = useRef(null);

  const colorPixel = (position, color) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const x = position % width;
    const y = Math.floor(position / width);
    const colorIdx = color;
    const colorHex = `#${colors[colorIdx]}FF`;
    context.fillStyle = colorHex;
    context.fillRect(x, y, 1, 1);
  };

  // Pixel selection data
  const [selectedColorId, setSelectedColorId] = useState(-1);
  const [pixelSelectedMode, setPixelSelectedMode] = useState(false);
  const [selectedPositionX, setSelectedPositionX] = useState(null);
  const [selectedPositionY, setSelectedPositionY] = useState(null);
  const [pixelPlacedBy, setPixelPlacedBy] = useState('');

  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [basePixelUp, setBasePixelUp] = useState(false);
  const [factionPixelsData, setFactionPixelsData] = useState([]);
  const [factionPixels, setFactionPixels] = useState([]);
  const [extraPixels, setExtraPixels] = useState(0);
  const [availablePixels, setAvailablePixels] = useState(0);
  const [availablePixelsUsed, setAvailablePixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);

  const [selectorMode, setSelectorMode] = useState(false);

  const [isEraserMode, setIsEraserMode] = React.useState(false);
  const [isExtraDeleteMode, setIsExtraDeleteMode] = React.useState(false);

  useEffect(() => {
    const getLastPlacedPixel = `get-last-placed-time?address=${queryAddress}`;
    async function fetchGetLastPlacedPixel() {
      const response = await fetchWrapper(getLastPlacedPixel);
      if (!response.data) {
        return;
      }
      const time = new Date(response.data);
      setLastPlacedTime(time);
    }

    fetchGetLastPlacedPixel();
  }, [queryAddress]);

  const updateInterval = 1000; // 1 second
  // TODO: make this a config
  const timeBetweenPlacements = 120000; // 2 minutes
  const [basePixelTimer, setBasePixelTimer] = useState('XX:XX');
  useEffect(() => {
    const updateBasePixelTimer = () => {
      let timeSinceLastPlacement = Date.now() - lastPlacedTime;
      let basePixelAvailable = timeSinceLastPlacement > timeBetweenPlacements;
      if (basePixelAvailable) {
        setBasePixelUp(true);
        setBasePixelTimer('00:00');
        clearInterval(interval);
      } else {
        let secondsTillPlacement = Math.floor(
          (timeBetweenPlacements - timeSinceLastPlacement) / 1000
        );
        setBasePixelTimer(
          `${Math.floor(secondsTillPlacement / 60)}:${secondsTillPlacement % 60 < 10 ? '0' : ''}${secondsTillPlacement % 60}`
        );
        setBasePixelUp(false);
      }
    };
    const interval = setInterval(() => {
      updateBasePixelTimer();
    }, updateInterval);
    updateBasePixelTimer();
    return () => clearInterval(interval);
  }, [lastPlacedTime]);

  const [factionPixelTimers, setFactionPixelTimers] = useState([]);
  useEffect(() => {
    const updateFactionPixelTimers = () => {
      let newFactionPixelTimers = [];
      let newFactionPixels = [];
      for (let i = 0; i < factionPixelsData.length; i++) {
        let memberPixels = factionPixelsData[i].memberPixels;
        if (memberPixels !== 0) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(memberPixels);
          continue;
        }
        let lastPlacedTime = new Date(factionPixelsData[i].lastPlacedTime);
        let timeSinceLastPlacement = Date.now() - lastPlacedTime;
        let factionPixelAvailable =
          timeSinceLastPlacement > timeBetweenPlacements;
        if (factionPixelAvailable) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(factionPixelsData[i].allocation);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          newFactionPixelTimers.push(
            `${Math.floor(secondsTillPlacement / 60)}:${secondsTillPlacement % 60 < 10 ? '0' : ''}${secondsTillPlacement % 60}`
          );
          newFactionPixels.push(0);
        }
      }
      setFactionPixelTimers(newFactionPixelTimers);
      setFactionPixels(newFactionPixels);
    };
    const interval = setInterval(() => {
      updateFactionPixelTimers();
    }, updateInterval);
    updateFactionPixelTimers();
    return () => clearInterval(interval);
  }, [factionPixelsData]);

  useEffect(() => {
    let totalFactionPixels = 0;
    for (let i = 0; i < factionPixels.length; i++) {
      totalFactionPixels += factionPixels[i];
    }
    setAvailablePixels(
      (basePixelUp ? 1 : 0) + totalFactionPixels + extraPixels
    );
  }, [basePixelUp, factionPixels, extraPixels]);

  useEffect(() => {
    async function fetchExtraPixelsEndpoint() {
      let extraPixelsResponse = await fetchWrapper(
        `get-extra-pixels?address=${queryAddress}`
      );
      if (!extraPixelsResponse.data) {
        return;
      }
      setExtraPixels(extraPixelsResponse.data);
    }
    fetchExtraPixelsEndpoint();

    async function fetchFactionPixelsEndpoint() {
      let factionPixelsResponse = await fetchWrapper(
        `get-faction-pixels?address=${queryAddress}`
      );
      if (!factionPixelsResponse.data) {
        return;
      }
      setFactionPixelsData(factionPixelsResponse.data);
    }
    fetchFactionPixelsEndpoint();
  }, [queryAddress]);

  const clearPixelSelection = () => {
    setSelectedColorId(-1);
    setSelectedPositionX(null);
    setSelectedPositionY(null);
    setPixelSelectedMode(false);
    setPixelPlacedBy('');
  };

  const setPixelSelection = (x, y) => {
    setSelectedPositionX(x);
    setSelectedPositionY(y);
    setPixelSelectedMode(true);
    // TODO: move http fetch for pixel data here?
  };

  const clearExtraPixels = useCallback(() => {
    setAvailablePixelsUsed(0);
    setExtraPixelsData([]);

    const canvas = extraPixelsCanvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
  }, [width, height]);

  // TODO: thread safety?
  const clearExtraPixel = useCallback(
    (index) => {
      setAvailablePixelsUsed(availablePixelsUsed - 1);
      setExtraPixelsData(extraPixelsData.filter((_, i) => i !== index));
      const canvas = extraPixelsCanvasRef.current;
      const context = canvas.getContext('2d');
      const pixel = extraPixelsData[index];
      const x = pixel.x;
      const y = pixel.y;
      context.clearRect(x, y, 1, 1);
    },
    [extraPixelsData, availablePixelsUsed]
  );

  const addExtraPixel = useCallback(
    (x, y) => {
      // Overwrite pixel if already placed
      const existingPixelIndex = extraPixelsData.findIndex(
        (pixel) => pixel.x === x && pixel.y === y
      );
      if (existingPixelIndex !== -1) {
        let newExtraPixelsData = [...extraPixelsData];
        newExtraPixelsData[existingPixelIndex].colorId = selectedColorId;
        setExtraPixelsData(newExtraPixelsData);
      } else {
        setAvailablePixelsUsed(availablePixelsUsed + 1);
        setExtraPixelsData([
          ...extraPixelsData,
          { x: x, y: y, colorId: selectedColorId }
        ]);
      }
    },
    [extraPixelsData, availablePixelsUsed, selectedColorId]
  );

  // Factions
  const [userFactions, setUserFactions] = useState([]);
  useEffect(() => {
    async function fetchUserFactions() {
      let userFactionsResponse = await fetchWrapper(
        `get-my-factions?address=${queryAddress}`
      );
      if (!userFactionsResponse.data) {
        return;
      }
      setUserFactions(userFactionsResponse.data);
    }
    fetchUserFactions();
  }, [queryAddress]);

  // NFTs
  const [nftMintingMode, setNftMintingMode] = useState(false);
  const [nftSelectionStarted, setNftSelectionStarted] = useState(false);
  const [nftSelected, setNftSelected] = useState(false);
  const [nftPosition, setNftPosition] = useState(null);
  const [nftWidth, setNftWidth] = useState(null);
  const [nftHeight, setNftHeight] = useState(null);

  // Tabs
  const tabs = ['Canvas', 'Factions', 'Quests', 'Vote', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [showExtraPixelsPanel, setShowExtraPixelsPanel] = useState(false);

  useEffect(() => {
    // TODO: If selecting into other tab, ask to stop selecting?
    if (activeTab !== tabs[0] && showExtraPixelsPanel) {
      clearExtraPixels();
      setSelectedColorId(-1);
      setShowExtraPixelsPanel(false);
      return;
    }

    if (selectedColorId !== -1) {
      if (availablePixels > (basePixelUp ? 1 : 0)) {
        setActiveTab(tabs[0]);
        setShowExtraPixelsPanel(true);
        return;
      } else {
        setShowExtraPixelsPanel(false);
        return;
      }
    } else {
      if (availablePixelsUsed > 0) {
        setActiveTab(tabs[0]);
        setShowExtraPixelsPanel(true);
        return;
      } else {
        setShowExtraPixelsPanel(false);
        return;
      }
    }
  }, [
    activeTab,
    selectedColorId,
    availablePixels,
    availablePixelsUsed,
    basePixelUp
  ]);

  return (
    <div className='App'>
      <CanvasContainer
        address={address}
        artPeaceContract={artPeaceContract}
        colors={colors}
        canvasRef={canvasRef}
        extraPixelsCanvasRef={extraPixelsCanvasRef}
        extraPixels={extraPixels}
        extraPixelsData={extraPixelsData}
        availablePixels={availablePixels}
        selectedColorId={selectedColorId}
        setSelectedColorId={setSelectedColorId}
        pixelSelectedMode={pixelSelectedMode}
        selectedPositionX={selectedPositionX}
        selectedPositionY={selectedPositionY}
        setPixelSelection={setPixelSelection}
        clearPixelSelection={clearPixelSelection}
        setPixelPlacedBy={setPixelPlacedBy}
        basePixelUp={basePixelUp}
        availablePixelsUsed={availablePixelsUsed}
        addExtraPixel={addExtraPixel}
        nftMintingMode={nftMintingMode}
        setNftMintingMode={setNftMintingMode}
        nftSelectionStarted={nftSelectionStarted}
        setNftSelectionStarted={setNftSelectionStarted}
        nftSelected={nftSelected}
        setNftSelected={setNftSelected}
        setNftPosition={setNftPosition}
        setNftWidth={setNftWidth}
        setNftHeight={setNftHeight}
        isEraserMode={isEraserMode}
        isExtraDeleteMode={isExtraDeleteMode}
        setIsEraserMode={setIsEraserMode}
        clearExtraPixel={clearExtraPixel}
        setLastPlacedTime={setLastPlacedTime}
      />
      <img src={logo} alt='logo' className='App__logo--mobile' />
      <div
        className={
          'App__panel ' +
          (isTabletOrMobile ? 'App__panel--tablet ' : ' ') +
          (isPortrait ? 'App__panel--portrait ' : ' ')
        }
      >
        <TabPanel
          address={address}
          queryAddress={queryAddress}
          account={account}
          chain={chain}
          artPeaceContract={artPeaceContract}
          usernameContract={usernameContract}
          colors={colors}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getDeviceTypeInfo={getDeviceTypeInfo}
          nftMintingMode={nftMintingMode}
          setNftMintingMode={setNftMintingMode}
          nftSelectionStarted={nftSelectionStarted}
          setNftSelectionStarted={setNftSelectionStarted}
          nftSelected={nftSelected}
          setNftSelected={setNftSelected}
          nftPosition={nftPosition}
          nftWidth={nftWidth}
          nftHeight={nftHeight}
          showSelectedPixelPanel={
            !isPortrait
              ? pixelSelectedMode || isEraserMode
              : (pixelSelectedMode || isEraserMode) && activeTab === tabs[0]
          }
          selectedPositionX={selectedPositionX}
          selectedPositionY={selectedPositionY}
          setSelectedColorId={setSelectedColorId}
          clearPixelSelection={clearPixelSelection}
          pixelPlacedBy={pixelPlacedBy}
          showExtraPixelsPanel={showExtraPixelsPanel}
          extraPixelsData={extraPixelsData}
          clearExtraPixels={clearExtraPixels}
          clearExtraPixel={clearExtraPixel}
          selectorMode={selectorMode}
          setSelectorMode={setSelectorMode}
          isEraserMode={isEraserMode}
          setIsEraserMode={setIsEraserMode}
          setIsExtraDeleteMode={setIsExtraDeleteMode}
          basePixelUp={basePixelUp}
          basePixelTimer={basePixelTimer}
          factionPixels={factionPixels}
          setFactionPixels={setFactionPixels}
          setPixelSelection={setPixelSelection}
          extraPixels={extraPixels}
          setExtraPixels={setExtraPixels}
          availablePixels={availablePixels}
          availablePixelsUsed={availablePixelsUsed}
          setLastPlacedTime={setLastPlacedTime}
          factionPixelsData={factionPixelsData}
          setFactionPixelsData={setFactionPixelsData}
          factionPixelTimers={factionPixelTimers}
          userFactions={userFactions}
          latestMintedTokenId={latestMintedTokenId}
          setLatestMintedTokenId={setLatestMintedTokenId}
        />
      </div>
      <div className='App__footer'>
        <PixelSelector
          colors={colors}
          selectedColorId={selectedColorId}
          setSelectedColorId={setSelectedColorId}
          getDeviceTypeInfo={getDeviceTypeInfo}
          extraPixels={extraPixels}
          selectorMode={selectorMode}
          setSelectorMode={setSelectorMode}
          setIsEraserMode={setIsEraserMode}
          availablePixels={availablePixels}
          availablePixelsUsed={availablePixelsUsed}
          basePixelUp={basePixelUp}
          setBasePixelUp={setBasePixelUp}
          lastPlacedTime={lastPlacedTime}
          basePixelTimer={basePixelTimer}
          queryAddress={queryAddress}
          setActiveTab={setActiveTab}
        />
        <TabsFooter
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getDeviceTypeInfo={getDeviceTypeInfo}
        />
      </div>
    </div>
  );
}

export default App;
