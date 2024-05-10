import React, { useEffect, useState } from 'react';
import './PixelSelector.css';
import '../utils/Styles.css';
import { backendUrl } from '../utils/Consts.js';

const PixelSelector = (props) => {
  // Track when a placement is available

  const updateInterval = 250; // 250ms
  // TODO: make this a config
  const timeBetweenPlacements = 5000; // 5 seconds
  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [placementTimer, setPlacementTimer] = useState('XX:XX');

  useEffect(() => {
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
      const interval = setInterval(() => {
        let timeSinceLastPlacement = Date.now() - lastPlacedTime;
        let basePixelAvailable = timeSinceLastPlacement > timeBetweenPlacements;
        if (basePixelAvailable) {
          props.setBasePixelUp(true);
          setPlacementTimer('Place Pixel');
          clearInterval(interval);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          setPlacementTimer(
            `${Math.floor(secondsTillPlacement / 60)}:${secondsTillPlacement % 60 < 10 ? '0' : ''}${secondsTillPlacement % 60}`
          );
        }
      }, updateInterval);
      return () => clearInterval(interval);
    }
  }, [props.availablePixels, props.availablePixelsUsed, lastPlacedTime]);

  useEffect(() => {
    const getLastPlacedPixel = backendUrl + '/get-last-placed-time?address=0';
    fetch(getLastPlacedPixel)
      .then((response) => response.json())
      .then((responseData) => {
        const time = new Date(responseData.data);
        setLastPlacedTime(time);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  // Selector mode controls

  const [selectorMode, setSelectorMode] = useState(false);

  const toSelectorMode = (event) => {
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains('Button__close')) {
      return;
    }

    if (props.availablePixels > props.availablePixelsUsed) {
      setSelectorMode(true);
    }
  };

  const selectColor = (idx) => {
    props.setSelectedColorId(idx);
    setSelectorMode(false);
  };

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    setSelectorMode(false);
  };

  return (
    <div className='PixelSelector'>
      {selectorMode && (
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
      {!selectorMode && (
        <div
          className={
            'Button__primary Text__large ' +
            (props.availablePixels > props.availablePixelsUsed
              ? 'PixelSelector__button--valid'
              : 'PixelSelector__button--invalid')
          }
          onClick={toSelectorMode}
        >
          <p className='PixelSelector__text'>{placementTimer}</p>
          {props.availablePixels > (props.basePixelUp ? 1 : 0) && (
            <div className='PixelSelector__extras'>
              <p style={{ margin: '0 0.5rem' }}>|</p>
              <p className='PixelSelector__text'>
                {props.availablePixels - props.availablePixelsUsed} XTRA
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
        </div>
      )}
    </div>
  );
};

export default PixelSelector;
