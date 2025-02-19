import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { BasicTab } from "./basic";
import { createCanvasCall } from "../../contract/calls";
import { getRoundsConfig } from "../../api/worlds";
import plus from "../../../public/icons/Edit.png";
import "./world-creation.css";
import { playSoftClick2 } from "../utils/sounds";

export const WorldCreationTab = (props: any) => {
  const { account, address } = useAccount();
  const [usingCompetitionConfig, setUsingCompetitionConfig] = useState(true);
  const submit = async () => {
    playSoftClick2();
    console.log("Submitting world...");
    const hexPalette = palette.map((color) => `0x${color.toLowerCase()}`);
    if (!usingCompetitionConfig) {
      await createCanvasCall(account, address as string, toHex(worldName), toHex(worldSlug), worldWidth, worldHeight, pixelsPer, timer, hexPalette, Math.floor(start / 1000), Math.floor(end / 1000));
    } else {
      await createCanvasCall(account, address as string, toHex(worldName), toHex(worldSlug), getCompetitionWidth(), getCompetitionHeight(), getCompetitionPixelsPer(), getCompetitionTimer(), hexPalette, Math.floor(getCompetitionStart() / 1000), Math.floor(getCompetitionEnd() / 1000));
    }
  };

  const toHex = (str: string) => {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
  };

  const [timeUnit, setTimeUnit] = useState("Days");
  const timeUnits = {
    Hrs: 1000 * 60 * 60,
    Days: 1000 * 60 * 60 * 24,
    Wks: 1000 * 60 * 60 * 24 * 7,
    Months: 1000 * 60 * 60 * 24 * 30,
    Yrs: 1000 * 60 * 60 * 24 * 365
  };
  const timeStringOptions = {
    timeZoneName: "short"
  }

  const minWorldSize = process.env.NEXT_PUBLIC_MIN_WORLD_SIZE as unknown as number || 16;
  const maxWorldSize = process.env.NEXT_PUBLIC_MAX_WORLD_SIZE as unknown as number || 1024;
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
  const defaultWorldSize = process.env.NEXT_PUBLIC_DEFAULT_WORLD_SIZE as unknown as number || 128;
  const defaultPixelsPer = process.env.NEXT_PUBLIC_DEFAULT_PIXELS_PER as unknown as number || 5;
  const defaultTimer = process.env.NEXT_PUBLIC_DEFAULT_TIMER as unknown as number || 5;
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
    if (pixelsPer < 1) {
      setValidationMessage('Invalid pixels per: 1+ required');
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

  const [isCompetitionWorld, setIsCompetitionWorld] = useState(true);
  const [worldName, setWorldName] = useState('');
  const [worldSlug, setWorldSlug] = useState('');
  const [worldWidth, setWorldWidth] = useState(defaultWorldSize);
  const [worldHeight, setWorldHeight] = useState(defaultWorldSize);
  const [pixelsPer, setPixelsPer] = useState(defaultPixelsPer);
  const [timer, setTimer] = useState(defaultTimer);
  const [newColorType, setNewColorType] = useState("Color");
  const [newColor, setNewColor] = useState('');
  const [palette, setPalette] = useState(defaultPalette);
  const [start, setStart] = useState(new Date().getTime());
  const [end, setEnd] = useState(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 7
  ); // 1 week
  const [nameError, setNameError] = useState('');

  // Name validation function
  const validateWorldName = (name: string) => {
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
    setWorldSlug(name.toLowerCase().replace(/\s/g, '-'));
    setNameError('');
    return true;
  };
  // Check if name exists
  const checkWorldSlugExists = async (name: string) => {
    // TODO
    // const response = await fetchWrapper(`check-world-name?uniqueName=${name}`);
    // if (response.data === true) {
    //   setNameError('This world name already exists');
    //   return true;
    // }
    return false;
  };

  // Modified name change handler
  const handleNameChange = (e: any) => {
    const newName = e.target.value;
    setWorldName(newName);
    validateWorldName(newName);
  };

  const reset = () => {
    setWorldName('');
    setWorldWidth(defaultWorldSize);
    setWorldHeight(defaultWorldSize);
    setPixelsPer(defaultPixelsPer);
    setTimer(defaultTimer);
    setPalette(defaultPalette);
    setStart(new Date().getTime());
    setEnd(new Date().getTime() + 1000 * 60 * 60 * 24 * 4);
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

  const [competitionConfig, setCompetitionConfig] = useState(null as any);
  useEffect(() => {
    const fetchRoundsConfig = async () => {
      try {
        const roundsConfig = await getRoundsConfig();
        setCompetitionConfig(roundsConfig.round3);
      } catch (error) {
        console.error('Failed to fetch competition config:', error);
      }
    }
    fetchRoundsConfig();
  }, []);

  const getCompetitionWidth = () => {
    return competitionConfig?.width || defaultWorldSize; // Fallback to default
  };

  const getCompetitionHeight = () => {
    return competitionConfig?.height || defaultWorldSize; // Fallback to default
  };

  const getCompetitionPixelsPer = () => {
    return competitionConfig?.pixelsPer || defaultPixelsPer; // Fallback to default
  }

  // Use competition values from config when available
  const getCompetitionTimer = () => {
    return competitionConfig?.timer || defaultTimer; // Fallback to default
  };

  const getCompetitionStart = () => {
    return competitionConfig?.startTime
      ? new Date(competitionConfig.startTime * 1000).getTime()
      : new Date('2025-02-21T00:00:00Z').getTime();
  };

  const getCompetitionEnd = () => {
    return competitionConfig?.endTime
      ? new Date(competitionConfig.endTime * 1000).getTime()
      : new Date('2025-02-25T00:00:00Z').getTime();
  };

  const [formComplete, setFormComplete] = useState(false);
  useEffect(() => {
    // TODO: Check if all fields are filled properly
    if (worldName.length > 0) {
      setFormComplete(true);
    }
  }, [worldName, worldWidth, worldHeight, pixelsPer, timer, palette]);

  return (
    <BasicTab title="Create a World" {...props} style={{ marginBottom: "0.5rem" }} onClose={props.endWorldCreation}>
      <div>
        <div className="flex flex-col w-full">
          <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
            <p className="Text__medium pr-[1rem]">Name&nbsp;&nbsp;:</p>
            <input className="Input__primary Text__small" type="text" value={worldName} onChange={handleNameChange} placeholder="World name..."/>
          </div>
          {nameError && <p className="Error__msg">{nameError}</p>}
          {isCompetitionWorld ? (
            <>
              <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
                <p className="Text__medium pr-[1rem]">Size&nbsp;&nbsp;:</p>
                <p className="Text__small text-right">{getCompetitionWidth()}x{getCompetitionHeight()}</p>
              </div>
              <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
                <p className="Text__medium pr-[1rem]">Allow&nbsp;:</p>
                <p className="Text__small text-right">{getCompetitionPixelsPer()} pixels per {getCompetitionTimer()} secs</p>
              </div>
              <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
                <p className="Text__medium pr-[1rem]">Start&nbsp;:</p>
                <p className="Text__small text-right">{new Date(getCompetitionStart()).toLocaleString()}</p>
              </div>
              <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
                <p className="Text__medium pr-[1rem]">End&nbsp;&nbsp;&nbsp;:</p>
                <p className="Text__small text-right">{new Date(getCompetitionEnd()).toLocaleString()}</p>
              </div>
            </>
          ) : (
            <>
            </>
          )}
          <div className="px-[0.5rem] mx-[0.5rem] mt-[1.5rem]">
            <p className="Text__large pr-[1rem] underline">Palette</p>
            <div className="flex flex-col justify-center border border-gray-300 rounded-lg p-[0.5rem] m-[1rem] shadow-md bg-[rgba(255,255,255,0.6)]">
              <div className="flex flex-row">
                <div className="flex flex-col">
                  <p className="Text__medium w-full px-[1rem] underline">Base</p>
                  <div className="flex flex-row flex-wrap mt-[0.5rem] pb-[1rem] justify-center">
                    <div className="w-[3rem] h-[3rem] m-[2px] border-2 border-[rgba(0,0,0,0.2)] rounded-lg shadow-md relative WorldCreation__color"
                      style={{ backgroundColor: `#${palette[0]}` }}
                      onClick={() => {
                        playSoftClick2();
                        const newPalette = [...palette];
                        newPalette.splice(0, 1);
                        setPalette(newPalette);
                      }}
                    >
                      <p className="text-[red] Transform__center--text text-xl Text__shadow--lg hidden">
                        X
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-[0.5rem] bg-[rgba(0,0,0,0.4)] border border-gray-300 rounded-lg m-[0.5rem] bg-[rgba(0,0,0,0.4)]"></div>
                <div className="flex flex-col flex-grow align-center">
                  <p className="Text__medium w-full text-center underline">Colors</p>
                  <div className="flex flex-row flex-wrap mt-[0.5rem] pb-[0.5rem] justify-center">
                    {palette.slice(1).map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-[3rem] h-[3rem] m-[2px] border-2 border-[rgba(0,0,0,0.2)] rounded-lg shadow-md relative WorldCreation__color"
                        style={{ backgroundColor: `#${color}` }}
                        onClick={() => {
                          playSoftClick2();
                          const newPalette = [...palette];
                          newPalette.splice(index + 1, 1);
                          setPalette(newPalette);
                        }}
                      >
                        <p className="text-[red] Transform__center--text text-xl Text__shadow--lg hidden">
                          X
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-around align-center my-[0.5rem] w-[90%] mx-auto bg-[#00000020] p-[3px] rounded-2xl outline outline-[rgba(0,0,0,0.15)]">
                <p
                  className={`Text__small rounded-2xl py-[0.5rem] px-[5rem] ${newColorType === "Base" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
                  onClick={() => {
                    playSoftClick2();
                    setNewColorType("Base");
                  }}
                >
                  Base
                </p>
                <p
                  className={`Text__small rounded-2xl py-[0.5rem] px-[5rem] ${newColorType === "Color" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
                  onClick={() => {
                    playSoftClick2();
                    setNewColorType("Color");
                  }}
                >
                  Color
                </p>
              </div>
              <div className="flex flex-row justify-center align-center w-[90%] mx-auto">
                <input
                  className="Text__small Input__primary mr-[0.5rem] flex-grow"
                  type="text"
                  placeholder={`Add ${newColorType} (#FFFFFF)...`}
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
                <Image
                  src={plus}
                  alt="Add Color"
                  className="w-[2.5rem] h-[2.5rem] cursor-pointer
                    hover:scale-110 transform transition duration-300 ease-in-out
                    active:scale-100"
                  onClick={() => {
                    playSoftClick2();
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
                    // Remove the base color if it exists
                    if (newColorType === "Base") {
                      setPalette([formattedColor, ...palette]);
                      setNewColor('');
                    } else {
                      setPalette([...palette, formattedColor]);
                      setNewColor('');
                    }
                    setValidationMessage('');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full">
          {!formComplete ? (
            <p className="text-lg text-red-500 px-[0.5rem] mx-[0.5rem]">
              Please fill in the form to create your world!
            </p>
          ) : (
            <p className="text-lg text-black px-[0.5rem] mx-[0.5rem]">
              Please comfirm the details and create the world...
            </p>
          )}
        </div>
        <div className="flex flex-row justify-around mt-[1.5rem] align-center">
          <div
            className="Button__primary Text__medium"
            onClick={() => {
              playSoftClick2();
              props.endWorldCreation();
            }}
          >
            Cancel
          </div>
          <div
            className={`Button__primary Text__medium ${!formComplete ? "Button--disabled" : ""}`}
            onClick={() => submit()}
          >
            Submit
          </div>
        </div>
      </div>
    </BasicTab>
  );
}
