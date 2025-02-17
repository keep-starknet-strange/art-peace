import Image from "next/image";
import { useEffect, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { useAccount } from '@starknet-react/core';
import FavoriteIcon from "../../../public/icons/Favorite.png";
import FavoritedIcon from "../../../public/icons/Favorited.png";
import Info from "../../../public/icons/Info.png";

export const WorldItem = (props: any) => {
  const { address } = useAccount();

  const [creatorText, setCreatorText] = useState("");

  const selectWorld = () => {
    console.log("Selecting world", props.world.worldId);
  }

  const handleFavoritePress = () => {
    console.log("Favorite pressed");
  }

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={`flex flex-row p-0 m-[0.5rem] border-[1px solid rgba(0,0,0,0.4)] shadow-md relative h-[22rem] overflow-hidden bg-[rgba(255,255,255,0.7)]
      transition-all duration-200 ease-in-out cursor-pointer
      hover:shadow-lg hover:scale-[1.02] hover:translate-y-[-0.1rem]
      active:shadow-md active:scale-[1.0] active:translate-y-[0rem] 
      ${props.activeWorldId === props.world.worldId ? "Anim__rainbow" : ""}`}
      onClick={selectWorld}
    >
      <div className="relative w-full h-full">
        <div className="flex flex-col w-full h-full justify-center items-center p-0 m-0">
          <Image
            src={props.world.image}
            alt={`world-image-${props.world.worldId}`}
            className="w-full h-auto block object-contain m-0 p-0 Pixel__img"
          />
          <div className="absolute bottom-0 right-0 my-[0.5rem] w-full">
            <div className="flex mx-[0.5rem] flex-row justify-between items-center p-0">
              <div></div>
              <div className="flex flex-row justify-right items-center p-0 m-0">
                <div
                  className={`relative p-[0.5rem] text-center mr-[0.5rem]
                  flex flex-row justify-center items-center
                  bg-[rgba(255,255,255,0.7)] rounded-lg border-[1px solid rgba(0,0,0,0.4)] shadow-lg Text__medium
                  transition-all duration-200 ease-in-out cursor-pointer
                  ${props.world.favorited ? "bg-[rgba(255,64,61,0.5)] border-[1px solid rgba(rgba(255,64,61,0.8)]" : ""} ${!address ? "Button--disabled" : ""}`}
                  onClick={handleFavoritePress}
                >
                  <Image
                    className="p-0 m-0 w-[2rem] h-[2rem]"
                    src={props.world.favorited ? FavoritedIcon : FavoriteIcon}
                    alt="Favorite"
                  />
                  <p className="Text__small p-0 m-0 text-center w-[3.5rem]">{props.world.favorites}</p>
                </div>
                <div
                  onClick={() => setShowInfo(!showInfo)}
                  className="relative w-[3rem] h-[3rem] p-[1rem] mr-[1rem] flex flex-row justify-center items-center text-center
                  bg-[rgba(255,255,255,0.7)] rounded-[50%] border-[1px solid rgba(0,0,0,0.4)] shadow-lg Text__medium
                  transition-all duration-200 ease-in-out cursor-pointer"
                >
                  {showInfo ? (
                    <p
                      className="Text__xsmall p-0 m-0"
                    >
                      X
                    </p>
                  ) : (
                    <Image
                      src={Info}
                      alt="Info"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderRadius: "50%",
                        padding: "0.2rem",
                        width: "3rem",
                        height: "3rem"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CSSTransition
        in={showInfo}
        timeout={200}
        classNames="list-transition absolute top-0 right-0 flex flex-col justify-center items-center p-0 m-[0.5rem]
        bg-[rgba(255,255,255,0.7)] rounded-lg border-[1px solid rgba(0,0,0,0.4)] shadow-lg Text__medium overflow-hidden"
        unmountOnExit
        appear
      >
        <div className="absolute top-0 right-0 flex flex-col justify-center items-center p-0 m-[0.5rem]
        bg-[rgba(255,255,255,0.7)] rounded-lg border-[1px solid rgba(0,0,0,0.4)] shadow-lg Text__medium overflow-hidden">
          <div
            className="flex-grow text-center border-t-[1px solid rgba(0,0,0,0.4)] py-[0.5rem] m-0 overflow-hidden first:border-none"
            style={{ backgroundColor: "rgba(61, 255, 64, 0.3)" }}
          >
            <p>Size</p>
            <p>
              {props.world.width} x {props.world.height}
            </p>
          </div>
          <div
            className="flex-grow text-center border-t-[1px solid rgba(0,0,0,0.4)] py-[0.5rem] m-0 overflow-hidden"
            style={{ backgroundColor: "rgba(255, 61, 64, 0.3)" }}
          >
            <p>Position</p>
            <p>
              {props.x}, {props.y}
            </p>
          </div>
          <div
            className="flex-grow text-center border-t-[1px solid rgba(0,0,0,0.4)] py-[0.5rem] m-0 overflow-hidden"
            style={{ backgroundColor: "rgba(64, 61, 255, 0.3)" }}
          >
            <p>Creator</p>
            <p className="truncate">
              {creatorText}
            </p>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};
