package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processColorAddedEvent(event IndexerEvent) {
	colorKeyHex := event.Event.Keys[1]
	colorHex := event.Event.Data[0]

	colorKey, err := strconv.ParseInt(colorKeyHex, 0, 64)
	if err != nil {
		PrintIndexerError("processColorAddedEvent", "Error converting color key hex to int", colorKeyHex, colorHex)
		return
	}

	color := colorHex[len(colorHex)-6:]

	// Set color in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Colors (color_key, hex) VALUES ($1, $2)", colorKey, color)
	if err != nil {
		PrintIndexerError("processColorAddedEvent", "Error inserting color into postgres", colorKey, color)
		return
	}
}

func revertColorAddedEvent(event IndexerEvent) {
	colorIdxHex := event.Event.Keys[1]

	colorIdx, err := strconv.ParseInt(colorIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertColorAddedEvent", "Error converting color index hex to int", colorIdxHex)
		return
	}

	// Delete color from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM colors WHERE color_key = $1", colorIdx)
	if err != nil {
		PrintIndexerError("revertColorAddedEvent", "Error deleting color from postgres", colorIdx)
		return
	}
}
