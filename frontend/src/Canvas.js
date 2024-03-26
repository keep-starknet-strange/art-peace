import React, { useRef, useEffect } from 'react'
import './Canvas.css';

const Canvas = props => {
  
  const canvasRef = useRef(null)

  const width = 50
  const height = 50
  const colors = ['#556270FF', '#4ECDC4FF', '#C7F464FF', '#FF6B6BFF', '#C44D58FF']
  let idx = 0
  let imageDataArray = []
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const random = Math.random()
      const color = colors[(idx + Math.floor(random * (colors.length - idx))) % colors.length]
      const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
      imageDataArray.push(r, g, b, a)
      idx++
    }
  }
  const uint8ClampedArray = new Uint8ClampedArray(imageDataArray)
  const imageData = new ImageData(uint8ClampedArray, width, height)

  const draw = ctx => {
    ctx.fillStyle = 'green'
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.putImageData(imageData, 0, 0)
    // TODO: Use image-rendering for supported browsers?
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    draw(context)
  }, [draw])
  
  return (
    <div className="Canvas-position">
    <div className="Canvas-control">
        <canvas ref={canvasRef} {...props} className="Canvas"/>
    </div>
    </div>
  );
}

export default Canvas
