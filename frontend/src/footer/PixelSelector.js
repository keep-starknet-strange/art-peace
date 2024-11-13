import React, { useEffect, useState, useCallback } from 'react';
import './PixelSelector.css';
import '../utils/Styles.css';
import EraserIcon from '../resources/icons/Eraser.png';

const PixelSelector = (props) => {
  // Track when a placement is available

  const [placementTimer, setPlacementTimer] = useState('XX:XX');
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (props.queryAddress === '0') {
      setPlacementTimer('Login to Play');
      return;
    }

    // Show countdown if last placed time exists and timer is active
    if (props.lastPlacedTime && props.basePixelTimer !== 'Place Pixel') {
      setPlacementTimer(props.basePixelTimer);
      return;
    }

    if (props.availablePixels > 0) {
      let amountAvailable = props.availablePixels - props.availablePixelsUsed;
      if (amountAvailable > 1) {
        setPlacementTimer('Place Pixels');
      } else if (amountAvailable === 1) {
        setPlacementTimer('Place Pixel');
      } else {
        setPlacementTimer('Out of Pixels');
      }
    } else {
      setPlacementTimer(props.basePixelTimer);
    }

    if (placementTimer === '00:00') {
      setEnded(true);
    }
  }, [
    props.availablePixels,
    props.availablePixelsUsed,
    props.basePixelTimer,
    props.queryAddress,
    props.lastPlacedTime,
    placementTimer
  ]);

  const toSelectorMode = (event) => {
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains('Button__close')) {
      return;
    }

    if (props.queryAddress === '0') {
      props.setActiveTab('Account');
      return;
    }

    if (
      props.availablePixels > props.availablePixelsUsed &&
      props.basePixelTimer === 'Place Pixel'
    ) {
      props.setSelectorMode(true);
      props.setIsEraserMode(false);
    }
  };

  const selectColor = (idx) => {
    props.setSelectedColorId(idx);
    props.setSelectorMode(false);
  };

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    props.setSelectorMode(false);
    props.setIsEraserMode(false);
    setEnded(false);
  };

  const defendTemplate = useCallback(() => {
    if (
      !props.overlayTemplate ||
      !props.templatePixels ||
      !props.templatePixels.pixelData
    )
      return;

    // const availableCount = props.templatePixels.pixelData.length;
    const availableCount = props.availablePixels - props.availablePixelsUsed;
    if (availableCount <= 0) return;

    const templateX = props.overlayTemplate.position % props.width;
    const templateY = Math.floor(props.overlayTemplate.position / props.width);

    // Get current canvas state
    const canvas = props.canvasRef.current;
    const context = canvas.getContext('2d');

    const pixelsToPlace = [];
    for (let i = 0; i < props.templatePixels.pixelData.length; i++) {
      const colorId = props.templatePixels.pixelData[i];
      if (colorId === 0xff) continue; // Skip transparent pixels

      const pixelX = i % props.templatePixels.width;
      const pixelY = Math.floor(i / props.templatePixels.width);
      const canvasX = templateX + pixelX;
      const canvasY = templateY + pixelY;

      // Get current pixel color
      const imageData = context.getImageData(canvasX, canvasY, 1, 1).data;
      const currentColor = `${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;

      // Only add if different from template
      if (currentColor.toLowerCase() !== props.colors[colorId].toLowerCase()) {
        pixelsToPlace.push({
          x: canvasX,
          y: canvasY,
          colorId: colorId
        });
      }
    }

    // Randomly select pixels up to available amount
    const shuffledPixels = pixelsToPlace.sort(() => Math.random() - 0.5);
    const selectedPixels = shuffledPixels.slice(0, availableCount);

    if (selectedPixels.length > 0) {
      // Add all selected pixels at once
      props.addExtraPixel(selectedPixels);
      // Update last placed time
      props.setLastPlacedTime(Date.now());
    }
  }, [
    props.overlayTemplate,
    props.templatePixels,
    props.availablePixels,
    props.availablePixelsUsed,
    props.width,
    props.colors,
    props.addExtraPixel,
    props.setLastPlacedTime,
    props.canvasRef
  ]);

  useEffect(() => {
    if (
      props.overlayTemplate &&
      props.isDefending &&
      props.availablePixels - props.availablePixelsUsed > 0 &&
      ended
    ) {
      defendTemplate();
    }
  }, [
    props.overlayTemplate,
    props.isDefending,
    props.availablePixels,
    props.availablePixelsUsed,
    ended,
    defendTemplate
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        alignItems: 'center'
      }}
    >
      <div className='PixelSelector'>
        {(props.selectorMode || ended) && (
          <div className='PixelSelector__selector'>
            <div className='PixelSelector__selector__colors'>
              {props.colors.map((color, idx) => {
                return (
                  <div
                    className='PixelSelector__color PixelSelector__color__selectable'
                    key={idx}
                    style={{ backgroundColor: `#${color}FF` }}
                    onClick={() => selectColor(idx)}
                  ></div>
                );
              })}
            </div>
            <div className='Button__close' onClick={() => cancelSelector()}>
              x
            </div>
          </div>
        )}
        {!props.selectorMode && !ended && (
          <div
            className={
              'Button__primary Text__large ' +
              (props.availablePixels > props.availablePixelsUsed
                ? ''
                : 'PixelSelector__button--invalid')
            }
            onClick={toSelectorMode}
          >
            <p className='PixelSelector__text'>{placementTimer}</p>
            {props.availablePixels > (props.basePixelUp ? 1 : 0) && (
              <div className='PixelSelector__extras'>
                <div
                  style={{
                    margin: '0 1rem',
                    height: '2.4rem',
                    width: '0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)'
                  }}
                ></div>
                <p className='PixelSelector__text'>
                  {props.availablePixels - props.availablePixelsUsed} left
                </p>
              </div>
            )}
            {props.selectedColorId !== -1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0 0 0 0.5rem'
                }}
              >
                <div
                  className='PixelSelector__color'
                  style={{
                    backgroundColor: `#${props.colors[props.selectedColorId]}FF`
                  }}
                ></div>
                <div
                  className='Button__close'
                  style={{ marginLeft: '1rem' }}
                  onClick={() => cancelSelector()}
                >
                  x
                </div>
              </div>
            )}
            {props.isEraserMode && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0 0 0 0.5rem'
                }}
              >
                <div
                  className='PixelSelector__color'
                  style={{
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <img
                    src={EraserIcon}
                    alt='Eraser'
                    style={{
                      width: '2rem',
                      height: '2rem'
                    }}
                  />
                </div>
                <div
                  className='Button__close'
                  style={{ marginLeft: '1rem' }}
                  onClick={() => cancelSelector()}
                >
                  x
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {props.overlayTemplate && (
        <div
          className='Button__primary Text__large'
          onClick={() => props.setIsDefending(!props.isDefending)}
          disabled={props.availablePixels <= props.availablePixelsUsed}
        >
          <p className='PixelSelector__text'>
            {props.isDefending ? 'Defender On' : 'Defender Off'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PixelSelector;
