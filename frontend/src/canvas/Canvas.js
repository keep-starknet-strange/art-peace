
import React, { useCallback, useRef, useEffect, useState } from 'react'
import { select, zoom, zoomIdentity } from "d3"
import useWebSocket, { ReadyState } from 'react-use-websocket'
import './Canvas.css';
// import TemplateOverlay from './TemplateOverlay.js';
import canvasConfig from "../configs/canvas.config.json";
import backendConfig from "../configs/backend.config.json";


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
  const width = canvasConfig.canvas.width;
  const height = canvasConfig.canvas.height;
  const staticColors = canvasConfig.colors;

  const [colors, setColors] = useState([]);
  const [setupColors, setSetupColors] = useState(false);

  useEffect(() => {
    if (setupColors) {
      return;
    }
    let getColorsEndpoint = backendUrl + "/get-colors";
    fetch(getColorsEndpoint, { mode: "cors" }).then((response) => {
      response.json().then((data) => {
        let colors = [];
        for (let i = 0; i < data.length; i++) {
          colors.push(data[i].hex);
        }
        setColors(colors);
        setSetupColors(true);
      }).catch((error) => {
        setColors(staticColors);
        setSetupColors(true);
        console.error(error);
      });
    });
    // TODO: Return a cleanup function to close the websocket / ...
  }, [colors, backendUrl, staticColors, setupColors, setColors]);

  const WS_URL =
    "ws://" + backendConfig.host + ":" + backendConfig.port + "/ws";
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


  const draw = useCallback(
    (ctx, imageData) => {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      ctx.putImageData(imageData, 0, 0);
      // TODO: Use image-rendering for supported browsers?
    },
    [width, height]
  );

  useEffect(() => {
    if (!setupColors) {
      return;
    }
    if (setup) {
      return;
    }
    const canvas = props.canvasRef.current
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
      let imageDataArray = [];
      for (let i = 0; i < dataArray.length; i++) {
        const color = "#" + colors[dataArray[i]] + "FF";
        const [r, g, b, a] = color.match(/\w\w/g).map((x) => parseInt(x, 16));
        imageDataArray.push(r, g, b, a);
      }
      const uint8ClampedArray = new Uint8ClampedArray(imageDataArray);
      const imageData = new ImageData(uint8ClampedArray, width, height);
      draw(context, imageData);
      setSetup(true);
    }).catch((error) => {
      //TODO: Notifiy user of error
      console.error(error);
    });

    console.log("Connect to websocket");
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          channel: "general",
        },
      });
    }
    // TODO: Return a cleanup function to close the websocket / ...
  }, [
    readyState,
    sendJsonMessage,
    setup,
    colors,
    width,
    height,
    backendUrl,
    draw,
    setupColors,
  ]);

  const colorPixel = useCallback((position, color) => {
    const canvas = props.canvasRef.current
    const context = canvas.getContext('2d')
    const x = position % width
    const y = Math.floor(position / width)
    const colorIdx = color
    const colorHex = "#" + colors[colorIdx] + "FF"
    context.fillStyle = colorHex
    context.fillRect(x, y, 1, 1)
  }, [colors, width])

  const colorExtraPixel = useCallback((position, color) => {
    const canvas = props.extraCanvasRef.current
    const context = canvas.getContext('2d')
    const x = position % width
    const y = Math.floor(position / width)
    const colorIdx = color
    const colorHex = "#" + colors[colorIdx] + "FF"
    context.fillStyle = colorHex
    context.fillRect(x, y, 1, 1)
  }, [colors, width])

  useEffect(() => {
    if (lastJsonMessage) {
      colorPixel(lastJsonMessage.position, lastJsonMessage.color)
    }
  }, [lastJsonMessage, colorPixel])

  const pixelSelect = useCallback((clientX, clientY) => {
    const canvas = props.canvasRef.current
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

    const position = y * width + x;
    let getPixelInfoEndpoint =
      backendUrl + "/getPixelInfo?position=" + position.toString();
    fetch(getPixelInfoEndpoint, {
      mode: "cors",
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        // TODO: Cache pixel info & clear cache on update from websocket
        // TODO: Dont query if hover select ( until 1s after hover? )
        props.setPixelPlacedBy(data);
      })
      .catch((error) => {
        console.error(error);
      });
    },
    [props, width, height, backendUrl]
  );

  const pixelClicked = (e) => {
    if (props.nftSelectionMode) {
      if (!nftSelectionStarted) {
        const canvas = props.canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
        const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return
        }
        setNftSelectionStartX(x)
        setNftSelectionStartY(y)
        setNftSelectionEndX(x+1)
        setNftSelectionEndY(y+1)
        setNftSelectionPositionX(x)
        setNftSelectionPositionY(y)
        setNftSelectionWidth(1)
        setNftSelectionHeight(1)
        setNftSelectionStarted(true)
        return
      } else {
        const canvas = props.canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
        const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return
        }
        setNftSelectionEndX(x+1)
        setNftSelectionEndY(y+1)
        if (nftSelectionEndX <= nftSelectionStartX) {
          setNftSelectionPositionX(nftSelectionEndX - 1)
          setNftSelectionWidth(nftSelectionStartX - nftSelectionEndX + 1)
        } else {
          setNftSelectionPositionX(nftSelectionStartX)
          setNftSelectionWidth(nftSelectionEndX - nftSelectionStartX)
        }
        if (nftSelectionEndY <= nftSelectionStartY) {
          setNftSelectionPositionY(nftSelectionEndY - 1)
          setNftSelectionHeight(nftSelectionStartY - nftSelectionEndY + 1)
        } else {
          setNftSelectionPositionY(nftSelectionStartY)
          setNftSelectionHeight(nftSelectionEndY - nftSelectionStartY)
        }
        console.log("Making NFT with position: ", nftSelectionPositionX, nftSelectionPositionY, nftSelectionWidth, nftSelectionHeight)

        // Mint NFT
        let mintNFTEndpoint = backendUrl + "/mint-nft-devnet"
        let nftPosition = nftSelectionPositionX + nftSelectionPositionY * width 
        let nftWidth = nftSelectionWidth
        let nftHeight = nftSelectionHeight
        fetch(mintNFTEndpoint, {
          mode: "cors",
          method: "POST",
          body: JSON.stringify({
            position: nftPosition.toString(),
            width: nftWidth.toString(),
            height: nftHeight.toString(),
          }),
        }).then(response => {
          return response.text()
        }).then(data => {
          console.log(data)
        }).catch(error => {
          console.error("Error minting nft")
          console.error(error)
        });

        setNftSelectionStarted(false)
        setNftSelectionPositionX(-1)
        setNftSelectionPositionY(-1)
        setNftSelectionWidth(0)
        setNftSelectionHeight(0)
        setNftSelectionStartX(0)
        setNftSelectionStartY(0)
        setNftSelectionEndX(0)
        setNftSelectionEndY(0)
        props.setNftSelectionMode(false)

        return
      }
    }

    if (props.templateCreationMode) {
      const canvas = props.canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
      const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return
      }

      let templatePosition = x + y * width
      // TODO: Template preview

      props.setTemplateImagePositionX(x)
      props.setTemplateImagePositionY(y)
      props.setTemplateImagePosition(templatePosition)
      props.setTemplatePlacedMode(true)
      props.setTemplateCreationMode(false)
      return
    }

    pixelSelect(e.clientX, e.clientY)
    if (props.selectedColorId === -1) {
      return;
    }
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return;
    }

    if (props.extraPixels > 0) {
      // TODO: allow overwrite on all pixels used
      if (props.extraPixelsUsed < props.extraPixels) {
        props.addExtraPixel(props.selectedPositionX, props.selectedPositionY)
        colorExtraPixel(props.selectedPositionX + props.selectedPositionY * width, props.selectedColorId)
        return
      } else {
        // TODO: Notify user of no more extra pixels
        return
      }
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
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("Error placing pixel");
        console.error(error);
      });
    props.clearPixelSelection();
    props.setSelectedColorId(-1);
    // TODO: Optimistic update


  }

  // TODO: Deselect pixel when clicking outside of color palette or pixel
  // TODO: Show small position vec in bottom right corner of canvas
  const getSelectedColor = () => {
    console.log(
      props.selectedColorId,
      props.selectedPositionX,
      props.selectedPositionY
    );
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null;
    }
    if (props.selectedColorId === -1) {
      return null;
    }
    return "#" + colors[props.selectedColorId] + "FF";
  };

  const getSelectorsColor = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null;
    }
    if (props.selectedColorId === -1) {
      let color = canvasRef.current
        .getContext("2d")
        .getImageData(
          props.selectedPositionX,
          props.selectedPositionY,
          1,
          1
        ).data;
      return (
        "#" +
        color[0].toString(16).padStart(2, "0") +
        color[1].toString(16).padStart(2, "0") +
        color[2].toString(16).padStart(2, "0") +
        color[3].toString(16).padStart(2, "0")
      );
    }
    return "#" + colors[props.selectedColorId] + "FF";
  };

  const getSelectorsColorInverse = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null;
    }
    if (props.selectedColorId === -1) {
      let color = canvasRef.current
        .getContext("2d")
        .getImageData(
          props.selectedPositionX,
          props.selectedPositionY,
          1,
          1
        ).data;
      return (
        "#" +
        (255 - color[0]).toString(16).padStart(2, "0") +
        (255 - color[1]).toString(16).padStart(2, "0") +
        (255 - color[2]).toString(16).padStart(2, "0") +
        color[3].toString(16).padStart(2, "0")
      );
    }
    return "#" + colors[props.selectedColorId] + "FF";
  };

  // TODO
  //const templateImage = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 4, 3]
  //const templateWidth = 4
  //const templatePositionX = 13
  //const templatePositionY = 13
  //<TemplateOverlay templateImage={templateImage} templateWidth={templateWidth} templatePositionX={templatePositionX} templatePositionY={templatePositionY} colors={colors} />

  // TODO
  // TODO: setup nft selection mode func w/ stop pixel selection
  const [nftSelectionPositionX, setNftSelectionPositionX] = useState(-1)
  const [nftSelectionPositionY, setNftSelectionPositionY] = useState(-1)
  const [nftSelectionWidth, setNftSelectionWidth] = useState(0)
  const [nftSelectionHeight, setNftSelectionHeight] = useState(0)
  const [nftSelectionStartX, setNftSelectionStartX] = useState(0)
  const [nftSelectionStartY, setNftSelectionStartY] = useState(0)
  const [nftSelectionEndX, setNftSelectionEndX] = useState(0)
  const [nftSelectionEndY, setNftSelectionEndY] = useState(0)
  const [nftSelectionStarted, setNftSelectionStarted] = useState(false)

  useEffect(() => {
    const setFromEvent = (e) => {
      if (props.nftSelectionMode) {
        if (!nftSelectionStarted) {
          const canvas = props.canvasRef.current
          const rect = canvas.getBoundingClientRect()
          const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
          const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
          if (x < 0 || x >= width || y < 0 || y >= height) {
            return
          }
          setNftSelectionStartX(x)
          setNftSelectionStartY(y)
          setNftSelectionEndX(x+1)
          setNftSelectionEndY(y+1)
          setNftSelectionPositionX(x)
          setNftSelectionPositionY(y)
          setNftSelectionWidth(1)
          setNftSelectionHeight(1)
          return
        } else {
          const canvas = props.canvasRef.current
          const rect = canvas.getBoundingClientRect()
          const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
          const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
          if (x < 0 || x >= width || y < 0 || y >= height) {
            return
          }
          setNftSelectionEndX(x+1)
          setNftSelectionEndY(y+1)
          if (nftSelectionEndX <= nftSelectionStartX) {
            setNftSelectionPositionX(nftSelectionEndX - 1)
            setNftSelectionWidth(nftSelectionStartX - nftSelectionEndX + 1)
          } else {
            setNftSelectionPositionX(nftSelectionStartX)
            setNftSelectionWidth(nftSelectionEndX - nftSelectionStartX)
          }
          if (nftSelectionEndY <= nftSelectionStartY) {
            setNftSelectionPositionY(nftSelectionEndY - 1)
            setNftSelectionHeight(nftSelectionStartY - nftSelectionEndY + 1)
          } else {
            setNftSelectionPositionY(nftSelectionStartY)
            setNftSelectionHeight(nftSelectionEndY - nftSelectionStartY)
          }
          return
        }
      }
      if (props.templateCreationMode) {
        const canvas = props.canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * width)
        const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * height)
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return
        }
        // TODO: Stop template overflows
        props.setTemplateImagePositionX(x)
        props.setTemplateImagePositionY(y)
        return
      }

      if (props.selectedColorId === -1) {
        return;
      }
      pixelSelect(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", setFromEvent);

    return () => {
      window.removeEventListener("mousemove", setFromEvent);
    };
  }, [props.selectedColorId, pixelSelect, props.nftSelectionMode, nftSelectionStarted, nftSelectionPositionX, nftSelectionPositionY, nftSelectionWidth, nftSelectionHeight, height, width, props.canvasRef, nftSelectionEndX, nftSelectionEndY, nftSelectionStartX, nftSelectionStartY]);

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
          <canvas ref={props.canvasRef} className="Canvas" onClick={pixelClicked}/>
          { props.extraPixels > 0 && (
            <canvas ref={props.extraCanvasRef} className="Canvas__extras" onClick={pixelClicked} width={width} height={height} />
          )}
          { props.nftSelectionMode && (
            <div className="Canvas__nftSelection" style={{left: nftSelectionPositionX, top: nftSelectionPositionY, width: nftSelectionWidth, height: nftSelectionHeight, pointerEvents: 'none', display: (nftSelectionWidth === 0 && nftSelectionHeight== 0 ? 'none' : 'block')}}>
            </div>
          )}
          { (props.templateCreationMode || props.templatePlacedMode) && (
            <img src={props.templateImage} alt="Template" className="Canvas__template" style={{top: props.templateImagePositionY, left: props.templateImagePositionX, pointerEvents: 'none'}} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
