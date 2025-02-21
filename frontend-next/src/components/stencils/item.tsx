import Image from "next/image";
import { useEffect, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { useAccount } from '@starknet-react/core';
import FavoriteIcon from "../../../public/icons/Favorite.png";
import FavoritedIcon from "../../../public/icons/Favorited.png";
//import Info from "../../../public/icons/Info.png";
import { playSoftClick2 } from "../utils/sounds";
import { favoriteStencilCall, unfavoriteStencilCall } from "../../contract/calls";

/* TODO
 <button className="Button__circle h-[3rem] w-[3rem] m-2" onClick={() => {
   playSoftClick2();
   setShowInfo(!showInfo);
 }}>
   <Image
     src={Info}
     alt="Info"
     width={24}
     height={24}
     className="p-0 m-0"
   />
 </button>
*/
export const StencilItem = (props: any) => {
  const { account, address } = useAccount();

  const [creatorText, setCreatorText] = useState("");

  const selectStencil = (e: any) => {
    e.preventDefault();
    // Ignore clicks on the favorite button
    if (e.target.classList.contains("FavoriteButton")) return;
    playSoftClick2();
    props.setOpenedStencil(props.stencil);
  }

  const handleFavoritePress = async () => {
    playSoftClick2();
    if (props.stencil.favorited) {
      await unfavoriteStencilCall(account, props.activeWorld.worldId, props.stencil.stencilId);
      props.setStencilFavorited(props.stencil.stencilId, false);
    } else {
      await favoriteStencilCall(account, props.activeWorld.worldId, props.stencil.stencilId);
      props.setStencilFavorited(props.stencil.stencilId, true);
    }
  }

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="relative w-full h-[20rem] bg-[rgba(255,255,255,0.4)]
        border-2 border-[#00000030] rounded-lg shadow-md
        overflow-hidden cursor-pointer"
    >
      <Image
        loader={() => props.image}
        src={props.image}
        alt={`stencil-image-${props.stencil.stencilId}`}
        width={props.stencil.width}
        height={props.stencil.height}
        className="w-full h-full object-contain m-0 p-0 Pixel__img bg-[#00000040]"
        onClick={selectStencil}
      />
      <div className="FavoriteButton absolute bottom-0 right-0 w-full flex flex-row justify-end items-center pointer-events-none">
        <button
          className={`${address ? "" : "Button--disabled"} Button__primary h-[3rem]`}
          onClick={handleFavoritePress}
        >
          <Image
            src={props.stencil.favorited ? FavoritedIcon : FavoriteIcon}
            alt="Favorite"
            width={24}
            height={24}
            className="p-0 m-0"
          />
          <p className="Text__medium p-0 m-0 text-center w-[3.5rem]">{props.stencil.favorites}</p>
        </button>
      </div>
    </div>
  );
  /*
  return (
    <div
      className={`flex flex-row p-0 m-[0.5rem] border-[1px solid rgba(0,0,0,0.4)] shadow-md relative h-[22rem] overflow-hidden bg-[rgba(255,255,255,0.7)]
      transition-all duration-200 ease-in-out cursor-pointer
      hover:shadow-lg hover:scale-[1.02] hover:translate-y-[-0.1rem]
      active:shadow-md active:scale-[1.0] active:translate-y-[0rem] 
      ${props.activeStencilId === props.stencil.stencilId ? "Anim__rainbow" : ""}`}
      onClick={selectStencil}
    >
      <div className="relative w-full h-full">
        <div className="flex flex-col w-full h-full justify-center items-center p-0 m-0">
          <Image
            loader={() => props.image}
            src={props.image}
            alt={`stencil-image-${props.stencil.stencilId}`}
            width={props.stencil.width}
            height={props.stencil.height}
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
                  ${props.stencil.favorited ? "bg-[rgba(255,64,61,0.5)] border-[1px solid rgba(rgba(255,64,61,0.8)]" : ""} ${!address ? "Button--disabled" : ""}`}
                  onClick={handleFavoritePress}
                >
                  <Image
                    className="p-0 m-0 w-[2rem] h-[2rem]"
                    src={props.stencil.favorited ? FavoritedIcon : FavoriteIcon}
                    alt="Favorite"
                  />
                  <p className="Text__small p-0 m-0 text-center w-[3.5rem]">{props.stencil.favorites}</p>
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
                      width={24}
                      height={24}
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
              {props.stencil.width} x {props.stencil.height}
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
  */
};
