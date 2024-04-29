package routes

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitIndexerRoutes() {
	http.HandleFunc("/consume-indexer-msg", consumeIndexerMsg)
}

type IndexerCursor struct {
	OrderKey  int    `json:"orderKey"`
	UniqueKey string `json:"uniqueKey"`
}

type IndexerEvent struct {
	Event struct {
		FromAddress string   `json:"fromAddress"`
		Keys        []string `json:"keys"`
		Data        []string `json:"data"`
	} `json:"event"`
}

type IndexerMessage struct {
	Data struct {
		Cursor    IndexerCursor `json:"cursor"`
		EndCursor IndexerCursor `json:"end_cursor"`
		Finality  string        `json:"finality"`
		Batch     []struct {
			Status string         `json:"status"`
			Events []IndexerEvent `json:"events"`
		} `json:"batch"`
	} `json:"data"`
}

const (
	pixelPlacedEvent   = "0x02d7b50ebf415606d77c7e7842546fc13f8acfbfd16f7bcf2bc2d08f54114c23"
	nftMintedEvent     = "0x030826e0cd9a517f76e857e3f3100fe5b9098e9f8216d3db283fb4c9a641232f"
	templateAddedEvent = "0x03e18ec266fe76a2efce73f91228e6e04456b744fc6984c7a6374e417fb4bf59"
	newDay             = "0x019cdbd24e137c00d1feb99cc0b48b86b676f6b69c788c7f112afeb8cd614c16"
)

// TODO: User might miss some messages between loading canvas and connecting to websocket?
// TODO: Check thread safety of these things
func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
	// TODO: only allow indexer to call this endpoint
	message, err := ReadJsonBody[IndexerMessage](r)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error reading indexer message")
		return
	}

	for _, event := range message.Data.Batch[0].Events {
		eventKey := event.Event.Keys[0]
		if eventKey == pixelPlacedEvent {
			processPixelPlacedEvent(event, w)
		} else if eventKey == nftMintedEvent {
			processNFTMintedEvent(event, w)
		} else if eventKey == templateAddedEvent {
			processTemplateAddedEvent(event, w)
		} else if eventKey == newDay {
			processNewDayEvent(event, w)
		} else {
			fmt.Println("Unknown event key: ", eventKey)
		}
	}
}

func processPixelPlacedEvent(event IndexerEvent, w http.ResponseWriter) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]
	dayIdxHex := event.Event.Keys[3]
	colorHex := event.Event.Data[0]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting position hex to int")
		return
	}

	//validate position
	maxPosition := int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width) * int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)

	// Perform comparison with maxPosition
	if position < 0 || position >= maxPosition {
		http.Error(w, "Position out of range", http.StatusBadRequest)
		return
	}

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting day index hex to int")
		return
	}
	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting color hex to int")
		return
	}
	//validate color
	colorsLength := len(core.ArtPeaceBackend.CanvasConfig.Colors)
	if int(color) < 0 || int(color) >= colorsLength {
		http.Error(w, "Color value exceeds bit width", http.StatusBadRequest)
		return
	}

	// Set pixel in redis
	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error setting pixel in redis")
		return
	}

	// Set pixel in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)", address, position, dayIdx, color)
	if err != nil {
		// TODO: Reverse redis operation?
		WriteErrorJson(w, http.StatusInternalServerError, "Error inserting pixel into postgres")
		return
	}

	// Send message to all connected clients
	var message = map[string]interface{}{
		"position": position,
		"color":    color,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error marshalling message")
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

	WriteResultJson(w, "Pixel placement indexed successfully")
}

func processNFTMintedEvent(event IndexerEvent, w http.ResponseWriter) {
	// TODO: combine high and low token ids
	tokenIdLowHex := event.Event.Keys[1]
	// TODO: tokenIdHighHex := event.Event.Keys[2]

	positionHex := event.Event.Data[0]
	widthHex := event.Event.Data[1]
	heightHex := event.Event.Data[2]
	imageHashHex := event.Event.Data[3]
	blockNumberHex := event.Event.Data[4]
	minter := event.Event.Data[5][2:] // Remove 0x prefix

	tokenId, err := strconv.ParseInt(tokenIdLowHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting token id low hex to int")
		return
	}

	position, err := strconv.ParseInt(positionHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting position hex to int")
		return
	}

	width, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting width hex to int")
		return
	}

	height, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting height hex to int")
		return
	}

	blockNumber, err := strconv.ParseInt(blockNumberHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting block number hex to int")
		return
	}

	// Set NFT in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTs (token_id, position, width, height, image_hash, block_number, minter) VALUES ($1, $2, $3, $4, $5, $6, $7)", tokenId, position, width, height, imageHashHex, blockNumber, minter)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error inserting NFT into postgres")
		return
	}

	// Load image from redis
	ctx := context.Background()
	canvas, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error getting canvas from redis")
		return
	}

	colorPaletteHex := core.ArtPeaceBackend.CanvasConfig.Colors
	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Error converting red hex to int when creating palette")
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Error converting green hex to int when creating palette")
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Error converting blue hex to int when creating palette")
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
		WriteErrorJson(w, http.StatusInternalServerError, "Error creating file")
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error encoding image")
		return
	}

	// TODO: Ws message to all clients

	WriteResultJson(w, "NFT mint indexed successfully")
}

func processTemplateAddedEvent(event IndexerEvent, w http.ResponseWriter) {
	templateIdHex := event.Event.Keys[1]
	templateHashHex := event.Event.Data[0]
	templateNameHex := event.Event.Data[1][2:] // Remove 0x prefix
	templatePositionHex := event.Event.Data[2]
	templateWidthHex := event.Event.Data[3]
	templateHeightHex := event.Event.Data[4]
	// TODO: Combine low and high token ids
	// templateRewardHighHex := event.Event.Data[5]
	templateRewardLowHex := event.Event.Data[6]
	templateRewardToken := event.Event.Data[7][2:] // Remove 0x prefix

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting template id hex to int")
		return
	}

	// Parse template name hex as bytes encoded in utf-8
	decodedName, err := hex.DecodeString(templateNameHex)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error decoding template name hex")
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

	templatePosition, err := strconv.ParseInt(templatePositionHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting template position hex to int")
		return
	}

	templateWidth, err := strconv.ParseInt(templateWidthHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting template width hex to int")
		return
	}

	templateHeight, err := strconv.ParseInt(templateHeightHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting template height hex to int")
		return
	}

	templateReward, err := strconv.ParseInt(templateRewardLowHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting template reward hex to int")
		return
	}

	// Add template to postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Templates (key, name, hash, position, width, height, reward, reward_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", templateId, templateName, templateHashHex, templatePosition, templateWidth, templateHeight, templateReward, templateRewardToken)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error inserting template into postgres")
		return
	}

	// TODO: Ws message to all clients

	WriteResultJson(w, "Template add indexed successfully")
}

func processNewDayEvent(event IndexerEvent, w http.ResponseWriter) {
	dayIdxHex := event.Event.Keys[1]
	dayStartTimeHex := event.Event.Data[0]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting day index hex to int")
		return
	}

	dayStartTime, err := strconv.ParseInt(dayStartTimeHex, 0, 64)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error converting day start time hex to int")
		return
	}

	// Set day in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Days (day_index, day_start) VALUES ($1, to_timestamp($2))", dayIdx, dayStartTime)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error inserting day into postgres")
		return
	}

	if dayIdx > 0 {
		// Update end time of previous day
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Days SET day_end = $1 WHERE day_index = $2", dayStartTime, dayIdx-1)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Error updating end time of previous day in postgres")
			return
		}
	}
}
