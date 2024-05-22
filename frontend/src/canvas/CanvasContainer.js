import React, { useState, useEffect, useRef } from 'react';
import { useContractWrite } from '@starknet-react/core';
import './CanvasContainer.css';
import Canvas from './Canvas';
import ExtraPixelsCanvas from './ExtraPixelsCanvas.js';
import NFTSelector from './NFTSelector.js';
import canvasConfig from '../configs/canvas.config.json';
import { fetchWrapper } from '../services/apiService.js';
import { devnetMode } from '../utils/Consts.js';

const CanvasContainer = (props) => {
  // TODO: Handle window resize
  const width = canvasConfig.canvas.width;
  const height = canvasConfig.canvas.height;

  const minScale = 1;
  const maxScale = 40;

  const [canvasX, setCanvasX] = useState(0);
  const [canvasY, setCanvasY] = useState(0);
  const [canvasScale, setCanvasScale] = useState(3.85);

  const canvasContainerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const [isErasing, setIsErasing] = useState(false);

  const handlePointerDown = (e) => {
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
    // Get the cursor position within the canvas ( note the canvas can go outsid  e the viewport )
    const rect = props.canvasRef.current.getBoundingClientRect();
    let cursorX = e.clientX - rect.left;
    let cursorY = e.clientY - rect.top;
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
    let newScale = canvasScale * (1 + e.deltaY * -0.01);
    if (newScale < minScale) {
      newScale = minScale;
    } else if (newScale > maxScale) {
      newScale = maxScale;
    }
    const newWidth = width * newScale;
    const newHeight = height * newScale;
    const oldCursorXRelative = cursorX / rect.width;
    const oldCursorYRelative = cursorY / rect.height;
    const newCursorX = oldCursorXRelative * newWidth;
    const newCursorY = oldCursorYRelative * newHeight;
    const newPosX = canvasX - (newCursorX - cursorX);
    const newPosY = canvasY - (newCursorY - cursorY);

    setCanvasScale(newScale);
    setCanvasX(newPosX);
    setCanvasY(newPosY);
  };

  useEffect(() => {
    canvasContainerRef.current.addEventListener('wheel', zoom);
    return () => {
      canvasContainerRef.current.removeEventListener('wheel', zoom);
    };
  }, [canvasScale, canvasX, canvasY]);

  // Init canvas transform to center of the viewport
  useEffect(() => {
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const adjustX = ((canvasScale - 1) * width) / 2;
    const adjustY = ((canvasScale - 1) * height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
  }, [canvasContainerRef]);

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

    const position = y * width + x;
    // TODO: Cache pixel info & clear cache on update from websocket
    // TODO: Dont query if hover select ( until 1s after hover? )
    const getPixelInfoEndpoint = await fetchWrapper(
      `get-pixel-info?position=${position.toString()}`
    );

    if (!getPixelInfoEndpoint.data) {
      return;
    }
    props.setPixelPlacedBy(getPixelInfoEndpoint.data);
  };

  const [calls, setCalls] = useState([]);
  const placePixelCall = (position, color, now) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    // TODO: Check valid inputs
    setCalls(
      props.artPeaceContract.populateTransaction['place_pixel'](
        position,
        color,
        now
      )
    );
  };

  useEffect(() => {
    const placePixel = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Place Pixel successful:', data, isPending);
      // TODO: Update the UI with the new state
    };
    placePixel();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  const pixelClicked = async (e) => {
    if (props.nftMintingMode) {
      return;
    }

    const canvas = props.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(
      ((e.clientX - rect.left) / (rect.right - rect.left)) * width
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / (rect.bottom - rect.top)) * height
    );

    // Only click pixel if it's within the canvas
    if (x < 0 || x >= width || y < 0 || y >= height) {
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
    const position = y * width + x;
    const colorId = props.selectedColorId;

    const timestamp = Math.floor(Date.now() / 1000);

    if (!devnetMode) {
      placePixelCall(position, colorId, timestamp);
      props.clearPixelSelection();
      props.setSelectedColorId(-1);
      props.setLastPlacedTime(timestamp * 1000);
      return;
    }

    const response = await fetchWrapper(`place-pixel-devnet`, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        position: position.toString(),
        color: colorId.toString(),
        timestamp: timestamp.toString()
      })
    });
    if (response.result) {
      console.log(response.result);
    }
    props.clearPixelSelection();
    props.setSelectedColorId(-1);
    props.setLastPlacedTime(timestamp * 1000);
    // TODO: Fix last placed time if error in placing pixel
  };
  // TODO: Erasing extra pixels

  useEffect(() => {
    const hoverColor = (e) => {
      if (props.selectedColorId === -1 && !props.isEraserMode) {
        return;
      }
      if (props.nftMintingMode) {
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
        ((e.clientX - rect.left) / (rect.right - rect.left)) * width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) * height
      );

      // Only click pixel if it's within the canvas
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
      }

      pixelSelect(x, y);
    };
    window.addEventListener('mousemove', hoverColor);
    return () => {
      window.removeEventListener('mousemove', hoverColor);
    };
  }, [props.selectedColorId, props.nftMintingMode, props.isEraserMode]);

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
          top: -height / 2,
          left: -width / 2,
          transform: `translate(${canvasX}px, ${canvasY}px)`
        }}
      >
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
        <Canvas
          canvasRef={props.canvasRef}
          width={width}
          height={height}
          style={{
            width: width * canvasScale,
            height: height * canvasScale
          }}
          colors={props.colors}
          pixelClicked={pixelClicked}
        />
        {props.availablePixels > 0 && (
          <ExtraPixelsCanvas
            extraPixelsCanvasRef={props.extraPixelsCanvasRef}
            width={width}
            height={height}
            style={{
              width: width * canvasScale,
              height: height * canvasScale
            }}
            colors={props.colors}
            pixelClicked={pixelClicked}
          />
        )}
        {props.nftMintingMode && (
          <NFTSelector
            canvasRef={props.canvasRef}
            canvasScale={canvasScale}
            width={width}
            height={height}
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
