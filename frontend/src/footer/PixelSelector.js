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
