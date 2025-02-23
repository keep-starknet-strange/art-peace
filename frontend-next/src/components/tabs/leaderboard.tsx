import Image from "next/image";
import { useState, useEffect } from "react";
import { lookupAddresses } from '@cartridge/controller';
import { useAccount } from '@starknet-react/core';
import { BasicTab } from "./basic";
import { getLeaderboardPixels, getLeaderboardWorlds, getLeaderboardPixelsWorld } from "../../api/stats";
import copyIcon from "../../../public/icons/copy.png";
import { PaginationView } from "../utils/pagination";
import { playSoftClick2 } from "../utils/sounds";

export const LeaderboardTab = (props: any) => {
  const { address } = useAccount();

  const shortFormNumber = (num: number) => {
    if (num < 10000) {
      return num;
    }
    if (num < 1000000) {
      return (num / 1000).toFixed(1) + "K";
    }
    if (num < 1000000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    return (num / 1000000000).toFixed(1) + "B";
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // TODO: No stats worlds
  // TODO: Show user stats at bottom
  // TODO: View icon on worlds to select world
  const leaderboardOptions = [
    {
      name: "Players",
      key: "User",
      value: "Pixels"
    },
    {
      name: "Worlds",
      key: "World",
      value: "Pixels"
    },
    {
      name: "World Pxs",
      key: "User",
      value: "Pixels"
    }
  ];
  const [selectedOption, setSelectedOption] = useState(leaderboardOptions[0]);
  const [leaderboardStats, setLeaderboardStats] = useState([] as any[]);
  const [mainWorldStats, setMainWorldStats] = useState({} as any);
  const [keyNameMap, setKeyNameMap] = useState({} as any);
  const [useKeyNames, setUseKeyNames] = useState(false);
  const [leaderboardPagination, setLeaderboardPagination] = useState({ page: 1, pageLength: 16 });
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        let res = [];
        if (selectedOption.name === "Players") {
          res = await getLeaderboardPixels(leaderboardPagination.pageLength, leaderboardPagination.page);
          setUseKeyNames(true);
        } else if (selectedOption.name === "Worlds") {
          res = await getLeaderboardWorlds(leaderboardPagination.pageLength, leaderboardPagination.page);
          setUseKeyNames(false);
        } else if (selectedOption.name === "World Pxs") {
          res = await getLeaderboardPixelsWorld(leaderboardPagination.pageLength, leaderboardPagination.page, props.activeWorld ? props.activeWorld.worldId : 0);
          setUseKeyNames(true);
        }
        const newKeyNameMap = keyNameMap;
        const keysList = res.map((stat: any) => "0x" + stat.key);
        let usernameMap: any = {};
        if (selectedOption.name !== "Worlds") {
          usernameMap = await lookupAddresses(keysList);
        }
        if (res && res.length !== 0) {
          res.forEach((stat: any) => {
            // Remove all 0s from the start of stat.key
            const unpaddedKey = "0x" + stat.key.replace(/^0+/, '');
            if (selectedOption.name !== "Worlds" && usernameMap.has(unpaddedKey)) {
              newKeyNameMap[stat.key] = usernameMap.get(unpaddedKey);
            } else {
              newKeyNameMap[stat.key] = "0x" + stat.key.slice(0, 4) + "..." + stat.key.slice(-4);
            }
          });
        }
        setKeyNameMap(newKeyNameMap);
        if (leaderboardPagination.page === 1) {
          if (selectedOption.name === "Worlds") {
            setLeaderboardStats(res.filter((stat: any) => stat.key !== "Art Peace III"));
            setMainWorldStats(res.find((stat: any) => stat.key === "Art Peace III"));
          } else {
            setLeaderboardStats(res);
            setMainWorldStats({});
          }
        } else {
          if (selectedOption.name === "Worlds") {
            setLeaderboardStats([...leaderboardStats, ...res.filter((stat: any) => stat.key !== "Art Peace III")]);
            setMainWorldStats(res.find((stat: any) => stat.key === "Art Peace III"));
          } else {
            setLeaderboardStats([...leaderboardStats, ...res]);
            setMainWorldStats({});
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchLeaderboard();
  }, [leaderboardPagination]);
  useEffect(() => {
    setLeaderboardPagination({ page: 1, pageLength: 16 });
  }, [selectedOption, props.activeWorld]);

  return (
    <BasicTab title="Leaderboard" {...props}>
      <div className="flex flex-row justify-around align-center mt-[1rem] mb-[0.5rem] w-[90%] mx-auto bg-[#00000020] p-[3px] rounded-2xl outline outline-[rgba(0,0,0,0.15)] text-nowrap">
        <p
          className={`Text__small rounded-2xl py-[0.5rem] flex-1 text-center ${selectedOption.name === "Players" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption(leaderboardOptions[0]);
          }}
        >
          Players
        </p>
        <p
          className={`Text__small rounded-2xl py-[0.5rem] flex-1 text-center ${selectedOption.name === "Worlds" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption(leaderboardOptions[1]);
          }}
        >
          Worlds
        </p>
        <p
          className={`Text__small rounded-2xl py-[0.5rem] flex-1 text-center ${selectedOption.name === "World Pxs" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer truncate`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption(leaderboardOptions[2]);
          }}
        >
          World
        </p>
      </div>
      <div className="flex flex-col mx-2 mt-4 border-2 border-[rgba(0,0,0,0.6)] rounded-2xl h-[40rem]
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className={`flex justify-between items-center py-1 border-b-2 border-[rgba(0,0,0,0.6)] bg-[rgba(0,0,100,0.25)]`}>
          <div className="flex items-center gap-8 py-2">
            <div className="text-black text-md w-[min(3rem)]"></div>
            <div className="Text__medium">{selectedOption.key}</div>
          </div>
          <div className="flex items-center mr-2">
            <div className="Text__medium">{selectedOption.value}</div>
          </div>
        </div>
        {leaderboardStats && leaderboardStats.map((stat, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-1
            border-b-2 border-[rgba(0,0,0,0.6)] last:border-b-0
            ${i % 2 !== 0 ? "bg-[rgba(0,0,0,0.15)]" : ""}
            `}>
            <div className="flex items-center">
              <div className="text-black text-md w-[min(3rem)] mr-4">{i + 1}</div>
              <div className="text-black text-md w-[max(25rem)] md:w-[max(22rem)] truncate">{useKeyNames ? keyNameMap[stat.key] : stat.key}</div>
              <Image src={copyIcon} alt="copy" width={16} height={16} onClick={() => {
                playSoftClick2();
                copyToClipboard(useKeyNames ? "0x" + stat.key : stat.key);
              }}
              className="cursor-pointer hover:scale-105 transform transition-transform active:scale-100 mr-8"/>
            </div>
            <div className="flex items-center">
              <div className="text-black text-bold text-[1.4rem] w-[8rem] text-right">{shortFormNumber(stat.score)}</div>
            </div>
          </div>
        ))}
      </div>
      {selectedOption.name === "Worlds" && (
        <div>
        <div className="flex flex-row justify-between align-center mx-[2rem] my-[1rem]">
          <p className="Text__medium">Main Canvas:</p>
          <p className="Text__medium">{shortFormNumber(mainWorldStats.score)}</p>
        </div>
        <div className="flex flex-row justify-between align-center mx-[2rem] my-[1rem]">
          <p className="Text__medium">Total Pixels:</p>
          <p className="Text__medium">{shortFormNumber(leaderboardStats.reduce((acc, stat) => acc + stat.score, 0) + mainWorldStats.score)}</p>
        </div>
        </div>
      )}
      <PaginationView
        data={leaderboardStats}
        stateValue={leaderboardPagination}
        setState={setLeaderboardPagination}
      />
      {selectedOption.name === "World Pxs" && (
        <p className="Text__xsmall mx-[0.5rem] my-[1rem] truncate">Stats for world: {props.activeWorld.name}</p>
      )}
    </BasicTab>
  );
}
