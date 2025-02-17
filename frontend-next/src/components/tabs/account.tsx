import Image from "next/image";
import { useState, useEffect } from "react";
import { constants } from "starknet";
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import ControllerConnector from "@cartridge/connector/controller";
import { BasicTab } from "./basic";
import copyIcon from "../../../public/icons/copy.png";

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
    controller.username()?.then((n) => setUsername(n));
    setAddressShort(`${address.slice(0, 6)}...${address.slice(-4)}`);
  }, [address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tryConnect = () => {
    try {
      connect({ connector: controller });
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

  return (
    <BasicTab title="Account" {...props}>
      {!address && (
        <div className="flex flex-row align-center justify-center w-full">
          <button
            className="w-[70%] py-[0.7rem] px-[1rem] Text__medium Button__primary"
            onClick={() => tryConnect()}
          >
            Cartridge Login
          </button>
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
            <div className="flex flex-row align-center">
              <p className="Text__medium pr-[0.5rem] truncate w-[21rem] text-right">{addressShort}</p>
              <div className="w-[2rem] h-[2rem] cursor-pointer" onClick={() => copyToClipboard(address)}>
                <Image src={copyIcon} alt="Copy icon" />
              </div>
            </div>
          </div>
          <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
            <p className="Text__medium pr-[1rem]">Network&nbsp;:</p>
            <p className="Text__medium pr-[0.5rem] text-right">
              {process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
                ? "Mainnet"
                : "Sepolia"}
            </p>
          </div>

          <h2 className="Text__large Heading__sub p-[0.5rem] my-[1rem]">
            User Stats
          </h2>
          <div className="mx-[1rem]">
            <h3 className="Text__medium underline mb-[1rem]">
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
              <h3 className="Text__medium underline mt-[1rem] mb-[1rem]">
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
          <div className="flex flex-row align-center justify-center w-full pt-[1rem]">
            <button
              className="w-[70%] py-[0.7rem] px-[1rem] Text__medium Button__primary"
              onClick={() => disconnect()}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </BasicTab>
  );
}
