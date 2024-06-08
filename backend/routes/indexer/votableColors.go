package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processVotableColorEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]
	colorHex := event.Event.Keys[2]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVotableColorEvent", "Error converting day index hex to int", dayIdxHex, colorHex)
		return
	}

	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVotableColorEvent", "Error converting color hex to int", dayIdxHex, colorHex)
		return
	}

	// Set votable color in postgres ( or update if already exists )
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO VotableColors (day_index, color_key) VALUES ($1, $2)", dayIdx, color)
	if err != nil {
		PrintIndexerError("processVotableColorEvent", "Error inserting color vote into postgres", dayIdxHex, colorHex)
		return
	}
}

func revertVotableColorEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertVotableColorEvent", "Error converting day index hex to int", dayIdxHex)
		return
	}

	// Remove vote from postgres
	// TODO: Revert to old vote if it existed before the vote being reverted
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM VotableColors WHERE day_index = $1", dayIdx)
	if err != nil {
		PrintIndexerError("revertVotableColorEvent", "Error deleting color vote from postgres", dayIdxHex)
		return
	}
}
