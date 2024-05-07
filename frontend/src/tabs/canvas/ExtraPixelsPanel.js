import React from 'react';
import './ExtraPixelsPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';

const ExtraPixelsPanel = (props) => {
  // TODO: Change on isPortrait
  // TODO: Highlight selected pixel when trying to remove it

  const clearAll = () => {
    props.clearExtraPixels();
  };

  // TODO: swap eraser mode when selecting a color
  const eraserMode = () => {
    props.setIsEraserMode(!props.isEraserMode);
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
              <p className='Text__xsmall'>
                ({pixelData.x},{pixelData.y})
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExtraPixelsPanel;
