import React, { useRef, useState, useEffect } from 'react';
import './TemplateOverlay.css';

const TemplateOverlay = props => {

  const canvasRef = useRef(null)
  const [setup, setSetup] = useState(false)

  const templateImage = props.templateImage
  const width = props.templateWidth
  const height = templateImage.length / width
  const scaler = 8

  const draw = (ctx, imageData) => {
    ctx.canvas.width = width * scaler
    ctx.canvas.height = height * scaler
    ctx.putImageData(imageData, 0, 0)
    // TODO: Use image-rendering for supported browsers?
  }

  useEffect(() => {
    if (setup) {
      return
    }
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    let imageDataArray = []
    for (let i = 0; i < height * scaler; i++) {
      for (let j = 0; j < width * scaler; j++) {
        if (i % scaler !== 0 && j % scaler !== 0 && i % scaler !== scaler - 1 && j % scaler !== scaler - 1) {
          imageDataArray.push(0, 0, 0, 0)
          continue
        }
        let index = Math.floor(i / scaler) * width + Math.floor(j / scaler)
        // TODO: Transparent pixels should be transparent
        const color = "#" + props.colors[templateImage[index]] + "FF"
        const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
        imageDataArray.push(r, g, b, a)
      }
    }
    const uint8ClampedArray = new Uint8ClampedArray(imageDataArray)
    const imageData = new ImageData(uint8ClampedArray, width * scaler, height * scaler)
    draw(context, imageData)
    setSetup(true)
  }, [setup, templateImage, width, height, props.colors, draw])

  return (
    <div className="TemplateOverlay" style={{top: props.templatePositionY, left: props.templatePositionX, width: `${width}px`, height: `${height}px`}}>
      <canvas className="TemplateOverlay__template" ref={canvasRef}>
      </canvas>
      <div className="TemplateOverlay__close" onClick={props.onClose}>X</div>
    </div>
  );
}

export default TemplateOverlay;
