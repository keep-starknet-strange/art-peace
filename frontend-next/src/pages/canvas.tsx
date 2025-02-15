import { useState, useEffect } from 'react';
import { CanvasController } from '../components/canvas/controller';
import { useLockScroll } from '../app/window';
import { TabPanel } from "../components/tabs/panel";
import { Footer } from "../components/footer/footer";
import { getHomeWorlds, getWorld } from "../api/canvas";

export const Canvas = (props: any) => {
  // Game Data
  const updateInterval = 1000;
  const secondsBetweenPlacements =
    process.env.REACT_APP_SECONDS_BETWEEN_PLACEMENTS as unknown as number || 5;
  const [timeBetweenPlacements, setTimeBetweenPlacements] = useState(secondsBetweenPlacements * 1000);
  const [openedWorldId, setOpenedWorldId] = useState<number>(0);
  const [activeWorld, setActiveWorld] = useState<any>(null);
  const baseWorldX = process.env.NEXT_PUBLIC_WORLD_X || 528;
  const [worldWidth, setWorldWidth] = useState<number>(baseWorldX as number);
  const [surroundingWorlds, setSurroundingWorlds] = useState<any[]>([]);
  useEffect(() => {
    const fetchWorldData = async () => {
      const worlds = await getHomeWorlds();
      const homeWorlds = worlds.filter((world) => world.worldId !== openedWorldId).slice(0, 12);
      let paddedWorlds = [...homeWorlds];
      while (paddedWorlds.length < 12) {
        paddedWorlds.push(null);
      }
      if (paddedWorlds.length > 12) {
        paddedWorlds = paddedWorlds.slice(0, 12);
      }
      setSurroundingWorlds(paddedWorlds);
    };

    fetchWorldData();
  }, []);
  useEffect(() => {
    const fetchWorldData = async () => {
      const world = await getWorld(openedWorldId);
      setActiveWorld(world);
      setWorldWidth(world.width);
      setTimeBetweenPlacements(world.timeBetweenPixels * 1000);
    };

    fetchWorldData();
  }, [openedWorldId]);

  // Player Data
  const [lastPlacedTime, setLastPlacedTime] = useState<number>(0);
  const [basePixelTimer, setBasePixelTimer] = useState<string>("XX:XX")
  const [basePixelUp, setBasePixelUp] = useState<boolean>(false)
  const [availablePixels, setAvailablePixels] = useState<number>(0)
  const [availablePixelsUsed, setAvailablePixelsUsed] = useState<number>(0)
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
        let minutes = Math.floor(secondsTillPlacement / 60);
        let seconds = secondsTillPlacement % 60;
        setBasePixelTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setBasePixelUp(false);
      }
    };

    const interval = setInterval(() => {
      updateBasePixelTimer();
    }, updateInterval);

    updateBasePixelTimer(); // Call immediately

    return () => clearInterval(interval);
  }, [lastPlacedTime, timeBetweenPlacements]);
  useEffect(() => {
    setAvailablePixels((basePixelUp ? 1 : 0));
  }, [basePixelUp]);

  // Pixel Selection
  const [selectedColorId, setSelectedColorId] = useState<number>(-1);
  const [selectorMode, setSelectorMode] = useState<boolean>(false)
  const [pixelSelectedMode, setPixelSelectedMode] = useState<boolean>(false)
  const [selectedPixelX, setSelectedPixelX] = useState<number>(0)
  const [selectedPixelY, setSelectedPixelY] = useState<number>(0)
  const clearPixelSelection = () => {
    setPixelSelectedMode(false);
    setSelectedColorId(-1);
    setSelectedPixelX(0);
    setSelectedPixelY(0);
  }
  const clearAll = () => {
    setAvailablePixelsUsed(0);
    setSelectedColorId(-1);
  }

  // Tabs
  const defaultTabs = ["Canvas", "Worlds", "Stencils", "Account"];
  const [tabs, setTabs] = useState<string[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0]);
  useLockScroll(activeTab === "Canvas");
  
  return (
    <div className="relative">
      <CanvasController
        openedWorldId={openedWorldId}
        setOpenedWorldId={setOpenedWorldId}
        activeWorld={activeWorld}
        surroundingWorlds={surroundingWorlds}
        width={worldWidth}
        setWidth={setWorldWidth}
        selectedColorId={selectedColorId}
        setSelectedColorId={setSelectedColorId}
        clearPixelSelection={clearPixelSelection}
        basePixelUp={basePixelUp}
        setLastPlacedTime={setLastPlacedTime}
        pixelSelectedMode={pixelSelectedMode}
        setPixelSelectedMode={setPixelSelectedMode}
        selectedPixelX={selectedPixelX}
        setSelectedPixelX={setSelectedPixelX}
        selectedPixelY={selectedPixelY}
        setSelectedPixelY={setSelectedPixelY}
      />
      <TabPanel
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        worldId={openedWorldId}
        activeWorld={activeWorld}
        pixelSelectedMode={pixelSelectedMode}
        selectedPixelX={selectedPixelX}
        selectedPixelY={selectedPixelY}
        clearPixelSelection={clearPixelSelection}
        width={worldWidth}
      />
      <Footer
        basePixelTimer={basePixelTimer}
        availablePixels={availablePixels}
        availablePixelsUsed={availablePixelsUsed}
        selectedColorId={selectedColorId}
        setSelectedColorId={setSelectedColorId}
        selectorMode={selectorMode}
        setSelectorMode={setSelectorMode}
        clearAll={clearAll}
        basePixelUp={basePixelUp}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        worldId={openedWorldId}
      />
    </div>
  );
}
