import React, {useCallback, useEffect, useState} from 'react';
import './PixelSelector.css';
import canvasConfig from './canvas.config.json';

const PixelSelector = (props) => {

  const [placedTime, setPlacedTime] = useState(0);
  const [timeTillNextPlacement, setTimeTillNextPlacement] = useState("XX:XX"); // TODO: get from server on init
  // TODO: Animation for swapping selectorMode
  const [selectorMode, setSelectorMode] = useState(false);

  const timeBetweenPlacements = 5000; // 5 seconds TODO: make this a config
  const updateInterval = 200; // 200ms
  let colors = canvasConfig.colors;
  colors = colors.map(color => `#${color}FF`);

  const getTimeTillNextPlacement = useCallback(() => {
    let timeSinceLastPlacement = Date.now() - placedTime;
    if (timeSinceLastPlacement > timeBetweenPlacements) {
      return 0;
    }
    return Math.floor((timeBetweenPlacements - timeSinceLastPlacement) / 1000);
  }, [placedTime]);

  const placePixelSelector = () => {
    if (getTimeTillNextPlacement() === 0) {
      setSelectorMode(true);
    }
  }

  const selectColor = (color) => {
    props.setSelectedColorId(colors.indexOf(color));
    setSelectorMode(false);
  }

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    setSelectorMode(false);
  }

  // TODO: setPlacedTime(Date.now());

  useEffect(() => {
    const getPlacementText = () => {
      let timeTillNextPlacement = getTimeTillNextPlacement();
      if (timeTillNextPlacement === 0) {
        return "Place Pixel";
      }
      let minutes = Math.floor(timeTillNextPlacement / 60);
      let seconds = timeTillNextPlacement % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    const interval = setInterval(() => {
      setTimeTillNextPlacement(getPlacementText());
    }, updateInterval);
    return () => clearInterval(interval);
  }, [getTimeTillNextPlacement]);

  return (
    <div className="PixelSelector">
    {
      selectorMode &&
      <div className="PixelSelector__selector">
          {colors.map((color, idx) => {
            return (
              <div className="PixelSelector__color" key={idx} style={{backgroundColor: color}} onClick={() => selectColor(color)}></div>
            )
          })}
          <div className="PixelSelector__cancel" onClick={() => cancelSelector()}>x</div>
      </div>
    }
    { !selectorMode &&
      <div className={"PixelSelector__button " + (getTimeTillNextPlacement() === 0 ? "PixelSelector__button__valid" : "PixelSelector__button__invalid")}onClick={placePixelSelector}>
        <p>{timeTillNextPlacement}</p>
        {props.selectedColorId !== -1 && <div className="PixelSelector__button__color" style={{backgroundColor: colors[props.selectedColorId]}}></div>}
      </div>
    }
    </div>
  );
}

export default PixelSelector;
