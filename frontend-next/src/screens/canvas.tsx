'use client';

import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAccount } from '@starknet-react/core';
import { CanvasController } from '../components/canvas/controller';
import { useLockScroll } from '../app/window';
import { TabPanel } from "../components/tabs/panel";
import { Footer } from "../components/footer/footer";
import { websocketUrl } from "../api/api";
import { getWorlds, getHomeWorlds, getWorld } from "../api/worlds";
import { getCanvasColors } from "../api/canvas";
import { placePixelsCall } from "../contract/calls";
import { playPixelPlaced2 } from "../components/utils/sounds";

const Canvas = (props: any) => {
  const { account } = useAccount();

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
      const worlds = await getWorlds(13, 0);
      // TODO: const worlds = await getHomeWorlds();
      // TODO: Once center can be a home world:
      //   const homeWorlds = worlds.filter((world) => world.worldId !== openedWorldId).slice(0, 12);
      let paddedWorlds: any[] = [];
      if (worlds && worlds.length > 0) {
        paddedWorlds = [...worlds];
        // Remove the last world & reverse the order
        paddedWorlds.pop();
        paddedWorlds.reverse();
      } 
      while (paddedWorlds.length < 12) {
        paddedWorlds.push(null);
      }
      if (paddedWorlds.length > 12) {
        paddedWorlds = paddedWorlds.slice(0, 12);
      }
      // Reverse order of worlds
      setSurroundingWorlds(paddedWorlds);
    };

    fetchWorldData();
  }, []);
  useEffect(() => {
    const fetchWorldData = async () => {
      const world = await getWorld(openedWorldId.toString());
      setActiveWorld(world);
      setWorldWidth(world.width);
      setTimeBetweenPlacements(world.timeBetweenPixels * 1000);
    };

    setStagingPixels([]);
    fetchWorldData();
  }, [openedWorldId]);
  const [worldColors, setWorldColors] = useState([] as string[]);
  const [worldCanvasRef, setWorldCanvasRef] = useState<any>(null);
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
  const [stagingPixels, setStagingPixels] = useState<any[]>([]);
  useEffect(() => {
    const updateBasePixelTimer = () => {
      const timeSinceLastPlacement = Date.now() - lastPlacedTime;
      const basePixelAvailable = timeSinceLastPlacement > timeBetweenPlacements;

      if (basePixelAvailable) {
        setBasePixelUp(true);
        setBasePixelTimer('00:00');
        clearInterval(interval);
      } else {
        const secondsTillPlacement = Math.floor(
          (timeBetweenPlacements - timeSinceLastPlacement) / 1000
        );
        const minutes = Math.floor(secondsTillPlacement / 60);
        const seconds = secondsTillPlacement % 60;
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
    if (!activeWorld) {
      setAvailablePixels(0);
      return;
    }
    setAvailablePixels((basePixelUp ? activeWorld.pixelsPerTime : 0));
  }, [basePixelUp, activeWorld]);
  useEffect(() => {
    if (!stagingPixels) {
      return;
    }
    setAvailablePixelsUsed(stagingPixels.length);
    if (stagingPixels.length !== 0 && stagingPixels.length === availablePixels) {
      commitStagingPixels();
    }
  }, [stagingPixels]);
  const commitStagingPixels = async () => {
    if (stagingPixels.length === 0) {
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const commitWorldId = openedWorldId;
    await placePixelsCall(account, openedWorldId, stagingPixels, now);
    let stagedPixels = [...stagingPixels];
    while (stagedPixels.length > 0) {
      playPixelPlaced2();
      const stagedPixel = stagedPixels[0];
      stagedPixels = stagedPixels.slice(1);
      updateGame({
        messageType: "pixel",
        position: stagedPixel.position,
        colorId: stagedPixel.colorId,
        worldId: commitWorldId,
        timestamp: now
      });
      setStagingPixels(stagedPixels);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    setStagingPixels([]);
  };
  const commitPixels = async (pixels: any[]) => {
    if (pixels.length === 0) {
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    await placePixelsCall(account, openedWorldId, pixels, now);
  }

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

    const imagePalleteIds = [];
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
    const stencilImage = {
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
  const [openedStencil, setOpenedStencil] = useState<any>(null);
  
  // Worlds
  const [worldCreationMode, setWorldCreationMode] = useState<boolean>(false);
  const startWorldCreation = () => {
    setWorldCreationMode(true);
  }
  const endWorldCreation = () => {
    setWorldCreationMode(false);
    setActiveTab("Worlds");
  }

  // Tabs
  const defaultTabs = ["Canvas", "Stencils", "Rankings", "Account"];
  const [tabs, setTabs] = useState<string[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0]);
  useLockScroll(activeTab === "Canvas" || activeTab === "");

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
  const [agentTransactions, setAgentTransactions] = useState<any[]>([]);
  useEffect(() => {
    if (agentTransactions.length === 0) {
      return;
    }
    if (stagingPixels.length !== 0) {
      return;
    }
    let newStagingPixels: any[] = [];
    agentTransactions.forEach((transaction) => {
      const calldata = transaction.calldata;
      // TODO: const worldId = calldata[0];
      const position = calldata[1];
      const colorId = calldata[2];
      newStagingPixels = [...newStagingPixels, {
        position: position,
        colorId: colorId
      }];
    });
    const newAgentTransactions = [...agentTransactions].slice(availablePixels);
    if (newAgentTransactions.length === 0) {
      commitPixels(newStagingPixels);
      setAgentTransactions([]);
    } else {
      setStagingPixels(newStagingPixels.slice(0, availablePixels));
      setAgentTransactions(newAgentTransactions);
    }
  }, [agentTransactions, stagingPixels, availablePixels]);
  useEffect(() => {
    if (!botMode || selectedBotOption !== "AI Agent") {
      setAgentTransactions([]);
    }
  }, [botMode, selectedBotOption]);

  const [gameUpdates, setGameUpdates] = useState<any[]>([]);
  const [gameUpdate, setGameUpdate] = useState<any>(null);
  const updateGame = (update: any) => {
    setGameUpdates([...gameUpdates, update]);
  }
  const updatesGame = (updates: any[]) => {
    setGameUpdates([...gameUpdates, ...updates]);
  }
  useEffect(() => {
    if (gameUpdates.length === 0) {
      return;
    }
    if (gameUpdate !== null) {
      return;
    }
    const update = gameUpdates[0];
    setGameUpdate(update);
    setGameUpdates(gameUpdates.slice(1));
  }, [gameUpdates, gameUpdate]);

  // Websocket
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(websocketUrl + '/ws', {
    share: false,
    shouldReconnect: (_e) => true,
    reconnectAttempts: 10,
    reconnectInterval: (attempt) => Math.min(10000, Math.pow(2, attempt) * 1000)
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
  useEffect(() => {
    const processMessage = async (message: any) => {
      const supportedTypes = ["colorWorldPixel"];
      if (message && message.length > 0) {
        const updates = message.filter((update: any) => supportedTypes.includes(update.messageType));
        updatesGame(updates);
      }
    };
    processMessage(lastJsonMessage);
  }, [lastJsonMessage]);

  useEffect(() => {
    if (props.homeClicked) {
      setActiveTab("Canvas");
    }
    props.setHomeClicked(false);
  }, [props.homeClicked]);

  return (
    <div className="relative">
      <CanvasController
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colors={worldColors}
        stagingPixels={stagingPixels}
        setStagingPixels={setStagingPixels}
        availablePixels={availablePixels}
        availablePixelsUsed={availablePixelsUsed}
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
        openedStencil={openedStencil}
        setOpenedStencil={setOpenedStencil}
        endStencilCreation={endStencilCreation}
        stencilPosition={stencilPosition}
        setStencilCreationSelected={setStencilCreationSelected}
        gameUpdate={gameUpdate}
        setGameUpdate={setGameUpdate}
        setWorldCanvasRef={setWorldCanvasRef}
      />
      <TabPanel
        setIsMusicMuted={props.setIsMusicMuted}
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
        stencilColorIds={stencilColorIds}
        setRawStencilImage={setRawStencilImage}
        stencilCreationSelected={stencilCreationSelected}
        openedStencil={openedStencil}
        setOpenedStencil={setOpenedStencil}
        startWorldCreation={startWorldCreation}
        endWorldCreation={endWorldCreation}
        worldCreationMode={worldCreationMode}
        stagingPixels={stagingPixels}
        setStagingPixels={setStagingPixels}
        commitStagingPixels={commitStagingPixels}
        gameUpdate={gameUpdate}
        setGameUpdate={setGameUpdate}
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
        activeWorld={activeWorld}
        worldId={openedWorldId}
        toggleBotMode={toggleBotMode}
        botMode={botMode}
        botOptions={botOptions}
        selectedBotOption={selectedBotOption}
        setSelectedBotOption={setSelectedBotOption}
        openedStencil={openedStencil}
        canvasRef={worldCanvasRef}
        worldColors={worldColors}
        stagingPixels={stagingPixels}
        setStagingPixels={setStagingPixels}
        agentTransactions={agentTransactions}
        setAgentTransactions={setAgentTransactions}
      />
    </div>
  );
}

export default Canvas;
