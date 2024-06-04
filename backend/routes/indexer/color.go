package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processColorAddedEvent(event IndexerEvent) {

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

func revertColorAddedEvent(event IndexerEvent) {

	if err != nil {
		PrintIndexerError("revertColorAddedEvent", "Error converting day index hex to int", colorIdxHex)
		return
	}

	// Delete color from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM colors WHERE color_index = $1", colorHexHex)
	if err != nil {
		PrintIndexerError("revertColorAddedEvent", "Error deleting color from postgres", colorHexHex)
		return
	}
}
