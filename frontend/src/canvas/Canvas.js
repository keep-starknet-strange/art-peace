import React, { useCallback, useEffect } from 'react';
import './Canvas.css';
import { backendUrl } from '../utils/Consts.js';
import canvasConfig from '../configs/canvas.config.json';

const Canvas = (props) => {
  useEffect(() => {
    if (props.width !== 518 || props.height !== 396) {
      console.error('Invalid canvas dimensions:', props.width, props.height);
    }
  }, [props.width, props.height]);

  const draw = useCallback(
    (ctx, imageData) => {
      if (
        imageData.width !== props.width ||
        imageData.height !== props.height
      ) {
        console.error(
          'ImageData dimensions mismatch:',
          imageData.width,
          imageData.height,
          'expected:',
          props.width,
          props.height
        );
        return;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.putImageData(imageData, 0, 0);
    },
    [props.width, props.height]
  );

  const isCenterCanvas =
    props.style &&
    props.style.width === props.width * props.canvasScale &&
    props.style.height === props.height * props.canvasScale;

  const handleClick = (e) => {
    if (!isCenterCanvas) {
      e.preventDefault();
      return;
    }
    props.pixelClicked(e);
  };

  useEffect(() => {
    const fetchCanvas = async () => {
      if (props.isEmpty) {
        const canvas = props.canvasRef.current;
        const context = canvas.getContext('2d');
        context.fillStyle = '#f0f0f0';
        context.fillRect(0, 0, props.width, props.height);
        return;
      }

      try {
        if (props.colors.length === 0) {
          return;
        }
        const canvas = props.canvasRef.current;
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
        const imageDataArray = [];
        for (let i = 0; i < dataArray.length; i++) {
          const color = '#' + props.colors[dataArray[i]] + 'FF';
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
  }, [props.colors, props.openedWorldId, props.isEmpty]);

  return (
    <canvas
      ref={props.canvasRef}
      width={props.width}
      height={props.height}
      style={props.style}
      className='Canvas'
      onClick={handleClick}
    />
  );
};

export default Canvas;
