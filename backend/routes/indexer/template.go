package indexer

import (
	"context"
	"encoding/hex"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]
	templateHashHex := event.Event.Data[0]
	templateNameHex := event.Event.Data[1][2:] // Remove 0x prefix
	templatePositionHex := event.Event.Data[2]
	templateWidthHex := event.Event.Data[3]
	templateHeightHex := event.Event.Data[4]
	// TODO: Combine low and high token ids
	// templateRewardHighHex := event.Event.Data[5]
	templateRewardLowHex := event.Event.Data[6]
	templateRewardToken := event.Event.Data[7][2:] // Remove 0x prefix

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error converting template id hex to int", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	// Parse template name hex as bytes encoded in utf-8
	decodedName, err := hex.DecodeString(templateNameHex)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error decoding template name hex", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
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
	templateName := string(trimmedName)

	templatePosition, err := strconv.ParseInt(templatePositionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error converting template position hex to int", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	templateWidth, err := strconv.ParseInt(templateWidthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error converting template width hex to int", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	templateHeight, err := strconv.ParseInt(templateHeightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error converting template height hex to int", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	templateReward, err := strconv.ParseInt(templateRewardLowHex, 0, 64)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error converting template reward hex to int", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	// Add template to postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Templates (key, name, hash, position, width, height, reward, reward_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", templateId, templateName, templateHashHex, templatePosition, templateWidth, templateHeight, templateReward, templateRewardToken)
	if err != nil {
		PrintIndexerError("processTemplateAddedEvent", "Error inserting template into postgres", templateIdHex, templateHashHex, templateNameHex, templatePositionHex, templateWidthHex, templateHeightHex, templateRewardLowHex, templateRewardToken)
		return
	}

	// TODO: Ws message to all clients
}

func revertTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("reverseTemplateAddedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Remove template from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Templates WHERE key = $1", templateId)
	if err != nil {
		PrintIndexerError("reverseTemplateAddedEvent", "Error deleting template from postgres", templateIdHex)
		return
	}
}
