package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processDailyQuestClaimedEvent(event IndexerEvent) {
	dayIndexHex := event.Event.Keys[1]
	questIdHex := event.Event.Keys[2]
	user := event.Event.Keys[3][2:] // Remove 0x prefix
	rewardHex := event.Event.Data[0]
	calldataLenHex := event.Event.Data[1]
	calldata := []string{}

	dayIndex, err := strconv.ParseInt(dayIndexHex, 0, 64)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to parse dayIndex", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	questId, err := strconv.ParseInt(questIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to parse questId", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	reward, err := strconv.ParseInt(rewardHex, 0, 64)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to parse reward", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	calldataLen, err := strconv.ParseInt(calldataLenHex, 0, 64)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to parse calldataLen", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	if calldataLen > 0 {
		for i := 2; i < len(event.Event.Data); i++ {
			calldataInt, err := strconv.ParseInt(event.Event.Data[i], 0, 64)
			if err != nil {
				PrintIndexerError("processDailyQuestClaimedEvent", "Failed to parse calldata", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
				return
			}
			calldata = append(calldata, strconv.FormatInt(calldataInt, 10))
		}
	}

	// TODO: Add calldata field & completed_at field
	// Add daily quest info into postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO UserDailyQuests (user_address, day_index, quest_id, completed) VALUES ($1, $2, $3, $4)", user, dayIndex, questId, true)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to insert daily quest into postgres", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	// Update user's extra pixels
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ExtraPixels (address, available, used) VALUES ($1, $2, 0) ON CONFLICT (address) DO UPDATE SET available = ExtraPixels.available + $2", user, reward)
	if err != nil {
		PrintIndexerError("processDailyQuestClaimedEvent", "Failed to update user's extra pixels", dayIndexHex, questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}
}

func revertDailyQuestClaimedEvent(event IndexerEvent) {
	// TODO
}

func processMainQuestClaimedEvent(event IndexerEvent) {
	questIdHex := event.Event.Keys[1]
	user := event.Event.Keys[2][2:] // Remove 0x prefix
	rewardHex := event.Event.Data[0]
	calldataLenHex := event.Event.Data[1]
	calldata := []string{}

	questId, err := strconv.ParseInt(questIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMainQuestClaimedEvent", "Failed to parse questId", questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	reward, err := strconv.ParseInt(rewardHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMainQuestClaimedEvent", "Failed to parse reward", questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	calldataLen, err := strconv.ParseInt(calldataLenHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMainQuestClaimedEvent", "Failed to parse calldataLen", questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	if calldataLen > 0 {
		calldata = event.Event.Data[2:][2:] // Remove 0x prefix
	}

	// Add main quest info into postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO UserMainQuests (user_address, quest_id, completed) VALUES ($1, $2, $3)", user, questId, true)
	if err != nil {
		PrintIndexerError("processMainQuestClaimedEvent", "Failed to insert main quest into postgres", questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}

	// Update user's extra pixels
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ExtraPixels (address, available, used) VALUES ($1, $2, 0) ON CONFLICT (address) DO UPDATE SET available = ExtraPixels.available + $2", user, reward)
	if err != nil {
		PrintIndexerError("processMainQuestClaimedEvent", "Failed to update user's extra pixels", questIdHex, user, rewardHex, calldataLenHex, calldata)
		return
	}
}

func revertMainQuestClaimedEvent(event IndexerEvent) {
	// TODO
}
