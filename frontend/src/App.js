import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';
import CanvasContainer from './canvas/CanvasContainer.js';
import PixelSelector from './footer/PixelSelector.js';
import TabsFooter from './footer/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom } from './utils/Window.js';
import { backendUrl, wsUrl } from './utils/Consts.js';
import logo from './resources/logo.png';
import canvasConfig from './configs/canvas.config.json';
import { fetchWrapper } from './services/apiService.js';

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
        if (
          lastJsonMessage.minter ===
          '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0'
        ) {
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

  const [extraPixels, setExtraPixels] = useState(0);
  const [extraPixelsUsed, setExtraPixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);

  useEffect(() => {
    const address = 0;
    async function fetchExtraPixelsEndpoint() {
      let getExtraPixelsEndpoint = await fetchWrapper(
        `get-extra-pixels?address=${address}`
      );
      if (!getExtraPixelsEndpoint.data) {
        return;
      }
      setExtraPixels(getExtraPixelsEndpoint.data);
    }
    fetchExtraPixelsEndpoint();
  }, []);

  const clearPixelSelection = () => {
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
    setExtraPixelsUsed(0);
    setExtraPixelsData([]);

    const canvas = extraPixelsCanvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
  }, [width, height]);

  // TODO: thread safety?
  const clearExtraPixel = useCallback(
    (index) => {
      setExtraPixelsUsed(extraPixelsUsed - 1);
      setExtraPixelsData(extraPixelsData.filter((_, i) => i !== index));
      const canvas = extraPixelsCanvasRef.current;
      const context = canvas.getContext('2d');
      const pixel = extraPixelsData[index];
      const x = pixel.x;
      const y = pixel.y;
      context.clearRect(x, y, 1, 1);
    },
    [extraPixelsData, extraPixelsUsed, setExtraPixelsData, setExtraPixelsUsed]
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
        setExtraPixelsUsed(extraPixelsUsed + 1);
        setExtraPixelsData([
          ...extraPixelsData,
          { x: x, y: y, colorId: selectedColorId }
        ]);
      }
    },
    [extraPixelsData, extraPixelsUsed, selectedColorId]
  );

  // NFTs
  const [nftMintingMode, setNftMintingMode] = useState(false);

  // Tabs
  const tabs = ['Canvas', 'Factions', 'Quests', 'Vote', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className='App'>
      <CanvasContainer
        colors={colors}
        canvasRef={canvasRef}
        extraPixelsCanvasRef={extraPixelsCanvasRef}
        extraPixels={extraPixels}
        selectedColorId={selectedColorId}
        setSelectedColorId={setSelectedColorId}
        pixelSelectedMode={pixelSelectedMode}
        selectedPositionX={selectedPositionX}
        selectedPositionY={selectedPositionY}
        setPixelSelection={setPixelSelection}
        clearPixelSelection={clearPixelSelection}
        setPixelPlacedBy={setPixelPlacedBy}
        extraPixelsUsed={extraPixelsUsed}
        addExtraPixel={addExtraPixel}
        nftMintingMode={nftMintingMode}
        setNftMintingMode={setNftMintingMode}
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
          colors={colors}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getDeviceTypeInfo={getDeviceTypeInfo}
          nftMintingMode={nftMintingMode}
          setNftMintingMode={setNftMintingMode}
          showSelectedPixelPanel={
            !isPortrait
              ? pixelSelectedMode
              : pixelSelectedMode && activeTab === tabs[0]
          }
          selectedPositionX={selectedPositionX}
          selectedPositionY={selectedPositionY}
          clearPixelSelection={clearPixelSelection}
          pixelPlacedBy={pixelPlacedBy}
          showExtraPixelsPanel={
            !isPortrait
              ? extraPixelsUsed > 0
              : extraPixelsUsed > 0 && activeTab === tabs[0]
          }
          extraPixelsData={extraPixelsData}
          clearExtraPixels={clearExtraPixels}
          clearExtraPixel={clearExtraPixel}
          latestMintedTokenId={latestMintedTokenId}
        />
      </div>
      <div className='App__footer'>
        <PixelSelector
          colors={colors}
          selectedColorId={selectedColorId}
          setSelectedColorId={setSelectedColorId}
          getDeviceTypeInfo={getDeviceTypeInfo}
          extraPixels={extraPixels}
          extraPixelsUsed={extraPixelsUsed}
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
