import React, { useRef, useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './Canvas.css';
import canvasConfig from "./canvas.config.json"

const Canvas = props => {
  
  const canvasRef = useRef(null)

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
  

  //let idx = 0
  //let imageDataArray = []
  //for (let i = 0; i < width; i++) {
  //  for (let j = 0; j < height; j++) {
  //    const random = Math.random()
  //    const color = colors[(idx + Math.floor(random * (colors.length - idx))) % colors.length]
  //    const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
  //    imageDataArray.push(r, g, b, a)
  //    idx++
  //  }
  //}
  //const uint8ClampedArray = new Uint8ClampedArray(imageDataArray)
  //const imageData = new ImageData(uint8ClampedArray, width, height)
  
  //const socket = new WebSocket('ws://localhost:8080/ws');

  //socket.addEventListener('open', function (event) {
  //  console.log("Connected to websocket")
  //  socket.send('Hello Server!');
  //});

  //socket.addEventListener('message', (event) => {
  //  console.log('Message from server ', event.data);
  //  // Parse event.data as JSON
  //  const data = JSON.parse(event.data)
  //  console.log(data)
  //  const x = Math.floor(data.position / width)
  //  const y = data.position % width
  //  const colorIdx = data.color
  //  console.log(x, y, colorIdx)
  //  const canvas = canvasRef.current
  //  const context = canvas.getContext('2d')
  //  const color = colors[colorIdx]
  //  //const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
  //  context.fillStyle = color
  //  context.fillRect(x, y, 1, 1)
  //  console.log("Pixel colored")
  //});

  const [setup, setSetup] = useState(false)
  const [colorSelectorMode, setColorSelectorMode] = useState(false)
  const [selectedPositionX, setSelectedPositionX] = useState(null)
  const [selectedPositionY, setSelectedPositionY] = useState(null)
  const [pixelPlacedBy, setPixelPlacedBy] = useState("")

  const draw = (ctx, imageData) => {
    // ctx.fillStyle = 'green'
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
      console.log("Got response")
      console.log(response)
      return response.arrayBuffer()
    }).then(data => {
      console.log("Got data")
      console.log(data.byteLength)
      let colorData = new Uint8Array(data, 0, data.byteLength)
      let dataArray = []
      // Data encoded as list of 5 bit values, unpack into dataArray
      // TODO: Think about edge cases
      // 8 * 5 = 40 / 8 = 5 bytes
      let bitwidth = canvasConfig.colors_bitwidth
      let oneByteBitOffset = 8 - bitwidth
      let twoByteBitOffset = 16 - bitwidth
      for (let bitPos = 0; bitPos < data.byteLength * 8; bitPos += bitwidth) {
        let bytePos = Math.floor(bitPos / 8)
        let bitOffset = bitPos % 8
        //if (dataArray.length < 10) {
        //  console.log(dataArray.length, bytePos, bitOffset, data.charCodeAt(bytePos), data.charCodeAt(bytePos + 1))
        //}
        if (bitOffset <= oneByteBitOffset) {
          //let byte = data.charCodeAt(bytePos);
          let byte = colorData[bytePos]
          let value = (byte >> (oneByteBitOffset - bitOffset)) & 0b11111
          dataArray.push(value)
        } else {
          //let byte = data.charCodeAt(bytePos) << 8 | data.charCodeAt(bytePos + 1)
          let byte = colorData[bytePos] << 8 | colorData[bytePos + 1]
          let value = (byte >> (twoByteBitOffset - bitOffset)) & 0b11111
          dataArray.push(value)
        }
      }
      console.log(dataArray)
      let imageDataArray = []
      for (let i = 0; i < dataArray.length; i++) {
        const color = "#" + colors[dataArray[i]] + "FF"
        console.log(color, dataArray[i], i, colors)
        const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
        imageDataArray.push(r, g, b, a)
      }
      const uint8ClampedArray = new Uint8ClampedArray(imageDataArray)
      const imageData = new ImageData(uint8ClampedArray, width, height)
      draw(context, imageData)
      setSetup(true)
    });
    //draw(context)
    console.log("Connect to websocket")
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          channel: "general",
        },
      })
    }
  }, [draw, readyState])

  useEffect(() => {
    console.log(`Got a new message: ${lastJsonMessage}`)
    if (lastJsonMessage) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      console.log(lastJsonMessage)
      const x = lastJsonMessage.position % width
      const y = Math.floor(lastJsonMessage.position / width)
      const colorIdx = lastJsonMessage.color
      console.log(x, y, colorIdx)
      const color = "#" + colors[colorIdx] + "FF"
      //const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
      context.fillStyle = color
      context.fillRect(x, y, 1, 1)
    }
  }, [lastJsonMessage])

  const pixelClicked = (e) => {
    console.log("Coloring pixel")
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
    const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
    console.log(x, y)
    setSelectedPositionX(x)
    setSelectedPositionY(y)
    setColorSelectorMode(true)

    const position = y * width + x
    fetch('http://localhost:8080/getPixelInfo?position=' + position.toString(), {
      mode: 'cors'
    }).then(response => {
      console.log("Got response")
      console.log(response)
      return response.text()
    }).then(data => {
      console.log("Got data")
      console.log(data)
      setPixelPlacedBy(data)
    }).catch(error => {
      console.error("Error getting pixel info")
      console.error(error)
    });

    // TODO: Create a border around the selected pixel
  }

  const colorPixel = (e) => {
    // Get index of color through key on div
    let colorIdx = e.target.id
    let x = selectedPositionX
    let y = selectedPositionY
    console.log(x, y, colorIdx)
    setColorSelectorMode(false)
    setSelectedPositionX(null)
    setSelectedPositionY(null)
    //const color = colors[colorIdx]
    //const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16))
    //context.fillStyle = color
    //context.fillRect(x, y, 1, 1)
    // Read the contract address from the environment ART_PEACE_CONTRACT_ADDRESS
    const contractAddr = process.env.REACT_APP_ART_PEACE_CONTRACT_ADDRESS
    console.log("Contract address: " + contractAddr)
    fetch('http://localhost:8080/placePixelDevnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({contract: contractAddr, x: x.toString(), y: y.toString(), color: colorIdx.toString()})
    }).then(response => {
      console.log("Got response")
      console.log(response)
      return response.text()
    }).then(data => {
      console.log("Got data")
      console.log(data)
    }).catch(error => {
      console.error("Error placing pixel")
      console.error(error)
    });
  }
  
  return (
    <div className="Canvas-position">
    <div className="Canvas-control">
        <canvas ref={canvasRef} {...props} className="Canvas" onClick={pixelClicked}/>
    { colorSelectorMode && (
    <div className="color-palette" >
      <div className="color-palette-title">
        <p>Choose a color</p>
        <p>Last Placed by :</p>
        <p style={{color: "red", overflowWrap: "break-word", wordWrap: "break-word", whiteSpace: "pre-wrap", width: "10px", textAlign: "center"}}
      >0x{pixelPlacedBy}</p>
      </div>
      {colors.map((color, idx) => (
        <div key={idx} id={idx} className="color" style={{backgroundColor: "#" + color + "FF"}} onClick={colorPixel}></div>
      ))}
    </div>
    )}
    </div>
    </div>
  );
}

export default Canvas
