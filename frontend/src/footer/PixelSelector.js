import React, { useEffect, useState } from 'react';
import './PixelSelector.css';
import '../utils/Styles.css';
import EraserIcon from '../resources/icons/Eraser.png';

const PixelSelector = (props) => {
  // Track when a placement is available

  const [placementTimer, setPlacementTimer] = useState('XX:XX');
  const [placementMode, setPlacementMode] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (props.queryAddress === '0') {
      setPlacementTimer('Login to Play');
      return;
    }
    if (props.availablePixels > 0) {
      let amountAvailable = props.availablePixels - props.availablePixelsUsed;
      if (amountAvailable > 1) {
        setPlacementTimer('Place Pixels');
        return;
      } else if (amountAvailable === 1) {
        setPlacementTimer('Place Pixel');
        return;
      } else {
        setPlacementTimer('Out of Pixels');
        return;
      }
    } else {
      // TODO: Use lowest timer out of base, chain, faction, ...
      setPlacementTimer(props.basePixelTimer);
      props.clearAll();
    }
    if (
      placementTimer === '0:00' &&
      placementMode &&
      placementTimer !== 'Out of Pixels' &&
      placementTimer !== 'Login to Play'
    ) {
      setEnded(true);
    } else {
      setEnded(false);
    }
  }, [
    props.availablePixels,
    props.availablePixelsUsed,
    props.basePixelTimer,
    props.queryAddress,
    placementTimer,
    placementMode
  ]);

  const defendTemplate = async () => {
    if (!props.templatePixels || !props.templatePixels.pixelData) return;
    const availableCount = props.availablePixels - props.availablePixelsUsed;
    if (props.availablePixels == 0) return;

    const templateX = props.overlayTemplate.position % props.width;
    const templateY = Math.floor(props.overlayTemplate.position / props.width);

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
      const currentColor = `${imageData[0]
        .toString(16)
        .padStart(2, '0')}${imageData[1]
        .toString(16)
        .padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;

      // Only add if different from template
      if (currentColor.toLowerCase() !== props.colors[colorId].toLowerCase()) {
        pixelsToPlace.push({
          x: canvasX,
          y: canvasY,
          colorId: colorId
        });
      }
    }

    while (pixelsToPlace.length < availableCount) {
      // Place random pixel in template
      let idx = Math.floor(
        Math.random() * props.templatePixels.pixelData.length
      );
      const randomX = idx % props.templatePixels.width;
      const randomY = Math.floor(idx / props.templatePixels.width);
      const colorId = props.templatePixels.pixelData[idx];
      if (colorId === 0xff) continue; // Skip transparent pixels
      const canvasX = templateX + randomX;
      const canvasY = templateY + randomY;
      pixelsToPlace.push({
        x: canvasX,
        y: canvasY,
        colorId: colorId
      });
    }

    // Randomly select pixels up to available amount
    const shuffledPixels = pixelsToPlace.sort(() => Math.random() - 0.5);
    const selectedPixels = shuffledPixels.slice(0, availableCount);

    await props.addExtraPixels(selectedPixels);
  };

  useEffect(() => {
    if (
      props.isDefending &&
      (placementTimer === 'Place Pixels' || placementTimer === 'Place Pixel')
    ) {
      defendTemplate();
    }
  }, [placementTimer, props.isDefending]);

  useEffect(() => {
    const submit = async () => {
      if (
        props.templatePixels &&
        props.isDefending &&
        props.availablePixels > 0 &&
        props.totalPixelsUsed === props.availablePixels
      ) {
        await props.submit();
      }
    };
    submit();
  }, [props.totalPixelsUsed]);

  const toSelectorMode = async (event) => {
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains('Button__close')) {
      return;
    }

    if (props.queryAddress === '0') {
      props.doControllerConnect();
      // props.setActiveTab('Account');
      return;
    }

    if (props.availablePixels > props.availablePixelsUsed) {
      props.setSelectorMode(true);
      props.setIsEraserMode(false);
      setPlacementMode(true);
    }
  };

  const selectColor = (idx) => {
    props.setSelectedColorId(idx);
    props.setSelectorMode(false);
  };

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    props.setSelectorMode(false);
    setPlacementMode(false);
    props.setIsEraserMode(false);
    setEnded(false);
  };

  useEffect(() => {
    cancelSelector();
  }, [props.openedWorldId]);

  return (
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
      {props.queryAddress !== '0' &&
        props.templatePixels.pixelData &&
        props.templatePixels.pixelData.length > 0 && (
          <div style={{ marginLeft: '1rem' }}>
            <div
              className='PixelSelector__defend Text__large Button__primary'
              onClick={() => props.setIsDefending(!props.isDefending)}
            >
              <p className='PixelSelector__text'>
                {props.isDefending ? 'Stop' : 'Defend'}
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default PixelSelector;
