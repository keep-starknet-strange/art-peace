import React, { useEffect } from 'react';
import './Canvas.css';
import { backendUrl } from '../utils/Consts.js';
import canvasConfig from '../configs/canvas.config.json';

const Canvas = (props) => {
  useEffect(() => {
    if (props.width !== 518 || props.height !== 396) {
      console.error('Invalid canvas dimensions:', props.width, props.height);
    }
  }, [props.width, props.height]);

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
      const canvas = props.canvasRef.current;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, props.width, props.height);

      if (props.isEmpty) {
        return;
      }

      try {
        if (props.colors.length === 0) {
          return;
        }

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

        if (dataArray.length > 0) {
          for (let i = 0; i < dataArray.length; i++) {
            const x = i % props.width;
            const y = Math.floor(i / props.width);
            context.fillStyle = `#${props.colors[dataArray[i]]}FF`;
            context.fillRect(x, y, 1, 1);
          }
        }
      } catch (error) {
        console.error('Error fetching canvas:', error);
      }
    };

    fetchCanvas();
  }, [
    props.colors,
    props.width,
    props.height,
    props.openedWorldId,
    props.isEmpty
  ]);

  const displayWidth = props.isCenter ? props.width : 256;
  const displayHeight = props.isCenter ? props.height : 192;

  return (
    <canvas
      ref={props.canvasRef}
      width={props.width}
      height={props.height}
      data-world-id={props.openedWorldId}
      style={{
        ...props.style,
        width: `${displayWidth}px`,
        height: `${displayHeight}px`
      }}
      className='Canvas'
      onClick={handleClick}
    />
  );
};

export default Canvas;
