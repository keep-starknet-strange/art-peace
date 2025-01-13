package indexer

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func processNFTMintedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix
	positionHex := event.Event.Data[0]
	widthHex := event.Event.Data[1]
	heightHex := event.Event.Data[2]
	nameHex := event.Event.Data[3][2:] // Remove 0x prefix
	imageHashHex := event.Event.Data[4]
	blockNumberHex := event.Event.Data[5]
	dayIndexHex := event.Event.Data[6]
	minter := event.Event.Data[7][2:] // Remove 0x prefix

	// combine high and low token ids
	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error combining high and low tokenId hex", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}
	tokenId := tokenIdU256.Uint64()

	position, err := strconv.ParseInt(positionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting position hex to int", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	width, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting width hex to int", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	height, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting height hex to int", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	decodedName, err := hex.DecodeString(nameHex)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error decoding name hex", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}
	trimmedName := []byte{}
	trimming := true
	for _, b := range decodedName {
		if b == 0 && trimming {
			continue
		}
		trimming = false
		trimmedName = append(trimmedName, b)
	}
	name := string(trimmedName)

	blockNumber, err := strconv.ParseInt(blockNumberHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting block number hex to int", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	dayIndex, err := strconv.ParseInt(dayIndexHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error converting day index hex to int", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	// Set NFT in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTs (token_id, position, width, height, name, image_hash, block_number, day_index, minter, owner) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", tokenId, position, width, height, name, imageHashHex, blockNumber, dayIndex, minter, minter)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error inserting NFT into postgres", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	// Load image from redis
	ctx := context.Background()
	canvas, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error getting canvas from redis", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	colorPaletteHex, err := core.PostgresQuery[string]("SELECT hex FROM colors ORDER BY color_key")
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error getting color palette from postgres", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting red hex to int when creating palette", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting green hex to int when creating palette", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			PrintIndexerError("processNFTMintedEvent", "Error converting blue hex to int when creating palette", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
			return
		}
		colorPalette[idx] = color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}
	}

	// Scale factors
	scaleFactor := 10
	scaledWidth := width * int64(scaleFactor)
	scaledHeight := height * int64(scaleFactor)

	// Create a new image with scaled dimensions
	generatedImage := image.NewRGBA(image.Rect(0, 0, int(scaledWidth), int(scaledHeight)))

	bitWidth := int64(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth)
	startX := int64(position % int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width))
	startY := int64(position / int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width))
	oneByteBitOffset := int64(8 - bitWidth)
	twoByteBitOffset := int64(16 - bitWidth)

	for y := startY; y < startY+height; y++ {
		for x := startX; x < startX+width; x++ {
			pos := y*int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width) + x
			bitPos := pos * bitWidth
			bytePos := bitPos / 8
			bitOffset := bitPos % 8

			// Calculate the scaled position
			for dy := 0; dy < scaleFactor; dy++ {
				for dx := 0; dx < scaleFactor; dx++ {
					scaledX := int(x-startX)*scaleFactor + dx
					scaledY := int(y-startY)*scaleFactor + dy

					if bitOffset <= oneByteBitOffset {
						colorIdx := (canvas[bytePos] >> (oneByteBitOffset - bitOffset)) & 0b11111
						generatedImage.Set(scaledX, scaledY, colorPalette[colorIdx])
					} else {
						colorIdx := (((uint16(canvas[bytePos]) << 8) | uint16(canvas[bytePos+1])) >> (twoByteBitOffset - bitOffset)) & 0b11111
						generatedImage.Set(scaledX, scaledY, colorPalette[colorIdx])
					}
				}
			}
		}
	}

	// TODO: Check if file exists
	roundNumber := os.Getenv("ROUND_NUMBER")
	if roundNumber == "" {
		PrintIndexerError("processNFTMintedEvent", "Error getting round number from environment", tokenIdLowHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}
	roundDir := fmt.Sprintf("round-%s", roundNumber)

	// Create base directories if they don't exist
	dirs := []string{
		"nfts",
		fmt.Sprintf("nfts/%s", roundDir),
		fmt.Sprintf("nfts/%s/images", roundDir),
		fmt.Sprintf("nfts/%s/metadata", roundDir),
	}

	for _, dir := range dirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, os.ModePerm)
			if err != nil {
				PrintIndexerError("processNFTMintedEvent", fmt.Sprintf("Error creating %s directory", dir), tokenIdLowHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
				return
			}
		}
	}

	// Save image to disk
	filename := fmt.Sprintf("nfts/%s/images/nft-%d.png", roundDir, tokenId)
	file, err := os.Create(filename)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error creating file", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error encoding image", tokenIdLowHex, tokenIdHighHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	// Create a NFT JSON metadata file
	x := position % int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)
	y := position / int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)
	metadata := map[string]interface{}{
		"name":        name,
		"description": "User minted art/peace NFT from the canvas.",
		"image":       fmt.Sprintf("%s/nft/%s/image/nft-%d.png", core.ArtPeaceBackend.GetBackendUrl(), roundDir, tokenId),
		"attributes": []map[string]interface{}{
			{
				"trait_type": "Width",
				"value":      fmt.Sprintf("%d", width),
			},
			{
				"trait_type": "Height",
				"value":      fmt.Sprintf("%d", height),
			},
			{
				"trait_type": "Position",
				"value":      fmt.Sprintf("(%d, %d)", x, y),
			},
			{
				"trait_type": "Day Index",
				"value":      fmt.Sprintf("%d", dayIndex),
			},
			{
				"trait_type": "Minter",
				"value":      minter,
			},
			{
				"trait_type": "Token ID",
				"value":      fmt.Sprintf("%d", tokenId),
			},
		},
	}

	metadataFile, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error generating NFT metadata", tokenIdLowHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	metadataFilename := fmt.Sprintf("nfts/%s/metadata/nft-%d.json", roundDir, tokenId)
	err = os.WriteFile(metadataFilename, metadataFile, 0644)
	if err != nil {
		PrintIndexerError("processNFTMintedEvent", "Error writing NFT metadata file", tokenIdLowHex, positionHex, widthHex, heightHex, nameHex, imageHashHex, blockNumberHex, minter)
		return
	}

	message := map[string]string {
		"token_id":    strconv.FormatUint(tokenId, 10),
		"minter":      minter,
		"messageType": "nftMinted",
	}
	routeutils.SendMessageToWSS(message)

	// TODO: Response?
}

func revertNFTMintedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix

	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("revertNFTMintedEvent", "Error converting tokenId hex to int", tokenIdLowHex)
		return
	}
	tokenId := tokenIdU256.Uint64()

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM NFTs WHERE token_id = $1", tokenId)
	if err != nil {
		PrintIndexerError("reverseNFTMintedEvent", "Error deleting NFT from postgres", tokenIdLowHex)
		return
	}

	// TODO: Mark image as unused?
}

func processNFTLikedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix
	liker := event.Event.Keys[3][2:]          // Remove 0x prefix

	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("processNFTLikedEvent", "Error converting tokenId hex to int", tokenIdLowHex, liker)
		return
	}
	tokenId := tokenIdU256.Uint64()

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTLikes (nftKey, liker) VALUES ($1, $2) ON CONFLICT DO NOTHING", tokenId, liker)
	if err != nil {
		PrintIndexerError("processNFTLikedEvent", "Error inserting NFT like into postgres", tokenIdLowHex, liker)
		return
	}

	// TODO: WebSocket message?
}

func revertNFTLikedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix
	liker := event.Event.Keys[3][2:]          // Remove 0x prefix

	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("revertNFTLikedEvent", "Error converting tokenId hex to int", tokenIdLowHex, liker)
		return
	}
	tokenId := tokenIdU256.Uint64()

	// TODO: Check if like exists before event
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM NFTLikes WHERE nftKey = $1 AND liker = $2", tokenId, liker)
	if err != nil {
		PrintIndexerError("revertNFTLikedEvent", "Error deleting NFT like from postgres", tokenIdLowHex, liker)
		return
	}
}

func processNFTUnlikedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix
	unliker := event.Event.Keys[3][2:]        // Remove 0x prefix

	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("processNFTUnlikedEvent", "Error converting tokenId hex to int", tokenIdLowHex, unliker)
		return
	}
	tokenId := tokenIdU256.Uint64()

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM NFTLikes WHERE nftKey = $1 AND liker = $2", tokenId, unliker)
	if err != nil {
		PrintIndexerError("processNFTUnlikedEvent", "Error deleting NFT like from postgres", tokenIdLowHex, unliker)
		return
	}

	// TODO: WebSocket message?
}

func revertNFTUnlikedEvent(event IndexerEvent) {
	tokenIdLowHex := event.Event.Keys[1][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[2][2:] // Remove 0x prefix
	unliker := event.Event.Keys[3][2:]        // Remove 0x prefix

	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("revertNFTUnlikedEvent", "Error converting tokenId hex to int", tokenIdLowHex, unliker)
		return
	}
	tokenId := tokenIdU256.Uint64()

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTLikes (nftKey, liker) VALUES ($1, $2) ON CONFLICT DO NOTHING", tokenId, unliker)
	if err != nil {
		PrintIndexerError("revertNFTUnlikedEvent", "Error inserting NFT like into postgres", tokenIdLowHex, unliker)
		return
	}
}
