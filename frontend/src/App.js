import React, { useState } from 'react';
import './App.css';
import Canvas from './canvas/Canvas.js';
import PixelSelector from './canvas/PixelSelector.js';
import SelectedPixelPanel from './canvas/SelectedPixelPanel.js';
import TabsFooter from './tabs/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom } from './utils/Window.js';

function App() {
  usePreventZoom();

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
      <div className="App__panel">
        { pixelSelectedMode && (
          <SelectedPixelPanel selectedPositionX={selectedPositionX} selectedPositionY={selectedPositionY} clearPixelSelection={clearPixelSelection} />
        )}
        <TabPanel activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="App__footer">
        <PixelSelector selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} />
        <TabsFooter tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
