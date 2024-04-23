import React, {useCallback, useEffect, useState} from 'react';
import './PixelSelector.css';
import {backendUrl} from '../utils/Consts.js';
import '../utils/Styles.css';
import canvasConfig from '../configs/canvas.config.json';

const PixelSelector = (props) => {
  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [timeTillNextPlacement, setTimeTillNextPlacement] = useState("XX:XX"); // TODO: get from server on init
  const [selectorMode, setSelectorMode] = useState(false);

  const timeBetweenPlacements = 5000; // 5 seconds TODO: make this a config
  const updateInterval = 200; // 200ms
  let staticColors = canvasConfig.colors;
  staticColors = staticColors.map(color => `#${color}FF`);

  const [colors, setColors] = useState([]);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (isSetup) {
      return;
    }
    let getColorsEndpoint = backendUrl + "/get-colors";
    fetch(getColorsEndpoint, { mode: "cors" }).then((response) => {
      response.json().then((data) => {
        let colors = [];
        for (let i = 0; i < data.length; i++) {
          colors.push(data[i].hex);
        }
        colors = colors.map(color => `#${color}FF`);
        setColors(colors);
        setIsSetup(true);
      }).catch((error) => {
        setColors(staticColors);
        setIsSetup(true);
        console.error(error);
      });
    });
    // TODO: Return a cleanup function to close the websocket / ...
  }, [colors, backendUrl, staticColors, setColors, setIsSetup, isSetup]);

  const [pixelAvailable, setPixelAvailable] = useState(false);
  useEffect(() => {
    if (props.extraPixels > 0) {
      setPixelAvailable(props.extraPixels - props.extraPixelsUsed > 0);
      return;
    }
    let timeSinceLastPlacement = Date.now() - lastPlacedTime;
    setPixelAvailable(timeSinceLastPlacement > timeBetweenPlacements);
  }, [lastPlacedTime, timeBetweenPlacements, props.extraPixels, props.extraPixelsUsed]);

  const getTimeTillNextPlacement = useCallback(() => {
    let timeSinceLastPlacement = Date.now() - lastPlacedTime;
    if (timeSinceLastPlacement > timeBetweenPlacements) {
      return 0;
    }
    return Math.floor((timeBetweenPlacements - timeSinceLastPlacement) / 1000);
  }, [lastPlacedTime]);

  const toSelectorMode = (event) => {
    event.preventDefault();
    // Only work if not clicking on the cancel button
    if (event.target.classList.contains("PixelSelector__cancel")) {
      return;
    }

    if (getTimeTillNextPlacement() === 0) {
      setSelectorMode(true);
    }
  }

  const selectColor = (idx) => {
    props.setSelectedColorId(idx);
    setSelectorMode(false);
  }

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    setSelectorMode(false);
  }

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
              <div className="PixelSelector__color PixelSelector__color__selectable" key={idx} style={{backgroundColor: color}} onClick={() => selectColor(idx)}></div>
            )
          })}
          <div className="Button__close" onClick={() => cancelSelector()}>x</div>
      </div>
    }
    { !selectorMode &&
      <div className={"Button__primary Text__large " + (pixelAvailable ? "PixelSelector__button--valid" : "PixelSelector__button--invalid")} onClick={toSelectorMode}>
        <p className="PixelSelector__text">{timeTillNextPlacement}</p>
        { props.extraPixels > 0 &&
          <div className="PixelSelector__extras">
            <p style={{margin: "0 0.5rem"}}>|</p>
            <p className="PixelSelector__text">{props.extraPixels - props.extraPixelsUsed} XTRA</p>
          </div>
        }
        {props.selectedColorId !== -1 &&
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", margin: "0 0 0 0.5rem"}}>
            <div className="PixelSelector__color" style={{backgroundColor: colors[props.selectedColorId]}}></div>
            <div className="Button__close" style={{marginLeft: '1rem'}} onClick={() => cancelSelector()}>x</div>
          </div>
        }
      </div>
    }
    </div>
  );
}

export default PixelSelector;
