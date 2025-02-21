import { useEffect, useState } from "react";
import { playSoftClick, playSoftClick2 } from "../utils/sounds";
import { getStencilPixelData } from "../../api/stencils";

export const StencilBotController = (props: any) => {
  const maxLoaderCount = 4;
  const [loaderCount, setLoaderCount] = useState(0);
  const loader = () => {
    setLoaderCount((loaderCount + 1) % maxLoaderCount);
  }
  useEffect(() => {
    const interval = setInterval(loader, 500);
    return () => clearInterval(interval);
  }, [loaderCount]);

  const [rawTemplatePixels, setRawTemplatePixels] = useState([]);
  const [remainingTemplatePixels, setRemainingTemplatePixels] = useState([] as any[]);
  useEffect(() => {
    const getStencilData = async () => {
      const stencilData = await getStencilPixelData(props.openedStencil.hash, props.activeWorld.worldId);
      setRawTemplatePixels(stencilData.pixelData);
    };
    if (props.openedStencil) {
      getStencilData();
    } else {
      setRawTemplatePixels([]);
    }
  }, [props.openedStencil]);
  const getCanvasColorAt = (x: number, y: number) => {
    const color = props.canvasRef.current.getContext("2d").getImageData(x, y, 1, 1).data;
    // Formatted color ( lowercase rrggbb )
    let formattedColor =
      color[0].toString(16).padStart(2, "0") +
      color[1].toString(16).padStart(2, "0") +
      color[2].toString(16).padStart(2, "0");
    formattedColor = formattedColor.toLowerCase();
    const colorId = props.worldColors.findIndex((worldColor: any) => {
      return worldColor === formattedColor;
    });
    return colorId;
  }
  const getRemainingTemplatePixels = (): any[] => {
    if (!props.openedStencil || !props.activeWorld) {
      return [];
    }
    const xStart = props.openedStencil.position % props.activeWorld.width;
    const yStart = Math.floor(props.openedStencil.position / props.activeWorld.width);
    const newRemaining = [];
    for (let xIdx = 0; xIdx < props.openedStencil.width; xIdx++) {
      for (let yIdx = 0; yIdx < props.openedStencil.height; yIdx++) {
        const rawIdx = xIdx + yIdx * props.openedStencil.width;
        const x = xStart + xIdx;
        const y = yStart + yIdx;
        if (x >= props.activeWorld.width || y >= props.activeWorld.height) {
          // Out of bounds
          continue;
        }
        if (rawTemplatePixels[rawIdx] === 255) {
          // Transparent pixel
          continue;
        }
        if (rawTemplatePixels[rawIdx] !== getCanvasColorAt(x, y)) {
          newRemaining.push({
            position: x + y * props.activeWorld.width,
            color: rawTemplatePixels[rawIdx]
          });
        }
      }
    }
    return newRemaining;
  };
  useEffect(() => {
    setRemainingTemplatePixels(getRemainingTemplatePixels());
  }, [rawTemplatePixels]);
  // Every 30 seconds, reset remainingTemplatePixels
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTemplatePixels(getRemainingTemplatePixels());
    }, 30000);
    return () => clearInterval(interval);
  }, [remainingTemplatePixels]);
  // TODO: Use remaining template pixels to build image
  useEffect(() => {
    const buildInterval = setInterval(() => {
      if (remainingTemplatePixels.length === 0) {
        clearInterval(buildInterval);
        return;
      }
      if (props.availablePixelsUsed < props.availablePixels) {
        const randomIdx = Math.floor(Math.random() * remainingTemplatePixels.length);
        let newStaging = props.stagingPixels;
        const position = remainingTemplatePixels[randomIdx].position;
        const pixel = { position, colorId: remainingTemplatePixels[randomIdx].color };
        newStaging = [...newStaging, pixel];
        const newRemaining = [...remainingTemplatePixels];
        newRemaining.splice(randomIdx, 1);
        setRemainingTemplatePixels(newRemaining);
        playSoftClick();
        props.setStagingPixels(newStaging);
      } else {
        clearInterval(buildInterval);
      }
    }, 150);
    return () => clearInterval(buildInterval);
  }, [remainingTemplatePixels, props.stagingPixels, props.availablePixelsUsed, props.availablePixels]);

  return (
    <div
      className="Buttonlike__primary pl-[1rem] pr-[0.5rem] gap-2"
    >
      {!props.openedStencil && (
        <p className="Text__medium">Please select a stencil...</p>
      )}
      {props.openedStencil && (
        <p className="Text__medium w-[30rem]">Building stencil{".".repeat(loaderCount)}</p>
      )}
      <div
        className="Button__close"
        onClick={() => {
          playSoftClick2();
          props.setSelectedBotOption(null);
        }}
      >
        x
      </div>
    </div>
  );
}
