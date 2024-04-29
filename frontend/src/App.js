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

  const [extraPixels, _setExtraPixels] = useState(5); // TODO: fetch from server
  const [extraPixelsUsed, setExtraPixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);

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

  // Timing
  const [timeLeftInDay, setTimeLeftInDay] = useState('');
  const startTime = '15:00';
  const [hours, minutes] = startTime.split(':');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextDayStart = new Date(now);
      nextDayStart.setDate(now.getDate() + 1);
      nextDayStart.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

      const difference = nextDayStart - now;
      const hoursFinal = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesFinal = Math.floor((difference / 1000 / 60) % 60);
      const secondsFinal = Math.floor((difference / 1000) % 60);

      const formattedTimeLeft = `${hoursFinal.toString().padStart(2, '0')}:${minutesFinal.toString().padStart(2, '0')}:${secondsFinal.toString().padStart(2, '0')}`;
      setTimeLeftInDay(formattedTimeLeft);
    };

    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  });

  // Tabs
  const tabs = ['Canvas', 'Factions', 'Quests', 'Vote', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  useEffect(() => {
    if (lastJsonMessage) {
      // TODO: handle other events
      colorPixel(lastJsonMessage.position, lastJsonMessage.color);
    }
  }, [lastJsonMessage]);

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
          timeLeftInDay={timeLeftInDay}
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
