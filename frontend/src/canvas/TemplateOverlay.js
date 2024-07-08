import React, { useEffect } from 'react';
import canvasConfig from '../configs/canvas.config.json';
import './TemplateOverlay.css';

const TemplateOverlay = (props) => {
  const [posx, setPosx] = React.useState(0);
  const [posy, setPosy] = React.useState(0);
  useEffect(() => {
    setPosx(props.overlayTemplate.position % canvasConfig.canvas.width);
    setPosy(
      Math.floor(props.overlayTemplate.position / canvasConfig.canvas.width)
    );
  }, [props.overlayTemplate]);

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
  }, [props.overlayTemplate.image, props.canvasScale]);

  const closeOverlay = () => {
    props.setOverlayTemplate(null);
    props.setTemplateOverlayMode(false);
  };

  return (
    <div
      className='TemplateOverlay'
      style={{
        left: posx * props.canvasScale,
        top: posy * props.canvasScale,
        width: props.overlayTemplate.width * props.canvasScale,
        height: props.overlayTemplate.height * props.canvasScale,
        pointerEvents: 'none',
        display: 'block',
        outline: templateOutline
      }}
    >
      <div
        className='TemplateOverlay__image'
        style={{
          backgroundImage: `url(${props.overlayTemplate.image})`,
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div
        className='TemplateOverlay__close Text__medium'
        onClick={closeOverlay}
      >
        X
      </div>
    </div>
  );
};

export default TemplateOverlay;
