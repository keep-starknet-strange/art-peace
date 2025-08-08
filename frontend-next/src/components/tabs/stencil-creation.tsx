import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { BasicTab } from "./basic";
import { sha256 } from "js-sha256";
import { playSoftClick2 } from "../utils/sounds";
import { addStencilData } from "../../api/stencils";
import { addStencilCall } from "../../contract/calls";

export const StencilCreationTab = (props: any) => {
  const { account } = useAccount();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const hashStencilImage = () => {
    // TODO: Change hash to Poseidon
    const hash = sha256(props.stencilColorIds).slice(2);
    return "0x" + hash;
  }

  const submit = async () => {
    playSoftClick2();
    const hash = hashStencilImage();
    
    if (isDevMode) {
      // In dev mode, skip blockchain interaction if no account
      if (!account) {
        console.log("Dev mode: Skipping blockchain call, adding stencil to backend only");
        const res = await addStencilData(props.worldId, props.stencilImage.width, props.stencilImage.height, props.stencilColorIds.toString());
        console.log("Stencil added to DB:", res);
        props.endStencilCreation();
        props.setActiveTab("Stencils");
        const imgHash = hash.substr(2).padStart(64, "0");
        const newStencil = {
          favorited: true,
          favorites: 1,
          hash: imgHash,
          height: props.stencilImage.height,
          name: "",
          position: props.stencilPosition,
          stencilId: res.stencilId,
          width: props.stencilImage.width,
          worldId: props.worldId,
        };
        props.setOpenedStencil(newStencil);
        return;
      }
    } else {
      // Production mode: require account
      if (!account) return;
    }
    
    // Normal flow with blockchain interaction
    try {
      await addStencilCall(account, props.worldId, hash, props.stencilImage.width, props.stencilImage.height, props.stencilPosition);
    } catch (error) {
      console.error("Error submitting stencil:", error);
      if (!isDevMode) return; // Only return in production mode
    }
    const res = await addStencilData(props.worldId, props.stencilImage.width, props.stencilImage.height, props.stencilColorIds.toString());
    console.log("Stencil added to DB:", res);
    props.endStencilCreation();
    props.setActiveTab("Stencils");
    const imgHash = hash.substr(2).padStart(64, "0");
    const newStencil = {
      favorited: true,
      favorites: 1,
      hash: imgHash,
      height: props.stencilImage.height,
      name: "",
      position: props.stencilPosition,
      stencilId: res.stencilId,
      width: props.stencilImage.width,
      worldId: props.worldId,
    };
    props.setOpenedStencil(newStencil);
  };

  return (
    <BasicTab title="Create a Stencil" {...props} style={{ marginBottom: "0.5rem" }} onClose={props.endStencilCreation}>
      {props.stencilImage && (
        <div>
          {isDevMode && !account && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-2 text-center">
              <p className="Text__small">Dev Mode: Creating stencil without blockchain interaction</p>
            </div>
          )}
          <div className="flex flex-col w-full">
            <div className="pt-[1rem] pb-[2rem] flex flex-col items-center justify-center gap-1">
              <Image
                src={props.stencilImage.image}
                width={props.stencilImage.width}
                height={props.stencilImage.height}
                alt="Stencil"
                className="Pixel__img mx-auto h-[14rem] w-[20rem] object-contain"
              />
              <p className="Text__xsmall text-center">(colors converted to world&lsquo;s palette)</p>
            </div>
            <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between">
              <p className="Text__medium pr-[1rem]">World&nbsp;&nbsp;&nbsp;&nbsp;:</p>
              <p className="Text__medium pr-[0.5rem] truncate w-[21rem] text-right">{props.worldName}</p>
            </div>
            <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
              <p className="Text__medium pr-[1rem]">Position&nbsp;:</p>
              <p className="Text__medium pr-[0.5rem] text-right">
                ({props.stencilPosition % props.canvasWidth},&nbsp;
                {Math.floor(props.stencilPosition / props.canvasWidth)})
              </p>
            </div>
            
            {/* Size Control Sliders */}
            <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] border-t pt-[0.75rem]">
              <div className="flex flex-row justify-between items-center mb-[1rem]">
                <p className="Text__medium">Size Control:</p>
                <div
                  className={`Button__primary Text__small px-2 py-1 cursor-pointer ${props.aspectRatioLocked ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                  onClick={() => props.setAspectRatioLocked(!props.aspectRatioLocked)}
                >
                  {props.aspectRatioLocked ? 'Locked' : 'Unlocked'}
                </div>
              </div>
              
              {/* Width Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Width</p>
                  <p className="Text__small">{props.stencilWidth}px</p>
                </div>
                <div className="relative">
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="5"
                    max="128"
                    value={props.stencilWidth}
                    onChange={(e) => props.handleWidthChange(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
              
              {/* Height Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Height</p>
                  <p className="Text__small">{props.stencilHeight}px</p>
                </div>
                <div className="relative">
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="5"
                    max="128"
                    value={props.stencilHeight}
                    onChange={(e) => props.handleHeightChange(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
            </div>
            
            {/* Image Processing Sliders */}
            <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] border-t pt-[0.75rem]">
              <p className="Text__medium mb-[1rem]">Image Adjustments:</p>
              
              {/* Saturation Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Saturation</p>
                  <p className="Text__small">{props.stencilSaturation}</p>
                </div>
                <div className="relative">
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-gray-400 pointer-events-none z-10"></div>
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={props.stencilSaturation}
                    onChange={(e) => props.setStencilSaturation(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
              
              {/* Contrast Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Contrast</p>
                  <p className="Text__small">{props.stencilContrast}</p>
                </div>
                <div className="relative">
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-gray-400 pointer-events-none z-10"></div>
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={props.stencilContrast}
                    onChange={(e) => props.setStencilContrast(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
              
              {/* Exposure Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Exposure</p>
                  <p className="Text__small">{props.stencilExposure}</p>
                </div>
                <div className="relative">
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-gray-400 pointer-events-none z-10"></div>
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={props.stencilExposure}
                    onChange={(e) => props.setStencilExposure(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
              
              {/* Tint Slider */}
              <div className="mb-[1.5rem]">
                <div className="flex flex-row justify-between mb-[0.25rem]">
                  <p className="Text__small">Tint (Red/Green)</p>
                  <p className="Text__small">{props.stencilTint}</p>
                </div>
                <div className="relative">
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-gray-400 pointer-events-none z-10"></div>
                  {/* Slider track background with visible bounds */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-[6px] bg-gray-300 rounded-[3px] pointer-events-none"></div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={props.stencilTint}
                    onChange={(e) => props.setStencilTint(Number(e.target.value))}
                    className="relative w-full h-[16px] bg-transparent appearance-none cursor-pointer z-20"
                  />
                </div>
              </div>
              
              {/* Reset Button */}
              <div className="flex justify-center mt-[0.5rem]">
                <div className="flex flex-row gap-2">
                  <div
                    className="Button__primary Text__small px-4 py-1 cursor-pointer"
                    onClick={() => {
                      props.setStencilExposure(0);
                      props.setStencilContrast(0);
                      props.setStencilSaturation(0);
                      props.setStencilTint(0);
                    }}
                  >
                    Reset Adjustments
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full">
            {props.stencilCreationSelected ? (
              <p className="text-lg text-black px-[0.5rem] mx-[0.5rem] mt-[1rem]">
                Confirm info and submit the new stencil...
              </p>
            ) : (
              <p className="text-lg text-red-500 px-[0.5rem] mx-[0.5rem] mt-[1rem]">
                Select a position on the Canvas for the stencil...
              </p>
            )}
          </div>
          <div className="flex flex-row justify-around mt-[1.5rem] align-center">
            <div
              className="Button__primary Text__medium"
              onClick={() => {
                playSoftClick2();
                props.endStencilCreation();
              }}
            >
              Cancel
            </div>
            <div
              className={`Button__primary Text__medium ${!props.stencilCreationSelected ? "Button--disabled" : ""}`}
              onClick={() => submit()}
            >
              Submit
            </div>
          </div>
        </div>
      )}
    </BasicTab>
  );
}
