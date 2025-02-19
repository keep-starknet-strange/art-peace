import { useEffect, useRef, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { ExpandableTab } from "./expandable";
import { StencilItem } from "../stencils/item";
import { backendUrl } from "../../api/api";
import {
  getFavoriteStencils,
  getHotStencils,
  getNewStencils,
  getStencils,
  getTopStencils,
  getStencil
} from "../../api/stencils";
import { PaginationView } from "../utils/pagination";
import { playSoftClick2 } from "../utils/sounds";

const StencilsMainSection = (props: any) => {
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
            Please login to view your favorite stencils
          </p>
        )}
        {props.openedStencil && !props.openedStencil.favorited && (
          <StencilItem
            key={props.openedStencil.stencilId}
            stencil={props.openedStencil}
            image={
              backendUrl +
              "/stencils/stencil-" +
              props.openedStencil.hash +
              ".png"
            }
            {...props}
          />
        )}
        {props.favoriteStencils.map((stencil: any, index: number) => {
          return (
            <StencilItem
              key={index}
              stencil={stencil}
              image={backendUrl + "/stencils/stencil-" + stencil.hash + ".png"}
              {...props}
            />
          );
        })}
        <PaginationView
          data={props.favoriteStencils}
          stateValue={props.myStencilsPagination}
          setState={props.setMyStencilsPagination}
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
                props.uploadStencil();
              }}
            >
              Create Stencil
            </p>
            <input
              type="file"
              id="file"
              accept=".png"
              ref={props.inputFile}
              style={{ display: "none" }}
              onChange={props.handleFileChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const StencilsExpandedSection = (props: any) => {
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
          {props.allStencils.map((stencil: any, index: number) => {
            return (
              <StencilItem
                key={index}
                stencil={stencil}
                image={
                  backendUrl + "/stencils/stencil-" + stencil.hash + ".png"
                }
                {...props}
              />
            );
          })}
        </div>
        <PaginationView
          data={props.allStencils}
          setState={props.setAllStencilsPagination}
          stateValue={props.allStencilsPagination}
        />
      </div>
    </div>
  );
};

export const StencilsTab = (props: any) => {
  const { address } = useAccount();

  const [favoriteStencils, setFavoriteStencils] = useState([] as any[]);
  const [allStencils, setAllStencils] = useState([] as any[]);
  const [myStencilsPagination, setMyStencilsPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allStencilsPagination, setAllStencilsPagination] = useState({
    pageLength: 24,
    page: 1
  });

  const maxImageSize = 128;

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file === undefined) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const image = new Image();
      if (!e.target) {
        return;
      }
      image.src = e.target.result as string;
      image.onload = () => {
        const height = image.height;
        const width = image.width;
        if (height < 5 || width < 5) {
          alert(
            "Image is too small, minimum size is 5x5. Given size is " +
              width +
              "x" +
              height
          );
          return;
        }
        if (height > maxImageSize || width > maxImageSize) {
          alert(
            `Image is too large, maximum size is ${maxImageSize}x${maxImageSize}. Given size is ` +
              width +
              "x" +
              height
          );
          return;
        }

        props.setRawStencilImage(image);
      }
    };
  };

  useEffect(() => {
    async function getMyStencils() {
      if (!address) {
        return;
      }
      try {
        const stencils = await getFavoriteStencils(
          address.slice(2),
          myStencilsPagination.pageLength,
          myStencilsPagination.page,
          showOnlyThisWorld ? props.worldId : null
        );

        if (stencils) {
          if (myStencilsPagination.page === 1) {
            setFavoriteStencils(stencils);
          } else {
            setFavoriteStencils([...favoriteStencils, ...stencils]);
          }
        } else if (myStencilsPagination.page === 1) {
          setFavoriteStencils([]);
        }
      } catch (error) {
        console.log("Error fetching Stencils", error);
      }
    }
    getMyStencils();
  }, [
    address,
    props.worldId,
    myStencilsPagination.page,
    myStencilsPagination.pageLength
  ]);

  const [expanded, setExpanded] = useState(false);
  const filters = ["hot", "new", "top"];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const [showOnlyThisWorld, setShowOnlyThisWorld] = useState(true);
  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getFilterStencils() {
      if (!address) {
        return;
      }
      try {
        let stencils;
        if (activeFilter === "hot") {
          stencils = await getHotStencils(
            address.slice(2),
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "new") {
          stencils = await getNewStencils(
            address.slice(2),
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "top") {
          stencils = await getTopStencils(
            address.slice(2),
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else {
          stencils = await getStencils(
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        }

        if (stencils) {
          if (allStencilsPagination.page === 1) {
            setAllStencils(stencils);
          } else {
            const newStencils = stencils.filter(
              (stencil: any) =>
                !allStencils.some(
                  (existingStencil) => existingStencil.id === stencil.id
                )
            );
            setAllStencils([...allStencils, ...newStencils]);
          }
        } else if (allStencilsPagination.page === 1) {
          setAllStencils([]);
        }
      } catch (error) {
        console.log("Error fetching Stencils", error);
      }
    }
    getFilterStencils();
  }, [address, props.worldId, expanded, allStencilsPagination]);

  const resetPagination = () => {
    setAllStencilsPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  const updateFavorites = (stencilId: number, favorites: number, favorited: boolean) => {
    const newFavoriteStencils = favoriteStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    const newAllStencils = allStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    setFavoriteStencils(newFavoriteStencils);
    setAllStencils(newAllStencils);
  };

  const inputFile = useRef(null as any);
  const uploadStencil = () => {
    if (!inputFile.current) return;
    inputFile.current.click();
  };

  return (
    <ExpandableTab
      title="Stencils"
      {...props}
      mainSection={StencilsMainSection}
      expandedSection={StencilsExpandedSection}
      expanded={expanded}
      setExpanded={setExpanded}
      filters={filters}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      favoriteStencils={favoriteStencils}
      allStencils={allStencils}
      myStencilsPagination={myStencilsPagination}
      setMyStencilsPagination={setMyStencilsPagination}
      allStencilsPagination={allStencilsPagination}
      setAllStencilsPagination={setAllStencilsPagination}
      uploadStencil={uploadStencil}
      inputFile={inputFile}
      handleFileChange={handleFileChange}
      openedStencil={props.openedStencil}
      setOpenedStencil={props.setOpenedStencil}
    >
    </ExpandableTab>
  );
}
