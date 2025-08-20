'use client';

import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAccount } from '@/solana-remote-wallet/hooks';
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
  const { account, chain } = useAccount();

  // Game Data
  const updateInterval = 1000;
  const secondsBetweenPlacements =
    process.env.REACT_APP_SECONDS_BETWEEN_PLACEMENTS as unknown as number || 5;
  const [timeBetweenPlacements, setTimeBetweenPlacements] = useState(secondsBetweenPlacements * 1000);
  const baseWorldId = parseInt(process.env.NEXT_PUBLIC_BASE_WORLD_ID as string) || 13;
  const [openedWorldId, setOpenedWorldId] = useState<number>(baseWorldId);
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
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  useEffect(() => {
    if (!stagingPixels) {
      return;
    }
    if (isCommitting) {
      return;
    }
    setAvailablePixelsUsed(stagingPixels.length);
    if (stagingPixels.length !== 0 && stagingPixels.length === availablePixels) {
      commitStagingPixels();
    }
  }, [stagingPixels, isCommitting, availablePixels]);
  const [modalMessage, setModalMessage] = useState<string>("");
  const checkRevertsEvery = 10;
  const [callsCounter, setCallsCounter] = useState<number>(0);
  const revertThreshold = 4;
  const [revertCount, setRevertCount] = useState<number>(0);
  const didRevert = async (transactionHash: string) => {
    if (chain === "solana") {
      return;
    }

    let res = null;
    let attempts = 0;
    console.log("Checking if tx reverted...");
    if (!transactionHash || !account) {
      return;
    }
    while (!res && attempts < 5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        // @ts-ignore
        res = await account.getTransactionReceipt(transactionHash) as any;
      } catch (e) {
        console.log("Error checking tx:", e);
      }
      attempts++;
    }
    if (res && res.execution_status === "REVERTED") {
      setRevertCount(revertCount + 1);
      if (revertCount + 1 > revertThreshold) {
        setSelectedBotOption(null);
        setModalMessage("⚠️Too many reverting transactions⚠️\nMost of your pixel placements are reverting.\nThis is most likely due to running the Stencil Bot in more than one tab on the same World, which is not supported.\nThe Stencil Bot has been disabled here.")
      }
      console.log("Transaction reverted", transactionHash);
    }
  }

  const commitStagingPixels = async () => {
    setIsCommitting(true);
    if (stagingPixels.length === 0) {
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const commitWorldId = openedWorldId;
    const txHash = await placePixelsCall(account, openedWorldId, stagingPixels, now + 60);
    if (txHash && (callsCounter % checkRevertsEvery) === 0) {
      setRevertCount(0)
      didRevert(txHash);
    }
    if (txHash && revertCount > 0) {
      didRevert(txHash)
    }
    setCallsCounter(callsCounter + 1);
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
      setLastPlacedTime(now * 1000);
      setStagingPixels(stagedPixels);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    setStagingPixels([]);
    setIsCommitting(false);
  };
  const commitPixels = async (pixels: any[]) => {
    setIsCommitting(true);
    if (pixels.length === 0) {
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const txHash = await placePixelsCall(account, openedWorldId, pixels, now + 60);
    if (txHash && (callsCounter % checkRevertsEvery) === 0) {
      setRevertCount(0)
      didRevert(txHash);
    }
    if (txHash && revertCount > 0) {
      didRevert(txHash)
    }
    setCallsCounter(callsCounter + 1);
    let stagedPixels = [...pixels];
    while (stagedPixels.length > 0) {
      playPixelPlaced2();
      const stagedPixel = stagedPixels[0];
      stagedPixels = stagedPixels.slice(1);
      updateGame({
        messageType: "pixel",
        position: stagedPixel.position,
        colorId: stagedPixel.colorId,
        worldId: openedWorldId,
        timestamp: now
      });
      setLastPlacedTime(now * 1000);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    setStagingPixels([]);
    setIsCommitting(false);
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
  const [originalImageSize, setOriginalImageSize] = useState<{width: number, height: number} | null>(null);
  
  // Image processing slider states
  const [stencilExposure, setStencilExposure] = useState<number>(0); // -100 to 100
  const [stencilContrast, setStencilContrast] = useState<number>(0); // -100 to 100
  const [stencilSaturation, setStencilSaturation] = useState<number>(0); // -100 to 100
  const [stencilTint, setStencilTint] = useState<number>(0); // -100 to 100
  const [removeBackground, setRemoveBackground] = useState<boolean>(false);
  
  // Image size states
  const [stencilWidth, setStencilWidth] = useState<number>(128);
  const [stencilHeight, setStencilHeight] = useState<number>(128);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);
  
  // Calculate auto-scale dimensions for images larger than 128x128
  const calculateAutoScale = (width: number, height: number) => {
    if (width <= 128 && height <= 128) {
      return { width, height };
    }
    
    const aspectRatio = width / height;
    if (width > height) {
      return { width: 128, height: Math.round(128 / aspectRatio) };
    } else {
      return { width: Math.round(128 * aspectRatio), height: 128 };
    }
  };

  // Handle size changes with aspect ratio locking
  const handleWidthChange = (newWidth: number) => {
    setStencilWidth(newWidth);
    if (aspectRatioLocked) {
      setStencilHeight(Math.round(newWidth / originalAspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setStencilHeight(newHeight);
    if (aspectRatioLocked) {
      setStencilWidth(Math.round(newHeight * originalAspectRatio));
    }
  };

  // Initialize size when new image is loaded
  useEffect(() => {
    if (originalImageSize) {
      const autoScale = calculateAutoScale(originalImageSize.width, originalImageSize.height);
      setStencilWidth(autoScale.width);
      setStencilHeight(autoScale.height);
      setOriginalAspectRatio(originalImageSize.width / originalImageSize.height);
    }
  }, [originalImageSize]);

  // Remove background by making similar colors transparent
  const applyBackgroundRemoval = (imageData: ImageData) => {
    if (!removeBackground) return imageData;
    
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Sample corner pixels to determine background color
    const cornerPixels: number[][] = [];
    const samplePoints = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1], // corners
      [Math.floor(width/2), 0], [0, Math.floor(height/2)], // edges
      [width-1, Math.floor(height/2)], [Math.floor(width/2), height-1]
    ];
    
    samplePoints.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 128) { // Only consider opaque pixels
        cornerPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    });
    
    if (cornerPixels.length === 0) return imageData;
    
    // Calculate average background color
    const avgBg = [
      Math.round(cornerPixels.reduce((sum, pixel) => sum + pixel[0], 0) / cornerPixels.length),
      Math.round(cornerPixels.reduce((sum, pixel) => sum + pixel[1], 0) / cornerPixels.length),
      Math.round(cornerPixels.reduce((sum, pixel) => sum + pixel[2], 0) / cornerPixels.length)
    ];
    
    // Remove background with tolerance
    const tolerance = 30; // Adjust this value for sensitivity
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // Skip already transparent pixels
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color distance from background
      const distance = Math.sqrt(
        Math.pow(r - avgBg[0], 2) +
        Math.pow(g - avgBg[1], 2) +
        Math.pow(b - avgBg[2], 2)
      );
      
      // Make pixel transparent if it's close to background color
      if (distance <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    return imageData;
  };

  // Apply image processing effects
  const applyImageEffects = (imageData: ImageData) => {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Skip transparent pixels
      if (data[i + 3] < 128) continue;
      
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply exposure (brightness)
      if (stencilExposure !== 0) {
        const exposureFactor = stencilExposure * 2.55; // Scale to 0-255 range
        r = Math.min(255, Math.max(0, r + exposureFactor));
        g = Math.min(255, Math.max(0, g + exposureFactor));
        b = Math.min(255, Math.max(0, b + exposureFactor));
      }
      
      // Apply contrast
      if (stencilContrast !== 0) {
        const contrastFactor = (259 * (stencilContrast + 255)) / (255 * (259 - stencilContrast));
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      }
      
      // Apply saturation
      if (stencilSaturation !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const saturationFactor = (stencilSaturation + 100) / 100;
        r = Math.min(255, Math.max(0, gray + saturationFactor * (r - gray)));
        g = Math.min(255, Math.max(0, gray + saturationFactor * (g - gray)));
        b = Math.min(255, Math.max(0, gray + saturationFactor * (b - gray)));
      }
      
      // Apply tint (shift towards red/green)
      if (stencilTint !== 0) {
        if (stencilTint > 0) {
          // Shift towards red
          r = Math.min(255, r + (stencilTint * 0.5));
          g = Math.max(0, g - (stencilTint * 0.25));
        } else {
          // Shift towards green
          g = Math.min(255, g + (Math.abs(stencilTint) * 0.5));
          r = Math.max(0, r - (Math.abs(stencilTint) * 0.25));
        }
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    return imageData;
  };
  
  useEffect(() => {
    if (!rawStencilImage) {
      return;
    }
    // New pipeline: import -> effects -> scale -> color convert -> background removal

    // Step 1: Process image at original size (effects only, no background removal yet)
    const effectsCanvas = document.createElement("canvas");
    const effectsCtx = effectsCanvas.getContext("2d");
    if (!effectsCtx) {
      return;
    }
    effectsCanvas.width = rawStencilImage.width;
    effectsCanvas.height = rawStencilImage.height;
    effectsCtx.drawImage(rawStencilImage, 0, 0);
    let imageData = effectsCtx.getImageData(0, 0, rawStencilImage.width, rawStencilImage.height);
    
    // Apply color effects only (no background removal yet)
    imageData = applyImageEffects(imageData);
    effectsCtx.putImageData(imageData, 0, 0);

    // Step 2: Scale the image to desired dimensions
    const scaledCanvas = document.createElement("canvas");
    const scaledCtx = scaledCanvas.getContext("2d");
    if (!scaledCtx) {
      return;
    }
    scaledCanvas.width = stencilWidth;
    scaledCanvas.height = stencilHeight;
    
    // Use high-quality scaling
    scaledCtx.imageSmoothingEnabled = false; // For pixel art style
    scaledCtx.drawImage(effectsCanvas, 0, 0, stencilWidth, stencilHeight);
    
    // Step 3: Get image data for color palette conversion
    let finalImageData = scaledCtx.getImageData(0, 0, stencilWidth, stencilHeight);
    const data = finalImageData.data;

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

    // Step 4: Apply background removal AFTER color conversion
    finalImageData = applyBackgroundRemoval(finalImageData);

    // Step 5: Update color IDs array to reflect background removal changes
    const finalData = finalImageData.data;
    const finalColorIds = [];
    for (let i = 0; i < finalData.length; i += 4) {
      if (finalData[i + 3] < 128) {
        // Transparent pixel
        finalColorIds.push(255);
      } else {
        // Use the original color ID from before background removal
        finalColorIds.push(imagePalleteIds[Math.floor(i / 4)]);
      }
    }

    // Set final processed image data back to canvas
    scaledCtx.putImageData(finalImageData, 0, 0);
    const paletteImage = scaledCanvas.toDataURL();
    const colorIds = finalColorIds;
    
    // TODO: Upload to backend and get template hash back
    const stencilImage = {
      image: paletteImage,
      width: stencilWidth,
      height: stencilHeight
    };
    startStencilCreation(stencilImage, colorIds);
  }, [rawStencilImage, worldColors, stencilExposure, stencilContrast, stencilSaturation, stencilTint, stencilWidth, stencilHeight, removeBackground]);

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
    // Reset image processing sliders
    setStencilExposure(0);
    setStencilContrast(0);
    setStencilSaturation(0);
    setStencilTint(0);
    setRemoveBackground(false);
    // Reset size and aspect ratio states
    setStencilWidth(128);
    setStencilHeight(128);
    setAspectRatioLocked(true);
    setOriginalImageSize(null);
    setOriginalAspectRatio(1);
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
  }];
  // TODO: Add AI Agent
  // , {
  //   name: "AI Agent",
  //   selectOption: () => {
  //     setSelectedBotOption("AI Agent");
  //   }
  // }];
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
        gameUpdates={gameUpdates}
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
        setOriginalImageSize={setOriginalImageSize}
        stencilImage={stencilImage}
        stencilPosition={stencilPosition}
        stencilColorIds={stencilColorIds}
        setRawStencilImage={setRawStencilImage}
        stencilCreationSelected={stencilCreationSelected}
        setStencilCreationSelected={setStencilCreationSelected}
        openedStencil={openedStencil}
        setOpenedStencil={setOpenedStencil}
        stencilExposure={stencilExposure}
        setStencilExposure={setStencilExposure}
        stencilContrast={stencilContrast}
        setStencilContrast={setStencilContrast}
        stencilSaturation={stencilSaturation}
        setStencilSaturation={setStencilSaturation}
        stencilTint={stencilTint}
        setStencilTint={setStencilTint}
        removeBackground={removeBackground}
        setRemoveBackground={setRemoveBackground}
        stencilWidth={stencilWidth}
        setStencilWidth={setStencilWidth}
        stencilHeight={stencilHeight}
        setStencilHeight={setStencilHeight}
        aspectRatioLocked={aspectRatioLocked}
        setAspectRatioLocked={setAspectRatioLocked}
        originalImageSize={originalImageSize}
        handleWidthChange={handleWidthChange}
        handleHeightChange={handleHeightChange}
        startWorldCreation={startWorldCreation}
        endWorldCreation={endWorldCreation}
        worldCreationMode={worldCreationMode}
        stagingPixels={stagingPixels}
        setStagingPixels={setStagingPixels}
        commitStagingPixels={commitStagingPixels}
        gameUpdate={gameUpdate}
        setGameUpdate={setGameUpdate}
        gameUpdates={gameUpdates}
        isCommitting={isCommitting}
        modalMessage={modalMessage}
        setModalMessage={setModalMessage}
        toggleBotMode={toggleBotMode}
        botMode={botMode}
        botOptions={botOptions}
        selectedBotOption={selectedBotOption}
        setSelectedBotOption={setSelectedBotOption}
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
        isCommitting={isCommitting}
      />
    </div>
  );
}

export default Canvas;
