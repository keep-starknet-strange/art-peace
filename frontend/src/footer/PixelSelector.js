import React, { useEffect, useState } from 'react';
import './PixelSelector.css';
import '../utils/Styles.css';
import { backendUrl } from '../utils/Consts.js';
import { fetchWrapper } from '../services/apiService.js';

const PixelSelector = (props) => {
  // Track when a placement is available

  const updateInterval = 250; // 250ms
  // TODO: make this a config
  const timeBetweenPlacements = 5000; // 5 seconds
  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [placementTimer, setPlacementTimer] = useState('XX:XX');
  const [pixelAvailable, setPixelAvailable] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (props.extraPixels > 0) {
        let newPixelAvailable = props.extraPixels - props.extraPixelsUsed > 0;
        setPixelAvailable(newPixelAvailable);
        if (newPixelAvailable) {
          setPlacementTimer('Place Pixel');
        } else {
          // TODO: Do we want to allow selecting colors / erasing xtra pixels?
          setPlacementTimer('Out of XTRA');
        }
        return;
      }

      let timeSinceLastPlacement = Date.now() - lastPlacedTime;
      let newPixelAvailable = timeSinceLastPlacement > timeBetweenPlacements;
      setPixelAvailable(newPixelAvailable);
      if (newPixelAvailable) {
        setPlacementTimer('Place Pixel');
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
  }, [
    lastPlacedTime,
    timeBetweenPlacements,
    props.extraPixels,
    props.extraPixelsUsed
  ]);

  useEffect(() => {
    const getLastPlacedPixel = 'get-last-placed-time?address=0';
    async function fetchGetLastPlacedPixel(){
      const response = await fetchWrapper(getLastPlacedPixel);
      if(!response.data){
        return
      }
      const time = new Date(response.data);
      setLastPlacedTime(time);
    }

    fetchGetLastPlacedPixel()
  }, []);

  // Selector mode controls

  const [selectorMode, setSelectorMode] = useState(false);

  const toSelectorMode = (event) => {
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains('Button__close')) {
      return;
    }

    if (pixelAvailable) {
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
          <div className='Button__close' onClick={() => cancelSelector()}>
            x
          </div>
        </div>
      )}
      {!selectorMode && (
        <div
          className={
            'Button__primary Text__large ' +
            (pixelAvailable
              ? 'PixelSelector__button--valid'
              : 'PixelSelector__button--invalid')
          }
          onClick={toSelectorMode}
        >
          <p className='PixelSelector__text'>{placementTimer}</p>
          {props.extraPixels > 0 && (
            <div className='PixelSelector__extras'>
              <p style={{ margin: '0 0.5rem' }}>|</p>
              <p className='PixelSelector__text'>
                {props.extraPixels - props.extraPixelsUsed} XTRA
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
