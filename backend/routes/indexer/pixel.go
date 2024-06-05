package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func processPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]
	dayIdxHex := event.Event.Keys[3]
	colorHex := event.Event.Data[0]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting position hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	//validate position
	maxPosition := int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width) * int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)

	// Perform comparison with maxPosition
	if position < 0 || position >= maxPosition {
		PrintIndexerError("processPixelPlacedEvent", "Position value exceeds canvas dimensions", address, posHex, dayIdxHex, colorHex)
		return
	}

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting day index hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}
	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting color hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	// TODO: Only validate onchain?
	//validate color
	colorsLength := len(core.ArtPeaceBackend.CanvasConfig.Colors)
	if int(color) < 0 || int(color) >= colorsLength {
		PrintIndexerError("processPixelPlacedEvent", "Color value exceeds color palette", address, posHex, dayIdxHex, colorHex)
		return
	}

	// Set pixel in redis
	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error setting pixel in redis", address, posHex, dayIdxHex, colorHex)
		return
	}

	// Set pixel in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)", address, position, dayIdx, color)
	if err != nil {
		// TODO: Reverse redis operation?
		PrintIndexerError("processPixelPlacedEvent", "Error inserting pixel into postgres", address, posHex, dayIdxHex, colorHex)
		return
	}

	// Send message to all connected clients
	var message = map[string]interface{}{
		"position":    position,
		"color":       color,
		"messageType": "colorPixel",
	}
	routeutils.SendWebSocketMessage(message)
}

func revertPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	// Delete pixel from postgres ( last one )
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Pixels WHERE address = $1 AND position = $2 ORDER BY time limit 1", address, position)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error deleting pixel from postgres", address, posHex)
		return
	}

	// Retrieve the old color
	oldColor, err := core.PostgresQueryOne[int]("SELECT color FROM Pixels WHERE address = $1 AND position = $2 ORDER BY time DESC LIMIT 1", address, position)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error retrieving old color from postgres", address, posHex)
		return
	}
	// Reset pixel in redis
	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, oldColor).Err()
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error resetting pixel in redis", address, posHex)
		return
	}

	// Send message to all connected clients
	var message = map[string]interface{}{
		"position":    position,
		"color":       oldColor,
		"messageType": "colorPixel",
	}
	routeutils.SendWebSocketMessage(message)
}

func processBasicPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEvent", "Error converting timestamp hex to int", address, timestampHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO LastPlacedTime (address, time) VALUES ($1, TO_TIMESTAMP($2)) ON CONFLICT (address) DO UPDATE SET time = TO_TIMESTAMP($2)", address, timestamp)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEvent", "Error inserting last placed time into postgres", address, timestampHex)
		return
	}
}

func revertBasicPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix

	// Reset last placed time to time of last pixel placed
	_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE LastPlacedTime SET time = (SELECT time FROM Pixels WHERE address = $1 ORDER BY time DESC LIMIT 1) WHERE address = $1", address)
	if err != nil {
		PrintIndexerError("revertBasicPixelPlacedEvent", "Error resetting last placed time in postgres", address)
		return
	}

	// TODO: check ordering of this and revertPixelPlacedEvent
}

func processMemberPixelsPlacedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	memberIdHex := event.Event.Keys[2]
	timestampHex := event.Event.Data[0]
	memberPixelsHex := event.Event.Data[1]

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting faction id hex to int", factionIdHex, memberIdHex, timestampHex, memberPixelsHex)
		return
	}

	memberId, err := strconv.ParseInt(memberIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting member id hex to int", factionIdHex, memberIdHex, timestampHex, memberPixelsHex)
		return
	}

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting timestamp hex to int", factionIdHex, memberIdHex, timestampHex, memberPixelsHex)
		return
	}

	memberPixels, err := strconv.ParseInt(memberPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting member pixels hex to int", factionIdHex, memberIdHex, timestampHex, memberPixelsHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE FactionMembersInfo SET last_placed_time = TO_TIMESTAMP($1), member_pixels = $2 WHERE faction_id = $3 AND member_id = $4", timestamp, memberPixels, factionId, memberId)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error updating faction member info in postgres", factionIdHex, memberIdHex, timestampHex, memberPixelsHex)
		return
	}
}

func revertMemberPixelsPlacedEvent(event IndexerEvent) {
	// TODO
}

func processExtraPixelsPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processExtraPixelsPlacedEvent", "Error converting extra pixels hex to int", address, extraPixelsHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ExtraPixels SET available = available - $1, used = used + $1 WHERE address = $2", extraPixels, address)
	if err != nil {
		PrintIndexerError("processExtraPixelsPlacedEvent", "Error updating extra pixels in postgres", address, extraPixelsHex)
		return
	}
}

func revertExtraPixelsPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertExtraPixelsPlacedEvent", "Error converting extra pixels hex to int", address, extraPixelsHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ExtraPixels SET available = available + $1, used = used - $1 WHERE address = $2", extraPixels, address)
	if err != nil {
		PrintIndexerError("revertExtraPixelsPlacedEvent", "Error updating extra pixels in postgres", address, extraPixelsHex)
		return
	}
}
