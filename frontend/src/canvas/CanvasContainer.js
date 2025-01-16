import React, { useState, useEffect, useRef } from 'react';
import './CanvasContainer.css';
import Canvas from './Canvas';
import ExtraPixelsCanvas from './ExtraPixelsCanvas.js';
import TemplateOverlay from './TemplateOverlay.js';
import TemplateCreationOverlay from './TemplateCreationOverlay.js';
import StencilCreationOverlay from './StencilCreationOverlay.js';
import NFTSelector from './NFTSelector.js';
import { fetchWrapper } from '../services/apiService.js';
import { devnetMode, backendUrl } from '../utils/Consts.js';
import canvasConfig from '../configs/canvas.config.json';

const CanvasContainer = (props) => {
  // TODO: Handle window resize
  const minScale = 0.6;
  const maxScale = 40;

  const [canvasX, setCanvasX] = useState(0);
  const [canvasY, setCanvasY] = useState(0);
  const [canvasScale, setCanvasScale] = useState(1.16);
  const [titleScale, setTitleScale] = useState(1);
  const [touchInitialDistance, setInitialTouchDistance] = useState(0);
  const [touchScale, setTouchScale] = useState(0);
  const canvasContainerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const [isErasing, setIsErasing] = useState(false);

  const handlePointerDown = (e) => {
    // TODO: Require over canvas?
    if (!props.isEraserMode) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    } else {
      setIsErasing(true);
    }
  };

  const handlePointerUp = () => {
    setIsErasing(false);
    setIsDragging(false);
    setDragStartX(0);
    setDragStartY(0);
  };

  const handlePointerMove = (e) => {
    if (props.nftMintingMode && !props.nftSelected) return;
    if (props.templateCreationMode && !props.templateCreationSelected) return;
    if (isDragging) {
      setCanvasX(canvasX + e.clientX - dragStartX);
      setCanvasY(canvasY + e.clientY - dragStartY);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    }
    if (props.isEraserMode && isErasing) {
      pixelClicked(e);
    }
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, canvasX, canvasY]);

  // Zoom in/out ( into the cursor position )
  const zoom = (e) => {
    // Get the cursor position within the canvas ( note the canvas can go outside the viewport )
    const rect = props.canvasRef.current.getBoundingClientRect();
    let cursorX = e.clientX - rect.left;
    let cursorY = e.clientY - rect.top;
    console.log(rect, cursorX, cursorY);
    if (cursorX < 0) {
      cursorX = 0;
    } else if (cursorX > rect.width) {
      cursorX = rect.width;
    }
    if (cursorY < 0) {
      cursorY = 0;
    } else if (cursorY > rect.height) {
      cursorY = rect.height;
    }

    // Calculate new left and top position to keep cursor over the same rect pos  ition
    let direction = e.deltaY > 0 ? 1 : -1;
    let scaler = Math.log2(1 + Math.abs(e.deltaY) * 2) * direction;
    let newScale = canvasScale * (1 + scaler * -0.01);
    if (newScale < minScale) {
      newScale = minScale;
    } else if (newScale > maxScale) {
      newScale = maxScale;
    }
    const newWidth = props.width * newScale * artificialZoom;
    const newHeight = props.height * newScale * artificialZoom;
    const oldCursorXRelative = cursorX / rect.width;
    const oldCursorYRelative = cursorY / rect.height;
    const newCursorX = oldCursorXRelative * newWidth;
    const newCursorY = oldCursorYRelative * newHeight;
    const newPosX = canvasX - (newCursorX - cursorX);
    const newPosY = canvasY - (newCursorY - cursorY);

    setCanvasScale(newScale);
    setCanvasX(newPosX);
    setCanvasY(newPosY);

    const titleScaler = props.width / 512;
    setTitleScale(newScale * titleScaler);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setTouchScale(canvasScale);
      setInitialTouchDistance(initialDistance);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const rect = props.canvasRef.current.getBoundingClientRect();
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      let cursorX = midX - rect.left;
      let cursorY = midY - rect.top;
      if (cursorX < 0) {
        cursorX = 0;
      } else if (cursorX > rect.width) {
        cursorX = rect.width;
      }
      if (cursorY < 0) {
        cursorY = 0;
      } else if (cursorY > rect.height) {
        cursorY = rect.height;
      }

      let newScale = (distance / touchInitialDistance) * touchScale;
      if (newScale < minScale) {
        newScale = minScale;
      } else if (newScale > maxScale) {
        newScale = maxScale;
      }
      const newWidth = props.width * newScale;
      const newHeight = props.height * newScale;

      const oldCursorXRelative = cursorX / rect.width;
      const oldCursorYRelative = cursorY / rect.height;

      const newCursorX = oldCursorXRelative * newWidth;
      const newCursorY = oldCursorYRelative * newHeight;

      const newPosX = canvasX - (newCursorX - cursorX);
      const newPosY = canvasY - (newCursorY - cursorY);

      setCanvasScale(newScale);
      setCanvasX(newPosX);
      setCanvasY(newPosY);

      const titleScaler = props.width / 512;
      setTitleScale(newScale * titleScaler);
      // TODO: Make scroll acceleration based
    }
  };

  useEffect(() => {
    canvasContainerRef.current.addEventListener('wheel', zoom);
    canvasContainerRef.current.addEventListener('touchstart', handleTouchStart);
    canvasContainerRef.current.addEventListener('touchmove', handleTouchMove);
    return () => {
      canvasContainerRef.current.removeEventListener('wheel', zoom);
      canvasContainerRef.current.removeEventListener(
        'touchstart',
        handleTouchStart
      );
      canvasContainerRef.current.removeEventListener(
        'touchmove',
        handleTouchMove
      );
    };
  }, [canvasScale, canvasX, canvasY, touchInitialDistance]);

  // Init canvas transform to center of the viewport
  const [hasInit, setHasInit] = useState(false);
  useEffect(() => {
    if (hasInit) return;
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    console.log(containerRect);
    const adjustX = ((canvasScale - 1) * props.width) / 2;
    const adjustY = ((canvasScale - 1) * props.height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
    setHasInit(true);
  }, [canvasContainerRef, props.width, props.height]);

  const colorExtraPixel = (x, y, colorId) => {
    const canvas = props.extraPixelsCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const colorHex = `#${props.colors[colorId]}FF`;
    ctx.fillStyle = colorHex;
    ctx.fillRect(x, y, 1, 1);
  };

  const pixelSelect = async (x, y) => {
    // Clear selection if clicking the same pixel
    if (
      props.selectedColorId === -1 &&
      props.pixelSelectedMode &&
      props.selectedPositionX === x &&
      props.selectedPositionY === y
    ) {
      props.clearPixelSelection();
      return;
    }

    props.setPixelSelection(x, y);

    const position = y * props.width + x;
    // TODO: Cache pixel info & clear cache on update from websocket
    // TODO: Dont query if hover select ( until 1s after hover? )
    if (
      props.selectedColorId !== -1 ||
      props.isEraserMode ||
      props.isExtraDeleteMode
    ) {
      props.setPixelPlacedBy(null);
      return;
    }
    const pixelInfoUrl =
      props.openedWorldId == null
        ? `get-pixel-info?position=${position.toString()}`
        : `get-worlds-pixel-info?position=${position.toString()}&worldId=${props.openedWorldId}`;
    const getPixelInfoEndpoint = await fetchWrapper(pixelInfoUrl);

    if (!getPixelInfoEndpoint.data) {
      return;
    }
    props.setPixelPlacedBy(getPixelInfoEndpoint.data);
  };

  const placePixelCall = async (position, color, now) => {
    if (devnetMode) return;
    if (props.openedWorldId === null) {
      if (!props.address || !props.artPeaceContract || !props.account) return;
      // TODO: Check valid inputs
      const callData = props.artPeaceContract.populate('place_pixel', {
        pos: position,
        color: color,
        now: now
      });
      const { suggestedMaxFee } = await props.estimateInvokeFee({
        contractAddress: props.artPeaceContract.address,
        entrypoint: 'place_pixel',
        calldata: callData.calldata
      });
      /* global BigInt */
      const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
      const result = await props.artPeaceContract.place_pixel(
        callData.calldata,
        {
          maxFee
        }
      );
      console.log(result);
    } else {
      if (!props.address || !props.worldsContract || !props.account) return;
      const callData = props.worldsContract.populate('place_pixel', {
        canvas_id: props.openedWorldId,
        pos: position,
        color: color,
        now: now
      });
      const { suggestedMaxFee } = await props.estimateInvokeFee({
        contractAddress: props.worldsContract.address,
        entrypoint: 'place_pixel',
        calldata: callData.calldata
      });
      const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
      const result = await props.worldsContract.place_pixel(callData.calldata, {
        maxFee
      });
      console.log(result);
    }
  };

  const pixelClicked = async (e) => {
    if (props.nftMintingMode || props.templateCreationMode) {
      return;
    }

    const canvas = props.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(
      ((e.clientX - rect.left) / (rect.right - rect.left)) * props.width
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
    );

    // Only click pixel if it's within the canvas
    if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
      return;
    }

    // Erase Extra Pixel
    if (props.isEraserMode) {
      const pixelIndex = props.extraPixelsData.findIndex((pixelData) => {
        return pixelData.x === x && pixelData.y === y;
      });
      if (pixelIndex !== -1) props.clearExtraPixel(pixelIndex);
      // Toggle Eraser mode  if there are no Extra Pixels placed
      if (!props.extraPixelsData.length)
        props.setIsEraserMode(!props.isEraserMode);
      return;
    }

    pixelSelect(x, y);

    // Color Extra Pixel
    if (props.selectedColorId === -1) {
      return;
    }

    if (props.availablePixels > (props.basePixelUp ? 1 : 0)) {
      if (props.availablePixelsUsed < props.availablePixels) {
        props.addExtraPixel(x, y);
        colorExtraPixel(x, y, props.selectedColorId);
        return;
      } else {
        // TODO: Notify user of no more extra pixels
        return;
      }
    }

    // Color Pixel
    const position = y * props.width + x;
    const colorId = props.selectedColorId;

    const timestamp = Math.floor(Date.now() / 1000);

    if (!devnetMode) {
      props.setSelectedColorId(-1);
      props.colorPixel(position, colorId);
      await placePixelCall(position, colorId, timestamp);
      props.clearPixelSelection();
      props.setLastPlacedTime(timestamp * 1000);
      return;
    }

    if (props.selectedColorId !== -1) {
      props.setSelectedColorId(-1);
      props.colorPixel(position, colorId);
      let response;
      if (props.openedWorldId === null) {
        response = await fetchWrapper(`place-pixel-devnet`, {
          mode: 'cors',
          method: 'POST',
          body: JSON.stringify({
            position: position.toString(),
            color: colorId.toString(),
            timestamp: timestamp.toString()
          })
        });
      } else {
        response = await fetchWrapper(`place-world-pixel-devnet`, {
          mode: 'cors',
          method: 'POST',
          body: JSON.stringify({
            position: position.toString(),
            color: colorId.toString(),
            timestamp: timestamp.toString(),
            worldId: props.openedWorldId.toString()
          })
        });
      }
      if (response.result) {
        console.log(response.result);
      }
      props.clearPixelSelection();
      props.setLastPlacedTime(timestamp * 1000);
    }
    // TODO: Fix last placed time if error in placing pixel
  };

  const openWorld = (index, world) => {
    // Set current world to surrounding world at index
    let newSurroundingWorlds = [...props.surroundingWorlds];
    newSurroundingWorlds[index] = props.activeWorld;
    props.setSurroundingWorlds(newSurroundingWorlds);
    props.setOpenedWorldId(world.worldId);
  };

  useEffect(() => {
    const hoverColor = (e) => {
      if (props.selectedColorId === -1 && !props.isEraserMode) {
        return;
      }
      if (
        props.nftMintingMode ||
        props.templateCreationMode ||
        props.stencilCreationMode
      ) {
        return;
      }
      if (
        !(
          e.target.classList.contains('ExtraPixelsCanvas') ||
          e.target.classList.contains('Canvas')
        )
      ) {
        return;
      }

      const canvas = props.canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(
        ((e.clientX - rect.left) / (rect.right - rect.left)) * props.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
      );

      // Only click pixel if it's within the canvas
      if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
        return;
      }

      pixelSelect(x, y);
    };
    window.addEventListener('mousemove', hoverColor);
    return () => {
      window.removeEventListener('mousemove', hoverColor);
    };
  }, [
    props.selectedColorId,
    props.nftMintingMode,
    props.isEraserMode,
    props.templateCreationMode,
    props.stencilCreationMode,
    props.width,
    props.height
  ]);

  const getSelectedColorInverse = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null;
    }

    if (props.selectedColorId === -1) {
      const existingPixel = props.extraPixelsData.find(
        (pixel) =>
          pixel.x == props.selectedPositionX &&
          pixel.y == props.selectedPositionY
      );

      if (existingPixel) {
        let color = props.colors[existingPixel.colorId];
        return (
          '#' +
          (255 - parseInt(color.substring(0, 2), 16))
            .toString(16)
            .padStart(2, '0') +
          (255 - parseInt(color.substring(2, 4), 16))
            .toString(16)
            .padStart(2, '0') +
          (255 - parseInt(color.substring(4, 6), 16))
            .toString(16)
            .padStart(2, '0')
        );
      }

      let color = props.canvasRef.current
        .getContext('2d')
        .getImageData(
          props.selectedPositionX,
          props.selectedPositionY,
          1,
          1
        ).data;
      return (
        '#' +
        (255 - color[0]).toString(16).padStart(2, '0') +
        (255 - color[1]).toString(16).padStart(2, '0') +
        (255 - color[2]).toString(16).padStart(2, '0') +
        color[3].toString(16).padStart(2, '0')
      );
    }

    if (props.isExtraDeleteMode) {
      const existingPixel = props.extraPixelsData.find(
        (pixel) =>
          pixel.x == props.selectedPositionX &&
          pixel.y == props.selectedPositionY
      );

      if (existingPixel) {
        let color = props.colors[existingPixel.colorId];
        return (
          '#' +
          (255 - parseInt(color.substring(0, 2), 16))
            .toString(16)
            .padStart(2, '0') +
          (255 - parseInt(color.substring(2, 4), 16))
            .toString(16)
            .padStart(2, '0') +
          (255 - parseInt(color.substring(4, 6), 16))
            .toString(16)
            .padStart(2, '0')
        );
      }
    }

    return '#' + props.colors[props.selectedColorId] + 'FF';
  };

  const [selectedBoxShadow, setSelectedBoxShadow] = useState(null);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(null);
  useEffect(() => {
    const base1 = 0.12;
    const minShadowScale = 0.8;
    const startVal = Math.max(minShadowScale, base1 * canvasScale);
    const endVal = startVal * 0.8;
    setSelectedBoxShadow(
      `0 0 ${startVal}px ${endVal}px ${getSelectedColorInverse()} inset`
    );

    if (props.selectedColorId === -1) {
      setSelectedBackgroundColor('rgba(255, 255, 255, 0)');
    } else {
      if (props.isExtraDeleteMode) {
        setSelectedBackgroundColor('rgba(255, 255, 255, 0)');
      } else {
        setSelectedBackgroundColor(`#${props.colors[props.selectedColorId]}FF`);
      }
    }
  }, [
    canvasScale,
    props.selectedColorId,
    props.selectedPositionX,
    props.selectedPositionY,
    props.isExtraDeleteMode
  ]);

  const baseWorldX = 528;
  const baseWorldY = 396;
  const getWorldPosition = (index) => {
    // TODO: To config
    let xGap = 16;
    let yGap = 12;
    if (index === 0) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 1) {
      return {
        x: 0,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 2) {
      return {
        x: (baseWorldX + xGap) / 2,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 3) {
      return {
        x: baseWorldX + xGap,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 4) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: 0
      };
    } else if (index === 5) {
      return {
        x: baseWorldX + xGap,
        y: 0
      };
    } else if (index === 6) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: (baseWorldY + yGap) / 2
      };
    } else if (index === 7) {
      return {
        x: baseWorldX + xGap,
        y: (baseWorldY + yGap) / 2
      };
    } else if (index === 8) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: baseWorldY + yGap
      };
    } else if (index === 9) {
      return {
        x: 0,
        y: baseWorldY + yGap
      };
    } else if (index === 10) {
      return {
        x: (baseWorldX + xGap) / 2,
        y: baseWorldY + yGap
      };
    } else if (index === 11) {
      return {
        x: baseWorldX + xGap,
        y: baseWorldY + yGap
      };
    }
    // Circle around the center
    return {
      x: baseWorldX * 2,
      y: baseWorldY * 2
    };
  };

  const [surroundingCanvasRefs, setSurroundingCanvasRefs] = useState([]);
  useEffect(() => {
    setSurroundingCanvasRefs(
      Array.from({ length: props.surroundingWorlds.length }, () =>
        React.createRef()
      )
    );
  }, [props.surroundingWorlds]);

  useEffect(() => {
    const fetchCanvas = async (
      width,
      height,
      colors,
      canvasRef,
      openedWorldId
    ) => {
      try {
        let canvasColors = colors;
        if (colors.length === 0) {
          // Try to fetch colors from the backend
          let canvasColorsEndpoint =
            backendUrl +
            (openedWorldId === null
              ? '/get-colors'
              : `/get-worlds-colors?worldId=${openedWorldId}`);
          let response = await fetch(canvasColorsEndpoint);
          let canvasColorsData = await response.json();
          canvasColors = canvasColorsData.data;
          if (canvasColors.length === 0) {
            console.error('No colors found');
            return;
          }
        }
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;

        let getCanvasEndpoint =
          backendUrl +
          (openedWorldId === null
            ? '/get-canvas'
            : `/get-world-canvas?worldId=${openedWorldId}`);
        let response = await fetch(getCanvasEndpoint);
        let canvasData = await response.arrayBuffer();

        let colorData = new Uint8Array(canvasData, 0, canvasData.byteLength);
        let dataArray = [];
        let bitwidth = canvasConfig.colorsBitwidth;
        let oneByteBitOffset = 8 - bitwidth;
        let twoByteBitOffset = 16 - bitwidth;
        let canvasBits = width * height * bitwidth;
        for (let bitPos = 0; bitPos < canvasBits; bitPos += bitwidth) {
          let bytePos = Math.floor(bitPos / 8);
          let bitOffset = bitPos % 8;
          if (bitOffset <= oneByteBitOffset) {
            let byte = colorData[bytePos];
            let value = (byte >> (oneByteBitOffset - bitOffset)) & 0b11111;
            dataArray.push(value);
          } else {
            let byte = (colorData[bytePos] << 8) | colorData[bytePos + 1];
            let value = (byte >> (twoByteBitOffset - bitOffset)) & 0b11111;
            dataArray.push(value);
          }
        }
        let imageDataArray = [];
        for (let i = 0; i < dataArray.length; i++) {
          const color = '#' + canvasColors[dataArray[i]] + 'FF';
          const [r, g, b, a] = color.match(/\w\w/g).map((x) => parseInt(x, 16));
          imageDataArray.push(r, g, b, a);
        }
        const uint8ClampedArray = new Uint8ClampedArray(imageDataArray);
        const imageData = new ImageData(uint8ClampedArray, width, height);
        context.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error(error);
      }
    };

    if (props.openedWorldId !== null) {
      fetchCanvas(
        props.width,
        props.height,
        props.colors,
        props.canvasRef,
        props.openedWorldId
      );
    }
    for (let i = 0; i < surroundingCanvasRefs.length; i++) {
      if (surroundingCanvasRefs[i].current) {
        let canvasConfig = props.surroundingWorlds[i];
        fetchCanvas(
          canvasConfig.width,
          canvasConfig.height,
          [],
          surroundingCanvasRefs[i],
          canvasConfig.worldId
        );
      }
    }
  }, [surroundingCanvasRefs, props.openedWorldId, props.activeWorld]);

  const [artificialZoom, setArtificialZoom] = useState(1);
  useEffect(() => {
    if (
      props.openedWorldId === 0 ||
      (props.activeWorld && props.activeWorld.worldId === 0)
    ) {
      setArtificialZoom(1);
    } else {
      setArtificialZoom(2.0625);
    }
  }, [props.isHome, props.worldsMode, props.activeWorld, props.openedWorldId]);

  return (
    <div
      ref={canvasContainerRef}
      className='CanvasContainer'
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <div
        className='CanvasContainer__anchor'
        style={{
          top: -baseWorldY / 2,
          left: -baseWorldX / 2,
          transform: `translate(${canvasX}px, ${canvasY}px)`
        }}
      >
        {props.isHome &&
          props.worldsMode &&
          props.surroundingWorlds &&
          props.surroundingWorlds.length > 0 &&
          props.surroundingWorlds.map((world, index) => {
            if (world === null) return null;
            const position = getWorldPosition(index);
            if (!position) return null;
            let surroundingWorldScaler = 1;
            if (world.worldId === 0) {
              surroundingWorldScaler = 1 / 2.0625;
            }
            return (
              <Canvas
                key={index}
                openedWorldId={world.worldId}
                canvasRef={surroundingCanvasRefs[index]}
                width={world.width}
                height={world.height}
                style={{
                  width: world.width * canvasScale * surroundingWorldScaler,
                  height: world.height * canvasScale * surroundingWorldScaler,
                  position: 'absolute',
                  top: position.y * canvasScale,
                  left: position.x * canvasScale,
                  cursor: 'pointer'
                }}
                className='Canvas__surrounding'
                colors={[]}
                pixelClicked={() => openWorld(index, world)}
              />
            );
          })}
        {!props.isHome &&
          props.openedWorldId !== null &&
          props.activeWorld !== null && (
            <h3
              className='CanvasContainer__title'
              style={{
                top: `calc(-0.75rem * ${titleScale})`,
                left: '50%',
                transform: `translate(-50%, -50%) scale(${titleScale})`
              }}
            >
              {props.activeWorld.name}
            </h3>
          )}
        {props.pixelSelectedMode && (
          <div
            className='Canvas__selection'
            style={{
              top: props.selectedPositionY * canvasScale,
              left: props.selectedPositionX * canvasScale
            }}
          >
            <div
              className='Canvas__selection__pixel'
              style={{
                boxShadow: selectedBoxShadow,
                backgroundColor: selectedBackgroundColor,
                width: canvasScale,
                height: canvasScale
              }}
            ></div>
          </div>
        )}
        {props.worldsMode ? (
          <Canvas
            openedWorldId={props.openedWorldId}
            canvasRef={props.canvasRef}
            width={props.width}
            height={props.height}
            style={{
              width: props.width * canvasScale * artificialZoom,
              height: props.height * canvasScale * artificialZoom
            }}
            colors={props.colors}
            pixelClicked={pixelClicked}
          />
        ) : (
          <div
            style={{
              display: 'relative'
            }}
          >
            <Canvas
              canvasRef={props.canvasRef}
              width={props.width}
              height={props.height}
              style={{
                width: props.width * canvasScale,
                height: props.height * canvasScale
              }}
              colors={props.colors}
              pixelClicked={pixelClicked}
            />
            <h2
              className='CanvasContainer__title CanvasContainer__title--worlds'
              style={{
                top: '10%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${titleScale})`
              }}
            >
              art/peace Worlds
            </h2>
            <h2
              className='CanvasContainer__title CanvasContainer__title--worlds'
              style={{
                top: '90%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${titleScale})`
              }}
            >
              coming soon...
            </h2>
          </div>
        )}
        {props.availablePixels > 0 && (
          <ExtraPixelsCanvas
            extraPixelsCanvasRef={props.extraPixelsCanvasRef}
            width={props.width}
            height={props.height}
            style={{
              width: props.width * canvasScale,
              height: props.height * canvasScale
            }}
            colors={props.colors}
            pixelClicked={pixelClicked}
          />
        )}
        {props.templateOverlayMode && props.overlayTemplate && (
          <TemplateOverlay
            canvasRef={props.canvasRef}
            width={props.width}
            height={props.height}
            canvasScale={canvasScale}
            overlayTemplate={props.overlayTemplate}
            setTemplateOverlayMode={props.setTemplateOverlayMode}
            setOverlayTemplate={props.setOverlayTemplate}
            colors={props.colors}
            openedWorldId={props.openedWorldId}
          />
        )}
        {props.templateCreationMode && (
          <TemplateCreationOverlay
            canvasRef={props.canvasRef}
            canvasScale={canvasScale}
            templateImage={props.templateImage}
            templateColorIds={props.templateColorIds}
            templateCreationMode={props.templateCreationMode}
            setTemplateCreationMode={props.setTemplateCreationMode}
            templateCreationSelected={props.templateCreationSelected}
            setTemplateCreationSelected={props.setTemplateCreationSelected}
            width={props.width}
            height={props.height}
            templatePosition={props.templatePosition}
            setTemplatePosition={props.setTemplatePosition}
          />
        )}
        {props.stencilCreationMode && (
          <StencilCreationOverlay
            canvasRef={props.canvasRef}
            canvasScale={canvasScale}
            stencilImage={props.stencilImage}
            stencilColorIds={props.stencilColorIds}
            stencilCreationMode={props.stencilCreationMode}
            setStencilCreationMode={props.setStencilCreationMode}
            stencilCreationSelected={props.stencilCreationSelected}
            setStencilCreationSelected={props.setStencilCreationSelected}
            width={props.width}
            height={props.height}
            stencilPosition={props.stencilPosition}
            setStencilPosition={props.setStencilPosition}
          />
        )}
        {props.nftMintingMode && (
          <NFTSelector
            canvasRef={props.canvasRef}
            canvasScale={canvasScale}
            width={props.width}
            height={props.height}
            nftMintingMode={props.nftMintingMode}
            nftSelectionStarted={props.nftSelectionStarted}
            setNftSelectionStarted={props.setNftSelectionStarted}
            nftSelected={props.nftSelected}
            setNftSelected={props.setNftSelected}
            setNftMintingMode={props.setNftMintingMode}
            setNftPosition={props.setNftPosition}
            setNftWidth={props.setNftWidth}
            setNftHeight={props.setNftHeight}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasContainer;
