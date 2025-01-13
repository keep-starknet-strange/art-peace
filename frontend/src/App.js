import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { stark, Contract } from 'starknet';
import { connect } from 'starknetkit-next';
import {
  openSession,
  createSessionRequest,
  buildSessionAccount
} from '@argent/x-sessions';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';
import CanvasContainer from './canvas/CanvasContainer.js';
import PixelSelector from './footer/PixelSelector.js';
import TabsFooter from './footer/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom, useLockScroll } from './utils/Window.js';
import {
  backendUrl,
  wsUrl,
  devnetMode,
  provider,
  allowedMethods,
  expiry,
  metaData,
  dappKey,
  CHAIN_ID
} from './utils/Consts.js';
import logo from './resources/logo.png';
import canvasConfig from './configs/canvas.config.json';
import { fetchWrapper, getTodaysStartTime } from './services/apiService.js';
import art_peace_abi from './contracts/art_peace.abi.json';
import username_store_abi from './contracts/username_store.abi.json';
import canvas_nft_abi from './contracts/canvas_nft.abi.json';
import multi_canvas_abi from './contracts/multi_canvas.abi.json';
import NotificationPanel from './tabs/NotificationPanel.js';
import ModalPanel from './ui/ModalPanel.js';
import Hamburger from './resources/icons/Hamburger.png';

function App() {
  const worldsMode = devnetMode;
  const [openedWorldId, setOpenedWorldId] = useState(worldsMode ? 0 : null);
  const [activeWorld, setActiveWorld] = useState(null);
  const [surroundingWorlds, setSurroundingWorlds] = useState([]);

  // Page management
  const [isHome, setIsHome] = useState(true);
  useEffect(() => {
    const getWorldId = async () => {
      let currentWorldId = 0;

      if (location.pathname.startsWith('/worlds/')) {
        setIsHome(false);
        try {
          let worldSlug = location.pathname.split('/worlds/')[1];
          let response = await fetchWrapper(
            `get-world-id?worldName=${worldSlug}`
          );

          if (response.data === undefined || response.data === null) {
            setActiveWorld(null);
            setOpenedWorldId(0);
          } else {
            setActiveWorld(response.data);
            setOpenedWorldId(response.data);
            currentWorldId = response.data;
          }
        } catch (error) {
          setActiveWorld(null);
          setOpenedWorldId(0);
        }
      } else {
        setIsHome(true);
        try {
          const response = await fetchWrapper('get-world?worldId=0');
          if (response.data) {
            setActiveWorld(response.data);
          }
          setOpenedWorldId(0);
        } catch (error) {
          console.error(error);
        }
      }

      // Always fetch surrounding worlds
      const surroundingResponse = await fetchWrapper('get-home-worlds');
      if (surroundingResponse.data) {
        const otherWorlds = surroundingResponse.data
          .filter((world) => world.worldId !== currentWorldId)
          .slice(0, 12);

        // Pad array with null values if less than 12 worlds
        let paddedWorlds = [...otherWorlds];
        while (paddedWorlds.length < 12) {
          paddedWorlds.push(null);
        }
        if (paddedWorlds.length > 12) {
          paddedWorlds = paddedWorlds.slice(0, 12);
        }

        // Randomize order of worlds
        paddedWorlds.sort(() => Math.random() - 0.5);
        setSurroundingWorlds(paddedWorlds);
      } else {
        setSurroundingWorlds(Array(12).fill(null)); // Fill with 12 null values if no worlds found
      }
    };

    getWorldId();
  }, [location.pathname]);

  useEffect(() => {
    setOverlayTemplate(null);
    setTemplateOverlayMode(false);
  }, [openedWorldId]);

  // Window management
  usePreventZoom();
  /*
  const tabs = [
    'Canvas',
    'Factions',
    'NFTs',
    'Quests',
    'Vote',
    'Worlds',
    'Account'
  ];
  //  : ['Canvas', 'Factions', 'NFTs', 'Quests', 'Vote', 'Account'];
  */
  // TODO: Add features back
  const tabs = devnetMode ? ['Canvas', 'Worlds', 'Stencils', 'Account'] : [];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  useLockScroll(activeTab === 'Canvas');

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-width: 1224px)'
  });
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' });
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' });
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const isFooterSplit = useMediaQuery({ query: '(max-width: 52rem)' });
  // TODO: height checks ?
  // TODO: Animate logo exit on mobile

  const [footerExpanded, setFooterExpanded] = useState(false);
  const [modal, setModal] = useState(null);

  const getDeviceTypeInfo = () => {
    return {
      isDesktopOrLaptop: isDesktopOrLaptop,
      isBigScreen: isBigScreen,
      isTabletOrMobile: isTabletOrMobile,
      isPortrait: isPortrait,
      isRetina: isRetina,
      isMobile: isMobile
    };
  };

  // Starknet wallet
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState(null);
  const [connectorData, setConnectorData] = useState(null);
  const [_connector, setConnector] = useState(null);
  const [account, setAccount] = useState(null);
  const [_sessionRequest, setSessionRequest] = useState(null);
  const [_accountSessionSignature, setAccountSessionSignature] = useState(null);
  const [isSessionable, setIsSessionable] = useState(false);
  const [usingSessionKeys, setUsingSessionKeys] = useState(false);
  const [queryAddress, setQueryAddress] = useState('0');
  const [connected, setConnected] = useState(false); // TODO: change to only devnet
  useEffect(() => {
    if (devnetMode) {
      if (connected) {
        setQueryAddress(
          '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0'
        );
      } else {
        setQueryAddress('0');
      }
    } else {
      if (!connectorData) {
        setQueryAddress('0');
      } else {
        setQueryAddress(
          connectorData.account.slice(2).toLowerCase().padStart(64, '0')
        );
        setAddress(connectorData.account);
      }
    }
  }, [connectorData, connected]);

  // Contracts
  // TODO: Pull addrs from api?
  const [artPeaceContract, setArtPeaceContract] = useState(null);
  const [usernameContract, setUsernameContract] = useState(null);
  const [canvasNftContract, setCanvasNftContract] = useState(null);
  const [multiCanvasContract, setMultiCanvasContract] = useState(null);

  useEffect(() => {
    if (!connected) return;
    if (!account) return;
    const artPeaceContract = new Contract(
      art_peace_abi,
      process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
      account
    );
    const usernameContract = new Contract(
      username_store_abi,
      process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
      account
    );
    const canvasNftContract = new Contract(
      canvas_nft_abi,
      process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
      account
    );
    const multiCanvasContract = new Contract(
      multi_canvas_abi,
      process.env.REACT_APP_CANVAS_FACTORY_CONTRACT_ADDRESS,
      account
    );
    setArtPeaceContract(artPeaceContract);
    setUsernameContract(usernameContract);
    setCanvasNftContract(canvasNftContract);
    setMultiCanvasContract(multiCanvasContract);
  }, [connected, account]);

  const [timeBetweenPlacements, setTimeBetweenPlacements] = useState(30 * 1000);
  const [currentDay, setCurrentDay] = useState(0);
  const [isLastDay, setIsLastDay] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [host, setHost] = useState('');
  const [endTimestamp, setEndTimestamp] = useState(0);
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        let response = await fetchWrapper('get-game-data');
        if (!response.data) {
          return;
        }
        setCurrentDay(response.data.day);
        if (devnetMode) {
          const days = 4;
          if (response.data.day >= days) {
            setGameEnded(true);
          } else if (response.data.day === days - 1) {
            setIsLastDay(true);
          }
        } else {
          let now = new Date();
          const result = await getTodaysStartTime();
          let dayEnd = new Date(result.data);
          dayEnd.setHours(dayEnd.getHours() + 24);
          // Now in seconds
          let nowInSeconds = Math.floor(now.getTime() / 1000);
          let dayEndInSeconds = Math.floor(dayEnd.getTime() / 1000);
          if (nowInSeconds >= response.data.endTime) {
            setGameEnded(true);
          } else if (dayEndInSeconds >= response.data.endTime) {
            setIsLastDay(true);
          }
        }
        setHost(response.data.host);
        setEndTimestamp(response.data.endTime);
        setTimeBetweenPlacements(process.env.REACT_APP_BASE_PIXEL_TIMER); // Example: 30 * 1000; // 30 seconds
      } catch (error) {
        console.error(error);
      }
    };
    if (!worldsMode && openedWorldId === null) {
      fetchGameData();
    } else if (activeWorld !== null) {
      let now = new Date();
      let nowInSeconds = Math.floor(now.getTime() / 1000);
      let endTime = new Date(activeWorld.endTime).getTime() / 1000;
      if (nowInSeconds >= endTime) {
        setGameEnded(true);
      } else {
        setGameEnded(false);
      }
      setHost(activeWorld.host);
      setEndTimestamp(endTime);
      setTimeBetweenPlacements(activeWorld.timeBetweenPixels * 1000);
    }
  }, [activeWorld, openedWorldId]);

  // Websocket
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    share: false,
    shouldReconnect: (_e) => true,
    reconnectAttempts: 10,
    reconnectInterval: (attempt) => Math.min(10000, Math.pow(2, attempt) * 1000)
  });
  const [latestMintedTokenId, setLatestMintedTokenId] = useState(null);

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

  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchColors = async () => {
    try {
      let getColorsEndpoint =
        backendUrl +
        (openedWorldId == null
          ? '/get-colors'
          : `/get-worlds-colors?worldId=${openedWorldId}`);
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
  useEffect(() => {
    fetchColors();
  }, [openedWorldId]);

  useEffect(() => {
    const processMessage = async (message) => {
      if (message) {
        if (message.messageType === 'colorPixel') {
          if (message.color >= colors.length) {
            await fetchColors();
          }
          colorPixel(message.position, message.color);
        } else if (message.messageType === 'colorWorldPixel') {
          if (message.worldId.toString() === openedWorldId.toString()) {
            if (message.color >= colors.length) {
              await fetchColors();
            }
            colorPixel(message.position, message.color);
          }

          surroundingWorlds.forEach((world) => {
            if (
              world &&
              world.worldId.toString() === message.worldId.toString()
            ) {
              const surroundingCanvas = document.querySelector(
                `canvas[data-world-id="${world.worldId}"]`
              );
              if (surroundingCanvas) {
                const context = surroundingCanvas.getContext('2d');
                const canvasWidth = surroundingCanvas[world.worldId].width;
                const x = message.position % canvasWidth;
                const y = Math.floor(message.position / canvasWidth);
                const canvasColors = surroundingCanvas[world.worldId].colors;
                const colorHex = `#${canvasColors[message.color]}FF`;
                context.fillStyle = colorHex;
                context.fillRect(x, y, 1, 1);
              }
            }
          });
        } else if (message.messageType === 'newWorld') {
          // TODO
          setOpenedWorldId(message.worldId);
        } else if (
          message.messageType === 'nftMinted' &&
          activeTab === 'NFTs'
        ) {
          if (message.minter === queryAddress) {
            setLatestMintedTokenId(message.token_id);
          }
        }
      }
    };

    processMessage(lastJsonMessage);
  }, [lastJsonMessage, openedWorldId, colors]);

  // Canvas
  const [width, setWidth] = useState(canvasConfig.canvas.width);
  const [height, setHeight] = useState(canvasConfig.canvas.height);

  const canvasRef = useRef(null);
  const extraPixelsCanvasRef = useRef(null);

  const colorPixel = (position, color) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const x = position % width;
    const y = Math.floor(position / width);

    if (x < 0 || x >= width || y < 0 || y >= height) {
      console.error('Invalid pixel position:', x, y);
      return;
    }

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

  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [basePixelUp, setBasePixelUp] = useState(false);
  const [chainFactionPixelsData, setChainFactionPixelsData] = useState([]);
  const [chainFactionPixels, setChainFactionPixels] = useState([]);
  const [factionPixelsData, setFactionPixelsData] = useState([]);
  const [factionPixels, setFactionPixels] = useState([]);
  const [extraPixels, setExtraPixels] = useState(0);
  const [availablePixels, setAvailablePixels] = useState(0);
  const [availablePixelsUsed, setAvailablePixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState([]);
  const [isDefending, setIsDefending] = useState(false);

  const [selectorMode, setSelectorMode] = useState(false);

  const [isEraserMode, setIsEraserMode] = React.useState(false);
  const [isExtraDeleteMode, setIsExtraDeleteMode] = React.useState(false);

  useEffect(() => {
    let getLastPlacedPixel = '';
    if (openedWorldId === null) {
      getLastPlacedPixel = `get-last-placed-time?address=${queryAddress}`;
    } else {
      getLastPlacedPixel = `get-worlds-last-placed-time?address=${queryAddress}&worldId=${openedWorldId}`;
    }
    async function fetchGetLastPlacedPixel() {
      const response = await fetchWrapper(getLastPlacedPixel);
      if (!response.data) {
        return;
      }
      const time = new Date(response.data);
      setLastPlacedTime(time);
    }

    fetchGetLastPlacedPixel();
  }, [queryAddress, openedWorldId]);

  const updateInterval = 1000; // 1 second
  const [basePixelTimer, setBasePixelTimer] = useState('XX:XX');

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

  const [chainFactionPixelTimers, setChainFactionPixelTimers] = useState([]);
  useEffect(() => {
    const updateChainFactionPixelTimers = () => {
      let newChainFactionPixelTimers = [];
      let newChainFactionPixels = [];
      for (let i = 0; i < chainFactionPixelsData.length; i++) {
        let memberPixels = chainFactionPixelsData[i].memberPixels;
        if (memberPixels !== 0) {
          newChainFactionPixelTimers.push('00:00');
          newChainFactionPixels.push(memberPixels);
          continue;
        }
        let lastPlacedTime = new Date(chainFactionPixelsData[i].lastPlacedTime);
        let timeSinceLastPlacement = Date.now() - lastPlacedTime;
        let chainFactionPixelAvailable =
          timeSinceLastPlacement > timeBetweenPlacements;
        if (chainFactionPixelAvailable) {
          newChainFactionPixelTimers.push('00:00');
          newChainFactionPixels.push(chainFactionPixelsData[i].allocation);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          newChainFactionPixelTimers.push(
            `${Math.floor(secondsTillPlacement / 60)}:${
              secondsTillPlacement % 60 < 10 ? '0' : ''
            }${secondsTillPlacement % 60}`
          );
          newChainFactionPixels.push(0);
        }
      }
      setChainFactionPixelTimers(newChainFactionPixelTimers);
      setChainFactionPixels(newChainFactionPixels);
    };
    const interval = setInterval(() => {
      updateChainFactionPixelTimers();
    }, updateInterval);
    updateChainFactionPixelTimers();
    return () => clearInterval(interval);
  }, [chainFactionPixelsData, timeBetweenPlacements]);

  const [factionPixelTimers, setFactionPixelTimers] = useState([]);
  useEffect(() => {
    const updateFactionPixelTimers = () => {
      let newFactionPixelTimers = [];
      let newFactionPixels = [];
      for (let i = 0; i < factionPixelsData.length; i++) {
        let memberPixels = factionPixelsData[i].memberPixels;
        if (memberPixels !== 0) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(memberPixels);
          continue;
        }
        let lastPlacedTime = new Date(factionPixelsData[i].lastPlacedTime);
        let timeSinceLastPlacement = Date.now() - lastPlacedTime;
        let factionPixelAvailable =
          timeSinceLastPlacement > timeBetweenPlacements;
        if (factionPixelAvailable) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(factionPixelsData[i].allocation);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          newFactionPixelTimers.push(
            `${Math.floor(secondsTillPlacement / 60)}:${
              secondsTillPlacement % 60 < 10 ? '0' : ''
            }${secondsTillPlacement % 60}`
          );
          newFactionPixels.push(0);
        }
      }
      setFactionPixelTimers(newFactionPixelTimers);
      setFactionPixels(newFactionPixels);
    };
    const interval = setInterval(() => {
      updateFactionPixelTimers();
    }, updateInterval);
    updateFactionPixelTimers();
    return () => clearInterval(interval);
  }, [factionPixelsData, timeBetweenPlacements]);

  useEffect(() => {
    let totalChainFactionPixels = 0;
    for (let i = 0; i < chainFactionPixels.length; i++) {
      totalChainFactionPixels += chainFactionPixels[i];
    }
    let totalFactionPixels = 0;
    for (let i = 0; i < factionPixels.length; i++) {
      totalFactionPixels += factionPixels[i];
    }
    setAvailablePixels(
      (basePixelUp ? 1 : 0) +
        totalChainFactionPixels +
        totalFactionPixels +
        extraPixels
    );
  }, [basePixelUp, chainFactionPixels, factionPixels, extraPixels]);

  useEffect(() => {
    async function fetchExtraPixelsEndpoint() {
      let extraPixelsResponse = await fetchWrapper(
        `get-extra-pixels?address=${queryAddress}`
      );
      if (!extraPixelsResponse.data) {
        setExtraPixels(0);
        return;
      }
      setExtraPixels(extraPixelsResponse.data);
    }
    fetchExtraPixelsEndpoint();

    async function fetchChainFactionPixelsEndpoint() {
      let chainFactionPixelsResponse = await fetchWrapper(
        `get-chain-faction-pixels?address=${queryAddress}`
      );
      if (!chainFactionPixelsResponse.data) {
        setChainFactionPixelsData([]);
        return;
      }
      setChainFactionPixelsData(chainFactionPixelsResponse.data);
    }
    fetchChainFactionPixelsEndpoint();

    async function fetchFactionPixelsEndpoint() {
      let factionPixelsResponse = await fetchWrapper(
        `get-faction-pixels?address=${queryAddress}`
      );
      if (!factionPixelsResponse.data) {
        setFactionPixelsData([]);
        return;
      }
      setFactionPixelsData(factionPixelsResponse.data);
    }
    fetchFactionPixelsEndpoint();
  }, [queryAddress]);

  const clearPixelSelection = () => {
    setSelectedColorId(-1);
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
    setTotalPixelsUsed(0);
    setExtraPixelsData([]);

    const canvas = extraPixelsCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
  }, [width, height]);

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

  const addExtraPixels = async (pixels) => {
    const available = availablePixels - availablePixelsUsed;
    if (available < pixels.length) {
      setNotificationMessage('Not enough available pixels');
      return;
    }
    setAvailablePixelsUsed(availablePixelsUsed + pixels.length);
    setExtraPixelsData([...extraPixelsData, ...pixels]);
  };

  const extraPixelPlaceCall = async (positions, colors, now) => {
    if (devnetMode) return;
    if (!address || !artPeaceContract || !account) return;
    // TODO: Validate inputs
    const placeExtraPixelsCallData = artPeaceContract.populate(
      'place_extra_pixels',
      {
        positions: positions,
        colors: colors,
        now: now
      }
    );
    const { suggestedMaxFee } = await estimateInvokeFee({
      contractAddress: artPeaceContract.address,
      entrypoint: 'place_extra_pixels',
      calldata: placeExtraPixelsCallData.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await artPeaceContract.place_extra_pixels(
      placeExtraPixelsCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const [basePixelUsed, setBasePixelUsed] = React.useState(false);
  const [totalChainFactionPixels, setTotalChainFactionPixels] =
    React.useState(0);
  const [totalFactionPixels, setTotalFactionPixels] = React.useState(0);
  const [chainFactionPixelsUsed, setChainFactionPixelsUsed] = React.useState(0);
  const [factionPixelsUsed, setFactionPixelsUsed] = React.useState(0);
  const [extraPixelsUsed, setExtraPixelsUsed] = React.useState(0);
  const [totalPixelsUsed, setTotalPixelsUsed] = React.useState(0);
  React.useEffect(() => {
    let pixelsUsed = availablePixelsUsed;
    if (basePixelUp) {
      if (pixelsUsed > 0) {
        setBasePixelUsed(true);
        pixelsUsed--;
      } else {
        setBasePixelUsed(false);
      }
    }
    let allChainFactionPixels = 0;
    for (let i = 0; i < chainFactionPixels.length; i++) {
      allChainFactionPixels += chainFactionPixels[i];
    }
    setTotalChainFactionPixels(allChainFactionPixels);
    let allFactionPixels = 0;
    for (let i = 0; i < factionPixels.length; i++) {
      allFactionPixels += factionPixels[i];
    }
    setTotalFactionPixels(allFactionPixels);
    if (allChainFactionPixels > 0) {
      let chainFactionsPixelsUsed = Math.min(
        pixelsUsed,
        totalChainFactionPixels
      );
      setChainFactionPixelsUsed(chainFactionsPixelsUsed);
      pixelsUsed -= chainFactionsPixelsUsed;
    }
    if (allFactionPixels > 0) {
      let factionsPixelsUsed = Math.min(pixelsUsed, totalFactionPixels);
      setFactionPixelsUsed(factionsPixelsUsed);
      pixelsUsed -= factionsPixelsUsed;
    }
    if (extraPixels > 0) {
      let extraPixelsUsed = Math.min(pixelsUsed, extraPixels);
      setExtraPixelsUsed(extraPixelsUsed);
      pixelsUsed -= extraPixelsUsed;
    }
    setTotalPixelsUsed(availablePixelsUsed - pixelsUsed);
  }, [availablePixels, availablePixelsUsed]);

  const clearAll = () => {
    clearExtraPixels();
    setSelectedColorId(-1);
  };

  // TODO: Is rounding down the time always okay?
  const submit = async () => {
    let timestamp = Math.floor(Date.now() / 1000);
    if (!devnetMode) {
      await extraPixelPlaceCall(
        extraPixelsData.map((pixel) => pixel.x + pixel.y * width),
        extraPixelsData.map((pixel) => pixel.colorId),
        timestamp
      );
    } else {
      if (worldsMode) {
        const firstPixel = extraPixelsData[0];
        const formattedData = {
          worldId: openedWorldId.toString(),
          position: (firstPixel.x + firstPixel.y * width).toString(),
          color: firstPixel.colorId.toString(),
          timestamp: timestamp.toString()
        };

        const response = await fetchWrapper('place-world-pixel-devnet', {
          mode: 'cors',
          method: 'POST',
          body: JSON.stringify(formattedData)
        });
        if (response.result) {
          console.log(response.result);
        }
      } else {
        const formattedData = {
          extraPixels: extraPixelsData.map((pixel) => ({
            position: pixel.x + pixel.y * width,
            colorId: pixel.colorId
          })),
          timestamp: timestamp
        };

        const response = await fetchWrapper('place-extra-pixels-devnet', {
          mode: 'cors',
          method: 'POST',
          body: JSON.stringify(formattedData)
        });
        if (response.result) {
          console.log(response.result);
        }
      }
    }
    for (let i = 0; i < extraPixelsData.length; i++) {
      let position = extraPixelsData[i].x + extraPixelsData[i].y * width;
      colorPixel(position, extraPixelsData[i].colorId);
    }
    if (basePixelUsed) {
      setLastPlacedTime(timestamp * 1000);
    }
    if (chainFactionPixelsUsed > 0) {
      let chainFactionIndex = 0;
      let chainFactionUsedCounter = 0;
      let newChainFactionPixels = [];
      let newChainFactionPixelsData = [];
      while (chainFactionIndex < chainFactionPixels.length) {
        if (chainFactionUsedCounter >= chainFactionPixelsUsed) {
          newChainFactionPixels.push(chainFactionPixels[chainFactionIndex]);
          newChainFactionPixelsData.push(
            chainFactionPixelsData[chainFactionIndex]
          );
          chainFactionIndex++;
          continue;
        }
        let currChainFactionPixelsUsed = Math.min(
          chainFactionPixelsUsed - chainFactionUsedCounter,
          chainFactionPixels[chainFactionIndex]
        );
        if (currChainFactionPixelsUsed <= 0) {
          newChainFactionPixels.push(chainFactionPixels[chainFactionIndex]);
          newChainFactionPixelsData.push(
            chainFactionPixelsData[chainFactionIndex]
          );
          chainFactionIndex++;
          continue;
        }
        if (
          currChainFactionPixelsUsed === chainFactionPixels[chainFactionIndex]
        ) {
          newChainFactionPixels.push(0);
          let newChainFactionData = chainFactionPixelsData[chainFactionIndex];
          newChainFactionData.lastPlacedTime = timestamp * 1000;
          newChainFactionData.memberPixels = 0;
          newChainFactionPixelsData.push(newChainFactionData);
        } else {
          newChainFactionPixels.push(
            chainFactionPixels[chainFactionIndex] - currChainFactionPixelsUsed
          );
          let newChainFactionData = chainFactionPixelsData[chainFactionIndex];
          newChainFactionData.memberPixels =
            chainFactionPixels[chainFactionIndex] - currChainFactionPixelsUsed;
          newChainFactionPixelsData.push(newChainFactionData);
        }
        chainFactionUsedCounter += currChainFactionPixelsUsed;
        chainFactionIndex++;
      }
      setChainFactionPixels(newChainFactionPixels);
      setChainFactionPixelsData(newChainFactionPixelsData);
    }

    // TODO: Click faction pixels button to expand out info here
    if (factionPixelsUsed > 0) {
      // TODO: Will order always be the same?
      let factionIndex = 0;
      let factionUsedCounter = 0;
      let newFactionPixels = [];
      let newFactionPixelsData = [];
      while (factionIndex < factionPixels.length) {
        if (factionUsedCounter >= factionPixelsUsed) {
          newFactionPixels.push(factionPixels[factionIndex]);
          newFactionPixelsData.push(factionPixelsData[factionIndex]);
          factionIndex++;
          continue;
        }
        let currFactionPixelsUsed = Math.min(
          factionPixelsUsed - factionUsedCounter,
          factionPixels[factionIndex]
        );
        if (currFactionPixelsUsed <= 0) {
          newFactionPixels.push(factionPixels[factionIndex]);
          newFactionPixelsData.push(factionPixelsData[factionIndex]);
          factionIndex++;
          continue;
        }
        if (currFactionPixelsUsed === factionPixels[factionIndex]) {
          newFactionPixels.push(0);
          let newFactionData = factionPixelsData[factionIndex];
          newFactionData.lastPlacedTime = timestamp * 1000;
          newFactionData.memberPixels = 0;
          newFactionPixelsData.push(newFactionData);
        } else {
          newFactionPixels.push(
            factionPixels[factionIndex] - currFactionPixelsUsed
          );
          let newFactionData = factionPixelsData[factionIndex];
          newFactionData.memberPixels =
            factionPixels[factionIndex] - currFactionPixelsUsed;
          newFactionPixelsData.push(newFactionData);
        }
        factionUsedCounter += currFactionPixelsUsed;
        factionIndex++;
      }
      setFactionPixels(newFactionPixels);
      setFactionPixelsData(newFactionPixelsData);
    }
    if (extraPixelsUsed > 0) {
      let newExtraPixels = extraPixels - extraPixelsUsed;
      setExtraPixels(newExtraPixels);
    }
    clearAll();
    setIsEraserMode(false);
    setSelectorMode(false);
    clearPixelSelection();
  };

  // Factions
  const [chainFaction, setChainFaction] = useState(null);
  const [userFactions, setUserFactions] = useState([]);
  useEffect(() => {
    async function fetchChainFaction() {
      let chainFactionResponse = await fetchWrapper(
        `get-my-chain-factions?address=${queryAddress}`
      );
      if (!chainFactionResponse.data) {
        return;
      }
      if (chainFactionResponse.data.length === 0) {
        return;
      }
      setChainFaction(chainFactionResponse.data[0]);
    }
    async function fetchUserFactions() {
      let userFactionsResponse = await fetchWrapper(
        `get-my-factions?address=${queryAddress}`
      );
      if (!userFactionsResponse.data) {
        return;
      }
      setUserFactions(userFactionsResponse.data);
    }
    fetchChainFaction();
    fetchUserFactions();
  }, [queryAddress]);

  // Templates
  const [templateOverlayMode, setTemplateOverlayMode] = useState(false);
  const [overlayTemplate, setOverlayTemplate] = useState(null);

  const [templateFaction, setTemplateFaction] = useState(null);
  const [templateImage, setTemplateImage] = useState(null);
  const [templateColorIds, setTemplateColorIds] = useState([]);
  const [templateCreationMode, setTemplateCreationMode] = useState(false);
  const [templateCreationSelected, setTemplateCreationSelected] =
    useState(false);
  const [templatePosition, setTemplatePosition] = useState(0);

  // NFTs
  const [nftMintingMode, setNftMintingMode] = useState(false);
  const [nftSelectionStarted, setNftSelectionStarted] = useState(false);
  const [nftSelected, setNftSelected] = useState(false);
  const [nftPosition, setNftPosition] = useState(null);
  const [nftWidth, setNftWidth] = useState(null);
  const [nftHeight, setNftHeight] = useState(null);

  // Worlds
  const [worldsCreationMode, setWorldsCreationMode] = useState(false);
  useEffect(() => {
    // TODO: Done twice ( here and src/tabs/worlds/Worlds.js )
    const getWorld = async () => {
      try {
        const getWorldPath = `get-world?worldId=${openedWorldId}`;
        const response = await fetchWrapper(getWorldPath);
        if (!response.data) {
          return;
        }
        setActiveWorld(response.data);
        setWidth(response.data.width);
        setHeight(response.data.height);
      } catch (error) {
        console.error(error);
        setActiveWorld(null);
        setWidth(canvasConfig.canvas.width);
        setHeight(canvasConfig.canvas.height);
      }
    };
    if (openedWorldId === null) {
      setActiveWorld(null);
      setWidth(canvasConfig.canvas.width);
      setHeight(canvasConfig.canvas.height);
    } else {
      getWorld();
    }
  }, [openedWorldId]);

  // Stencils
  const [openedStencilId, setOpenedStencilId] = useState(null);
  const [stencilImage, setStencilImage] = useState(null);
  const [stencilColorIds, setStencilColorIds] = useState([]);
  const [stencilCreationMode, setStencilCreationMode] = useState(false);
  const [stencilCreationSelected, setStencilCreationSelected] = useState(false);
  const [stencilPosition, setStencilPosition] = useState(0);

  const [loadingRequest, _setLoadingRequest] = useState(false);
  const estimateInvokeFee = async ({
    contractAddress,
    entrypoint,
    calldata
  }) => {
    try {
      const { suggestedMaxFee } = await account.estimateInvokeFee({
        contractAddress: contractAddress,
        entrypoint: entrypoint,
        calldata: calldata
      });
      return { suggestedMaxFee };
    } catch (error) {
      console.error(error);
      return { suggestedMaxFee: BigInt(1000000000000000) };
    }
  };

  const canSession = (wallet) => {
    let sessionableIds = [
      'argentX',
      'ArgentX',
      'argent',
      'Argent',
      'argentMobile',
      'ArgentMobile',
      'argentWebWallet',
      'ArgentWebWallet'
    ];
    if (sessionableIds.includes(wallet.id)) {
      return true;
    }
    return false;
  };

  // Account
  const connectWallet = async () => {
    if (devnetMode) {
      setConnected(true);
      return;
    }
    const { wallet, connectorData, connector } = await connect({
      modalMode: 'alwaysAsk',
      webWalletUrl: process.env.REACT_APP_ARGENT_WEBWALLET_URL,
      argentMobileOptions: {
        dappName: 'art/peace',
        url: window.location.hostname,
        chainId: CHAIN_ID,
        icons: []
      }
    });
    if (wallet && connectorData && connector) {
      setWallet(wallet);
      setConnectorData(connectorData);
      setConnector(connector);
      setConnected(true);
      let new_account = await connector.account(provider);
      setAccount(new_account);
      setIsSessionable(canSession(wallet));
      console.log('Wallet:', wallet);
    }
  };

  const disconnectWallet = async () => {
    if (devnetMode) {
      setConnected(false);
      return;
    }
    setWallet(null);
    setConnectorData(null);
    setConnected(false);
    setAccount(null);
    setSessionRequest(null);
    setAccountSessionSignature(null);
    setUsingSessionKeys(false);
    setIsSessionable(false);
  };

  const startSession = async () => {
    const sessionParams = {
      allowedMethods: allowedMethods,
      expiry: expiry,
      metaData: metaData(false),
      publicDappKey: dappKey.publicKey
    };
    let chainId = await provider.getChainId();
    const accountSessionSignature = await openSession({
      wallet: wallet,
      sessionParams: sessionParams,
      chainId: chainId
    });
    const sessionRequest = createSessionRequest(
      allowedMethods,
      expiry,
      metaData(false),
      dappKey.publicKey
    );
    if (!accountSessionSignature || !sessionRequest) {
      console.error('Session request failed');
      return;
    }
    setSessionRequest(sessionRequest);
    setAccountSessionSignature(accountSessionSignature);
    if (!address || !connectorData) {
      console.error('No address or connector data');
      return;
    }
    const sessionAccount = await buildSessionAccount({
      accountSessionSignature: stark.formatSignature(accountSessionSignature),
      sessionRequest: sessionRequest,
      provider: provider,
      chainId: chainId,
      address: address,
      dappKey: dappKey,
      argentSessionServiceBaseUrl:
        process.env.REACT_APP_ARGENT_SESSION_SERVICE_BASE_URL
    });
    if (!sessionAccount) {
      console.error('Session account failed');
      return;
    }
    setAccount(sessionAccount);
    setUsingSessionKeys(true);
  };

  /*
   * TODO
  useEffect(() => {
    if (devnetMode) return;
    if (!connectors) return;
    if (connectors.length === 0) return;

    const connectIfReady = async () => {
      for (let i = 0; i < connectors.length; i++) {
        let ready = await connectors[i].ready();
        if (ready) {
          connectWallet(connectors[i]);
          break;
        }
      }
    };
    connectIfReady();
  }, [connectors]);
  */

  // Tabs
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

  const [templatePixels, setTemplatePixels] = useState([]);

  useEffect(() => {
    const getTemplatePixelData = async (hash) => {
      if (hash !== null) {
        const response = await fetchWrapper(
          `get-template-pixel-data?hash=${hash}`
        );
        return response.data;
      }
      return [];
    };

    const getStencilPixelData = async (hash) => {
      if (hash !== null) {
        const response = await fetchWrapper(
          `get-stencil-pixel-data?hash=${hash}`
        );
        return response.data;
      }
      return [];
    };

    const getNftPixelData = async (tokenId) => {
      if (tokenId !== null) {
        const response = await fetchWrapper(
          `get-nft-pixel-data?tokenId=${tokenId}`
        );
        if (!response.data) {
          console.error('NFT pixel data not found');
          return [];
        }
        return response.data;
      }
      return [];
    };

    const fetchPixelData = async () => {
      try {
        if (!overlayTemplate) {
          setTemplatePixels([]);
          return;
        }

        // Handle NFT overlay case
        if (overlayTemplate.isNft && overlayTemplate.tokenId !== undefined) {
          const data = await getNftPixelData(overlayTemplate.tokenId);
          setTemplatePixels(data);
          return;
        }

        // Handle stencil overlay case
        if (overlayTemplate.isStencil && overlayTemplate.hash) {
          const data = await getStencilPixelData(overlayTemplate.hash);
          setTemplatePixels(data);
          return;
        }

        // Handle template overlay case
        if (overlayTemplate.hash) {
          const data = await getTemplatePixelData(overlayTemplate.hash);
          setTemplatePixels(data);
          return;
        }

        setTemplatePixels([]);
      } catch (error) {
        console.error('Error fetching pixel data:', error);
        setTemplatePixels([]);
      }
    };

    fetchPixelData();
  }, [overlayTemplate]);

  return (
    <div className='App'>
      <div className='App--background'>
        <NotificationPanel
          message={notificationMessage}
          animationDuration={5000}
        />
        {modal && <ModalPanel modal={modal} setModal={setModal} />}
        <CanvasContainer
          isHome={isHome}
          setOpenedWorldId={setOpenedWorldId}
          colorPixel={colorPixel}
          worldsMode={worldsMode}
          openedWorldId={openedWorldId}
          activeWorld={activeWorld}
          width={width}
          height={height}
          address={address}
          account={account}
          estimateInvokeFee={estimateInvokeFee}
          artPeaceContract={artPeaceContract}
          stencilCreationMode={stencilCreationMode}
          stencilImage={stencilImage}
          stencilColorIds={stencilColorIds}
          stencilCreationSelected={stencilCreationSelected}
          setStencilCreationSelected={setStencilCreationSelected}
          setStencilCreationMode={setStencilCreationMode}
          stencilPosition={stencilPosition}
          setStencilPosition={setStencilPosition}
          colors={colors}
          canvasRef={canvasRef}
          extraPixelsCanvasRef={extraPixelsCanvasRef}
          extraPixels={extraPixels}
          extraPixelsData={extraPixelsData}
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
          templateOverlayMode={templateOverlayMode}
          setTemplateOverlayMode={setTemplateOverlayMode}
          overlayTemplate={overlayTemplate}
          setOverlayTemplate={setOverlayTemplate}
          templateImage={templateImage}
          templateColorIds={templateColorIds}
          templateCreationMode={templateCreationMode}
          setTemplateCreationSelected={setTemplateCreationSelected}
          templateCreationSelected={templateCreationSelected}
          setTemplateCreationMode={setTemplateCreationMode}
          templatePosition={templatePosition}
          setTemplatePosition={setTemplatePosition}
          nftMintingMode={nftMintingMode}
          setNftMintingMode={setNftMintingMode}
          nftSelectionStarted={nftSelectionStarted}
          setNftSelectionStarted={setNftSelectionStarted}
          nftSelected={nftSelected}
          setNftSelected={setNftSelected}
          setNftPosition={setNftPosition}
          setNftWidth={setNftWidth}
          setNftHeight={setNftHeight}
          isEraserMode={isEraserMode}
          isExtraDeleteMode={isExtraDeleteMode}
          setIsEraserMode={setIsEraserMode}
          clearExtraPixel={clearExtraPixel}
          setLastPlacedTime={setLastPlacedTime}
          surroundingWorlds={surroundingWorlds}
          setSurroundingWorlds={setSurroundingWorlds}
        />
        {(!isMobile || activeTab === tabs[0]) && (
          <div
            className='App__logo'
            onClick={() => {
              setActiveTab(tabs[0]);
              window.location.pathname = '/';
            }}
          >
            <img
              src={logo}
              alt='logo'
              className={`App__logo--mobile ${loadingRequest ? 'App__logo--rotating' : ''}`}
            />
            <p className='App__logo--round'>3</p>
          </div>
        )}
        <div
          className={
            'App__panel ' +
            (isTabletOrMobile ? 'App__panel--tablet ' : ' ') +
            (isPortrait ? 'App__panel--portrait ' : ' ') +
            (isMobile ? 'App__panel--mobile ' : ' ')
          }
        >
          <TabPanel
            isHome={isHome}
            openedWorldId={openedWorldId}
            setOpenedWorldId={setOpenedWorldId}
            openedStencilId={openedStencilId}
            setOpenedStencilId={setOpenedStencilId}
            activeWorld={activeWorld}
            colorPixel={colorPixel}
            address={address}
            queryAddress={queryAddress}
            account={account}
            usingSessionKeys={usingSessionKeys}
            submit={submit}
            clearAll={clearAll}
            // chain={chain}
            setConnected={setConnected}
            artPeaceContract={artPeaceContract}
            usernameContract={usernameContract}
            canvasNftContract={canvasNftContract}
            multiCanvasContract={multiCanvasContract}
            setNotificationMessage={setNotificationMessage}
            colors={colors}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setModal={setModal}
            getDeviceTypeInfo={getDeviceTypeInfo}
            isMobile={isMobile}
            templateOverlayMode={templateOverlayMode}
            setTemplateOverlayMode={setTemplateOverlayMode}
            worldsCreationMode={worldsCreationMode}
            setWorldsCreationMode={setWorldsCreationMode}
            stencilCreationMode={stencilCreationMode}
            setStencilCreationMode={setStencilCreationMode}
            overlayTemplate={overlayTemplate}
            setOverlayTemplate={setOverlayTemplate}
            stencilImage={stencilImage}
            setStencilImage={setStencilImage}
            stencilColorIds={stencilColorIds}
            setStencilColorIds={setStencilColorIds}
            stencilCreationSelected={stencilCreationSelected}
            setStencilCreationSelected={setStencilCreationSelected}
            stencilPosition={stencilPosition}
            setStencilPosition={setStencilPosition}
            templateFaction={templateFaction}
            setTemplateFaction={setTemplateFaction}
            templateImage={templateImage}
            templatePosition={templatePosition}
            setTemplateImage={setTemplateImage}
            templateColorIds={templateColorIds}
            setTemplateColorIds={setTemplateColorIds}
            templateCreationMode={templateCreationMode}
            setTemplateCreationMode={setTemplateCreationMode}
            templateCreationSelected={templateCreationSelected}
            setTemplateCreationSelected={setTemplateCreationSelected}
            nftMintingMode={nftMintingMode}
            setNftMintingMode={setNftMintingMode}
            nftSelectionStarted={nftSelectionStarted}
            setNftSelectionStarted={setNftSelectionStarted}
            nftSelected={nftSelected}
            setNftSelected={setNftSelected}
            nftPosition={nftPosition}
            nftWidth={nftWidth}
            nftHeight={nftHeight}
            showSelectedPixelPanel={
              !isPortrait
                ? pixelSelectedMode || isEraserMode
                : (pixelSelectedMode || isEraserMode) && activeTab === tabs[0]
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
            selectorMode={selectorMode}
            setSelectorMode={setSelectorMode}
            isEraserMode={isEraserMode}
            setIsEraserMode={setIsEraserMode}
            setIsExtraDeleteMode={setIsExtraDeleteMode}
            basePixelUp={basePixelUp}
            basePixelTimer={basePixelTimer}
            chainFactionPixels={chainFactionPixels}
            factionPixels={factionPixels}
            setChainFactionPixels={setChainFactionPixels}
            setFactionPixels={setFactionPixels}
            setPixelSelection={setPixelSelection}
            extraPixels={extraPixels}
            setExtraPixels={setExtraPixels}
            availablePixels={availablePixels}
            availablePixelsUsed={availablePixelsUsed}
            setLastPlacedTime={setLastPlacedTime}
            chainFactionPixelsData={chainFactionPixelsData}
            factionPixelsData={factionPixelsData}
            setChainFactionPixelsData={setChainFactionPixelsData}
            setFactionPixelsData={setFactionPixelsData}
            chainFactionPixelTimers={chainFactionPixelTimers}
            factionPixelTimers={factionPixelTimers}
            chainFaction={chainFaction}
            setChainFaction={setChainFaction}
            userFactions={userFactions}
            setUserFactions={setUserFactions}
            latestMintedTokenId={latestMintedTokenId}
            setLatestMintedTokenId={setLatestMintedTokenId}
            connectWallet={connectWallet}
            disconnectWallet={disconnectWallet}
            startSession={startSession}
            isSessionable={isSessionable}
            estimateInvokeFee={estimateInvokeFee}
            currentDay={currentDay}
            gameEnded={gameEnded}
            isLastDay={isLastDay}
            endTimestamp={endTimestamp}
            host={host}
            width={width}
            height={height}
            isDefending={isDefending}
          />
        </div>
        <div className='App__footer'>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: `${
                footerExpanded && isFooterSplit ? 'space-between' : 'center'
              }`,
              alignItems: `${
                footerExpanded && isFooterSplit ? 'flex-end' : 'center'
              }`
            }}
          >
            {!gameEnded && (
              <PixelSelector
                colors={colors}
                openedWorldId={openedWorldId}
                submit={submit}
                clearAll={clearAll}
                totalPixelsUsed={totalPixelsUsed}
                setTotalPixelsUsed={setTotalPixelsUsed}
                selectedColorId={selectedColorId}
                setSelectedColorId={setSelectedColorId}
                getDeviceTypeInfo={getDeviceTypeInfo}
                extraPixels={extraPixels}
                selectorMode={selectorMode}
                setSelectorMode={setSelectorMode}
                setIsEraserMode={setIsEraserMode}
                availablePixels={availablePixels}
                availablePixelsUsed={availablePixelsUsed}
                basePixelUp={basePixelUp}
                setBasePixelUp={setBasePixelUp}
                lastPlacedTime={lastPlacedTime}
                basePixelTimer={basePixelTimer}
                queryAddress={queryAddress}
                setActiveTab={setActiveTab}
                isEraserMode={isEraserMode}
                setIsEraseMode={setIsEraserMode}
                isPortrait={isPortrait}
                isMobile={isMobile}
                overlayTemplate={overlayTemplate}
                templatePixels={templatePixels}
                width={width}
                canvasRef={canvasRef}
                addExtraPixel={addExtraPixel}
                addExtraPixels={addExtraPixels}
                setLastPlacedTime={setLastPlacedTime}
                isDefending={isDefending}
                setIsDefending={setIsDefending}
              />
            )}
            {isFooterSplit && !footerExpanded && (
              <div
                className='Button__primary ExpandTabs__button'
                onClick={() => {
                  setActiveTab(tabs[0]);
                  setFooterExpanded(!footerExpanded);
                }}
              >
                <img src={Hamburger} alt='Tabs' className='ExpandTabs__icon' />
              </div>
            )}
            {isFooterSplit && footerExpanded && (
              <TabsFooter
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                getDeviceTypeInfo={getDeviceTypeInfo}
                isFooterSplit={isFooterSplit}
                setFooterExpanded={setFooterExpanded}
              />
            )}
          </div>
          {!isFooterSplit && (
            <TabsFooter
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              getDeviceTypeInfo={getDeviceTypeInfo}
              isFooterSplit={isFooterSplit}
              setFooterExpanded={setFooterExpanded}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
