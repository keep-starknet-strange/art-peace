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

  // Account
  const [address, setAddress] = useState('0');
  const [provider, setProvider] = useState();
  const [connected, setConnected] = useState(false);

  const setupStarknet = (addr, prov) => {
    setAddress(addr);
    setProvider(prov);
    setConnected(true);
  };

  const _starknetData = () => {
    return {
      rpc: provider
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

  const [basePixelUp, setBasePixelUp] = useState(true); // TODO: Base values
  const [factionPixels, setFactionPixels] = useState(4);
  const [extraPixels, setExtraPixels] = useState(10);
  const [availablePixels, setAvailablePixels] = useState(0);
  const [availablePixelsUsed, setAvailablePixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);

  useEffect(() => {
    setAvailablePixels((basePixelUp ? 1 : 0) + factionPixels + extraPixels);
  }, [basePixelUp, factionPixels, extraPixels]);

  useEffect(() => {
    let getExtraPixelsEndpoint = `${backendUrl}/get-extra-pixels?address=${address}`;
    fetch(getExtraPixelsEndpoint).then((response) => {
      response
        .json()
        .then((result) => {
          setExtraPixels(result.data + 10);
        })
        .catch((error) => {
          console.error(error);
        });
    });

    /*
    let getFactionPixelsEndpoint = `${backendUrl}/get-faction-pixels?address=${address}`;
    fetch(getFactionPixelsEndpoint).then((response) => {
      response
        .json()
        .then((result) => {
          setFactionPixels(result.data + 4);
        })
        .catch((error) => {
          console.error(error);
        });
    });
    */
    setFactionPixels(4); // TODO
  }, [address]);

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

  // NFTs
  const [nftMintingMode, setNftMintingMode] = useState(false);

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
          connected={connected}
          address={address}
          setupStarknet={setupStarknet}
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
          setSelectedColorId={setSelectedColorId}
          clearPixelSelection={clearPixelSelection}
          pixelPlacedBy={pixelPlacedBy}
          showExtraPixelsPanel={showExtraPixelsPanel}
          extraPixelsData={extraPixelsData}
          clearExtraPixels={clearExtraPixels}
          clearExtraPixel={clearExtraPixel}
          basePixelUp={basePixelUp}
          factionPixels={factionPixels}
          extraPixels={extraPixels}
          availablePixels={availablePixels}
          availablePixelsUsed={availablePixelsUsed}
        />
      </div>
      <div className='App__footer'>
        <PixelSelector
          colors={colors}
          selectedColorId={selectedColorId}
          setSelectedColorId={setSelectedColorId}
          getDeviceTypeInfo={getDeviceTypeInfo}
          availablePixels={availablePixels}
          availablePixelsUsed={availablePixelsUsed}
          basePixelUp={basePixelUp}
          setBasePixelUp={setBasePixelUp}
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
