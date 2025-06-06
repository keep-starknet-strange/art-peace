import React from 'react';
import './Canvas.css';
// import { backendUrl } from '../utils/Consts.js';
// import canvasConfig from '../configs/canvas.config.json';

const Canvas = (props) => {
  /*
  const draw = useCallback(
    (ctx, imageData) => {
      ctx.putImageData(imageData, 0, 0);
    },
    [props.width, props.height]
  );

  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        let canvasColors = props.colors;
        if (props.colors.length === 0) {
          // Try to fetch colors from the backend
          let canvasColorsEndpoint =
            backendUrl +
            (props.openedWorldId === null
              ? '/get-colors'
              : `/get-worlds-colors?worldId=${props.openedWorldId}`);
          let response = await fetch(canvasColorsEndpoint);
          let canvasColorsData = await response.json();
          canvasColors = canvasColorsData.data;
          if (canvasColors.length === 0) {
            console.error('No colors found');
            return;
          }
        }
        const canvas = props.canvasRef.current;
        if (!canvas) {
          return;
        }
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;

        let getCanvasEndpoint =
          backendUrl +
          (props.openedWorldId === null
            ? '/get-canvas'
            : `/get-world-canvas?worldId=${props.openedWorldId}`);
        let response = await fetch(getCanvasEndpoint);
        let canvasData = await response.arrayBuffer();

        let colorData = new Uint8Array(canvasData, 0, canvasData.byteLength);
        let dataArray = [];
        let bitwidth = canvasConfig.colorsBitwidth;
        let oneByteBitOffset = 8 - bitwidth;
        let twoByteBitOffset = 16 - bitwidth;
        let canvasBits = props.width * props.height * bitwidth;
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
          const color = '#' + canvasColors[dataArray[i]] + 'FF';
          const [r, g, b, a] = color.match(/\w\w/g).map((x) => parseInt(x, 16));
          imageDataArray.push(r, g, b, a);
        }
        const uint8ClampedArray = new Uint8ClampedArray(imageDataArray);
        const imageData = new ImageData(
          uint8ClampedArray,
          props.width,
          props.height
        );
        draw(context, imageData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCanvas();
  }, [props.width, props.height, props.colors, props.openedWorldId]);
  */

  return (
    <canvas
      ref={props.canvasRef}
      width={props.width}
      height={props.height}
      style={props.style}
      className={`Canvas ${props.className}`}
      onClick={props.pixelClicked}
    />
  );
};

export default Canvas;
