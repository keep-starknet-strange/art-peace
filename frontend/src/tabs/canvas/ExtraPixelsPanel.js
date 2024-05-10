import React from 'react';
import './ExtraPixelsPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';

const ExtraPixelsPanel = (props) => {
  // TODO: Change on isPortrait
  // TODO: Highlight selected pixel when trying to remove it

  const clearAll = () => {
    props.clearExtraPixels();
    props.setSelectedColorId(-1);
  };

  // TODO: swap eraser mode when selecting a color
  const [isEraserMode, setIsEraserMode] = React.useState(false);
  const eraserMode = () => {
    setIsEraserMode(!isEraserMode);
    // TODO: clear color selection
  };

  const submit = async () => {
    let placeExtraPixelsEndpoint = 'place-extra-pixels-devnet';
    const response = await fetchWrapper(placeExtraPixelsEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        extraPixels: props.extraPixelsData.map((pixel) => ({
          position: pixel.x + pixel.y * canvasConfig.canvas.width,
          colorId: pixel.colorId
        }))
      })
    });
    if (response.result) {
      console.log(response.result);
    }
    clearAll();
  };

  const [basePixelUsed, setBasePixelUsed] = React.useState(false);
  const [factionPixelsUsed, setFactionPixelsUsed] = React.useState(0);
  const [extraPixelsUsed, setExtraPixelsUsed] = React.useState(0);
  React.useEffect(() => {
    let pixelsUsed = props.availablePixelsUsed;
    if (props.basePixelUp) {
      if (pixelsUsed > 0) {
        setBasePixelUsed(true);
        pixelsUsed--;
      } else {
        setBasePixelUsed(false);
      }
    }
    if (props.factionPixels > 0) {
      let factionsPixelsUsed = Math.min(pixelsUsed, props.factionPixels);
      setFactionPixelsUsed(factionsPixelsUsed);
      pixelsUsed -= factionsPixelsUsed;
    }
    if (props.extraPixels > 0) {
      let extraPixelsUsed = Math.min(pixelsUsed, props.extraPixels);
      setExtraPixelsUsed(extraPixelsUsed);
      pixelsUsed -= extraPixelsUsed;
    }
  }, [props.availablePixels, props.availablePixelsUsed]);

  return (
    <div className='ExtraPixelsPanel'>
      <p
        className='Button__close ExtraPixelsPanel__close'
        onClick={() => clearAll()}
      >
        X
      </p>
      <div className='ExtraPixelsPanel__header'>
        <p className='Text__medium Heading__sub'>Extra Pixels</p>
        <div className='Button__primary' onClick={() => eraserMode()}>
          Eraser
        </div>
        <div className='Button__primary' onClick={() => submit()}>
          Submit
        </div>
      </div>
      <div className='ExtraPixelsPanel__body'>
        <div className='ExtraPixelsPanel__info'>
          <p
            className='Text__medium Heading__sub'
            style={{ textAlign: 'center' }}
          >
            Pixel Types
          </p>
          <div
            className={`ExtraPixelsPanel__info__item ${basePixelUsed ? 'ExtraPixelsPanel__info__item--used' : ''}`}
          >
            <p className='Text__small Heading__sub'>Main</p>
            {!props.basePixelUp && (
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                TODO: XX:XX
              </p>
            )}
          </div>
          {props.factionPixels > 0 && (
            <div
              className={`ExtraPixelsPanel__info__item ${factionPixelsUsed === props.factionPixels ? 'ExtraPixelsPanel__info__item--used' : ''}`}
            >
              <p className='Text__small Heading__sub'>Faction</p>
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.factionPixels - factionPixelsUsed} /&nbsp;
                {props.factionPixels}
              </p>
            </div>
          )}
          {props.extraPixels > 0 && (
            <div
              className={`ExtraPixelsPanel__info__item ${extraPixelsUsed === props.extraPixels ? 'ExtraPixelsPanel__info__item--used' : ''}`}
            >
              <p className='Text__small Heading__sub'>Extra</p>
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.extraPixels - extraPixelsUsed} / {props.extraPixels}
              </p>
            </div>
          )}
        </div>
        <div className='ExtraPixelsPanel__pixels'>
          {props.extraPixelsData.map((pixelData, index) => {
            return (
              <div className='ExtraPixelsPanel__item' key={index}>
                <div
                  className='ExtraPixelsPanel__bubble'
                  style={{
                    backgroundColor: `#${props.colors[pixelData.colorId]}FF`
                  }}
                  onClick={() => props.clearExtraPixel(index)}
                >
                  <p className='ExtraPixelsPanel__bubble__remove'>X</p>
                </div>
                <p
                  className='Text__xsmall'
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  ({pixelData.x},{pixelData.y})
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExtraPixelsPanel;
