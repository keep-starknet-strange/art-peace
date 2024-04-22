package routes

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitIndexerRoutes() {
	http.HandleFunc("/consumeIndexerMsg", consumeIndexerMsg)
}

// TODO: Clean up
// Message layout
/*
{
  "data": {
    "cursor": {
      "orderKey": 3,
      "uniqueKey": "0x050d47ba775556cd86577692d31a38422af66471dcb85edaea33cde70bfc156c"
    },
    "end_cursor": {
      "orderKey": 4,
      "uniqueKey": "0x03b2711fe29eba45f2a0250c34901d15e37b495599fac1a74960a09cc83e1234"
    },
    "finality": "DATA_STATUS_ACCEPTED",
    "batch": [
      {
        "status": "BLOCK_STATUS_ACCEPTED_ON_L2",
        "events": [
          {
            "event": {
              "fromAddress": "0x0474642f7f488d4b49b6e892f3e4a5407c6ad5fe065687f2ebe4e0f7c1309860",
              "keys": [
                "0x02d7b50ebf415606d77c7e7842546fc13f8acfbfd16f7bcf2bc2d08f54114c23",
                "0x0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0",
                "0x000000000000000000000000000000000000000000000000000000000000001e"
              ],
              "data": [
                "0x0000000000000000000000000000000000000000000000000000000000000001"
              ]
            }
          }
        ]
      }
    ]
  }
}
*/

const (
  pixelPlacedEvent   = "0x02d7b50ebf415606d77c7e7842546fc13f8acfbfd16f7bcf2bc2d08f54114c23"
  nftMintedEvent     = "0x030826e0cd9a517f76e857e3f3100fe5b9098e9f8216d3db283fb4c9a641232f"
  templateAddedEvent = "0x03e18ec266fe76a2efce73f91228e6e04456b744fc6984c7a6374e417fb4bf59"
)


// TODO: User might miss some messages between loading canvas and connecting to websocket?
func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("Error reading request body: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// TODO: Parse message fully, check block status, number, ...
	reqBody := map[string]interface{}{}
	err = json.Unmarshal(requestBody, &reqBody)
	if err != nil {
		fmt.Println("Error unmarshalling request body: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

  events := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})

  for _, event := range events {
    eventKey := event.(map[string]interface{})["event"].(map[string]interface{})["keys"].([]interface{})[0].(string)
    if eventKey == pixelPlacedEvent {
      processPixelPlacedEvent(event.(map[string]interface{}), w)
    } else if eventKey == nftMintedEvent {
      processNFTMintedEvent(event.(map[string]interface{}), w)
    } else if eventKey == templateAddedEvent {
      processTemplateAddedEvent(event.(map[string]interface{}), w)
    } else {
      fmt.Println("Unknown event key: ", eventKey)
    }
  }
}

func processPixelPlacedEvent(event map[string]interface{}, w http.ResponseWriter) {
	address := event["event"].(map[string]interface{})["keys"].([]interface{})[1]
	address = address.(string)[2:]
	posHex := event["event"].(map[string]interface{})["keys"].([]interface{})[2]
	dayIdxHex := event["event"].(map[string]interface{})["keys"].([]interface{})[3]
	colorHex := event["event"].(map[string]interface{})["data"].([]interface{})[0]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex.(string), 0, 64)
	if err != nil {
		fmt.Println("Error converting position hex to int: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	dayIdx, err := strconv.ParseInt(dayIdxHex.(string), 0, 64)
	if err != nil {
		fmt.Println("Error converting day index hex to int: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	color, err := strconv.ParseInt(colorHex.(string), 0, 64)
	if err != nil {
		fmt.Println("Error converting color hex to int: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	fmt.Println("Pixel indexed with position: ", position, " and color: ", color)

	// Set pixel in redis
	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
	if err != nil {
		panic(err)
	}

	// Set pixel in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)", address, position, dayIdx, color)
	if err != nil {
		fmt.Println("Error inserting pixel into postgres: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Send message to all connected clients
	var message = map[string]interface{}{
		"position": position,
		"color":    color,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Error marshalling message: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	for idx, conn := range core.ArtPeaceBackend.WSConnections {
		if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			fmt.Println(err)
			// TODO: Should we always remove connection?
			// Remove connection
			conn.Close()
			core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections[:idx], core.ArtPeaceBackend.WSConnections[idx+1:]...)
		}
	}
}

/*
indexer-1   | [
indexer-1   |   [Object: null prototype] {
indexer-1   |     event: [Object: null prototype] {
indexer-1   |       fromAddress: "0x07163dbc0d5dc7e65c8fb9697dbd778e70fa9fef66f12a018a69751eb53fec5a",
indexer-1   |       keys: [
indexer-1   |         "0x030826e0cd9a517f76e857e3f3100fe5b9098e9f8216d3db283fb4c9a641232f",
indexer-1   |         "0x0000000000000000000000000000000000000000000000000000000000000000",
indexer-1   |         "0x0000000000000000000000000000000000000000000000000000000000000000"
indexer-1   |       ],
indexer-1   |       data: [
indexer-1   |         "0x0000000000000000000000000000000000000000000000000000000000000091",
indexer-1   |         "0x000000000000000000000000000000000000000000000000000000000000000e",
indexer-1   |         "0x000000000000000000000000000000000000000000000000000000000000000d",
indexer-1   |         "0x0000000000000000000000000000000000000000000000000000000000000000",
indexer-1   |         "0x0000000000000000000000000000000000000000000000000000000000000006",
indexer-1   |         "0x0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0"
indexer-1   |       ],
indexer-1   |       index: "1"
indexer-1   |     }
indexer-1   |   }
indexer-1   | ]
*/

func processNFTMintedEvent(event map[string]interface{}, w http.ResponseWriter) {
  // TODO: combine high and low token ids
	tokenIdLowHex := event["event"].(map[string]interface{})["keys"].([]interface{})[1]
	tokenIdHighHex := event["event"].(map[string]interface{})["keys"].([]interface{})[2]

  positionHex := event["event"].(map[string]interface{})["data"].([]interface{})[0]
  widthHex := event["event"].(map[string]interface{})["data"].([]interface{})[1]
  heightHex := event["event"].(map[string]interface{})["data"].([]interface{})[2]
  imageHashHex := event["event"].(map[string]interface{})["data"].([]interface{})[3]
  blockNumberHex := event["event"].(map[string]interface{})["data"].([]interface{})[4]
  minterHex := event["event"].(map[string]interface{})["data"].([]interface{})[5]

  fmt.Println("NFT minted with token id low: ", tokenIdLowHex, " and token id high: ", tokenIdHighHex)

  tokenId, err := strconv.ParseInt(tokenIdLowHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting token id low hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  position, err := strconv.ParseInt(positionHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting position hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  width, err := strconv.ParseInt(widthHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting width hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  height, err := strconv.ParseInt(heightHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting height hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  blockNumber, err := strconv.ParseInt(blockNumberHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting block number hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  minter := minterHex.(string)[2:]

  fmt.Println("NFT minted with position: ", position, " width: ", width, " height: ", height, " image hash: ", imageHashHex, " block number: ", blockNumber, " minter: ", minter, "tokenId", tokenId)
  // Set NFT in postgres
  _, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTs (key, position, width, height, imageHash, blockNumber, minter) VALUES ($1, $2, $3, $4, $5, $6, $7)", tokenId, position, width, height, imageHashHex, blockNumber, minter)
  if err != nil {
    fmt.Println("Error inserting NFT into postgres: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  // TODO: get image from canvas through starknet rpc? What to do about pending transactions?

  // Load image from redis
  ctx := context.Background()
  // TODO: Better way to get image
  canvas, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
  if err != nil {
    panic(err)
  }

  colorPaletteHex := core.ArtPeaceBackend.CanvasConfig.Colors
  colorPalette := make([]color.RGBA, len(colorPaletteHex))
  for idx, colorHex := range colorPaletteHex {
    r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
    if err != nil {
      fmt.Println("Error converting red hex to int: ", err)
      w.WriteHeader(http.StatusInternalServerError)
      return
    }
    g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
    if err != nil {
      fmt.Println("Error converting green hex to int: ", err)
      w.WriteHeader(http.StatusInternalServerError)
      return
    }
    b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
    if err != nil {
      fmt.Println("Error converting blue hex to int: ", err)
      w.WriteHeader(http.StatusInternalServerError)
      return
    }
    colorPalette[idx] = color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}
  }
  bitWidth := int64(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth)
  startX := int64(position % int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width))
  startY := int64(position / int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width))
  oneByteBitOffset := int64(8 - bitWidth)
  twoByteBitOffset := int64(16 - bitWidth)
  generatedImage := image.NewRGBA(image.Rect(0, 0, int(width), int(height)))
  for y := startY; y < startY+height; y++ {
    for x := startX; x < startX+width; x++ {
      pos := y*int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width) + x
      bitPos := pos * bitWidth
      bytePos := bitPos / 8
      bitOffset := bitPos % 8
      if bitOffset <= oneByteBitOffset {
        colorIdx := (canvas[bytePos] >> (oneByteBitOffset - bitOffset)) & 0b11111
        generatedImage.Set(int(x-startX), int(y-startY), colorPalette[colorIdx])
      } else {
        colorIdx := (((uint16(canvas[bytePos]) << 8) | uint16(canvas[bytePos+1])) >> (twoByteBitOffset - bitOffset)) & 0b11111
        generatedImage.Set(int(x-startX), int(y-startY), colorPalette[colorIdx])
      }
    }
  }
  
  // TODO: Path to save image
  // Save image to disk
  filename := fmt.Sprintf("nft-%d.png", tokenId)
  file, err := os.Create(filename)
  if err != nil {
    fmt.Println("Error creating file: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  defer file.Close()

  err = png.Encode(file, generatedImage)
  if err != nil {
    fmt.Println("Error encoding image: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  w.WriteHeader(http.StatusOK)
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte("NFT minted"))
}

func processTemplateAddedEvent(event map[string]interface{}, w http.ResponseWriter) {
  templateIdHex := event["event"].(map[string]interface{})["keys"].([]interface{})[1]
  templateHashHex := event["event"].(map[string]interface{})["data"].([]interface{})[0]
  templateNameHex := event["event"].(map[string]interface{})["data"].([]interface{})[1]
  templatePositionHex := event["event"].(map[string]interface{})["data"].([]interface{})[2]
  templateWidthHex := event["event"].(map[string]interface{})["data"].([]interface{})[3]
  templateHeightHex := event["event"].(map[string]interface{})["data"].([]interface{})[4]
  // TODO: Combine low and high token ids
  templateRewardHighHex := event["event"].(map[string]interface{})["data"].([]interface{})[5]
  templateRewardLowHex := event["event"].(map[string]interface{})["data"].([]interface{})[6]
  templateRewardTokenHex := event["event"].(map[string]interface{})["data"].([]interface{})[7]

  fmt.Println("Template added with template id: ", templateIdHex, " template hash: ", templateHashHex, "reward: ", templateRewardLowHex, templateRewardHighHex, "name:", templateNameHex)

  templateId, err := strconv.ParseInt(templateIdHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting template id hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  // Parse template name hex as bytes encoded in utf-8
  decodedName, err := hex.DecodeString(templateNameHex.(string)[2:])
  if err != nil {
    fmt.Println("Error decoding template name hex: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  // Trim off 0s at the start
  trimmedName := []byte{}
  trimming := true
  for _, b := range decodedName {
    if b == 0 && trimming {
      continue
    }
    trimming = false
    trimmedName = append(trimmedName, b)
  }
  templateName := string(trimmedName)

  templatePosition, err := strconv.ParseInt(templatePositionHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting template position hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  templateWidth, err := strconv.ParseInt(templateWidthHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting template width hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  templateHeight, err := strconv.ParseInt(templateHeightHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting template height hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  templateReward, err := strconv.ParseInt(templateRewardLowHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting template reward hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  templateRewardToken := templateRewardTokenHex.(string)[2:]

  // Add template to postgres
  _, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Templates (key, name, hash, position, width, height, reward, rewardToken) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", templateId, templateName, templateHashHex, templatePosition, templateWidth, templateHeight, templateReward, templateRewardToken)
  if err != nil {
    fmt.Println("Error inserting template into postgres: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  w.WriteHeader(http.StatusOK)
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte("Template added"))
}
