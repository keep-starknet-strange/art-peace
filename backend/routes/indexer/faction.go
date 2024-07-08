package indexer

import (
	"context"
	"encoding/hex"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processFactionCreatedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	nameHex := event.Event.Data[0][2:] // Remove 0x prefix
	leader := event.Event.Data[1][2:]  // Remove 0x prefix
	joinableHex := event.Event.Data[2]
	allocationHex := event.Event.Data[3]

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse factionId", factionIdHex, nameHex, leader, joinableHex, allocationHex)
		return
	}

	decodedName, err := hex.DecodeString(nameHex)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to decode name", factionIdHex, nameHex, leader, joinableHex, allocationHex)
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

	joinableInt, err := strconv.ParseInt(joinableHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse joinable", factionIdHex, nameHex, leader, joinableHex, allocationHex)
		return
	}
	joinable := joinableInt != 0

	allocation, err := strconv.ParseInt(allocationHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to parse allocation", factionIdHex, nameHex, leader, joinableHex, allocationHex)
		return
	}

	// Add faction info into postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Factions (faction_id, name, leader, joinable, allocation) VALUES ($1, $2, $3, $4, $5)", factionId, name, leader, joinable, allocation)
	if err != nil {
		PrintIndexerError("processFactionCreatedEvent", "Failed to insert faction into postgres", factionIdHex, nameHex, leader, joinableHex, allocationHex)
		return
	}
}

func revertFactionCreatedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertFactionCreatedEvent", "Failed to parse factionId", factionIdHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Factions WHERE id = $1", factionId)
	if err != nil {
		PrintIndexerError("revertFactionCreatedEvent", "Failed to delete faction from postgres", factionIdHex)
		return
	}
}

func processFactionLeaderChangedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	newLeader := event.Event.Data[0][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionLeaderChangedEvent", "Failed to parse factionId", factionIdHex, newLeader)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE Factions SET leader = $1 WHERE faction_id = $2", newLeader, factionId)
	if err != nil {
		PrintIndexerError("processFactionLeaderChangedEvent", "Failed to update faction leader in postgres", factionIdHex, newLeader)
		return
	}
}

func revertFactionLeaderChangedEvent(event IndexerEvent) {
	// TODO: Implement
}

func processFactionJoinedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionJoinedEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO FactionMembersInfo (faction_id, user_address, last_placed_time, member_pixels) VALUES ($1, $2, TO_TIMESTAMP($3), $4)", factionId, userAddress, 0, 0)
	if err != nil {
		PrintIndexerError("processFactionJoinedEvent", "Failed to insert faction member into postgres", factionIdHex, userAddress)
		return
	}
}

func revertFactionJoinedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertFactionJoinedEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM FactionMembersInfo WHERE faction_id = $1 AND user_address = $2", factionId, userAddress)
	if err != nil {
		PrintIndexerError("revertFactionJoinedEvent", "Failed to delete faction member from postgres", factionIdHex, userAddress)
		return
	}
}

func processFactionLeftEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionLeftEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM FactionMembersInfo WHERE faction_id = $1 AND user_address = $2", factionId, userAddress)
	if err != nil {
		PrintIndexerError("processFactionLeftEvent", "Failed to delete faction member from postgres", factionIdHex, userAddress)
		return
	}
}

func revertFactionLeftEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertFactionLeftEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	// TODO: Stash the last_placed_time and member_pixels in the event data
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO FactionMembersInfo (faction_id, user_address, last_placed_time, member_pixels) VALUES ($1, $2, TO_TIMESTAMP($3), $4)", factionId, userAddress, 0, 0)
	if err != nil {
		PrintIndexerError("revertFactionLeftEvent", "Failed to insert faction member into postgres", factionIdHex, userAddress)
		return
	}
}

func processChainFactionCreatedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	nameHex := event.Event.Data[0][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainFactionCreatedEvent", "Failed to parse factionId", factionIdHex, nameHex)
		return
	}

	decodedName, err := hex.DecodeString(nameHex)
	if err != nil {
		PrintIndexerError("processChainFactionCreatedEvent", "Failed to decode name", factionIdHex, nameHex)
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

	// Add faction info into postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ChainFactions (faction_id, name) VALUES ($1, $2)", factionId, name)
	if err != nil {
		PrintIndexerError("processChainFactionCreatedEvent", "Failed to insert faction into postgres", factionIdHex, nameHex)
		return
	}
}

func revertChainFactionCreatedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertChainFactionCreatedEvent", "Failed to parse factionId", factionIdHex)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM ChainFactions WHERE faction_id = $1", factionId)
	if err != nil {
		PrintIndexerError("revertChainFactionCreatedEvent", "Failed to delete faction from postgres", factionIdHex)
		return
	}
}

func processChainFactionJoinedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainFactionJoinedEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ChainFactionMembersInfo (faction_id, user_address, last_placed_time, member_pixels) VALUES ($1, $2, TO_TIMESTAMP($3), $4)", factionId, userAddress, 0, 0)
	if err != nil {
		PrintIndexerError("processChainFactionJoinedEvent", "Failed to insert faction member into postgres", factionIdHex, userAddress)
		return
	}
}

func revertChainFactionJoinedEvent(event IndexerEvent) {
	factionIdHex := event.Event.Keys[1]
	userAddress := event.Event.Keys[2][2:] // Remove 0x prefix

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertChainFactionJoinedEvent", "Failed to parse factionId", factionIdHex, userAddress)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM ChainFactionMembersInfo WHERE faction_id = $1 AND user_address = $2", factionId, userAddress)
	if err != nil {
		PrintIndexerError("revertChainFactionJoinedEvent", "Failed to delete faction member from postgres", factionIdHex, userAddress)
		return
	}
}
