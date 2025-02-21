import Image from 'next/image';
import { useEffect, useState } from "react";
import { useConnect, useAccount } from '@starknet-react/core'
import ControllerConnector from "@cartridge/connector/controller";
import { getCanvasColors } from "../../api/canvas";
import bot from "../../../public/icons/bot.png";
import { AIController } from "./ai-agent";
import { StencilBotController } from "./stencil-bot";
import { playNotification, playSoftClick2 } from "../utils/sounds";

export const GameController = (props: any) => {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const controller = connectors[0] as ControllerConnector;

  const [controllerText, setControllerText] = useState("XX:XX");
  const [placementMode, setPlacementMode] = useState(false);
  const [ended, setEnded] = useState(false); // Track if the timer has ended

  const [colors, setColors] = useState([] as string[]);
  useEffect(() => {
    const getColors = async (worldId: number) => {
      const canvasColors = await getCanvasColors(worldId);
      setColors(canvasColors);
    };
    getColors(props.worldId);
  }, [props.worldId]);

  useEffect(() => {
    if (!address) {
      setControllerText("Login to Play");
      return;
    }
    if (props.availablePixels > 0) {
      const amountAvailable = props.availablePixels - props.availablePixelsUsed;
      if (amountAvailable > 1) {
        setControllerText("Place Pixels");
        return;
      } else if (amountAvailable === 1) {
        setControllerText("Place Pixel");
        return;
      } else {
        setControllerText("Out of Pixels");
        return;
      }
    } else {
      // TODO: Use lowest timer out of base, chain, faction, ...
      setControllerText(props.basePixelTimer);
      props.clearAll();
    }
    if (
      controllerText === "0:00" &&
      placementMode &&
      controllerText !== "Out of Pixels" as string &&
      controllerText !== "Login to Play" as string
    ) {
      playNotification();
      setEnded(true);
    } else {
      setEnded(false);
    }
  }, [
    props.availablePixels,
    props.availablePixelsUsed,
    props.basePixelTimer,
    address,
    controllerText,
    placementMode
  ]);

  const toSelectorMode = async (event: any) => {
    playSoftClick2();
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains("Button__close")) {
      return;
    }

    if (!address) {
      try {
        connect({ connector: controller });
      } catch (error) {
        console.log(error);
      }
      // props.setActiveTab("Account");
      return;
    }

    if (props.availablePixels > props.availablePixelsUsed) {
      props.setSelectorMode(true);
      setPlacementMode(true);
    }
  };

  const selectColor = (idx: number) => {
    playSoftClick2();
    props.setSelectedColorId(idx);
    props.setSelectorMode(false);
  };

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    props.setSelectorMode(false);
    setPlacementMode(false);
    setEnded(false);
  };

  useEffect(() => {
    cancelSelector();
  }, [props.worldId]);

  return (
    <div className="flex flex-row items-center justify-center m-[1rem]">
      {(props.selectorMode || ended) && !props.botMode && (
        <div className="m-[0.2rem] px-[0.5rem] flex flex-row justify-center items-center Gradient__secondary rounded-[1rem] shadow-[0.5rem] border-[0.1rem] border-[#00000070] pointer-events-auto">
          <div className="px-[0.5rem] flex flex-row justify-center items-center flex-wrap">
            {colors.map((color: string, idx: number) => {
              return (
                <div
                  className={`w-[2.5rem] h-[2.5rem] rounded-[1rem] m-[0.5rem] border-[0.1rem] border-[#00000070] shadow-[0.5rem] flex flex-row align-center justify-center cursor pointer-events-auto
                    hover:shadow-[0.25rem] hover:transform hover:scale-105 cursor-pointer ${
                      idx === props.selectedColorId
                        ? "border-[0.2rem] border-[#00000070] scale-[130%] hover:scale-[130%] shadow-xl"
                        : ""
                    }`}
                  key={idx}
                  style={{ backgroundColor: `#${color}FF` }}
                  onClick={() => selectColor(idx)}
                ></div>
              );
            })}
          </div>
          <div className="Button__close" onClick={() => cancelSelector()}>
            x
          </div>
        </div>
      )}
      {!props.selectorMode && !ended && !props.botMode && (
        <div
          className={
            "Button__primary Text__large " +
            (props.availablePixels > props.availablePixelsUsed
              ? ""
              : "Button__primary--invalid")
          }
          onClick={toSelectorMode}
        >
          <p className="m-0 p-[0.25rem]">{controllerText}</p>
          {address && props.availablePixels > (props.basePixelUp ? 1 : 0) && (
            <div className="flex flex-row justify-center items-center">
              <div className="mx-3 h-[2.4rem] w-[0.5rem] rounded-[0.25rem] bg-[#00000060]"></div>
              <p className="m-0 p-[0.25rem]">
                {props.availablePixels - props.availablePixelsUsed} left
              </p>
            </div>
          )}
          {props.selectedColorId !== -1 && (
            <div className="flex flex-row justify-center items-center ml-[0.5rem]">
              <div
                className="w-[2.5rem] h-[2.5rem] rounded-[1rem] mx-[0.5rem] border-[0.1rem] border-[#00000070]
                shadow-[0.5rem] flex flex-row justify-center items-center"
                style={{
                  backgroundColor: `#${colors[props.selectedColorId]}FF`
                }}
              ></div>
              <div
                className="Button__close ml-[1rem]"
                onClick={() => {
                  playSoftClick2();
                  cancelSelector();
                }}
              >
                x
              </div>
            </div>
          )}
        </div>
      )}
      {props.botMode && props.selectedBotOption === null && (
        props.botOptions.map((option: any, idx: number) => {
          return (
            <div className="ml-[0.5rem] first:ml-0" key={idx}>
            <div
              className="Button__primary Text__large"
              onClick={() => {
                playSoftClick2();
                option.selectOption();
              }}
            >
              <p className="m-0 p-[0.25rem]">{option.name}</p>
            </div>
            </div>
          )
        }
      ))}
      {props.botMode && props.selectedBotOption === "Stencil Bot" && (
        <StencilBotController
          address={address}
          botMode={props.botMode}
          toggleBotMode={props.toggleBotMode}
          setSelectedBotOption={props.setSelectedBotOption}
          openedStencil={props.openedStencil}
          activeWorld={props.activeWorld}
          canvasRef={props.canvasRef}
          worldColors={props.worldColors}
          stagingPixels={props.stagingPixels}
          setStagingPixels={props.setStagingPixels}
          availablePixelsUsed={props.availablePixelsUsed}
          availablePixels={props.availablePixels}
        />
      )}
      {props.botMode && props.selectedBotOption === "AI Agent" && (
        <AIController
          address={address}
          botMode={props.botMode}
          toggleBotMode={props.toggleBotMode}
          setSelectedBotOption={props.setSelectedBotOption}
          agentTransactions={props.agentTransactions}
          setAgentTransactions={props.setAgentTransactions}
        />
      )}
      {address && (
        <div
          className="ml-[0.5rem] Button__circle relative"
          onClick={() => {
            playSoftClick2();
            props.toggleBotMode();
          }}
        >
          {props.botMode && (
            <>
            <div
              className="absolute top-0 left-0 w-full h-full rounded-full bg-[#FF000040] border-[0.1rem] border-[#00000070]"
              style={{ boxShadow: "0 0 0.5rem #FF0000" }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center">
              <div className="w-[0.4rem] h-[4rem] bg-[#FF0000A0] transform -rotate-45 shadow-xl rounded-md"></div>
            </div>
            </>
          )}
          <Image
            src={bot}
            alt="Bot"
            className="w-[2.6rem] h-[2.6rem] m-[2px]"
          />
        </div>
      )}
    </div>
  );
};
