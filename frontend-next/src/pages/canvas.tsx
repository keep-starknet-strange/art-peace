import { useState, useEffect } from 'react';
import { CanvasController } from '../components/canvas/controller';
import { useLockScroll } from '../app/window';
import { TabPanel } from "../components/tabs/panel";
import { Footer } from "../components/footer/footer";
import { getCanvasColors, getHomeWorlds, getWorld } from "../api/canvas";

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
  const [worldColors, setWorldColors] = useState([] as string[]);
  useEffect(() => {
    const getColors = async (worldId: number) => {
      const canvasColors = await getCanvasColors(worldId);
      setWorldColors(canvasColors);
    };
    getColors(openedWorldId);
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

  // Stencil Creation
  const [rawStencilImage, setRawStencilImage] = useState<any>(null);
  useEffect(() => {
    if (!rawStencilImage) {
      return;
    }
    // Convert image pixels to be within the color palette

    // Get image data
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    canvas.width = rawStencilImage.width;
    canvas.height = rawStencilImage.height;
    ctx.drawImage(rawStencilImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, rawStencilImage.width, rawStencilImage.height);
    const data = imageData.data;

    let imagePalleteIds = [];
    // Convert image data to color palette
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        imagePalleteIds.push(255);
        continue;
      }
      let minDistance = 1000000;
      let worldColorOne = worldColors[0].match(/[A-Za-z0-9]{2}/g);
      if (!worldColorOne) {
        worldColorOne = ["00", "00", "00"];
      }
      let minColor = worldColorOne.map((x: string) => parseInt(x, 16));
      let minColorIndex = 0;
      for (let j = 0; j < worldColors.length; j++) {
        const colorRGB = worldColors[j].match(/[A-Za-z0-9]{2}/g);
        if (!colorRGB) {
          continue;
        }
        const color = colorRGB.map((x: string) => parseInt(x, 16));
        const distance = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          minColor = color;
          minColorIndex = j;
        }
      }
      data[i] = minColor[0];
      data[i + 1] = minColor[1];
      data[i + 2] = minColor[2];
      imagePalleteIds.push(minColorIndex);
    }

    // Set image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    const paletteImage = canvas.toDataURL();
    const colorIds = imagePalleteIds;
    
    // TODO: Upload to backend and get template hash back
    let stencilImage = {
      image: paletteImage,
      width: rawStencilImage.width,
      height: rawStencilImage.height
    };
    startStencilCreation(stencilImage, colorIds);
  }, [rawStencilImage, worldColors]);

  const [stencilCreationMode, setStencilCreationMode] = useState<boolean>(false);
  const [stencilCreationSelected, setStencilCreationSelected] = useState<boolean>(false);
  const [stencilImage, setStencilImage] = useState<any>(null);
  const [stencilColorIds, setStencilColorIds] = useState<number[]>([]);
  const [stencilPosition, setStencilPosition] = useState<number>(0);
  const startStencilCreation = (stencilImage: any, colorIds: number[]) => {
    setStencilImage(stencilImage);
    setStencilColorIds(colorIds);
    setStencilCreationMode(true);
    setStencilCreationSelected(false);
    setStencilPosition(0);
    setActiveTab("Canvas");
  }
  const endStencilCreation = () => {
    setStencilImage(null);
    setStencilColorIds([]);
    setStencilCreationMode(false);
    setStencilCreationSelected(false);
    setStencilPosition(0);
    setRawStencilImage(null);
    setActiveTab("Stencils");
  }
  
  // Worlds
  const [worldCreationMode, setWorldCreationMode] = useState<boolean>(false);
  const startWorldCreation = () => {
    setWorldCreationMode(true);
    setActiveTab("Canvas");
  }
  const endWorldCreation = () => {
    setWorldCreationMode(false);
    setActiveTab("Worlds");
  }

  // Tabs
  const defaultTabs = ["Canvas", "Worlds", "Stencils", "Account"];
  const [tabs, setTabs] = useState<string[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0]);
  useLockScroll(activeTab === "Canvas");

  // Bot mode
  const botOptions = [{
    name: "Stencil Bot",
    selectOption: () => {
      setSelectedBotOption("Stencil Bot");
      if (!stencilImage) {
        setActiveTab("Stencils");
      }
    }
  }, {
    name: "AI Agent",
    selectOption: () => {
      setSelectedBotOption("AI Agent");
    }
  }];
  const [botMode, setBotMode] = useState<boolean>(false);
  const [selectedBotOption, setSelectedBotOption] = useState(null as any);
  const toggleBotMode = () => {
    setBotMode(!botMode);
    setSelectedBotOption(null);
  }

  return (
    <div className="relative">
      <CanvasController
        colors={worldColors}
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
        stencilCreationMode={stencilCreationMode}
        stencilCreationSelected={stencilCreationSelected}
        setStencilPosition={setStencilPosition}
        stencilImage={stencilImage}
        endStencilCreation={endStencilCreation}
        stencilPosition={stencilPosition}
        setStencilCreationSelected={setStencilCreationSelected}
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
        colors={worldColors}
        startStencilCreation={startStencilCreation}
        endStencilCreation={endStencilCreation}
        stencilCreationMode={stencilCreationMode}
        stencilImage={stencilImage}
        stencilPosition={stencilPosition}
        setRawStencilImage={setRawStencilImage}
        stencilCreationSelected={stencilCreationSelected}
        startWorldCreation={startWorldCreation}
        endWorldCreation={endWorldCreation}
        worldCreationMode={worldCreationMode}
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
        toggleBotMode={toggleBotMode}
        botMode={botMode}
        botOptions={botOptions}
        selectedBotOption={selectedBotOption}
        setSelectedBotOption={setSelectedBotOption}
      />
    </div>
  );
}
