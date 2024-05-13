package indexer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processPixelPlacedEvent(event IndexerEvent, w http.ResponseWriter) {
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
		"position": position,
		"color":    color,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
    PrintIndexerError("processPixelPlacedEvent", "Error marshalling message", address, posHex, dayIdxHex, colorHex)
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

func processBasicPixelPlacedEvent(event IndexerEvent, w http.ResponseWriter) {
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

func processMemberPixelsPlacedEvent(event IndexerEvent, w http.ResponseWriter) {
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

func processExtraPixelsPlacedEvent(event IndexerEvent, w http.ResponseWriter) {
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
