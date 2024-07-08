import React, { useEffect, useState } from 'react';
import canvasConfig from '../configs/canvas.config.json';
import './TemplateCreationOverlay.css';

const TemplateCreationOverlay = (props) => {
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    setPosX(props.templatePosition % canvasConfig.canvas.width);
    setPosY(Math.floor(props.templatePosition / canvasConfig.canvas.width));
  }, [props.templatePosition]);

  useEffect(() => {
    const updateFromEvent = (event) => {
      if (
        !(
          event.target.classList.contains('ExtraPixelsCanvas') ||
          event.target.classList.contains('Canvas')
        )
      ) {
        return;
      }
      if (!props.templateCreationSelected) {
        const canvas = props.canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.width
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
        );
        if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
          return;
        }
        props.setTemplatePosition(y * props.width + x);
      }
    };
    if (props.templateCreationMode && !props.templateCreationSelected) {
      window.addEventListener('mousemove', updateFromEvent);
    }

    return () => {
      window.removeEventListener('mousemove', updateFromEvent);
    };
  }, [
    props.templateCreationSelected,
    props.templateCreationMode,
    props.width,
    props.height
  ]);

  useEffect(() => {
    const mouseUp = async (event) => {
      if (
        !(
          event.target.classList.contains('ExtraPixelsCanvas') ||
          event.target.classList.contains('Canvas')
        )
      ) {
        return;
      }

      if (props.templateCreationSelected) {
        return;
      }
      if (event.button === 0 && props.templateCreationMode) {
        const canvas = props.canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.width
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
        );
        if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
          return;
        }
        props.setTemplatePosition(y * props.width + x);
        props.setTemplateCreationSelected(true);
      }
    };
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mouseup', mouseUp);
    };
  }, [
    props.templateCreationSelected,
    props.templateCreationMode,
    props.width,
    props.height
  ]);
  /*
  const templateCanvasRef = React.useRef(null);
  const imageToCanvas = (image) => {
    // Convert image pixels to be within the color palette
    if (image === null) return;

    // Get image data
    const templateCanvas = templateCanvasRef.current;
    const ctx = templateCanvas.getContext('2d');
    templateCanvas.width = image.width;
    templateCanvas.height = image.height;
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
          .map((x) => parseInt(x, 16));
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
  };

  React.useEffect(() => {
    var image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = props.overlayTemplate.image;
    image.onload = () => {
      imageToCanvas(image);
    };
  }, [props.overlayTemplate.image]);
      <canvas
        ref={templateCanvasRef}
        width={props.overlayTemplate.width * props.canvasScale}
        height={props.overlayTemplate.height * props.canvasScale}
        className='TemplateOverlay__canvas'
      />
  */

  const [templateOutline, setTemplateOutline] = React.useState('none');
  useEffect(() => {
    const outlineWidth = 1 * props.canvasScale;
    setTemplateOutline(`${outlineWidth}px solid rgba(200, 0, 0, 0.3)`);
  }, [props.canvasScale]);

  const closeOverlay = () => {
    props.setTemplateCreationMode(false);
  };

  return (
    <div
      className='TemplateCreationOverlay'
      style={{
        left: posX * props.canvasScale,
        top: posY * props.canvasScale,
        width: props.templateImage.width * props.canvasScale,
        height: props.templateImage.height * props.canvasScale,
        pointerEvents: 'none',
        display: 'block',
        outline: templateOutline
      }}
    >
      <div
        className='TemplateCreationOverlay__image'
        style={{
          backgroundImage: `url(${props.templateImage.image})`,
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div
        className='TemplateCreationOverlay__close Text__medium'
        onClick={closeOverlay}
      >
        X
      </div>
    </div>
  );
};

export default TemplateCreationOverlay;
