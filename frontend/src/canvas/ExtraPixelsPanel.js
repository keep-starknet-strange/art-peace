import React from 'react';
import './ExtraPixelsPanel.css';
import canvasConfig from '../configs/canvas.config.json';
import backendConfig from '../configs/backend.config.json';

const ExtraPixelsPanel = props => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port
  let colors = canvasConfig.colors;
  colors = colors.map(color => `#${color}FF`);

  const clearAll = () => {
    props.clearPixelSelection();
    props.clearExtraPixels();
  }

  const submit = () => {
    let placeExtraPixelsEndpoint = backendUrl + "/place-extra-pixels-devnet";
    fetch(placeExtraPixelsEndpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        extraPixels: props.extraPixelsData
      }),
    }).then(response => {
      return response.text();
    }).then(data => {
      console.log(data);
    }).catch(error => {
      console.error("Error placing extra pixels: ", error);
    });
    clearAll();
  }

  return (
    <div className="ExtraPixelsPanel">
      <p className="ExtraPixelsPanel__exit" onClick={() => clearAll()}>X</p>
      <div className="ExtraPixelsPanel__header">
        <p className="ExtraPixelsPanel__title">Extra Pixels</p>
        <div className="ExtraPixelsPanel__submit" onClick={() => submit()}>Submit</div>
      </div>
      <div className="ExtraPixelsPanel__pixels">
        { props.extraPixelsData.map((pixelData, index) => {
          return (
            <div className="ExtraPixelsPanel__item" key={index}>
              <div className="ExtraPixelsPanel__bubble" style={{backgroundColor: colors[pixelData.colorId]}} onClick={() => props.clearExtraPixel(index)}>
                <p className="ExtraPixelsPanel__bubble__remove">X</p>
               </div>
              <p className="ExtraPixelsPanel__id">({pixelData.x}, {pixelData.y})</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExtraPixelsPanel;
