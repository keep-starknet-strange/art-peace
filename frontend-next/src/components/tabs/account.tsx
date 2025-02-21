import Image from "next/image";
import { useState, useEffect } from "react";
import { constants } from "starknet";
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import ControllerConnector from "@cartridge/connector/controller";
import { BasicTab } from "./basic";
import { getLeaderboardPixelsUser, getLeaderboardWorldUser } from "../../api/stats";
import copyIcon from "../../../public/icons/copy.png";
import muteIcon from "../../../public/icons/mute.png";
import unmuteIcon from "../../../public/icons/unmute.png";
import { getSoundEffectVolume, setSoundEffectVolume, getMusicVolume, setMusicVolume, playSoftClick2 } from "../utils/sounds";

export const AccountTab = (props: any) => {
  const { address } = useAccount();
  const { connect, connector, connectors } = useConnect();
  const controller = connectors[0] as ControllerConnector;
  const { disconnect } = useDisconnect();

  const [username, setUsername] = useState<string>();
  const [addressShort, setAddressShort] = useState<string>();
  useEffect(() => {
    if (!address) return;
    const controller = connector as ControllerConnector;
    if (!controller.username) {
      setUsername("N/A");
    } else {
      controller.username()?.then((n) => setUsername(n));
    }
    setAddressShort(`${address.slice(0, 6)}...${address.slice(-4)}`);
  }, [address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tryConnectController = () => {
    try {
      connect({ connector: controller });
    } catch (e) {
      console.log(e);
    }
  }

  const tryConnectWallet = (connector: any) => {
    try {
      connect({ connector: connector });
    } catch (e) {
      console.log(e);
    }
  }

  const [totalPixelsPlaced, setTotalPixelsPlaced] = useState<number>(0);
  const [pixelsOnWorld, setPixelsOnWorld] = useState<number>(0);
  const [totalStencilLikes, setTotalStencilLikes] = useState<number>(0);
  const [stencilLikesOnWorld, setStencilLikesOnWorld] = useState<number>(0);
  useEffect(() => {
    if (!address) return;
    //TODO
    console.log("TODO: Fetch total pixels placed and pixels on world");
  }, [address]);

  useEffect(() => {
    const getStats = async () => {
      if (!address) return;
      const leaderboardPixelsUser = await getLeaderboardPixelsUser(address.slice(2));
      const leaderboardPixelsWorldUser = await getLeaderboardWorldUser(address.slice(2), props.activeWorld?.worldId);
      setTotalPixelsPlaced(leaderboardPixelsUser ? leaderboardPixelsUser : 0);
      setPixelsOnWorld(leaderboardPixelsWorldUser ? leaderboardPixelsWorldUser : 0);
    }
    getStats();
  }, [address, props.activeWorld]);

  const [isFXMuted, setIsFXMuted] = useState<boolean>(getSoundEffectVolume() === 0);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(getMusicVolume() === 0);

  return (
    <BasicTab title="Account" {...props}>
      {!address && (
        <div className="flex flex-col align-center justify-center w-full gap-[0.5rem]">
          <h2 className="Text__large p-[0.5rem] my-[1rem]">
            Login!
          </h2>
          <div
            className="w-[100%] py-[0.7rem] px-[1rem] Text__medium Button__primary"
            onClick={() => tryConnectController()}
          >
            <div className="flex flex-col align-center justify-center gap-[0.5rem]">
              <p className="Text__large">Controller</p>
              <p className="Txt__small text-blue-500">No fees + Sessions!</p>
            </div>
          </div>
          {connectors.slice(1).map((connector, index) => (
            <div
              key={index}
              className="w-[100%] py-[0.7rem] px-[1rem] Text__medium Button__primary"
              onClick={() => tryConnectWallet(connector)}
            >
              <div className="flex flex-col align-center justify-center gap-[0.5rem]">
                <p className="Text__large">{connector.name}</p>
                <p className="Txt__small text-green-700">Standard</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {address && (
        <div className="flex flex-col w-full mt-[1rem]"> 
          <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between">
            <p className="Text__medium pr-[1rem]">Username:</p>
            <p className="Text__medium pr-[0.5rem] truncate w-[21rem] text-right">{username}</p>
          </div>
          <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
            <p className="Text__medium pr-[1rem]">Address&nbsp;:</p>
            <div className="flex flex-row align-center flex-grow">
              <p className="Text__medium pr-[0.5rem] truncate text-right w-[100%]">{addressShort}</p>
              <div className="w-[2rem] h-[2rem] cursor-pointer" onClick={() => {
                playSoftClick2();
                copyToClipboard(address);
              }}>
                <Image src={copyIcon} alt="Copy icon" />
              </div>
            </div>
          </div>
          <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
            <p className="Text__medium pr-[1rem]">Network&nbsp;:</p>
            <p className="Text__medium pr-[0.5rem] text-right">
              {process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
                ? "Starknet Mainnet"
                : "Starknet Sepolia"}
            </p>
          </div>

          <div className="border-y-2 border-black mx-[1rem] mt-[1rem] py-[1rem]">
            <h2 className="Text__large Heading__sub p-[0.5rem] mb-[1rem]">
              Stats
            </h2>
            <div className="mx-[1rem]">
              <h3 className="text-black text-xl truncate underline mb-[1rem]">
                Totals
              </h3>
              <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between">
                <p className="Text__medium pr-[1rem]">Pixels Placed&nbsp;:</p>
                <p className="Text__medium pr-[0.5rem] text-right">
                  {totalPixelsPlaced}
                </p>
              </div>
              <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between mt-[0.5rem]">
                <p className="Text__medium pr-[1rem]">Stencil Likes&nbsp;:</p>
                <p className="Text__medium pr-[0.5rem] text-right">
                  {totalStencilLikes}
                </p>
              </div>
              {props.activeWorld && (
                <>
                <h3 className="text-black text-xl truncate underline mt-[1rem] mb-[1rem]">
                  On World &quot;{props.activeWorld.name}&quot;
                </h3>
                <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between">
                  <p className="Text__medium pr-[1rem]">Pixels Placed&nbsp;:</p>
                  <p className="Text__medium pr-[0.5rem] text-right">
                    {pixelsOnWorld}
                  </p>
                </div>
                <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between mt-[0.5rem]">
                  <p className="Text__medium pr-[1rem]">Stencil Likes&nbsp;:</p>
                  <p className="Text__medium pr-[0.5rem] text-right">
                    {stencilLikesOnWorld}
                  </p>
                </div>
                </>
              )}
            </div>
          </div>
          </div>
          )}
          <div className="mx-[1rem] mt-[1rem] py-[1rem]">
            <h2 className="Text__large Heading__sub px-[0.5rem]">
              Settings
            </h2>
            <div className="px-[0.5rem] ml-[0.5rem] mr-[1rem] flex flex-row align-center justify-around mt-[1rem]">
              <div className="flex flex-row align-center">
                <p className="Text__medium pr-[1rem] my-auto">Sound FX</p>
                <Image
                  src={isFXMuted ? muteIcon : unmuteIcon}
                  alt="Mute icon"
                  onClick={() => {
                    playSoftClick2();
                    const newVolume = isFXMuted ? 1 : 0;
                    setSoundEffectVolume(newVolume);
                    setIsFXMuted(!isFXMuted);
                  }}
                  className="cursor-pointer h-[2.5rem] w-[2.5rem] hover:scale-105"
                />
              </div>
              <div className="flex flex-row align-center">
                <p className="Text__medium pr-[1rem] my-auto">Music</p>
                <Image
                  src={isMusicMuted ? muteIcon : unmuteIcon}
                  alt="Mute icon"
                  onClick={() => {
                    playSoftClick2();
                    const newVolume = isMusicMuted ? 1 : 0;
                    props.setIsMusicMuted(newVolume === 0);
                    setMusicVolume(newVolume);
                    setIsMusicMuted(!isMusicMuted);
                  }}
                  className="cursor-pointer h-[2.5rem] w-[2.5rem] hover:scale-105"
                />
              </div>
            </div>
          </div>
          {address && (
          <div className="flex flex-row align-center justify-center w-full pt-[2rem]">
            <button
              className="w-[70%] py-[0.7rem] px-[1rem] Text__medium Button__primary"
              onClick={() => disconnect()}
            >
              Logout
            </button>
          </div>
          )}
    </BasicTab>
  );
}
