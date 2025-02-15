import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { getCanvas, getCanvasColors } from "../../api/canvas";
import { placePixelCall } from "../../contract/calls";
import "./canvas.css";

export const Canva = (props: any) => {
  const { account } = useAccount();
  const [colors, setColors] = useState([] as string[]);
  useEffect(() => {
    const getColors = async (worldId: number) => {
      const canvasColors = await getCanvasColors(worldId);
      setColors(canvasColors);
    };
    getColors(props.worldId);
  }, [props.worldId]);
  useEffect(() => {
    const fetchCanvas = async (
      width: number,
      height: number,
      canvasRef: any,
      worldId: number
    ) => {
      try {
        // Try to fetch colors from the backend
        let canvasColors = colors;
        if (!canvasRef) return;
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error("Canva not found");
          return;
        }
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;

        let canvasData = await getCanvas(worldId);
        let colorData = new Uint8Array(canvasData, 0, canvasData.byteLength);
        let dataArray = [];
        let bitwidth = process.env.NEXT_PUBLIC_CANVAS_BITWIDTH as unknown as number || 5;
        let oneByteBitOffset = 8 - bitwidth;
        let twoByteBitOffset = 16 - bitwidth;
        let canvasBits = width * height * bitwidth;
        for (let bitPos = 0; bitPos < canvasBits; bitPos += bitwidth) {
          let bytePos = Math.floor(bitPos / 8);
          let bitOffset = bitPos % 8;
          if (bitOffset <= oneByteBitOffset) {
            let byte = colorData[bytePos];
            let value = (byte >> (oneByteBitOffset - bitOffset)) & 0b11111;
            dataArray.push(value);
          } else {
            let byte = (colorData[bytePos] << 8) | colorData[bytePos + 1];
            let value = (byte >> (twoByteBitOffset - bitOffset)) & 0b11111;
            dataArray.push(value);
          }
        }
        let imageDataArray = [];
        for (let i = 0; i < dataArray.length; i++) {
          let color = "#" + canvasColors[dataArray[i]] + "FF";
          if (!color) {
            color = "#000000FF";
          }
          const splitColor = color.match(/\w\w/g);
          if (!splitColor) {
            console.error("Invalid color" + color);
            return;
          }
          const [r, g, b, a] = splitColor.map((x) => parseInt(x, 16));
          imageDataArray.push(r, g, b, a);
        }
        const uint8ClampedArray = new Uint8ClampedArray(imageDataArray);
        const imageData = new ImageData(uint8ClampedArray, width, height);
        context.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCanvas(
      props.width,
      props.height,
      props.canvasRef,
      props.worldId
    );
  // TODO: Change params to make more efficient
  }, [props.width, props.height, props.canvasRef, props.worldId, colors]);

  const colorPixel = (x: number, y: number, colorId: number) => {
    const canvas = props.canvasRef.current;
    const context = canvas.getContext("2d");
    if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
      console.error("Invalid pixel position");
      return;
    }

    const colorHex = `#${colors[colorId]}FF`;
    context.fillStyle = colorHex;
    context.fillRect(x, y, 1, 1);
  }

  const pixelClicked = async (event: any) => {
    const canvas = props.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(
      ((event.clientX - rect.left) / (rect.right - rect.left)) * props.width
    );
    const y = Math.floor(
      ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
    );

    // Only click pixel if it's within the canvas
    if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
      return;
    }

    if(!props.selectPixel(x, y)) return;
    if (!props.selectedColorId || props.selectedColorId === -1 || !props.basePixelUp) {
      return;
    }

    // Color the pixel if color is selected & available
    const position = y * props.width + x;
    const colorId = props.selectedColorId;

    const timestamp = Math.floor(Date.now() / 1000);

    props.setSelectedColorId(-1);
    colorPixel(x, y, colorId);
    await placePixelCall(
      account,
      props.worldId,
      position,
      colorId,
      timestamp
    );
    props.clearPixelSelection();
    props.setLastPlacedTime(timestamp * 1000);
  }

  return (
    <div>
      <h3
        className="p-0 m-0 absolute z-5 text-lg font-bold whitespace-nowrap pointer-events-none text-black drop-shadow-lg"
        style={{
          top: `calc(-0.75rem * ${props.titleScale} + ${props.origin.y}px)`,
          left: `calc(${props.origin.x}px + ${props.width * props.canvasScale / 2}px)`,
          transform: `translate(-50%, -50%) scale(${props.titleScale})`
        }}
      >
        {props.title}
      </h3>
      <canvas
        ref={props.canvasRef}
        width={props.width}
        height={props.height}
        style={props.style}
        className={`Canva ${props.className} relative cursor-pointer`}
        onClick={props.onClick ? props.onClick : pixelClicked}
      >
      </canvas>
    </div>
  );
};
