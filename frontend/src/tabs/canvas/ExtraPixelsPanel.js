import React from 'react';
import EraserIcon from '../../resources/icons/Eraser.png';
import './ExtraPixelsPanel.css';

const ExtraPixelsPanel = (props) => {
  // TODO: Change on isPortrait
  // TODO: Highlight selected pixel when trying to remove it

  const eraserMode = () => {
    props.setIsEraserMode(!props.isEraserMode);
    props.setSelectorMode(false);
    props.clearPixelSelection();
    props.setSelectedColorId(-1);
  };

  const [factionPixelsExpanded, setFactionPixelsExpanded] =
    React.useState(false);
  const getChainFactionName = (_index) => {
    return props.chainFaction.name;
  };
  const getFactionName = (index) => {
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
        onClick={() => props.clearAll()}
      >
        X
      </p>
      <div className='ExtraPixelsPanel__header'>
        <p className='Text__medium Heading__sub'>Extra Pixels</p>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div
            className={`Button__primary ${
              props.isEraserMode ? 'Eraser__button--selected' : ''
            }`}
            onClick={() => eraserMode()}
          >
            <p className='Text__small Eraser__text'>Eraser</p>
            <img className='Eraser__icon' src={EraserIcon} alt='eraser' />
          </div>
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
            className={`ExtraPixelsPanel__info__item ${
              props.basePixelUsed || !props.basePixelUp
                ? 'ExtraPixelsPanel__info__item--used'
                : ''
            }`}
          >
            <p className='Text__small Heading__sub'>Main</p>
            {!props.basePixelUp && (
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.basePixelTimer}
              </p>
            )}
          </div>
          {(props.chainFactionPixels.length > 0 ||
            props.factionPixels.length > 0) && (
            <div
              className={`ExtraPixelsPanel__info__item ${
                props.chainFactionPixelsUsed + props.factionPixelsUsed ===
                props.totalChainFactionPixels + props.totalFactionPixels
                  ? 'ExtraPixelsPanel__info__item--used'
                  : ''
              } ExtraPixelsPanel__info__item--clickable`}
              onClick={() => setFactionPixelsExpanded(!factionPixelsExpanded)}
            >
              <p className='Text__small Heading__sub'>Faction</p>
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.totalChainFactionPixels +
                  props.totalFactionPixels -
                  props.chainFactionPixelsUsed -
                  props.factionPixelsUsed}
                /&nbsp;
                {props.totalChainFactionPixels + props.totalFactionPixels}
              </p>
              {factionPixelsExpanded && (
                <div className='ExtraPixelsPanel__info__item__expand'>
                  {props.chainFactionPixels.map((chainFactionPixel, index) => {
                    return (
                      <div
                        className='ExtraPixelsPanel__info__item__expand__item'
                        key={index}
                      >
                        <p
                          className='Text__xsmall ExtraPixelsPanel__faction__name'
                          style={{
                            margin: '0.5rem 0',
                            padding: '0 0.5rem',
                            borderRight: '1px solid black',
                            flex: 1
                          }}
                        >
                          {getChainFactionName(index)}
                        </p>
                        <p
                          className='Text__xsmall'
                          style={{ margin: 0, padding: '0.5rem' }}
                        >
                          {chainFactionPixel === 0
                            ? props.chainFactionPixelTimers[index]
                            : chainFactionPixel + 'px'}
                        </p>
                      </div>
                    );
                  })}
                  {props.factionPixels.map((factionPixel, index) => {
                    return (
                      <div
                        className='ExtraPixelsPanel__info__item__expand__item'
                        key={index}
                      >
                        <p
                          className='Text__xsmall ExtraPixelsPanel__faction__name'
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
              className={`ExtraPixelsPanel__info__item ${
                props.extraPixelsUsed === props.extraPixels
                  ? 'ExtraPixelsPanel__info__item--used'
                  : ''
              }`}
            >
              <p className='Text__small Heading__sub'>Extra</p>
              <p className='Text__small ExtraPixelsPanel__info__item__details'>
                {props.extraPixels - props.extraPixelsUsed} /{' '}
                {props.extraPixels}
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
                  }}
                  onMouseOut={() => {
                    props.setIsExtraDeleteMode(false);
                  }}
                  onClick={() => {
                    props.clearExtraPixel(index);
                    props.setIsExtraDeleteMode(false);
                  }}
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
      {props.availablePixelsUsed > 0 ? (
        <div
          className={`Text__medium Button__primary ExtraPixelPanel__submit__button ${
            props.availablePixelsUsed === props.availablePixels
              ? 'ExtraPixelsPanel__submit__button--all'
              : 'ExtraPixelsPanel__submit__button--some'
          }`}
          onClick={() => props.submit()}
        >
          Submit {props.availablePixelsUsed}/{props.availablePixels} pxs
        </div>
      ) : (
        <div className='Text__small' style={{ margin: '1rem' }}>
          Place pixels on the canvas
        </div>
      )}
    </div>
  );
};

export default ExtraPixelsPanel;
