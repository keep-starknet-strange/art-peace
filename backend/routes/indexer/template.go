package indexer

import (
	"context"
	"encoding/hex"
	"strconv"
	"strings"

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

func processFactionTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]
	factionIdHex := event.Event.Data[0]
	factionTemplateHashHex := event.Event.Data[1][2:] // Remove 0x prefix
	factionTemplatePositionHex := event.Event.Data[2]
	factionTemplateWidthHex := event.Event.Data[3]
	factionTemplateHeightHex := event.Event.Data[4]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error converting template id hex to int", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}

	factionId, err := strconv.ParseInt(factionIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error converting faction id hex to int", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}

	imageHashLowercase := strings.ToLower(factionTemplateHashHex)

	factionTemplatePosition, err := strconv.ParseInt(factionTemplatePositionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error converting faction template position hex to int", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}

	factionTemplateWidth, err := strconv.ParseInt(factionTemplateWidthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error converting faction template width hex to int", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}

	factionTemplateHeight, err := strconv.ParseInt(factionTemplateHeightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error converting faction template height hex to int", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}

	// Add faction template to postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO FactionTemplates (template_id, faction_id, hash, position, width, height, stale) VALUES ($1, $2, $3, $4, $5, $6, $7)", templateId, factionId, imageHashLowercase, factionTemplatePosition, factionTemplateWidth, factionTemplateHeight, false)
	if err != nil {
		PrintIndexerError("processFactionTemplateAddedEvent", "Error inserting faction template into postgres", templateIdHex, factionIdHex, factionTemplateHashHex, factionTemplatePositionHex, factionTemplateWidthHex, factionTemplateHeightHex)
		return
	}
}

func revertFactionTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("reverseFactionTemplateAddedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Remove faction template from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM FactionTemplates WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("reverseFactionTemplateAddedEvent", "Error deleting faction template from postgres", templateIdHex)
		return
	}
}

func processFactionTemplateRemovedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processFactionTemplateRemovedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Mark faction template as stale in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE FactionTemplates SET stale = true WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("processFactionTemplateRemovedEvent", "Error marking faction template as stale in postgres", templateIdHex)
		return
	}
}

func revertFactionTemplateRemovedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("reverseFactionTemplateRemovedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Unmark faction template as stale in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE FactionTemplates SET stale = false WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("reverseFactionTemplateRemovedEvent", "Error unmarking faction template as stale in postgres", templateIdHex)
		return
	}
}

func processChainFactionTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]
	chainIdHex := event.Event.Data[0]
	chainTemplateHashHex := event.Event.Data[1][2:] // Remove 0x prefix
	chainTemplatePositionHex := event.Event.Data[2]
	chainTemplateWidthHex := event.Event.Data[3]
	chainTemplateHeightHex := event.Event.Data[4]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error converting template id hex to int", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}

	chainId, err := strconv.ParseInt(chainIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error converting chain id hex to int", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}

	imageHashLowercase := strings.ToLower(chainTemplateHashHex)

	chainTemplatePosition, err := strconv.ParseInt(chainTemplatePositionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error converting chain template position hex to int", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}

	chainTemplateWidth, err := strconv.ParseInt(chainTemplateWidthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error converting chain template width hex to int", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}

	chainTemplateHeight, err := strconv.ParseInt(chainTemplateHeightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error converting chain template height hex to int", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}

	// Add chain template to postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ChainFactionTemplates (template_id, faction_id, hash, position, width, height, stale) VALUES ($1, $2, $3, $4, $5, $6, $7)", templateId, chainId, imageHashLowercase, chainTemplatePosition, chainTemplateWidth, chainTemplateHeight, false)
	if err != nil {
		PrintIndexerError("processChainTemplateAddedEvent", "Error inserting chain template into postgres", templateIdHex, chainIdHex, chainTemplateHashHex, chainTemplatePositionHex, chainTemplateWidthHex, chainTemplateHeightHex)
		return
	}
}

func revertChainFactionTemplateAddedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("reverseChainTemplateAddedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Remove chain template from postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM ChainFactionTemplates WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("reverseChainTemplateAddedEvent", "Error deleting chain template from postgres", templateIdHex)
		return
	}
}

func processChainFactionTemplateRemovedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainTemplateRemovedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Mark chain template as stale in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ChainFactionTemplates SET stale = true WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("processChainTemplateRemovedEvent", "Error marking chain template as stale in postgres", templateIdHex)
		return
	}
}

func revertChainFactionTemplateRemovedEvent(event IndexerEvent) {
	templateIdHex := event.Event.Keys[1]

	templateId, err := strconv.ParseInt(templateIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("reverseChainTemplateRemovedEvent", "Error converting template id hex to int", templateIdHex)
		return
	}

	// Unmark chain template as stale in postgres
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ChainFactionTemplates SET stale = false WHERE template_id = $1", templateId)
	if err != nil {
		PrintIndexerError("reverseChainTemplateRemovedEvent", "Error unmarking chain template as stale in postgres", templateIdHex)
		return
	}
}
