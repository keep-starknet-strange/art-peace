package indexer

import (
	"context"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processNFTTransferEvent(event IndexerEvent) {
	to := event.Event.Keys[2][2:]             // Remove 0x prefix
	tokenIdLowHex := event.Event.Keys[3][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[4][2:] // Remove 0x prefix

	// combine high and low token ids
	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("processNFTTransferEvent", "Error combining high and low tokenId hex", to, tokenIdLowHex, tokenIdHighHex)
		return
	}
	tokenId := tokenIdU256.Uint64()

	// Set owner
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE NFTs SET owner = $1 WHERE token_id = $2", to, tokenId)
	if err != nil {
		PrintIndexerError("processNFTTransferEvent", "Error updating owner in postgres", to, tokenIdLowHex, tokenIdHighHex)
		return
	}
}

func revertNFTTransferEvent(event IndexerEvent) {
	from := event.Event.Keys[1][2:]           // Remove 0x prefix
	tokenIdLowHex := event.Event.Keys[3][2:]  // Remove 0x prefix
	tokenIdHighHex := event.Event.Keys[4][2:] // Remove 0x prefix

	// combine high and low token ids
	tokenIdU256, err := combineLowHigh(tokenIdLowHex, tokenIdHighHex)
	if err != nil {
		PrintIndexerError("revertNFTTransferEvent", "Error combining high and low tokenId hex", from, tokenIdLowHex, tokenIdHighHex)
		return
	}
	tokenId := tokenIdU256.Uint64()

	// Set owner
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE NFTs SET owner = $1 WHERE token_id = $2", from, tokenId)
	if err != nil {
		PrintIndexerError("revertNFTTransferEvent", "Error updating owner in postgres", from, tokenIdLowHex, tokenIdHighHex)
		return
	}
}
