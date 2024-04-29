import React from 'react';
import './ExtraPixelsPanel.css';
import { backendUrl } from '../../utils/Consts.js';

const ExtraPixelsPanel = (props) => {
  // TODO: Change on isPortrait
  // TODO: Highlight selected pixel when trying to remove it

  const clearAll = () => {
    props.clearExtraPixels();
  };

  // TODO: swap eraser mode when selecting a color
  const [isEraserMode, setIsEraserMode] = React.useState(false);
  const eraserMode = () => {
    setIsEraserMode(!isEraserMode);
    // TODO: clear color selection
  };

  const submit = () => {
    let placeExtraPixelsEndpoint = backendUrl + '/place-extra-pixels-devnet';
    fetch(placeExtraPixelsEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        extraPixels: props.extraPixelsData
      })
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        console.log(response.result);
      })
      .catch((error) => {
        console.error('Error placing extra pixels: ', error);
      });
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
