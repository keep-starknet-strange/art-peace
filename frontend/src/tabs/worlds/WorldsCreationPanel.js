import React, { useEffect, useState } from 'react';
import './WorldsCreationPanel.css';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';

const WorldsCreationPanel = (props) => {
  // TODO: Arrows to control position and size
  const closePanel = () => {
    props.setWorldsCreationMode(false);
  };

  const toHex = (str) => {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
  };

  const [timeUnit, setTimeUnit] = useState('Days');
  const timeUnits = {
    Hrs: 1000 * 60 * 60,
    Days: 1000 * 60 * 60 * 24,
    Wks: 1000 * 60 * 60 * 24 * 7,
    Months: 1000 * 60 * 60 * 24 * 30,
    Yrs: 1000 * 60 * 60 * 24 * 365
  };

  const [isCompetitionWorld, setIsCompetitionWorld] = useState(true);

  // Competition constants
  const COMPETITION_TIMER = 5; // 5 seconds
  const COMPETITION_START = new Date('2023-12-06').getTime();
  const COMPETITION_END = new Date('2024-01-01').getTime();

  const createWorldCall = async (
    name,
    width,
    height,
    timer,
    palette,
    start,
    end
  ) => {
    if (devnetMode) return;
    if (!props.address || !props.canvasFactoryContract || !props.account)
      return;
    // TODO: Validate ...
    const host = props.account.address;
    let createWorldParams = {
      host: host,
      name: toHex(name),
      width: width,
      height: height,
      time_between_pixels: timer,
      color_palette: palette,
      start_time: start,
      end_time: end
    };
    const createWorldsCalldata = props.canvasFactoryContract.populate(
      'create_canvas',
      {
        init_params: createWorldParams
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.canvasFactoryContract.address,
      entrypoint: 'create_canvas',
      calldata: createWorldsCalldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.canvasFactoryContract.create_canvas(
      createWorldParams.calldata,
      {
        maxFee
      }
    );
    console.log(result);
    // TODO: Update the UI with the new World
    closePanel();
    props.setActiveTab('Worlds');
  };

  const minWorldSize = 16;
  const maxWorldSize = 1024;
  const defaultPalette = [
    'FAFAFA',
    '080808',
    'BA2112',
    'FF403D',
    'FF7714',
    'FFD115',
    'F5FF05',
    '199F27',
    '00EF3F',
    '152665',
    '1542FF',
    '5CFFFE',
    'A13DFF',
    'FF7AD7',
    'C1D9E6'
  ];
  const minPaletteSize = 2;
  const maxPaletteSize = 25;

  const [validationMessage, setValidationMessage] = useState('');
  const [isValidName, setIsValidName] = useState(false);
  const checkInputs = () => {
    if (worldName.length === 0 || worldName.length > 31) {
      setValidationMessage('Invalid world name: 1-31 characters');
      return false;
    }
    // TODO: Check if worldName is unique
    setIsValidName(true);
    if (worldWidth < minWorldSize || worldWidth > maxWorldSize) {
      setValidationMessage('Invalid world width: 16-1024');
      return false;
    }
    if (worldHeight < minWorldSize || worldHeight > maxWorldSize) {
      setValidationMessage('Invalid world height: 16-1024');
      return false;
    }
    if (timer < 1) {
      setValidationMessage('Invalid timer: 1+ seconds required');
      return false;
    }
    if (palette.length < minPaletteSize || palette.length > maxPaletteSize) {
      setValidationMessage('Invalid palette: 2-24 colors');
      return false;
    }
    setValidationMessage('');
    return true;
  };

  const [worldName, setWorldName] = useState('');
  const [worldWidth, setWorldWidth] = useState(128);
  const [worldHeight, setWorldHeight] = useState(128);
  const [timer, setTimer] = useState(10);
  const [newColor, setNewColor] = useState('');
  const [palette, setPalette] = useState(defaultPalette);
  const [start, setStart] = useState(new Date().getTime());
  const [end, setEnd] = useState(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 7
  ); // 1 week
  const [nameError, setNameError] = useState('');

  // Name validation function
  const validateWorldName = (name) => {
    if (name === '') {
      setNameError('');
      return true;
    }
    // Check if name contains only allowed characters
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(name)) {
      setNameError(
        'Name can only contain letters, numbers, spaces, hyphens, and underscores'
      );
      return false;
    }

    if (name.length === 0 || name.length > 31) {
      setNameError('Name must be between 1 and 31 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  // Check if name exists
  const checkWorldNameExists = async (name) => {
    const response = await fetchWrapper(`check-world-name?name=${name}`);
    if (response.data === true) {
      setNameError('This world name already exists');
      return true;
    }
    return false;
  };

  // Modified name change handler
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setWorldName(newName);
    validateWorldName(newName);
  };

  const submit = async () => {
    if (!validateWorldName(worldName)) {
      return;
    }

    const nameExists = await checkWorldNameExists(worldName);
    if (nameExists) {
      return;
    }

    if (!checkInputs()) return;

    // Use competition values if toggle is on
    const submitTimer = isCompetitionWorld ? COMPETITION_TIMER : timer;
    const submitStart = isCompetitionWorld ? COMPETITION_START : start;
    const submitEnd = isCompetitionWorld ? COMPETITION_END : end;

    if (!devnetMode) {
      await createWorldCall(
        worldName,
        worldWidth,
        worldHeight,
        submitTimer,
        palette,
        submitStart,
        submitEnd
      );
      return;
    }
    const host = '0x' + props.queryAddress;
    let createWorldEndpoint = 'create-canvas-devnet';
    const response = await fetchWrapper(createWorldEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        host: host,
        name: toHex(worldName),
        width: worldWidth.toString(),
        height: worldHeight.toString(),
        time_between_pixels: timer.toString(),
        color_palette: palette.toString(),
        start_time: Math.floor(start / 1000).toString(),
        end_time: Math.floor(end / 1000).toString()
      })
    });
    if (response.result) {
      console.log(response.result);
      closePanel();
      props.setActiveTab('Worlds');
    }
  };

  const reset = () => {
    setWorldName('');
    setWorldWidth(128);
    setWorldHeight(128);
    setTimer(10);
    setPalette(defaultPalette);
    setStart(new Date().getTime());
    setEnd(new Date().getTime() + 1000 * 60 * 60 * 24 * 7);
    setTimeUnit('Days');
    setValidationMessage('');
  };

  useEffect(() => {
    if (worldName.length === 0 || worldName.length > 31) {
      setIsValidName(false);
    } else {
      setIsValidName(true);
    }
  }, [worldName]);

  return (
    <div className='WorldsCreationPanel'>
      <p
        className='Button__close WorldsCreationPanel__close'
        onClick={() => closePanel()}
      >
        X
      </p>
      <div className='WorldsCreationPanel__header'>
        <p className='Text__medium Heading__sub'>art/peace World Creator</p>
      </div>
      <div className='WorldsCreationPanel__notes'>
        <p className='Text__small'>Fill out the form to create your world!</p>
      </div>
      <div className='WorldsCreationPanel__form'>
        <div className='w-full'>
          <div className='WorldsCreationPanel__form__item'>
            <p className='Text__small'>Name</p>
            <input
              className='Text__small Input__primary WorldsCreationPanel__form__input'
              type='text'
              placeholder='World name...'
              value={worldName}
              onChange={handleNameChange}
            />
          </div>
          {nameError && <p className='error-message'>{nameError}</p>}
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <div className='WorldsCreationPanel__competition__toggle'>
            <input
              type='checkbox'
              id='competition-toggle'
              checked={isCompetitionWorld}
              onChange={(e) => setIsCompetitionWorld(e.target.checked)}
            />
            <label htmlFor='competition-toggle' className='Text__small'>
              Join Round 3 Competition
            </label>
          </div>
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <p className='Text__small'>Size</p>
          <div className='WorldsCreationPanel__main__form'>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <input
                  className='Text__small Input__primary WorldsCreationPanel__form__input'
                  type='number'
                  placeholder='Width...'
                  value={worldWidth}
                  onChange={(e) => {
                    if (e.target.value < minWorldSize) {
                      setWorldWidth(minWorldSize);
                    } else if (e.target.value > maxWorldSize) {
                      setWorldWidth(maxWorldSize);
                    } else {
                      setWorldWidth(e.target.value);
                    }
                  }}
                />
                <p className='Text__xsmall' style={{ margin: 0, padding: 0 }}>
                  Width
                </p>
              </div>
              <p className='Text__small'>&nbsp;x&nbsp;</p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <input
                  className='Text__small Input__primary WorldsCreationPanel__form__input'
                  type='number'
                  placeholder='Height...'
                  value={worldHeight}
                  onChange={(e) => {
                    if (e.target.value < minWorldSize) {
                      setWorldHeight(minWorldSize);
                    } else if (e.target.value > maxWorldSize) {
                      setWorldHeight(maxWorldSize);
                    } else {
                      setWorldHeight(e.target.value);
                    }
                  }}
                />
                <p className='Text__xsmall' style={{ margin: 0, padding: 0 }}>
                  Height
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <p className='Text__small'>Timer</p>
          {isCompetitionWorld ? (
            <div className='Text__small WorldsCreationPanel__competition__value'>
              {COMPETITION_TIMER} seconds between pixels
            </div>
          ) : (
            <>
              <input
                className='Text__small Input__primary WorldsCreationPanel__form__input'
                type='number'
                placeholder='Timer (seconds)...'
                value={timer}
                onChange={(e) => setTimer(Math.round(e.target.value))}
              />
              <p className='Text__xsmall'>Seconds between pixels</p>
            </>
          )}
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <p className='Text__small'>Palette</p>
          <div className='WorldsCreationPanel__main__form'>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'left',
                flexWrap: 'wrap'
              }}
            >
              {palette.map((color, index) => (
                <div
                  key={index}
                  className='WorldsCreationPanel__form__color'
                  onClick={() => {
                    let newPalette = [...palette];
                    newPalette.splice(index, 1);
                    setPalette(newPalette);
                  }}
                  style={{
                    backgroundColor: `#${color}`
                  }}
                >
                  <p className='Text__small WorldsCreationPanel__bubble__remove'>
                    X
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              <input
                className='Text__small Input__primary WorldsCreationPanel__form__input'
                type='text'
                placeholder='New Color (#FFFFFFF)...'
                value={newColor}
                onChange={(e) => {
                  setNewColor(e.target.value);
                }}
              />
              <div
                className={`Button__primary WorldsCreationPanel__button__add ${newColor.length !== 7 ? 'Button__disabled' : ''} ${palette.length > maxPaletteSize ? 'Button__disabled' : ''}`}
                onClick={() => {
                  // TODO: Allow host to add colors later?
                  // TODO: Color wheel?
                  // TODO: Pressing enter should add the color too
                  // TODO: Display color when done typing
                  // Check if the color is valid
                  let formattedColor = newColor.replace('#', '');
                  // To uppercase
                  formattedColor = formattedColor.toUpperCase();
                  if (formattedColor.length !== 6) {
                    setValidationMessage(
                      'Invalid color: must be #FFFFFF format'
                    );
                    return;
                  }
                  if (!/^[0-9A-F]{6}$/i.test(formattedColor)) {
                    setValidationMessage(
                      'Invalid color: must be #FFFFFF format'
                    );
                    return;
                  }
                  // Check if the color is already in the palette
                  if (palette.includes(formattedColor)) {
                    setValidationMessage('Color already in palette');
                    return;
                  }
                  setPalette([...palette, formattedColor]);
                  setNewColor('');
                  setValidationMessage('');
                }}
              >
                <p
                  className='Text__medium'
                  style={{
                    transform: 'translate(1px, -2px)'
                  }}
                >
                  +
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <p className='Text__small'>Start</p>
          {isCompetitionWorld ? (
            <div className='Text__small WorldsCreationPanel__competition__value'>
              {new Date(COMPETITION_START).toLocaleDateString()}
            </div>
          ) : (
            <>
              <input
                className='Text__small Input__primary WorldsCreationPanel__form__input'
                type='datetime-local'
                value={new Date(start).toISOString().slice(0, -1)}
                onChange={(e) => setStart(new Date(e.target.value).getTime())}
              />
              <div
                className='Button__primary WorldsCreationPanel__button'
                onClick={() => setStart(new Date().getTime())}
              >
                Now
              </div>
            </>
          )}
        </div>
        <div className='WorldsCreationPanel__form__item'>
          <p className='Text__small'>End</p>
          {isCompetitionWorld ? (
            <div className='Text__small WorldsCreationPanel__competition__value'>
              {new Date(COMPETITION_END).toLocaleDateString()}
            </div>
          ) : (
            <div className='WorldsCreationPanel__main__form'>
              <input
                className='Text__small Input__primary WorldsCreationPanel__form__input'
                type='datetime-local'
                value={new Date(end).toISOString().slice(0, -1)}
                onChange={(e) => setEnd(new Date(e.target.value).getTime())}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}
                >
                  <input
                    className='Text__small Input__primary WorldsCreationPanel__form__input'
                    type='number'
                    placeholder='Duration...'
                    value={((end - start) / timeUnits[timeUnit]).toFixed(2)}
                    onChange={(e) => {
                      let newEnd = start + timeUnits[timeUnit] * e.target.value;
                      if (newEnd < start + timeUnits[timeUnit]) {
                        newEnd = start + timeUnits[timeUnit];
                      }
                      setEnd(newEnd);
                    }}
                    style={{ width: '13rem' }}
                  />
                  <div
                    className='WorldsCreationPanel__timeUnit Button__primary'
                    onClick={() => {
                      let keys = Object.keys(timeUnits);
                      let index = keys.indexOf(timeUnit);
                      index++;
                      if (index >= keys.length) {
                        index = 0;
                      }
                      setTimeUnit(keys[index]);
                    }}
                  >
                    <div className='Text__xsmall'>{timeUnit}</div>
                  </div>
                </div>
                <div
                  className='Button__primary WorldsCreationPanel__button'
                  onClick={
                    () =>
                      setEnd(
                        new Date().getTime() + 1000 * 60 * 60 * 24 * 1000000
                      ) // "No Limit"
                  }
                >
                  No End
                </div>
              </div>
            </div>
          )}
        </div>
        <p className='Text__xsmall' style={{ color: 'red' }}>
          {validationMessage}
        </p>
        <div className='WorldsCreationPanel__form__buttons'>
          <div
            className='Button__primary WorldsCreationPanel__button'
            onClick={() => reset()}
          >
            Reset
          </div>
          <div
            className={`Button__primary WorldsCreationPanel__button ${!isValidName ? 'Button__disabled' : ''}`}
            onClick={() => submit()}
          >
            Submit
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldsCreationPanel;
