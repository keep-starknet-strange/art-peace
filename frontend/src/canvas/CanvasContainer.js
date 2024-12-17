import React, { useState, useEffect, useRef } from 'react';
import './CanvasContainer.css';
import Canvas from './Canvas';
import ExtraPixelsCanvas from './ExtraPixelsCanvas.js';
import TemplateOverlay from './TemplateOverlay.js';
import TemplateCreationOverlay from './TemplateCreationOverlay.js';
import StencilCreationOverlay from './StencilCreationOverlay.js';
import NFTSelector from './NFTSelector.js';
import { fetchWrapper } from '../services/apiService.js';
import { devnetMode } from '../utils/Consts.js';

const CanvasContainer = (props) => {
  // Calculate minimum scale based on container and canvas dimensions
  const containerWidth = 1072;
  const containerHeight = 804;
  const centerCanvasWidth = 518;
  const centerCanvasHeight = 396;
  const surroundingCanvasWidth = 256;
  const surroundingCanvasHeight = 192;

  // Calculate minimum scale needed to fill container
  const widthScale =
    containerWidth / (centerCanvasWidth + surroundingCanvasWidth * 2);
  const heightScale =
    containerHeight / (centerCanvasHeight + surroundingCanvasHeight * 2);
  const minScale = Math.max(widthScale, heightScale, 0.6); // Keep original minimum if larger
  const maxScale = 40;

  const [canvasX, setCanvasX] = useState(0);
  const [canvasY, setCanvasY] = useState(0);
  const [canvasScale, setCanvasScale] = useState(minScale);
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
    const rect = props.canvasRef.current.getBoundingClientRect();
    let cursorX = e.clientX - rect.left;
    let cursorY = e.clientY - rect.top;

    // Clamp cursor position
    cursorX = Math.max(0, Math.min(cursorX, rect.width));
    cursorY = Math.max(0, Math.min(cursorY, rect.height));

    let direction = e.deltaY > 0 ? 1 : -1;
    let scaler = Math.log2(1 + Math.abs(e.deltaY) * 2) * direction;
    let newScale = canvasScale * (1 + scaler * -0.01);

    // Enforce scale limits
    newScale = Math.max(minScale, Math.min(newScale, maxScale));

    // Calculate new dimensions
    const newWidth = props.width * newScale;
    const newHeight = props.height * newScale;

    // Calculate position adjustments to maintain cursor position
    const cursorXRelative = (cursorX - canvasX) / (props.width * canvasScale);
    const cursorYRelative = (cursorY - canvasY) / (props.height * canvasScale);

    const newCursorX = cursorXRelative * newWidth;
    const newCursorY = cursorYRelative * newHeight;

    // Calculate new positions
    const newPosX = Math.round(cursorX - newCursorX);
    const newPosY = Math.round(cursorY - newCursorY);

    setCanvasScale(newScale);
    setCanvasX(newPosX);
    setCanvasY(newPosY);
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
      newScale = Math.max(minScale, Math.min(newScale, maxScale));

      // Calculate cursor positions
      const newCursorX = cursorX * (newScale / canvasScale);
      const newCursorY = cursorY * (newScale / canvasScale);

      // Round positions to prevent subpixel gaps
      const newPosX = Math.round(canvasX - (newCursorX - cursorX));
      const newPosY = Math.round(canvasY - (newCursorY - cursorY));

      setCanvasScale(newScale);
      setCanvasX(newPosX);
      setCanvasY(newPosY);
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
  useEffect(() => {
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const adjustX = ((canvasScale - 1) * props.width) / 2;
    const adjustY = ((canvasScale - 1) * props.height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
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

      if (!props.canvasRef || !props.canvasRef.current) {
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

  return (
    <div
      ref={canvasContainerRef}
      className='CanvasContainer'
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <div className='CanvasContainer__inner'>
        {/* Center Canvas */}
        <div
          className='CanvasContainer__anchor center'
          style={{
            transform: `translate(${Math.round(canvasX)}px, ${Math.round(canvasY)}px)`,
            width: Math.round(518 * canvasScale) + 'px',
            height: Math.round(396 * canvasScale) + 'px'
          }}
          key='center'
        >
          <div
            className='CanvasContainer__canvas-wrapper'
            style={{
              position: 'relative',
              width: 518 * canvasScale,
              height: 396 * canvasScale,
              overflow: 'hidden'
            }}
          >
            <Canvas
              openedWorldId={props.openedWorldId}
              canvasRef={props.canvasRef}
              width={518}
              height={396}
              style={{
                width: 518 * canvasScale,
                height: 396 * canvasScale
              }}
              colors={props.colors}
              pixelClicked={pixelClicked}
              canvasScale={canvasScale}
              isCenter={true}
            />

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
              />
            )}
          </div>

          {/* Move overlay components inside center canvas */}
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
              width={518}
              height={396}
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

        {/* 12 Surrounding Canvases */}
        {props.surroundingWorlds.slice(0, 12).map((world, index) => {
          const gridPositions = [
            { gridColumn: '2', gridRow: '1' }, // Top
            { gridColumn: '3', gridRow: '1' }, // Top
            { gridColumn: '4', gridRow: '2' }, // Right
            { gridColumn: '4', gridRow: '3' }, // Right
            { gridColumn: '2', gridRow: '4' }, // Bottom
            { gridColumn: '3', gridRow: '4' }, // Bottom
            { gridColumn: '1', gridRow: '2' }, // Left
            { gridColumn: '1', gridRow: '3' }, // Left
            { gridColumn: '1', gridRow: '1' }, // Corners
            { gridColumn: '4', gridRow: '1' },
            { gridColumn: '1', gridRow: '4' },
            { gridColumn: '4', gridRow: '4' }
          ];

          return (
            <div
              className='CanvasContainer__anchor surrounding'
              style={{
                transform: `translate(${Math.round(canvasX)}px, ${Math.round(canvasY)}px)`,
                width: Math.round(256 * canvasScale) + 'px',
                height: Math.round(192 * canvasScale) + 'px',
                gridColumn: gridPositions[index].gridColumn,
                gridRow: gridPositions[index].gridRow,
                cursor: world ? 'pointer' : 'default'
              }}
              key={`surrounding-${index}`}
              onClick={() => {
                if (world) {
                  window.location.href = `/worlds/${world.uniqueName}`;
                }
              }}
            >
              <Canvas
                openedWorldId={world ? world.worldId : null}
                canvasRef={React.createRef()}
                width={256}
                height={192}
                style={{
                  width: 256 * canvasScale,
                  height: 192 * canvasScale
                }}
                colors={props.colors}
                pixelClicked={pixelClicked}
                isEmpty={!world}
                isCenter={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasContainer;
