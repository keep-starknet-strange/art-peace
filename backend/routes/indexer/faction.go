package indexer

import (
	"context"
	"encoding/hex"
	"net/http"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processFactionCreatedEvent(event IndexerEvent, w http.ResponseWriter) {
	factionIdHex := event.Event.Keys[1]
	nameHex := event.Event.Data[0][2:] // Remove 0x prefix
	leader := event.Event.Data[1][2:]  // Remove 0x prefix
	poolHex := event.Event.Data[2]
	membersCountHex := event.Event.Data[3]
	memberAddresses := event.Event.Data[4:]

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse factionId", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
		return
	}

	decodedName, err := hex.DecodeString(nameHex)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to decode name", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
		return
	}
	// Trim off 0s at the start
	trimmedName := []byte{}
	trimming := true
	for _, b := range decodedName {
		if b == 0 && trimming {
			continue
		}
		trimming = false
		trimmedName = append(trimmedName, b)
	}
	name := string(trimmedName)

	pool, err := strconv.ParseInt(poolHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse pool", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
		return
	}

	membersCount, err := strconv.ParseInt(membersCountHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse membersCount", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
		return
	}
	allocation := pool / membersCount

	// Add faction info into postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Factions (name, leader, pixel_pool) VALUES ($1, $2, $3)", name, leader, pool)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to insert faction into postgres", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
		return
	}

	// Add members info into postgres
	for i, memberAddress := range memberAddresses {
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO FactionMembersInfo (faction_id, member_id, user_address, allocation, last_placed_time, member_pixels) VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5), $6)", factionId, i, memberAddress[2:], allocation, 0, 0)
		if err != nil {
			PrintIndexerError("processFactionCreatedEvent", "Failed to insert member into postgres", factionIdHex, nameHex, leader, poolHex, membersCountHex, memberAddresses)
			return
		}
	}
}

func processMemberReplacedEvent(event IndexerEvent, w http.ResponseWriter) {
	// TODO: Implement
}
