import React, { useState, useEffect } from 'react';
import { useContractWrite } from '@starknet-react/core';
import './ExtraPixelsPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';

const ExtraPixelsPanel = (props) => {
  // TODO: Change on isPortrait
  // TODO: Highlight selected pixel when trying to remove it

  const clearAll = () => {
    props.clearExtraPixels();
    props.setSelectedColorId(-1);
  };

  const eraserMode = () => {
    props.setIsEraserMode(!props.isEraserMode);
    props.setSelectorMode(false);
    props.clearPixelSelection();
  };

  const [calls, setCalls] = useState([]);
  const extraPixelPlaceCall = (positions, colors, now) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    // TODO: Validate inputs
    setCalls(
      props.artPeaceContract.populateTransaction['place_extra_pixels'](
        positions,
        colors,
        now
      )
    );
  };

  useEffect(() => {
    const extraPixelsPlaced = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Extra pixels placed successful:', data, isPending);
      // TODO: Update the UI with the new vote count
    };
    extraPixelsPlaced();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  // TODO: Is rounding down the time always okay?
  const submit = async () => {
    let timestamp = Math.floor(Date.now() / 1000);
    if (!devnetMode) {
      extraPixelPlaceCall(
        props.extraPixelsData.map(
          (pixel) => pixel.x + pixel.y * canvasConfig.canvas.width
        ),
        props.extraPixelsData.map((pixel) => pixel.colorId),
        timestamp
      );
    } else {
      let placeExtraPixelsEndpoint = 'place-extra-pixels-devnet';
      const response = await fetchWrapper(placeExtraPixelsEndpoint, {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          extraPixels: props.extraPixelsData.map((pixel) => ({
            position: pixel.x + pixel.y * canvasConfig.canvas.width,
            colorId: pixel.colorId
          })),
          timestamp: timestamp
        })
      });
      if (response.result) {
        console.log(response.result);
      }
    }
    if (basePixelUsed) {
      props.setLastPlacedTime(timestamp * 1000);
    }
    // TODO: Click faction pixels button to expand out info here
    if (factionPixelsUsed > 0) {
      // TODO: Will order always be the same?
      let factionIndex = 0;
      let factionUsedCounter = 0;
      let newFactionPixels = [];
      let newFactionPixelsData = [];
      while (factionIndex < props.factionPixels.length) {
        if (factionUsedCounter >= factionPixelsUsed) {
          newFactionPixels.push(props.factionPixels[factionIndex]);
          newFactionPixelsData.push(props.factionPixelsData[factionIndex]);
          factionIndex++;
          continue;
        }
        let currFactionPixelsUsed = Math.min(
          factionPixelsUsed - factionUsedCounter,
          props.factionPixels[factionIndex]
        );
        if (currFactionPixelsUsed <= 0) {
          newFactionPixels.push(props.factionPixels[factionIndex]);
          newFactionPixelsData.push(props.factionPixelsData[factionIndex]);
          factionIndex++;
          continue;
        }
        if (currFactionPixelsUsed === props.factionPixels[factionIndex]) {
          newFactionPixels.push(0);
          let newFactionData = props.factionPixelsData[factionIndex];
          newFactionData.lastPlacedTime = timestamp * 1000;
          newFactionData.memberPixels = 0;
          newFactionPixelsData.push(newFactionData);
        } else {
          newFactionPixels.push(
            props.factionPixels[factionIndex] - currFactionPixelsUsed
          );
          let newFactionData = props.factionPixelsData[factionIndex];
          newFactionData.memberPixels =
            props.factionPixels[factionIndex] - currFactionPixelsUsed;
          newFactionPixelsData.push(newFactionData);
        }
        factionUsedCounter += currFactionPixelsUsed;
        factionIndex++;
      }
      props.setFactionPixels(newFactionPixels);
      props.setFactionPixelsData(newFactionPixelsData);
    }
    if (extraPixelsUsed > 0) {
      let newExtraPixels = props.extraPixels - extraPixelsUsed;
      props.setExtraPixels(newExtraPixels);
    }
    clearAll();
    props.setIsEraserMode(false);
    props.setSelectorMode(false);
    props.clearPixelSelection();
  };

  const [basePixelUsed, setBasePixelUsed] = React.useState(false);
  const [totalFactionPixels, setTotalFactionPixels] = React.useState(0);
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
    let allFactionPixels = 0;
    for (let i = 0; i < props.factionPixels.length; i++) {
      allFactionPixels += props.factionPixels[i];
    }
    setTotalFactionPixels(allFactionPixels);
    if (allFactionPixels > 0) {
      let factionsPixelsUsed = Math.min(pixelsUsed, totalFactionPixels);
      setFactionPixelsUsed(factionsPixelsUsed);
      pixelsUsed -= factionsPixelsUsed;
    }
    if (props.extraPixels > 0) {
      let extraPixelsUsed = Math.min(pixelsUsed, props.extraPixels);
      setExtraPixelsUsed(extraPixelsUsed);
      pixelsUsed -= extraPixelsUsed;
    }
  }, [props.availablePixels, props.availablePixelsUsed]);

  const [factionPixelsExpanded, setFactionPixelsExpanded] =
    React.useState(false);
  const getFactionName = (index) => {
    /* TODO: Black out spent pixels */
    /* TODO: Animate expanding */
    const id = props.userFactions.findIndex(
      (faction) =>
        faction.factionId === props.factionPixelsData[index].factionId
    );
    return props.userFactions[id].name;
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
      <div className='ExtraPixelsPanel__body'>
        <div className='ExtraPixelsPanel__info'>
          <p
            className='Text__medium Heading__sub'
            style={{ textAlign: 'center' }}
          >
            Available
          </p>
          <div
            className={`ExtraPixelsPanel__info__item ${basePixelUsed || !props.basePixelUp ? 'ExtraPixelsPanel__info__item--used' : ''}`}
          >
            <p className='Text__small Heading__sub'>Main</p>
            {!props.basePixelUp && (
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.basePixelTimer}
              </p>
            )}
          </div>
          {totalFactionPixels > 0 && (
            <div
              className={`ExtraPixelsPanel__info__item ${factionPixelsUsed === totalFactionPixels ? 'ExtraPixelsPanel__info__item--used' : ''} ExtraPixelsPanel__info__item--clickable`}
              onClick={() => setFactionPixelsExpanded(!factionPixelsExpanded)}
            >
              <p className='Text__small Heading__sub'>Faction</p>
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {totalFactionPixels - factionPixelsUsed} /&nbsp;
                {totalFactionPixels}
              </p>
              {factionPixelsExpanded && (
                <div className='ExtraPixelsPanel__info__item__expand'>
                  {props.factionPixels.map((factionPixel, index) => {
                    return (
                      <div
                        className='ExtraPixelsPanel__info__item__expand__item'
                        key={index}
                      >
                        <p
                          className='Text__xsmall'
                          style={{
                            margin: '0.5rem 0',
                            padding: '0 0.5rem',
                            borderRight: '1px solid black',
                            flex: 1
                          }}
                        >
                          {getFactionName(index)}
                        </p>
                        <p
                          className='Text__xsmall'
                          style={{ margin: 0, padding: '0.5rem' }}
                        >
                          {factionPixel === 0
                            ? props.factionPixelTimers[index]
                            : factionPixel + 'px'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  onMouseOver={() => {
                    props.setIsExtraDeleteMode(true);
                    props.setPixelSelection(pixelData.x, pixelData.y);
                    props.setSelectedColorId(pixelData.colorId);
                  }}
                  onMouseOut={() => {
                    props.setIsExtraDeleteMode(false);
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
