package indexer

import (
	"fmt"
	"math/big"
	"strings"
)

func combineLowHigh(tokenIdLowHex, tokenIdHighHex string) (*big.Int, error) {
	// Remove leading zeros from the hex strings
	tokenIdLowHex = strings.TrimLeft(tokenIdLowHex, "0")
	tokenIdHighHex = strings.TrimLeft(tokenIdHighHex, "0")

	// Combine the low and high hex strings
	combinedHex := tokenIdHighHex + tokenIdLowHex

	// Convert the combined hex string to a big.Int
	tokenId := new(big.Int)
	tokenId, ok := tokenId.SetString(combinedHex, 16)
	if !ok {
		return nil, fmt.Errorf("invalid hex string: %s", combinedHex)
	}

	return tokenId, nil
}
