import React, { useCallback, useRef, useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './Canvas.css';
import canvasConfig from "./canvas.config.json"

const Canvas = props => {
  // TODO: Pressing "Canvas" resets the view / positioning

  const [canvasPositionX, setCanvasPositionX] = useState(0)
  const [canvasPositionY, setCanvasPositionY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)

  const [canvasScale, setCanvasScale] = useState(6)
  const minScale = 1 // TODO: To config
  const maxScale = 40
  //TODO: Way to configure tick rates to give smooth xp for all users
  
  const canvasRef = useRef(null)
  const [pixelSelectedMode, setPixelSelectedMode] = useState(false)

  // Read canvas config from environment variable file json
  const width = canvasConfig.canvas.width
  const height = canvasConfig.canvas.height
  const colors = canvasConfig.colors

  const WS_URL = "ws://127.0.0.1:8080/ws"
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    },
  )
  
  // TODO: Weird positioning behavior when clicking into devtools

  // Handle wheel event for zooming
  const handleWheel = (e) => {
    let newScale = canvasScale
    if (e.deltaY < 0) {
      newScale = Math.min(maxScale, newScale + 0.2)
    } else {
      newScale = Math.max(minScale, newScale - 0.2)
    }
    // TODO: Smart positioning of canvas zoom ( zoom to center of mouse pointer )
    //let newCanvasPositionX = canvasPositionX
    //let newCanvasPositionY = canvasPositionY
    //const canvasOriginX = canvasPositionX + width / 2
    //const canvasOriginY = canvasPositionY + height / 2
    //setCanvasPositionX(newCanvasPositionX)
    //setCanvasPositionY(newCanvasPositionY)

    setCanvasScale(newScale)
  }

  const handlePointerDown = (e) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    setDragStartX(0)
    setDragStartY(0)
  }

  const handlePointerMove = (e) => {
    if (isDragging) {
      // TODO: Prevent dragging outside of canvas container
      setCanvasPositionX(canvasPositionX + e.clientX - dragStartX)
      setCanvasPositionY(canvasPositionY + e.clientY - dragStartY)
      setDragStartX(e.clientX)
      setDragStartY(e.clientY)
    }
  }

  useEffect(() => {
    document.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  const [setup, setSetup] = useState(false)
  const [selectedPositionX, setSelectedPositionX] = useState(null)
  const [selectedPositionY, setSelectedPositionY] = useState(null)
  const [pixelPlacedBy, setPixelPlacedBy] = useState("")

  const draw = (ctx, imageData) => {
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.putImageData(imageData, 0, 0)
    // TODO: Use image-rendering for supported browsers?
  }

  useEffect(() => {
    if (setup) {
      return
    }
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    fetch('http://localhost:8080/getCanvas', {mode: 'cors'}).then(response => {
      return response.arrayBuffer()
    }).then(data => {
      let colorData = new Uint8Array(data, 0, data.byteLength)
      let dataArray = []
      // TODO: Think about edge cases
      let bitwidth = canvasConfig.colors_bitwidth
      let oneByteBitOffset = 8 - bitwidth
      let twoByteBitOffset = 16 - bitwidth
      for (let bitPos = 0; bitPos < data.byteLength * 8; bitPos += bitwidth) {
        let bytePos = Math.floor(bitPos / 8)
        let bitOffset = bitPos % 8
        if (bitOffset <= oneByteBitOffset) {
          let byte = colorData[bytePos]
          let value = (byte >> (oneByteBitOffset - bitOffset)) & 0b11111
          dataArray.push(value)
        } else {
          let byte = colorData[bytePos] << 8 | colorData[bytePos + 1]
          let value = (byte >> (twoByteBitOffset - bitOffset)) & 0b11111
          dataArray.push(value)
        }
      }
      let imageDataArray = []
      for (let i = 0; i < dataArray.length; i++) {
        const color = "#" + colors[dataArray[i]] + "FF"
        const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
        imageDataArray.push(r, g, b, a)
      }
      const uint8ClampedArray = new Uint8ClampedArray(imageDataArray)
      const imageData = new ImageData(uint8ClampedArray, width, height)
      draw(context, imageData)
      setSetup(true)
    });

    console.log("Connect to websocket")
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          channel: "general",
        },
      })
    }
    // TODO: Return a cleanup function to close the websocket / ...
  }, [draw, readyState])

  useEffect(() => {
    if (lastJsonMessage) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      const x = lastJsonMessage.position % width
      const y = Math.floor(lastJsonMessage.position / width)
      const colorIdx = lastJsonMessage.color
      const color = "#" + colors[colorIdx] + "FF"
      //const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
      context.fillStyle = color
      context.fillRect(x, y, 1, 1)
    }
  }, [lastJsonMessage])

  const pixelSelect = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((clientX - rect.left) / (rect.right - rect.left) * width)
    const y = Math.floor((clientY - rect.top) / (rect.bottom - rect.top) * height)
    if (props.selectedColorId === -1 && pixelSelectedMode && selectedPositionX === x && selectedPositionY === y) {
      setPixelSelectedMode(false)
      setSelectedPositionX(null)
      setSelectedPositionY(null)
      return
    }
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return
    }
    setSelectedPositionX(x)
    setSelectedPositionY(y)
    setPixelSelectedMode(true)
    //setColorSelectorMode(true)

    const position = y * width + x
    fetch('http://localhost:8080/getPixelInfo?position=' + position.toString(), {
      mode: 'cors'
    }).then(response => {
      return response.text()
    }).then(data => {
      // TODO: not working
      // TODO: Cache pixel info & clear cache on update from websocket
      // TODO: Dont query if hover select ( until 1s after hover? )
      setPixelPlacedBy(data)
    }).catch(error => {
      console.error(error)
      //TODO: Handle error
    });

    // TODO: Create a border around the selected pixel
  }, [setSelectedPositionX, setSelectedPositionY, setPixelSelectedMode, setPixelPlacedBy, width, height, props.selectedColorId, pixelSelectedMode, selectedPositionX, selectedPositionY])

  const pixelClicked = (e) => {
    pixelSelect(e.clientX, e.clientY)
    if (props.selectedColorId === -1) {
      return
    }
    if (selectedPositionX === null || selectedPositionY === null) {
      return
    }
    const x = selectedPositionX
    const y = selectedPositionY
    const colorIdx = props.selectedColorId
    const contractAddr = process.env.REACT_APP_ART_PEACE_CONTRACT_ADDRESS
    fetch('http://localhost:8080/placePixelDevnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({contract: contractAddr, x: x.toString(), y: y.toString(), color: colorIdx.toString()})
    }).then(response => {
      return response.text()
    }).then(data => {
      console.log(data)
    }).catch(error => {
      console.error("Error placing pixel")
      console.error(error)
    });
    setPixelSelectedMode(false)
    props.setSelectedColorId(-1)
    // TODO: Optimistic update
  }
  
  // TODO: Deselect pixel when clicking outside of color palette or pixel
  // TODO: Show small position vec in bottom right corner of canvas
  const getSelectedColor = () => {
    if (selectedPositionX === null || selectedPositionY === null) {
      return null
    }
    if (props.selectedColorId === -1) {
      return null
    }
    return "#" + colors[props.selectedColorId] + "FF"
  }

  useEffect(() => {
    const setFromEvent = (e) => {
      if (props.selectedColorId === -1) {
        return
      }
      setPixelSelectedMode(true)
      pixelSelect(e.clientX, e.clientY)
    };
    window.addEventListener("mousemove", setFromEvent);

    return () => {
      window.removeEventListener("mousemove", setFromEvent);
    };
  }, [props.selectedColorId, pixelSelect]);

  // TODO: both place options
  return (
    <div className="Canvas__container" onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}>
      <div className="Canvas__position" style={{transform: `translate(${canvasPositionX}px, ${canvasPositionY}px )`}}>
        <div className="Canvas__scale" style={{transform: `scale(${canvasScale})`}}>
          { pixelSelectedMode && (
            <div className="Canvas__selected" style={{left: selectedPositionX, top: selectedPositionY}}>
              <div className="Canvas__selected__pixel" style={{backgroundColor: getSelectedColor()}}></div>
            </div>
          )}
          <canvas ref={canvasRef} className="Canvas" onClick={pixelClicked}/>
        </div>
      </div>
      { pixelSelectedMode && (
        <div className="Canvas__selected__menu">
          <p className="Canvas__selected__menu__exit" onClick={() => { setPixelSelectedMode(false); setSelectedPositionX(null); setSelectedPositionY(null); }}>X</p>
          <p className="Canvas__selected__menu__item">Pos &nbsp; : ({selectedPositionX}, {selectedPositionY})</p>
          <p className="Canvas__selected__menu__item Canvas__selected__menu__address">Owner : 0x{pixelPlacedBy}</p>
        </div>
      )}
    </div>
  );
}

export default Canvas
