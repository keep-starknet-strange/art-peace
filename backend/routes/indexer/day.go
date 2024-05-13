package indexer

import (
	"context"
	"net/http"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processNewDayEvent(event IndexerEvent, w http.ResponseWriter) {
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

	if dayIdx > 0 {
		// Update end time of previous day
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Days SET day_end = $1 WHERE day_index = $2", dayStartTime, dayIdx-1)
		if err != nil {
      PrintIndexerError("processNewDayEvent", "Error updating end time of previous day in postgres", dayIdx, dayStartTime)
			return
		}
	}
}
