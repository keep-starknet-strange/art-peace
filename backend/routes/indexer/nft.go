package indexer

import (
	"context"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"os"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

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
		PrintIndexerError("processNFTMintedEvent", "Error converting token id low hex to int", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	position, err := strconv.ParseInt(positionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting position hex to int", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	width, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting width hex to int", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	height, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting height hex to int", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	blockNumber, err := strconv.ParseInt(blockNumberHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting block number hex to int", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	// Set NFT in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTs (token_id, position, width, height, image_hash, block_number, minter) VALUES ($1, $2, $3, $4, $5, $6, $7)", tokenId, position, width, height, imageHashHex, blockNumber, minter)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error inserting NFT into postgres", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	// Load image from redis
	ctx := context.Background()
	canvas, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error getting canvas from redis", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

	colorPaletteHex := core.ArtPeaceBackend.CanvasConfig.Colors
	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting red hex to int when creating palette", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting green hex to int when creating palette", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting blue hex to int when creating palette", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
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
		PrintIndexerError("processNFTMintedEvent", "Error creating file", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error encoding image", tokenIdLowHex, positionHex, widthHex, heightHex, imageHashHex, blockNumberHex, minter)
		return
	}

  message := map[string]interface{}{
		"token_id":    tokenId,
		"minter":      minter,
		"messageType": "nftMinted",
	}
	routeutils.SendWebSocketMessage(w, message)

	// TODO: Response?
}
