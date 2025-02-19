import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { ExpandableTab } from "./expandable";
import { backendUrl } from "../../api/api";
import { PaginationView } from "../utils/pagination";
import {
  getFavoriteWorlds,
  getHotWorlds,
  getNewWorlds,
  getTopWorlds,
  getWorld,
  getWorlds
} from "../../api/worlds";
import { WorldItem } from "../worlds/item";
import { playSoftClick2 } from "../utils/sounds";

const WorldsMainSection = (props: any) => {
  const { address } = useAccount();

  return (
    <div
      className={`${props.expanded ? "relative w-[min(100%,40rem)] mx-auto my-0 transition-all duration-500 ease-in-out" : "relative w-full mx-auto my-0 transition-all duration-500 ease-in-out"}`}
    >
      <div className="flex flex-row justify-between items-between p-[0.5rem] mx-[0.5rem] w-[calc(100%-1rem)]">
        <h2 className="Text__large p-0 m-0 pb-[0.5rem] underline">Favorites</h2>
        <div className="flex flex-row align-center">
          {!props.expanded && (
            <div
              className="Text__medium Button__primary"
              onClick={() => {
                playSoftClick2();
                props.setExpanded(true);
              }}
            >
              Explore
            </div>
          )}
        </div>
      </div>
      <div className="h-[55vh] grid grid-rows-[min-content] grid-cols-[minmax(25rem,1fr)] m-[0.5rem] p-[0.5rem] overflow-scroll">
        {!address && (
          <p className="Text__medium text-center">
            Please login to view your favorite worlds
          </p>
        )}
        {props.activeWorld && !props.activeWorld.favorited && (
          <WorldItem
            key={props.activeWorld.worldId}
            world={props.activeWorld}
            image={
              backendUrl +
              "/worlds/world-" +
              props.activeWorld.worldId +
              ".png"
            }
            {...props}
          />
        )}
        {props.favoriteWorlds.map((world: any, index: number) => {
          return (
            <WorldItem
              key={index}
              world={world}
              image={backendUrl + "/worlds/world-" + world.worldId + ".png"}
              {...props}
            />
          );
        })}
        <PaginationView
          data={props.favoriteWorlds}
          stateValue={props.myWorldsPagination}
          setState={props.setMyWorldsPagination}
        />
        {address && (
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%)"
            }}
          >
            <p
              className="Text__medium Button__primary"
              onClick={() => {
                playSoftClick2();
                props.startWorldCreation();
              }}
            >
              Create World
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const WorldsExpandedSection = (props: any) => {
  return (
    <div className="flex flex-col w-full align-center">
      <div className="flex flex-row justify-between items-between p-[0.5rem] mx-[0.5rem] w-[calc(100%-1rem)]">
        <h2 className="Text__large p-0 pb-[0.5rem] underline">Explore</h2>
        <div className="flex flex-row align-center justify-between p-[0.5rem] mx-[0.5rem]">
          {props.filters.map((filter: string, index: number) => {
            return (
              <div
                key={index}
                className={`Button__primary Text__medium flex flex-row align-center mx-[0.5rem] ${props.activeFilter === filter ? "Button--selected" : ""}`}
                onClick={() => {
                  playSoftClick2();
                  props.setActiveFilter(filter);
                }}
              >
                {filter}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-[0.5rem] p-[0.5rem] h-[55vh] overflow-scroll w-full">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] grid-rows-[min-content]">
          {props.allWorlds.map((world: any, index: number) => {
            return (
              <WorldItem
                key={index}
                world={world}
                image={
                  backendUrl + "/worlds/world-" + world.worldId + ".png"
                }
                {...props}
              />
            );
          })}
        </div>
        <PaginationView
          data={props.allWorlds}
          setState={props.setAllWorldsPagination}
          stateValue={props.allWorldsPagination}
        />
      </div>
    </div>
  );
};

export const WorldsTab = (props: any) => {
  const { address } = useAccount();
  const [queryAddress, setQueryAddress] = useState("0".repeat(64));
  useEffect(() => {
    if (!address) {
      setQueryAddress("");
      return;
    }
    // Remove 0x prefix and convert to lowercase
    let newAddr = address.slice(2).toLowerCase();
    // Left pad with 0s to 64 characters
    newAddr = newAddr.padStart(64, "0");
    setQueryAddress(newAddr);
  }, [address]);

  const [favoriteWorlds, setFavoriteWorlds] = useState([] as any[]);
  const [allWorlds, setAllWorlds] = useState([] as any[]);
  const [myWorldsPagination, setMyWorldsPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allWorldsPagination, setAllWorldsPagination] = useState({
    pageLength: 24,
    page: 1
  });

  useEffect(() => {
    async function getMyWorlds() {
      try {
        const result = await getFavoriteWorlds(
          queryAddress,
          myWorldsPagination.pageLength,
          myWorldsPagination.page
        );

        if (result.data) {
          if (myWorldsPagination.page === 1) {
            setFavoriteWorlds(result.data);
          } else {
            setFavoriteWorlds([...favoriteWorlds, ...result.data]);
          }
        }
      } catch (error) {
        console.log("Error fetching Worlds", error);
      }
    }
    getMyWorlds();
  }, [
    queryAddress,
    myWorldsPagination.page,
    myWorldsPagination.pageLength
  ]);

  const [expanded, setExpanded] = useState(false);
  const filters = ["hot", "new", "top"];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getFilterWorlds() {
      try {
        let result;
        if (activeFilter === "hot") {
          result = await getHotWorlds(
            queryAddress,
            allWorldsPagination.pageLength,
            allWorldsPagination.page
          );
        } else if (activeFilter === "new") {
          result = await getNewWorlds(
            queryAddress,
            allWorldsPagination.pageLength,
            allWorldsPagination.page
          );
        } else if (activeFilter === "top") {
          result = await getTopWorlds(
            queryAddress,
            allWorldsPagination.pageLength,
            allWorldsPagination.page
          );
        } else {
          result = await getWorlds(
            allWorldsPagination.pageLength,
            allWorldsPagination.page
          );
        }

        if (result.data) {
          if (allWorldsPagination.page === 1) {
            setAllWorlds(result.data);
          } else {
            const newWorlds = result.data.filter(
              (world: any) =>
                !allWorlds.some(
                  (existingWorld) => existingWorld.id === world.id
                )
            );
            setAllWorlds([...allWorlds, ...newWorlds]);
          }
        }
      } catch (error) {
        console.log("Error fetching Worlds", error);
      }
    }
    getFilterWorlds();
  }, [queryAddress, expanded, allWorldsPagination]);

  const resetPagination = () => {
    setAllWorldsPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  const [activeWorld, setActiveWorld] = useState(null);
  useEffect(() => {
    const getActiveWorld = async () => {
      if (!props.openedWorldId) {
        return;
      }
      const world = await getWorld(props.openedWorldId);
      setActiveWorld(world);
    };
    getActiveWorld();
  }, [props.openedWorldId]);

  const updateFavorites = (worldId: number, favorites: number, favorited: boolean) => {
    const newFavoriteWorlds = favoriteWorlds.map((world: any) => {
      if (world.worldId === worldId) {
        return { ...world, favorites: favorites, favorited: favorited };
      }
      return world;
    });

    const newAllWorlds = allWorlds.map((world: any) => {
      if (world.worldId === worldId) {
        return { ...world, favorites: favorites, favorited: favorited };
      }
      return world;
    });

    setFavoriteWorlds(newFavoriteWorlds);
    setAllWorlds(newAllWorlds);
  };

  return (
    <ExpandableTab
      title="Worlds"
      {...props}
      mainSection={WorldsMainSection}
      expandedSection={WorldsExpandedSection}
      expanded={expanded}
      setExpanded={setExpanded}
      filters={filters}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      favoriteWorlds={favoriteWorlds}
      allWorlds={allWorlds}
      myWorldsPagination={myWorldsPagination}
      setMyWorldsPagination={setMyWorldsPagination}
      allWorldsPagination={allWorldsPagination}
      setAllWorldsPagination={setAllWorldsPagination}
      activeWorld={activeWorld}
      startWorldCreation={props.startWorldCreation}
    >
    </ExpandableTab>
  );
}
