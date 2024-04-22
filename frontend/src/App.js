import React, { useEffect, useState } from 'react';
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
  const [pixelPlacedBy, setPixelPlacedBy] = useState("");

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
      <Canvas selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} pixelSelectedMode={pixelSelectedMode} selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} setPixelSelection={setPixelSelection} clearPixelSelection={clearPixelSelection} setPixelPlacedBy={setPixelPlacedBy} />
      { !isDesktopOrLaptop && (
        <img src={logo} alt="logo" className="App__logo--mobile" />
      )}
      <div className={"App__panel " + (isTabletOrMobile ? "App__panel--tablet " : " ") + (isPortrait ? "App__panel--portrait " : " ")}>
        { (!isPortrait ? pixelSelectedMode : pixelSelectedMode && activeTab === tabs[0]) && (
          <SelectedPixelPanel selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} clearPixelSelection={clearPixelSelection} pixelPlacedBy={pixelPlacedBy} />
        )}
        <TabPanel activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} timeLeftInDay={timeLeftInDay} />
      </div>
      <div className="App__footer">
        <PixelSelector selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} getDeviceTypeInfo={getDeviceTypeInfo} />
        <TabsFooter tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} getDeviceTypeInfo={getDeviceTypeInfo} />
      </div>
    </div>
  );
}

export default App;
