package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processVotableColorAddedEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]
	colorKeyHex := event.Event.Keys[2]
	colorHex := event.Event.Data[0]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVotableColorAddedEvent", "Error converting day index hex to int", dayIdxHex, colorHex)
		return
	}

	colorKey, err := strconv.ParseInt(colorKeyHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVotableColorAddedEvent", "Error converting color key hex to int", dayIdxHex, colorHex)
		return
	}

	color := colorHex[len(colorHex)-6:]

	// Set votable color in postgres ( or update if already exists )
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO VotableColors (day_index, color_key, hex) VALUES ($1, $2, $3)", dayIdx, colorKey, color)
	if err != nil {
		PrintIndexerError("processVotableColorAddedEvent", "Error inserting color vote into postgres", dayIdxHex, colorHex)
		return
	}
}

func revertVotableColorAddedEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]
	colorKeyHex := event.Event.Keys[2]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertVotableColorAddedEvent", "Error converting day index hex to int", dayIdxHex, colorKeyHex)
		return
	}

	colorKey, err := strconv.ParseInt(colorKeyHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertVotableColorAddedEvent", "Error converting color key hex to int", dayIdxHex, colorKeyHex)
		return
	}

	// Remove vote from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM VotableColors WHERE day_index = $1 AND color_key = $2", dayIdx, colorKey)
	if err != nil {
		PrintIndexerError("revertVotableColorAddedEvent", "Error deleting votable color from postgres", dayIdxHex, colorKeyHex)
		return
	}
}
