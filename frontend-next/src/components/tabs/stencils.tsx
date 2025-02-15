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
        {props.activeStencil && !props.activeStencil.favorited && (
          <StencilItem
            key={props.activeStencil.stencilId}
            stencil={props.activeStencil}
            image={
              backendUrl +
              "/stencils/stencil-" +
              props.activeStencil.hash +
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
              onClick={props.uploadStencil}
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
                onClick={() => props.setActiveFilter(filter)}
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

  const imageToPalette = (image: any) => {
    // Convert image pixels to be within the color palette

    // Get image data
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    let imagePalleteIds = [];
    // Convert image data to color palette
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        imagePalleteIds.push(255);
        continue;
      }
      let minDistance = 1000000;
      let minColor = props.colors[0];
      let minColorIndex = 0;
      for (let j = 0; j < props.colors.length; j++) {
        const color = props.colors[j]
          .match(/[A-Za-z0-9]{2}/g)
          .map((x: string) => parseInt(x, 16));
        const distance = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          minColor = color;
          minColorIndex = j;
        }
      }
      data[i] = minColor[0];
      data[i + 1] = minColor[1];
      data[i + 2] = minColor[2];
      imagePalleteIds.push(minColorIndex);
    }

    // Set image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    return [canvas.toDataURL(), imagePalleteIds];
  };

  const inputFile = useRef(null as any);
  const uploadStencil = () => {
    if (!inputFile.current) return;
    inputFile.current.click();
  };

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file === undefined) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      var image = new Image();
      if (!e.target) {
        return;
      }
      image.src = e.target.result as string;
      image.onload = () => {
        var height = image.height;
        var width = image.width;
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

        const [paletteImage, colorIds] = imageToPalette(image) as any;
        // TODO: Upload to backend and get template hash back
        let stencilImage = {
          image: paletteImage,
          width: width,
          height: height
        };
        props.setStencilImage(stencilImage);
        props.setStencilColorIds(colorIds);
        props.setStencilCreationMode(true);
        props.setStencilCreationSelected(false);
        props.setActiveTab("Canvas");
      };
    };
  };

  useEffect(() => {
    async function getMyStencils() {
      try {
        const result = await getFavoriteStencils(
          queryAddress,
          myStencilsPagination.pageLength,
          myStencilsPagination.page,
          showOnlyThisWorld ? props.worldId : null
        );

        if (result.data) {
          if (myStencilsPagination.page === 1) {
            setFavoriteStencils(result.data);
          } else {
            setFavoriteStencils([...favoriteStencils, ...result.data]);
          }
        }
      } catch (error) {
        console.log("Error fetching Stencils", error);
      }
    }
    getMyStencils();
  }, [
    queryAddress,
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
      try {
        let result;
        if (activeFilter === "hot") {
          result = await getHotStencils(
            queryAddress,
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "new") {
          result = await getNewStencils(
            queryAddress,
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else if (activeFilter === "top") {
          result = await getTopStencils(
            queryAddress,
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        } else {
          result = await getStencils(
            allStencilsPagination.pageLength,
            allStencilsPagination.page,
            showOnlyThisWorld ? props.worldId : null
          );
        }

        if (result.data) {
          if (allStencilsPagination.page === 1) {
            setAllStencils(result.data);
          } else {
            const newStencils = result.data.filter(
              (stencil: any) =>
                !allStencils.some(
                  (existingStencil) => existingStencil.id === stencil.id
                )
            );
            setAllStencils([...allStencils, ...newStencils]);
          }
        }
      } catch (error) {
        console.log("Error fetching Stencils", error);
      }
    }
    getFilterStencils();
  }, [queryAddress, expanded, allStencilsPagination]);

  const resetPagination = () => {
    setAllStencilsPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  const [activeStencil, setActiveStencil] = useState(null);
  useEffect(() => {
    const getActiveStencil = async () => {
      if (!props.openedStencilId) {
        return;
      }
      const stencil = await getStencil(props.openedStencilId);
      setActiveStencil(stencil);
    };
    getActiveStencil();
  }, [props.openedStencilId]);

  const updateFavorites = (stencilId: number, favorites: number, favorited: boolean) => {
    let newFavoriteStencils = favoriteStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    let newAllStencils = allStencils.map((stencil: any) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    setFavoriteStencils(newFavoriteStencils);
    setAllStencils(newAllStencils);
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
      activeStencil={activeStencil}
    >
    </ExpandableTab>
  );
}
