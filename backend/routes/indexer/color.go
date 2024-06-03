package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processColorAddedEvent(event IndexerEvent) {
	colorIdexHex := event.Event.Keys[1]
	colorHexHex := event.Event.Data[0]

	colorIdx, err := strconv.ParseInt(colorIdexHex, 0, 64)
	if err != nil {
		PrintIndexerError("processcolorIdexHex", "Error converting color index hex to int", colorIdx, colorIdexHex)
		return
	}

	// Set color in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Colors (hex) VALUES ($1))", colorHexHex)
	if err != nil {
		PrintIndexerError("processColorAddedEvent", "Error inserting day into postgres", colorHexHex)
		return
	}
}
