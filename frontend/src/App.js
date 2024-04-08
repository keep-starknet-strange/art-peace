import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive'
import './App.css';
import Canvas from './canvas/Canvas.js';
import PixelSelector from './canvas/PixelSelector.js';
import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import TabsFooter from './tabs/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom } from './utils/Window.js';
import logo from './resources/logo.png';

function App() {
  // Window management
  usePreventZoom();

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-width: 1224px)'
  })
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

  // Pixel selection data
  const [selectedColorId, setSelectedColorId] = useState(-1);
  const [pixelSelectedMode, setPixelSelectedMode] = useState(false);
  const [selectedPositionX, setSelectedPositionX] = useState(null)
  const [selectedPositionY, setSelectedPositionY] = useState(null)

  const clearPixelSelection = () => {
    setSelectedPositionX(null);
    setSelectedPositionY(null);
    setPixelSelectedMode(false);
  }

  const setPixelSelection = (x, y) => {
    setSelectedPositionX(x);
    setSelectedPositionY(y);
    setPixelSelectedMode(true);
  }

  // Tabs
  const tabs = ['Canvas', 'Quests', 'Vote', 'Templates', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="App">
      <Canvas selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} pixelSelectedMode={pixelSelectedMode} selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} setPixelSelection={setPixelSelection} clearPixelSelection={clearPixelSelection} />
      { !isDesktopOrLaptop && (
        <img src={logo} alt="logo" className="App__logo--mobile" />
      )}
      <div className={"App__panel " + (isTabletOrMobile ? "App__panel--tablet " : " ") + (isPortrait ? "App__panel--portrait " : " ")}>
        { (!isPortrait ? pixelSelectedMode : pixelSelectedMode && activeTab === tabs[0]) && (
          <SelectedPixelPanel selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} clearPixelSelection={clearPixelSelection} />
        )}
        <TabPanel activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} />
      </div>
      <div className="App__footer">
        <PixelSelector selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} getDeviceTypeInfo={getDeviceTypeInfo} />
        <TabsFooter tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} />
      </div>
    </div>
  );
}

export default App;
