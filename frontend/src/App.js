import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive'
import './App.css';
import Canvas from './canvas/Canvas.js';
import PixelSelector from './canvas/PixelSelector.js';
import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import ExtraPixelsPanel from './canvas/ExtraPixelsPanel.js';
import TemplateBuilderPanel from './canvas/TemplateBuilderPanel.js';
import TabsFooter from './tabs/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom } from './utils/Window.js';
import logo from './resources/logo.png';
import canvasConfig from "./configs/canvas.config.json"
import backendConfig from "./configs/backend.config.json";

function App() {
  // Window management
  usePreventZoom();

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-width: 1224px)'
  })
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port;
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  // TODO: Consider using in sizing stuff
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  // TODO: height checks ?

  const getDeviceTypeInfo = () => {
    return {
      isDesktopOrLaptop: isDesktopOrLaptop,
      isBigScreen: isBigScreen,
      isTabletOrMobile: isTabletOrMobile,
      isPortrait: isPortrait,
      isRetina: isRetina
    }
  }

  // Canvas
  const width = canvasConfig.canvas.width
  const height = canvasConfig.canvas.height

  const canvasRef = useRef(null);
  const extraCanvasRef = useRef(null);
  
  // Pixel selection data
  const [selectedColorId, setSelectedColorId] = useState(-1);
  const [pixelSelectedMode, setPixelSelectedMode] = useState(false);
  const [selectedPositionX, setSelectedPositionX] = useState(null)
  const [selectedPositionY, setSelectedPositionY] = useState(null)
  const [pixelPlacedBy, setPixelPlacedBy] = useState("");

  const [extraPixels, setExtraPixels] = useState(42); // TODO: fetch from server
  const [extraPixelsUsed, setExtraPixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);

  useEffect(() => {
    const address = 0;
    let getExtraPixelsEndpoint = `${backendUrl}/getExtraPixels?address=${address}`;
    fetch(getExtraPixelsEndpoint, { mode: "cors" }).then((response) => {
      response
        .json()
        .then((data) => {
          setExtraPixels(data);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  },[])

  const clearPixelSelection = () => {
    setSelectedPositionX(null);
    setSelectedPositionY(null);
    setPixelSelectedMode(false);
    setPixelPlacedBy("");
  }

  const setPixelSelection = (x, y) => {
    setSelectedPositionX(x);
    setSelectedPositionY(y);
    setPixelSelectedMode(true);
    // TODO: move http fetch for pixel data here?
  }

  const clearExtraPixels = useCallback(() => {
    setExtraPixelsUsed(0);
    setExtraPixelsData([]);

    const canvas = extraCanvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, width, height)
  }, [width, height])

  // TODO: thread safety?
  const clearExtraPixel = useCallback((index) => {
    setExtraPixelsUsed(extraPixelsUsed - 1);
    setExtraPixelsData(extraPixelsData.filter((_, i) => i !== index));
    const canvas = extraCanvasRef.current
    const context = canvas.getContext('2d')
    const pixel = extraPixelsData[index]
    const x = pixel.x
    const y = pixel.y
    context.clearRect(x, y, 1, 1)
  }, [extraPixelsData, extraPixelsUsed, setExtraPixelsData, setExtraPixelsUsed])

  const addExtraPixel = useCallback((x, y) => {
    // Overwrite pixel if already placed
    const existingPixelIndex = extraPixelsData.findIndex((pixel) => pixel.x === x && pixel.y === y)
    if (existingPixelIndex !== -1) {
      let newExtraPixelsData = [...extraPixelsData]
      newExtraPixelsData[existingPixelIndex].colorId = selectedColorId
      setExtraPixelsData(newExtraPixelsData)
    } else {
      setExtraPixelsUsed(extraPixelsUsed + 1);
      setExtraPixelsData([...extraPixelsData, {x: x, y: y, colorId: selectedColorId}]);
    }
  }, [extraPixelsData, extraPixelsUsed, selectedColorId])

  // Templates
  const [templateCreationMode, setTemplateCreationMode] = useState(false);
  const [templatePlacedMode, setTemplatePlacedMode] = useState(false);
  const [templateImage, setTemplateImage] = useState(null);
  const [templateColorIds, setTemplateColorIds] = useState([]);
  const [templateImagePositionX, setTemplateImagePositionX] = useState(0)
  const [templateImagePositionY, setTemplateImagePositionY] = useState(0)
  const [templateImagePosition, setTemplateImagePosition] = useState(0)

  // NFTs
  const [nftSelectionMode, setNftSelectionMode] = useState(false);

  // Timing
  const [timeLeftInDay, setTimeLeftInDay] = useState('');
  const startTime = "15:00";
  const [hours, minutes] = startTime.split(":");
  
  
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
  })

  // Tabs
  const tabs = ['Canvas', 'Quests', 'Vote', 'Templates', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="App">
      <Canvas selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} pixelSelectedMode={pixelSelectedMode} selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} setPixelSelection={setPixelSelection} clearPixelSelection={clearPixelSelection} setPixelPlacedBy={setPixelPlacedBy} extraPixels={extraPixels} extraPixelsUsed={extraPixelsUsed} addExtraPixel={addExtraPixel} canvasRef={canvasRef} extraCanvasRef={extraCanvasRef} nftSelectionMode={nftSelectionMode} setNftSelectionMode={setNftSelectionMode} templateCreationMode={templateCreationMode} templateImage={templateImage} setTemplateCreationMode={setTemplateCreationMode} setTemplatePlacedMode={setTemplatePlacedMode} templatePlacedMode={templatePlacedMode} templateImagePositionX={templateImagePositionX} setTemplateImagePositionX={setTemplateImagePositionX} templateImagePositionY={templateImagePositionY} setTemplateImagePositionY={setTemplateImagePositionY} setTemplateImagePosition={setTemplateImagePosition} />
      { !isDesktopOrLaptop && (
        <img src={logo} alt="logo" className="App__logo--mobile" />
      )}
      <div className={"App__panel " + (isTabletOrMobile ? "App__panel--tablet " : " ") + (isPortrait ? "App__panel--portrait " : " ")}>
        { (!isPortrait ? pixelSelectedMode : pixelSelectedMode && activeTab === tabs[0]) && (
          <SelectedPixelPanel selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} clearPixelSelection={clearPixelSelection} pixelPlacedBy={pixelPlacedBy} />
        )}
        { (!isPortrait ? extraPixelsUsed > 0 : extraPixelsUsed > 0 && activeTab === tabs[0])  && (
          <ExtraPixelsPanel extraPixelsData={extraPixelsData} clearExtraPixels={clearExtraPixels} clearExtraPixel={clearExtraPixel} clearPixelSelection={clearPixelSelection}/>
        )}
        { (templateCreationMode || templatePlacedMode) && (
          <TemplateBuilderPanel templateImage={templateImage} setTemplateImage={setTemplateImage} setTemplateCreationMode={setTemplateCreationMode} setTemplatePlacedMode={setTemplatePlacedMode} templateImagePositionY={templateImagePositionY} templateImagePositionX={templateImagePositionX} setTemplateImagePositionX={setTemplateImagePositionX} setTemplateImagePositionY={setTemplateImagePositionY} templateImagePosition={templateImagePosition} setTemplateImagePosition={setTemplateImagePosition} templateColorIds={templateColorIds} setTemplateColorIds={templateColorIds} />
        )}
        <TabPanel activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} nftSelectionMode={nftSelectionMode} setNftSelectionMode={setNftSelectionMode} setTemplateCreationMode={setTemplateCreationMode} setTemplateImage={setTemplateImage} setTemplateColorIds={setTemplateColorIds} timeLeftInDay={timeLeftInDay} />
      </div>
      <div className="App__footer">
        <PixelSelector selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} getDeviceTypeInfo={getDeviceTypeInfo} extraPixels={extraPixels} extraPixelsUsed={extraPixelsUsed} />
        <TabsFooter tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} />
      </div>
    </div>
  );
}

export default App;
