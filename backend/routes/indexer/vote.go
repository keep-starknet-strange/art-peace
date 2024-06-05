package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processVoteColorEvent(event IndexerEvent) {
	voter := event.Event.Keys[1][2:] // Remove 0x prefix
	dayIdxHex := event.Event.Keys[2]
	colorHex := event.Event.Keys[3]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVoteColorEvent", "Error converting day index hex to int", voter, dayIdxHex, colorHex)
		return
	}

	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processVoteColorEvent", "Error converting color hex to int", voter, dayIdxHex, colorHex)
		return
	}

	// Set vote in postgres ( or update if already exists )
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ColorVotes (user_address, day_index, color_key) VALUES ($1, $2, $3) ON CONFLICT (user_address, day_index) DO UPDATE SET color_key = $3", voter, dayIdx, color)
	if err != nil {
		PrintIndexerError("processVoteColorEvent", "Error inserting color vote into postgres", voter, dayIdxHex, colorHex)
		return
	}
}

func revertVoteColorEvent(event IndexerEvent) {
	voter := event.Event.Keys[1][2:] // Remove 0x prefix
	dayIdxHex := event.Event.Keys[2]

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertVoteColorEvent", "Error converting day index hex to int", voter, dayIdxHex)
		return
	}

	// Remove vote from postgres
	// TODO: Revert to old vote if it existed before the vote being reverted
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM ColorVotes WHERE user_address = $1 AND day_index = $2", voter, dayIdx)
	if err != nil {
		PrintIndexerError("revertVoteColorEvent", "Error deleting color vote from postgres", voter, dayIdxHex)
		return
	}
}
