import NextImg from "next/image";
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
import uploadIcon from "../../../public/icons/Share.png";

const StencilsMainSection = (props: any) => {
  const [uploadEnabled, _] = useState(false);
  const { address } = useAccount();

  return (
    <div
      className={`${props.expanded ? "relative w-[min(100%,40rem)] mx-auto my-0 transition-all duration-500 ease-in-out" : "relative w-full mx-auto my-0 transition-all duration-500 ease-in-out"}`}
    >
      <div className="flex flex-row justify-between items-between px-[0.5rem] mx-[0.5rem] w-[calc(100%-1rem) relative]">
        <div className="flex flex-row align-center absolute top-0 right-[1rem] z-[20]">
          {!props.expanded && (
            <div
              className="Text__large Button__primary"
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
      <div className="h-[55vh] px-[2rem] overflow-scroll">
        {props.openedStencil && (
          <>
          <h2 className="Text__xlarge p-0 m-0 pb-[1rem] underline">Current:</h2>
          <div className="w-[70%] mx-auto">
          <StencilItem
            key={props.openedStencil.stencilId}
            activeWorld={props.activeWorld}
            setStencilFavorited={props.setStencilFavorited}
            stencil={props.openedStencil}
            image={
              backendUrl +
              "/stencils/stencil-" +
              props.openedStencil.hash +
              ".png"
            }
            {...props}
          />
          </div>
          </>
        )}
        {props.favoriteStencils.length > 0 && (
          <div className="flex flex-col gap-2">
          <h2 className="Text__xlarge p-0 m-0 pb-[1rem] underline">Favorites:</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] grid-rows-[min-content] gap-2">
          {props.favoriteStencils.map((stencil: any, index: number) => {
            return (
              <StencilItem
                key={index}
                activeWorld={props.activeWorld}
                setStencilFavorited={props.setStencilFavorited}
                stencil={stencil}
                image={backendUrl + "/stencils/stencil-" + stencil.hash + ".png"}
                {...props}
              />
            );
          })}
          </div>
          </div>
        )}
        <PaginationView
          data={props.favoriteStencils}
          stateValue={props.myStencilsPagination}
          setState={props.setMyStencilsPagination}
        />
        <div className="flex flex-col gap-2">
        {!props.expanded && (
        <>
        <h2 className="Text__xlarge p-0 m-0 pb-[1rem] underline">For you :</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] grid-rows-[min-content] gap-2">
        {props.allStencils.map((stencil: any, index: number) => {
          return (
            <StencilItem
              key={index}
              activeWorld={props.activeWorld}
              setStencilFavorited={props.setStencilFavorited}
              stencil={stencil}
              image={backendUrl + "/stencils/stencil-" + stencil.hash + ".png"}
              {...props}
            />
          );
        })}
        </div>
        <PaginationView
          data={props.allStencils}
          stateValue={props.allStencilsPagination}
          setState={props.setAllStencilsPagination}
        />
        </>
        )}
      </div>
      </div>
        {address && uploadEnabled && (
          <div className="flex flex-row justify-center items-center w-full mt-2">
            <div
              className="Button__primary"
              onClick={() => {
                playSoftClick2();
                props.uploadStencil();
              }}
            >
              <div className="flex flex-col align-center justify-center">
                <p className="Text__large p-2 pl-6 text-nowrap">Upload PNG</p>
                <p className="Text__xsmall pt-0 p-2">Max 128x128</p>
              </div>
              <NextImg
                src={uploadIcon}
                alt="Upload"
                width={24}
                height={24}
                className="w-[3.4rem] h-[3.4rem] ml-[0.5rem] Pixel__img"
              />
            </div>
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
  );
};

const StencilsExpandedSection = (props: any) => {
  return (
    <div className="flex flex-col w-full align-center">
      <div className="flex flex-col sm:flex-row justify-between items-between p-[0.5rem] mx-[0.5rem] w-[calc(100%-1rem)]">
        <h2 className="Text__xlarge p-0 pb-[0.5rem] underline">Explore</h2>
        <div className="flex flex-row align-center justify-around p-[0.5rem] mx-[0.5rem] gap-2">
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
      <div className="mt-[0.5rem] p-[0.5rem] h-[55vh] overflow-y-scroll w-full">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(22rem,1fr))] grid-rows-[min-content] gap-2">
          {props.allStencils.map((stencil: any, index: number) => {
            return (
              <StencilItem
                key={index}
                activeWorld={props.activeWorld}
                setStencilFavorited={props.setStencilFavorited}
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
    reader.onload = async (e: any) => {
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
          event.target.value = "";
          event.target.files = null;
          return;
        }
        if (height > maxImageSize || width > maxImageSize) {
          alert(
            `Image is too large, maximum size is ${maxImageSize}x${maxImageSize}. Given size is ` +
              width +
              "x" +
              height
          );
          event.target.value = "";
          event.target.files = null
          return;
        }

        props.setRawStencilImage(image);
      }
    };
  };

  useEffect(() => {
    async function getMyStencils() {
      const queryAddress = address ? address.slice(2) : "0";
      try {
        const stencils = await getFavoriteStencils(
          queryAddress,
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
    if (!address) {
      return;
    }
    getMyStencils();
  }, [
    address,
    props.worldId,
    myStencilsPagination.page,
    myStencilsPagination.pageLength
  ]);

  const [expanded, setExpanded] = useState(false);
  const filters = ["top", "new"];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const [showOnlyThisWorld, setShowOnlyThisWorld] = useState(true);
  useEffect(() => {
    async function getFilterStencils() {
      const queryAddress = address ? address.slice(2) : "0";
      try {
        let stencils;
        if (activeFilter === "hot") {
          stencils = await getHotStencils(
            queryAddress,
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "new") {
          stencils = await getNewStencils(
            queryAddress,
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "top") {
          stencils = await getTopStencils(
            queryAddress,
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
                  (existingStencil) => existingStencil.stencilId === stencil.stencilId
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

  const setStencilFavorited = (stencilId: number, favorited: boolean) => {
    const newFavoriteOffset = favorited ? 1 : -1;
    const newStencils = favoriteStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorited: favorited, favorites: stencil.favorites + newFavoriteOffset };
      }
      return stencil;
    });
    setFavoriteStencils(newStencils);
    const newAllStencils = allStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorited: favorited, favorites: stencil.favorites + newFavoriteOffset };
      }
      return stencil;
    }
    );
    setAllStencils(newAllStencils);
    const newOpenedStencil = props.openedStencil;
    if (newOpenedStencil && newOpenedStencil.stencilId === stencilId) {
      props.setOpenedStencil({ ...newOpenedStencil, favorited: favorited, favorites: newOpenedStencil.favorites + newFavoriteOffset });
    }
  }

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
      activeWorld={props.activeWorld}
      setStencilFavorited={setStencilFavorited}
    >
    </ExpandableTab>
  );
}
