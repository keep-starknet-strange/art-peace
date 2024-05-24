package indexer

import (
	"math/big"
)


func combineLowAndHighTokenId(tokenIdLowInt, tokenIdHighInt int64) (*big.Int) {
	// Convert int64 parts to big.Int
	low :=  new(big.Int).SetInt64(tokenIdLowInt)
	high := new(big.Int).SetInt64(tokenIdHighInt)

	// Shift tokenIdHighHex left by 128 bits and add to tokenIdLowHex
	high.Lsh(high, 128)
	tokenId := new(big.Int).Add(low, high)

	return tokenId
}