package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processNFTTransferEvent(event IndexerEvent) {
	to := event.Event.Keys[2][2:] // Remove 0x prefix
	// TODO: combine high and low token ids
	tokenIdLowHex := event.Event.Keys[3]
	// TODO tokenIdHighHex := event.Event.Keys[4]

	tokenId, err := strconv.ParseInt(tokenIdLowHex, 0, 64)
	if err != nil {
		PrintIndexerError("processNFTTransferEvent", "Error converting token id low hex to int", to, tokenIdLowHex)
		return
	}

	// Set owner
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE NFTs SET owner = $1 WHERE token_id = $2", to, tokenId)
	if err != nil {
		PrintIndexerError("processNFTTransferEvent", "Error updating owner in postgres", to, tokenIdLowHex)
		return
	}
}

func revertNFTTransferEvent(event IndexerEvent) {
  from := event.Event.Keys[1][2:] // Remove 0x prefix
  tokenIdLowHex := event.Event.Keys[3]

  tokenId, err := strconv.ParseInt(tokenIdLowHex, 0, 64)
  if err != nil {
    PrintIndexerError("revertNFTTransferEvent", "Error converting token id low hex to int", from, tokenIdLowHex)
    return
  }

  // Set owner
  _, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "UPDATE NFTs SET owner = $1 WHERE token_id = $2", from, tokenId)
  if err != nil {
    PrintIndexerError("revertNFTTransferEvent", "Error updating owner in postgres", from, tokenIdLowHex)
    return
  }
}
