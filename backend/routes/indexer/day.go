package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processNewDayEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]
	dayStartTimeHex := event.Event.Data[0]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNewDayEvent", "Error converting day index hex to int", dayIdxHex, dayStartTimeHex)
		return
	}

	dayStartTime, err := strconv.ParseInt(dayStartTimeHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNewDayEvent", "Error converting day start time hex to int", dayIdxHex, dayStartTimeHex)
		return
	}

	// Set day in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Days (day_index, day_start) VALUES ($1, to_timestamp($2))", dayIdx, dayStartTime)
	if err != nil {
		PrintIndexerError("processNewDayEvent", "Error inserting day into postgres", dayIdx, dayStartTime)
		return
	}
}

func revertNewDayEvent(event IndexerEvent) {
	dayIdxHex := event.Event.Keys[1]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertNewDayEvent", "Error converting day index hex to int", dayIdxHex)
		return
	}

	// Delete day from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Days WHERE day_index = $1", dayIdx)
	if err != nil {
		PrintIndexerError("revertNewDayEvent", "Error deleting day from postgres", dayIdx)
		return
	}
}
