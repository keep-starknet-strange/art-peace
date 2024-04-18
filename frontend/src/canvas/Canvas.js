import React, { useCallback, useRef, useEffect, useState } from 'react'
import { select, zoom, zoomIdentity } from "d3"
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './Canvas.css';
// import TemplateOverlay from './TemplateOverlay.js';
import canvasConfig from "../configs/canvas.config.json"
import backendConfig from "../configs/backend.config.json"

const Canvas = props => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port
  //TODO: Pressing "Canvas" resets the view / positioning
  //TODO: Way to configure tick rates to give smooth xp for all users

  //Todo: Make this dynamic
  const minScale = 1;
  const maxScale = 40;


  const canvasRef = useRef(null)
  const canvasPositionRef = useRef(null)
  const canvasScaleRef = useRef(null)

  // Read canvas config from environment variable file json
  const width = canvasConfig.canvas.width
  const height = canvasConfig.canvas.height
  const colors = canvasConfig.colors

  const WS_URL = "ws://" + backendConfig.host + ":" + backendConfig.port + "/ws"
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    },
  )

  // TODO: Weird positioning behavior when clicking into devtools
  useEffect(() => {
    const canvas = select(canvasPositionRef.current)
    const Dzoom = zoom().scaleExtent([minScale, maxScale]).on("zoom", zoomHandler)

    // Set default zoom level and center the canvas
    canvas
      .call(Dzoom)
      .call(Dzoom.transform, zoomIdentity.translate(0, 0).scale(4))

    return () => {
      canvas.on(".zoom", null); // Clean up zoom event listeners
    };
  }, []);

  const zoomHandler = (event) => {
    const ele = canvasScaleRef.current
    const {
      k: newScale,
      x: newCanvasPositionX,
      y: newCanvasPositionY,
    } = event.transform;
    const transformValue = `translate(${newCanvasPositionX}px, ${newCanvasPositionY}px) scale(${newScale})`
    ele.style.transform = transformValue
  }

  const [setup, setSetup] = useState(false)

  const draw = useCallback((ctx, imageData) => {
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.putImageData(imageData, 0, 0)
    // TODO: Use image-rendering for supported browsers?
  }, [width, height])

  useEffect(() => {
    if (setup) {
      return
    }
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    let getCanvasEndpoint = backendUrl + "/getCanvas"
    fetch(getCanvasEndpoint, { mode: 'cors' }).then(response => {
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
          let byte = (colorData[bytePos] << 8) | colorData[bytePos + 1]
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
    }).catch(error => {
      //TODO: Notifiy user of error
      console.error(error)
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
  }, [readyState, sendJsonMessage, setup, colors, width, height, backendUrl, draw])

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
  }, [lastJsonMessage, colors, width])

  const pixelSelect = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((clientX - rect.left) / (rect.right - rect.left) * width)
    const y = Math.floor((clientY - rect.top) / (rect.bottom - rect.top) * height)
    if (props.selectedColorId === -1 && props.pixelSelectedMode && props.selectedPositionX === x && props.selectedPositionY === y) {
      props.clearPixelSelection()
      return
    }
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return
    }
    props.setPixelSelection(x, y)

    const position = y * width + x
    let getPixelInfoEndpoint = backendUrl + "/getPixelInfo?position=" + position.toString()
    fetch(getPixelInfoEndpoint, {
      mode: 'cors'
    }).then(response => {
      return response.text()
    }).then(data => {
      // TODO: Cache pixel info & clear cache on update from websocket
      // TODO: Dont query if hover select ( until 1s after hover? )
      props.setPixelPlacedBy(data)
    }).catch(error => {
      console.error(error)
    });

  }, [props, width, height, backendUrl])

  const pixelClicked = (e) => {
    pixelSelect(e.clientX, e.clientY)
    if (props.selectedColorId === -1) {
      return
    }
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return
    }

    const position = props.selectedPositionX + props.selectedPositionY * width
    const colorIdx = props.selectedColorId
    let placePixelEndpoint = backendUrl + "/placePixelDevnet"
    fetch(placePixelEndpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        position: position.toString(),
        color: colorIdx.toString(),
      }),
    }).then(response => {
      return response.text()
    }).then(data => {
      console.log(data)
    }).catch(error => {
      console.error("Error placing pixel")
      console.error(error)
    });
    props.clearPixelSelection()
    props.setSelectedColorId(-1)
    // TODO: Optimistic update
  }

  // TODO: Deselect pixel when clicking outside of color palette or pixel
  // TODO: Show small position vec in bottom right corner of canvas
  const getSelectedColor = () => {
    console.log(props.selectedColorId, props.selectedPositionX, props.selectedPositionY)
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null
    }
    if (props.selectedColorId === -1) {
      return null
    }
    return "#" + colors[props.selectedColorId] + "FF"
  }

  const getSelectorsColor = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null
    }
    if (props.selectedColorId === -1) {
      let color = canvasRef.current.getContext('2d').getImageData(props.selectedPositionX, props.selectedPositionY, 1, 1).data
      return "#" + color[0].toString(16).padStart(2, '0') + color[1].toString(16).padStart(2, '0') + color[2].toString(16).padStart(2, '0') + color[3].toString(16).padStart(2, '0')
    }
    return "#" + colors[props.selectedColorId] + "FF"
  }

  const getSelectorsColorInverse = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null
    }
    if (props.selectedColorId === -1) {
      let color = canvasRef.current.getContext('2d').getImageData(props.selectedPositionX, props.selectedPositionY, 1, 1).data
      return "#" + (255 - color[0]).toString(16).padStart(2, '0') + (255 - color[1]).toString(16).padStart(2, '0') + (255 - color[2]).toString(16).padStart(2, '0') + color[3].toString(16).padStart(2, '0')
    }
    return "#" + colors[props.selectedColorId] + "FF"
  }

  useEffect(() => {
    const setFromEvent = (e) => {
      if (props.selectedColorId === -1) {
        return
      }
      pixelSelect(e.clientX, e.clientY)
    };
    window.addEventListener("mousemove", setFromEvent);

    return () => {
      window.removeEventListener("mousemove", setFromEvent);
    };
  }, [props.selectedColorId, pixelSelect]);

  // TODO
  //const templateImage = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 4, 3]
  //const templateWidth = 4
  //const templatePositionX = 13
  //const templatePositionY = 13
  //<TemplateOverlay templateImage={templateImage} templateWidth={templateWidth} templatePositionX={templatePositionX} templatePositionY={templatePositionY} colors={colors} />

  // TODO: both place options
  return (
    <div className="Canvas__container">
      <div ref={canvasPositionRef} className="Canvas__position">
        <div ref={canvasScaleRef} className="Canvas__scale">
          {props.pixelSelectedMode && (
            <div className="Canvas__selected" style={{ left: props.selectedPositionX, top: props.selectedPositionY }}>
              <div className="Canvas__selected__pixel" style={{ backgroundColor: getSelectorsColor(), boxShadow: `0 0 .2px .1px ${getSelectorsColorInverse()} inset` }}></div>
            </div>
          )}
          <canvas ref={canvasRef} className="Canvas" onClick={pixelClicked} />
        </div>
      </div>
    </div>
  );
}

export default Canvas
