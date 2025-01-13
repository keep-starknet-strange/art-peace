package indexer

import (
	"context"
	"encoding/hex"
	"image"
	"image/color"
	"image/png"
	"os"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func processCanvasCreatedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	host := event.Event.Data[0][2:]          // Remove 0x prefix
	nameHex := event.Event.Data[1][2:]       // Remove 0x prefix
	uniqueNameHex := event.Event.Data[2][2:] // Remove 0x prefix
	widthHex := event.Event.Data[3]
	heightHex := event.Event.Data[4]
	timeBetweenPixelsHex := event.Event.Data[5]
	colorPaletteLenHex := event.Event.Data[6]

	colorPaletteLen, err := strconv.ParseInt(colorPaletteLenHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse colorPaletteLenHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}
	// Skip colors since they are processed in another event

	startTimeHex := event.Event.Data[7+colorPaletteLen]
	endTimeHex := event.Event.Data[8+colorPaletteLen]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse canvasIdHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	decodedName, err := hex.DecodeString(nameHex)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to decode nameHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
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

	decodedUniqueName, err := hex.DecodeString(uniqueNameHex)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to decode uniqueNameHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}
	trimmedUniqueName := []byte{}
	trimming = true
	for _, b := range decodedUniqueName {
		if b == 0 && trimming {
			continue
		}
		trimming = false
		trimmedUniqueName = append(trimmedUniqueName, b)
	}
	uniqueName := string(trimmedUniqueName)

	width, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse widthHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	height, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse heightHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	timeBetweenPixels, err := strconv.ParseInt(timeBetweenPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse timeBetweenPixelsHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	startTime, err := strconv.ParseInt(startTimeHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse startTimeHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	endTime, err := strconv.ParseInt(endTimeHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse endTimeHex", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	// Insert into Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Worlds (world_id, host, name, unique_name, width, height, time_between_pixels, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, TO_TIMESTAMP($8), TO_TIMESTAMP($9))", canvasId, host, name, uniqueName, width, height, timeBetweenPixels, startTime, endTime)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to insert into Worlds", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
		return
	}

	canvasRedisKey := "canvas-" + strconv.Itoa(int(canvasId))
	if core.ArtPeaceBackend.Databases.Redis.Exists(context.Background(), canvasRedisKey).Val() == 0 {
		totalBitSize := uint(width*height) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth
		totalByteSize := (totalBitSize / 8)
		if totalBitSize%8 != 0 {
			totalByteSize += 1
		}

		canvas := make([]byte, totalByteSize)
		err := core.ArtPeaceBackend.Databases.Redis.Set(context.Background(), canvasRedisKey, canvas, 0).Err()
		if err != nil {
			PrintIndexerError("processCanvasCreatedEvent", "Failed to set canvas in redis", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
			return
		}
	} else {
		PrintIndexerError("processCanvasCreatedEvent", "Canvas already exists in redis", canvasIdHex, host, nameHex, uniqueNameHex, widthHex, heightHex, timeBetweenPixelsHex, colorPaletteLenHex, err)
	}

	// Create base directories if they don't exist
	dirs := []string{
		"worlds",
		"worlds/images",
	}

	for _, dir := range dirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, os.ModePerm)
			if err != nil {
				PrintIndexerError("processCanvasCreatedEvent", "Failed to create directory", dir, err)
				return
			}
		}
	}

	generatedWorldImage := image.NewRGBA(image.Rect(0, 0, int(width), int(height)))
	baseColorHex := event.Event.Data[7]
	baseColor := baseColorHex[len(baseColorHex)-6:] // Remove prefix
	baseColorR, err := strconv.ParseInt(baseColor[0:2], 16, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse baseColorR", baseColor, err)
		return
	}
	baseColorG, err := strconv.ParseInt(baseColor[2:4], 16, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse baseColorG", baseColor, err)
		return
	}
	baseColorB, err := strconv.ParseInt(baseColor[4:6], 16, 64)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to parse baseColorB", baseColor, err)
		return
	}
	color := color.RGBA{R: uint8(baseColorR), G: uint8(baseColorG), B: uint8(baseColorB), A: 255}
	for y := 0; y < int(height); y++ {
		for x := 0; x < int(width); x++ {
			generatedWorldImage.Set(x, y, color)
		}
	}

	// Create world image
	filename := "worlds/images/world-" + strconv.Itoa(int(canvasId)) + ".png"
	file, err := os.Create(filename)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to create file", filename, err)
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedWorldImage)
	if err != nil {
		PrintIndexerError("processCanvasCreatedEvent", "Failed to encode image", filename, err)
		return
	}

	// After world creation
	var message = map[string]string {
		"messageType": "newWorld",
		"worldId": strconv.Itoa(int(canvasId)),
	}
	routeutils.SendMessageToWSS(message)
}

func revertCanvasCreatedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasCreatedEvent", "Failed to parse canvasIdHex", canvasIdHex, err)
		return
	}

	// Delete from Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Worlds WHERE world_id = $1", canvasId)
	if err != nil {
		PrintIndexerError("revertCanvasCreatedEvent", "Failed to delete from Worlds", canvasIdHex, err)
		return
	}

	canvasRedisKey := "canvas-" + strconv.Itoa(int(canvasId))
	err = core.ArtPeaceBackend.Databases.Redis.Del(context.Background(), canvasRedisKey).Err()
	if err != nil {
		PrintIndexerError("revertCanvasCreatedEvent", "Failed to delete canvas from redis", canvasIdHex, err)
		return
	}
}

func processCanvasHostChangedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	oldHost := event.Event.Data[0][2:] // Remove 0x prefix
	newHost := event.Event.Data[1][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasHostChangedEvent", "Failed to parse canvasIdHex", canvasIdHex, oldHost, newHost, err)
		return
	}

	// Update Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Worlds SET host = $1 WHERE world_id = $2", newHost, canvasId)
	if err != nil {
		PrintIndexerError("processCanvasHostChangedEvent", "Failed to update Worlds", canvasIdHex, oldHost, newHost, err)
		return
	}
}

func revertCanvasHostChangedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	oldHost := event.Event.Data[0][2:] // Remove 0x prefix
	newHost := event.Event.Data[1][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasHostChangedEvent", "Failed to parse canvasIdHex", canvasIdHex, oldHost, newHost, err)
		return
	}

	// Update Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Worlds SET host = $1 WHERE world_id = $2", oldHost, canvasId)
	if err != nil {
		PrintIndexerError("revertCanvasHostChangedEvent", "Failed to update Worlds", canvasIdHex, oldHost, newHost, err)
		return
	}
}

func processCanvasTimerChangedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	oldTimeHex := event.Event.Data[0]
	newTimeHex := event.Event.Data[1]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasTimeBetweenPixelsChangedEvent", "Failed to parse canvasIdHex", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}

	newTime, err := strconv.ParseInt(newTimeHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasTimeBetweenPixelsChangedEvent", "Failed to parse newTimeHex", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}

	// Update Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Worlds SET time_between_pixels = $1 WHERE world_id = $2", newTime, canvasId)
	if err != nil {
		PrintIndexerError("processCanvasTimeBetweenPixelsChangedEvent", "Failed to update Worlds", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}
}

func revertCanvasTimerChangedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	oldTimeHex := event.Event.Data[0]
	newTimeHex := event.Event.Data[1]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasTimeBetweenPixelsChangedEvent", "Failed to parse canvasIdHex", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}

	oldTime, err := strconv.ParseInt(oldTimeHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasTimeBetweenPixelsChangedEvent", "Failed to parse oldTimeHex", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}

	// Update Worlds
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Worlds SET time_between_pixels = $1 WHERE world_id = $2", oldTime, canvasId)
	if err != nil {
		PrintIndexerError("revertCanvasTimeBetweenPixelsChangedEvent", "Failed to update Worlds", canvasIdHex, oldTimeHex, newTimeHex, err)
		return
	}
}

func processCanvasColorAddedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	colorKeyHex := event.Event.Keys[2]
	colorHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasColorAddedEvent", "Failed to parse canvasIdHex", canvasIdHex, colorKeyHex, colorHex, err)
		return
	}

	colorKey, err := strconv.ParseInt(colorKeyHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasColorAddedEvent", "Failed to parse colorKeyHex", canvasIdHex, colorKeyHex, colorHex, err)
		return
	}

	color := colorHex[len(colorHex)-6:] // Remove prefix

	// Insert into WorldsColors
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldsColors (world_id, color_key, hex) VALUES ($1, $2, $3)", canvasId, colorKey, color)
}

func revertCanvasColorAddedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	colorKeyHex := event.Event.Keys[2]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasColorAddedEvent", "Failed to parse canvasIdHex", canvasIdHex, colorKeyHex, err)
		return
	}

	colorKey, err := strconv.ParseInt(colorKeyHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasColorAddedEvent", "Failed to parse colorKeyHex", canvasIdHex, colorKeyHex, err)
		return
	}

	// Delete from WorldsColors
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM WorldsColors WHERE world_id = $1 AND color_key = $2", canvasId, colorKey)
}

func processCanvasPixelPlacedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	placedBy := event.Event.Keys[2][2:] // Remove 0x prefix
	posHex := event.Event.Keys[3]
	colorHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse canvasIdHex", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	pos, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse posHex", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	colorVal, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse colorHex", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	position := uint(pos) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	canvasRedisKey := "canvas-" + strconv.Itoa(int(canvasId))
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, canvasRedisKey, "SET", bitfieldType, position, colorVal).Err()
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to set bitfield", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldsPixels (world_id, address, position, color) VALUES ($1, $2, $3, $4)", canvasId, placedBy, pos, colorVal)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to insert into WorldsPixels", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	// Check # of total pixels placed on this world
	totalPixelsPlaced, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM WorldsPixels WHERE world_id = $1", canvasId)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to query totalPixelsPlaced", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}

	lastPixelPlacedTime, err := core.PostgresQueryOne[*time.Time]("SELECT time FROM WorldsPixels WHERE world_id = $1 ORDER BY time DESC LIMIT 1", canvasId)
	if err != nil {
		PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to query lastPixelPlacedTime", canvasIdHex, placedBy, posHex, colorHex, err)
		return
	}
	timeSinceLastPixelPlaced := time.Now().Unix() - (*lastPixelPlacedTime).Unix()
	threeHours := int64(3 * 60 * 60)

	// TODO: Improve this & collect snapshots for a timelapse
	// Snapshot canvas image every 100 pixels placed || if last pixel placed was more than 3 hours ago
	if uint(*totalPixelsPlaced)%100 == 0 || timeSinceLastPixelPlaced > threeHours {
		worldWidth, err := core.PostgresQueryOne[int]("SELECT width FROM Worlds WHERE world_id = $1", canvasId)
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to query worldWidth", canvasIdHex, placedBy, posHex, colorHex, err)
			return
		}
		worldHeight, err := core.PostgresQueryOne[int]("SELECT height FROM Worlds WHERE world_id = $1", canvasId)
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to query worldHeight", canvasIdHex, placedBy, posHex, colorHex, err)
			return
		}

		ctx := context.Background()
		canvasRedisKey := "canvas-" + strconv.Itoa(int(canvasId))
		canvas, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, canvasRedisKey).Result()
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to get canvas", canvasIdHex, placedBy, posHex, colorHex, err)
			return
		}

		colorPaletteHex, err := core.PostgresQuery[string]("SELECT hex FROM colors ORDER BY color_key")
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to query colorPaletteHex", canvasIdHex, placedBy, posHex, colorHex, err)
			return
		}

		colorPalette := make([]color.RGBA, len(colorPaletteHex))
		for idx, colorHex := range colorPaletteHex {
			r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
			if err != nil {
				PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse colorHex", colorHex, err)
				return
			}
			g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
			if err != nil {
				PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse colorHex", colorHex, err)
				return
			}
			b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
			if err != nil {
				PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to parse colorHex", colorHex, err)
				return
			}
			colorPalette[idx] = color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}
		}

		// Create world image
		generatedWorldImage := image.NewRGBA(image.Rect(0, 0, *worldWidth, *worldHeight))
		bitWidth := uint(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth)
		oneByteBitOffset := uint(8 - bitWidth)
		twoByteBitOffset := uint(16 - bitWidth)

		for y := 0; y < *worldHeight; y++ {
			for x := 0; x < *worldWidth; x++ {
				innerPos := uint(y*(*worldWidth) + x)
				bitPos := innerPos * bitWidth
				bytePos := bitPos / 8
				bitOffset := bitPos % 8

				if bitOffset <= oneByteBitOffset {
					colorIdx := (canvas[bytePos] >> (oneByteBitOffset - bitOffset)) & 0b11111
					generatedWorldImage.Set(x, y, colorPalette[colorIdx])
				} else {
					colorIdx := (((uint16(canvas[bytePos]) << 8) | uint16(canvas[bytePos+1])) >> (twoByteBitOffset - bitOffset)) & 0b11111
					generatedWorldImage.Set(x, y, colorPalette[colorIdx])
				}
			}
		}

		// Create world image
		filename := "worlds/images/world-" + strconv.Itoa(int(canvasId)) + ".png"
		file, err := os.Create(filename)
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to create file", filename, err)
			return
		}
		defer file.Close()

		err = png.Encode(file, generatedWorldImage)
		if err != nil {
			PrintIndexerError("processCanvasPixelPlacedEvent", "Failed to encode image", filename, err)
			return
		}
	}

	var message = map[string]string {
		"worldId":     strconv.Itoa(int(canvasId)),
		"position":    strconv.Itoa(int(pos)),
		"color":       strconv.Itoa(int(colorVal)),
		"messageType": "colorWorldPixel",
	}
	routeutils.SendMessageToWSS(message)
}

func revertCanvasPixelPlacedEvent(event IndexerEvent) {
	worldIdHex := event.Event.Keys[1]
	placedBy := event.Event.Keys[2][2:] // Remove 0x prefix
	posHex := event.Event.Keys[3]

	worldId, err := strconv.ParseInt(worldIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Failed to parse worldIdHex", worldIdHex, placedBy, posHex, err)
		return
	}

	pos, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Failed to parse posHex", worldIdHex, placedBy, posHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM WorldsPixels WHERE world_id = $1 AND address = $2 AND position = $3 ORDER BY time DESC limit 1", worldId, placedBy, pos)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Failed to delete from WorldsPixels", worldIdHex, placedBy, posHex, err)
		return
	}

	oldColor, err := core.PostgresQueryOne[int]("SELECT color FROM WorldsPixels WHERE world_id = $1 AND address = $2 AND position = $3 ORDER BY time DESC LIMIT 1", worldId, placedBy, pos)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Failed to query old color", worldIdHex, placedBy, posHex, err)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	position := uint(pos) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas-"+strconv.Itoa(int(worldId)), "SET", bitfieldType, position, oldColor).Err()
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Failed to set bitfield", worldIdHex, placedBy, posHex, err)
		return
	}

	// TODO: Send websocket message?
}

func processCanvasBasicPixelPlacedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	placedBy := event.Event.Keys[2][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasBasicPixelPlacedEvent", "Failed to parse canvasIdHex", canvasIdHex, placedBy, timestampHex, err)
		return
	}

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasBasicPixelPlacedEvent", "Failed to parse timestampHex", canvasIdHex, placedBy, timestampHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldsLastPlacedTime (world_id, address, time) VALUES ($1, $2, TO_TIMESTAMP($3)) ON CONFLICT (world_id, address) DO UPDATE SET time = TO_TIMESTAMP($3)", canvasId, placedBy, timestamp)
	if err != nil {
		PrintIndexerError("processCanvasBasicPixelPlacedEvent", "Failed to insert into WorldsLastPlacedTime", canvasIdHex, placedBy, timestampHex, err)
		return
	}
}

func revertCanvasBasicPixelPlacedEvent(event IndexerEvent) {
	// TODO: See pixel.go impl?
}

func processCanvasExtraPixelsPlacedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	placedBy := event.Event.Keys[2][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasExtraPixelsPlacedEvent", "Failed to parse canvasIdHex", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasExtraPixelsPlacedEvent", "Failed to parse extraPixelsHex", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE WorldsExtraPixels SET available = available - $1, used = used + $1 WHERE world_id = $2 AND address = $3", extraPixels, canvasId, placedBy)
	if err != nil {
		PrintIndexerError("processCanvasExtraPixelsPlacedEvent", "Failed to insert into WorldsExtraPixels", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}
}

func revertCanvasExtraPixelsPlacedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	placedBy := event.Event.Keys[2][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasExtraPixelsPlacedEvent", "Failed to parse canvasIdHex", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasExtraPixelsPlacedEvent", "Failed to parse extraPixelsHex", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE WorldsExtraPixels SET available = available + $1, used = used - $1 WHERE world_id = $2 AND address = $3", extraPixels, canvasId, placedBy)
	if err != nil {
		PrintIndexerError("revertCanvasExtraPixelsPlacedEvent", "Failed to insert into WorldsExtraPixels", canvasIdHex, placedBy, extraPixelsHex, err)
		return
	}
}

func processCanvasHostAwardedUserEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix
	amountHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasHostAwardedUserEvent", "Failed to parse canvasIdHex", canvasIdHex, user, amountHex, err)
		return
	}

	amount, err := strconv.ParseInt(amountHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasHostAwardedUserEvent", "Failed to parse amountHex", canvasIdHex, user, amountHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldsExtraPixels (world_id, address, available, used) VALUES ($1, $2, $3, 0) ON CONFLICT (world_id, address) DO UPDATE SET available = WorldsExtraPixels.available + $3", canvasId, user, amount)
	if err != nil {
		PrintIndexerError("processCanvasHostAwardedUserEvent", "Failed to insert into WorldFavorites", canvasIdHex, user, amountHex, err)
		return
	}
}

func revertCanvasHostAwardedUserEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix
	amountHex := event.Event.Data[0]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasHostAwardedUserEvent", "Failed to parse canvasIdHex", canvasIdHex, user, amountHex, err)
		return
	}

	amount, err := strconv.ParseInt(amountHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasHostAwardedUserEvent", "Failed to parse amountHex", canvasIdHex, user, amountHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE WorldsExtraPixels SET available = available - $1 WHERE world_id = $2 AND address = $3", amount, canvasId, user)
	if err != nil {
		PrintIndexerError("revertCanvasHostAwardedUserEvent", "Failed to insert into WorldFavorites", canvasIdHex, user, amountHex, err)
		return
	}
}

func processCanvasFavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasFavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, user, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldFavorites (world_id, user_address) VALUES ($1, $2)", canvasId, user)
	if err != nil {
		PrintIndexerError("processCanvasFavoritedEvent", "Failed to insert into WorldFavorites", canvasIdHex, user, err)
		return
	}
}

func revertCanvasFavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasFavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, user, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM WorldFavorites WHERE world_id = $1 AND user_address = $2", canvasId, user)
	if err != nil {
		PrintIndexerError("revertCanvasFavoritedEvent", "Failed to delete from WorldFavorites", canvasIdHex, user, err)
		return
	}
}

func processCanvasUnfavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processCanvasUnfavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, user, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM WorldFavorites WHERE world_id = $1 AND user_address = $2", canvasId, user)
	if err != nil {
		PrintIndexerError("processCanvasUnfavoritedEvent", "Failed to delete from WorldFavorites", canvasIdHex, user, err)
		return
	}
}

func revertCanvasUnfavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertCanvasUnfavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, user, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO WorldFavorites (world_id, user_address) VALUES ($1, $2)", canvasId, user)
	if err != nil {
		PrintIndexerError("revertCanvasUnfavoritedEvent", "Failed to insert into WorldFavorites", canvasIdHex, user, err)
		return
	}
}
