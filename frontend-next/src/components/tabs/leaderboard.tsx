import Image from "next/image";
import { useState, useEffect } from "react";
import { useAccount } from '@starknet-react/core';
import { BasicTab } from "./basic";
import { getLeaderboardPixels, getLeaderboardWorlds, getLeaderboardPixelsWorld } from "../../api/stats";
import copyIcon from "../../../public/icons/copy.png";
import { PaginationView } from "../utils/pagination";
import { playSoftClick2 } from "../utils/sounds";

export const LeaderboardTab = (props: any) => {
  const { address } = useAccount();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText("0x" + text);
  };

  // TODO: Heading
  // TODO: Scrolling
  // TODO: Show user stats at bottom
  // TODO: View icon on worlds to select world
  const leaderboardOptions = [
    "Pixels",
    "Worlds",
    "World Pxs"
  ];
  const [selectedOption, setSelectedOption] = useState(leaderboardOptions[0]);
  const [leaderboardStats, setLeaderboardStats] = useState([] as any[]);
  const [keyNameMap, setKeyNameMap] = useState({} as any);
  const [useKeyNames, setUseKeyNames] = useState(false);
  const [leaderboardPagination, setLeaderboardPagination] = useState({ page: 1, limit: 16 });
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        let res = [];
        if (selectedOption === "Pixels") {
          res = await getLeaderboardPixels(leaderboardPagination.limit, leaderboardPagination.page);
          setUseKeyNames(true);
        } else if (selectedOption === "Worlds") {
          res = await getLeaderboardWorlds(leaderboardPagination.limit, leaderboardPagination.page);
          setUseKeyNames(false);
        } else if (selectedOption === "World Pxs") {
          res = await getLeaderboardPixelsWorld(leaderboardPagination.limit, leaderboardPagination.page, props.activeWorld ? props.activeWorld.worldId : 0);
          setUseKeyNames(true);
        }
        const newKeyNameMap = keyNameMap;
        if (res && res.length !== 0) {
          res.forEach((stat: any) => {
            newKeyNameMap[stat.key] = "0x" + stat.key.slice(0, 4) + "..." + stat.key.slice(-4);
          });
        }
        setKeyNameMap(newKeyNameMap);
        if (leaderboardPagination.page === 1) {
          setLeaderboardStats(res);
        } else {
          setLeaderboardStats([...leaderboardStats, ...res]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchLeaderboard();
  }, [leaderboardPagination]);
  useEffect(() => {
    setLeaderboardPagination({ page: 1, limit: 16 });
  }, [selectedOption, props.activeWorld]);

  // TODO: Address to name

  return (
    <BasicTab title="Leaderboard" {...props}>
      <div className="flex flex-row justify-around align-center mt-[1rem] mb-[0.5rem] w-[90%] mx-auto bg-[#00000020] p-[3px] rounded-2xl outline outline-[rgba(0,0,0,0.15)] text-nowrap">
        <p
          className={`Text__small rounded-2xl py-[0.5rem] px-[4rem] ${selectedOption === "Pixels" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption("Pixels");
          }}
        >
          Pixels
        </p>
        <p
          className={`Text__small rounded-2xl py-[0.5rem] px-[4rem] ${selectedOption === "Worlds" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption("Worlds");
          }}
        >
          Worlds
        </p>
        <p
          className={`Text__small rounded-2xl py-[0.5rem] px-[2.5rem] ${selectedOption === "World Pxs" ? "outline outline-[rgba(0,0,0,0.4)] bg-[rgba(255,255,255,0.8)]" : ""} cursor-pointer`}
          onClick={() => {
            playSoftClick2();
            setSelectedOption("World Pxs");
          }}
        >
          World Pxs
        </p>
      </div>
      <div className="flex flex-col mx-2 mt-4 border-2 border-[rgba(0,0,0,0.6)] rounded-2xl h-[40rem]
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {leaderboardStats && leaderboardStats.map((stat, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-1
            border-b-2 border-[rgba(0,0,0,0.6)] last:border-b-0
            ${i % 2 !== 0 ? "bg-[rgba(0,0,0,0.15)]" : ""}
            `}>
            <div className="flex items-center gap-8 flex-grow">
              <div className="text-black text-md">{i + 1}</div>
              <div className="text-black text-md">{useKeyNames ? keyNameMap[stat.key] : stat.key}</div>
              {useKeyNames && (
                <Image src={copyIcon} alt="copy" width={16} height={16} onClick={() => {
                  playSoftClick2();
                  copyToClipboard(stat.key);
                }}
                className="cursor-pointer hover:scale-105 transform transition-transform active:scale-100"/>
              )}
            </div>
            <div className="flex items-center mr-8">
              <div className="text-black text-bold text-md">{stat.score}</div>
            </div>
          </div>
        ))}
      </div>
      <PaginationView
        data={leaderboardStats}
        stateValue={leaderboardPagination}
        setState={setLeaderboardPagination}
      />
    </BasicTab>
  );
}
