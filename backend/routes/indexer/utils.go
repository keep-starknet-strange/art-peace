package indexer

import (
	"fmt"
	"math/big"
)

func combineLowHigh(lowHex string, highHex string) (*big.Int, error) {
	// Convert the high and low hex strings to big.Int
	low := new(big.Int)
	high := new(big.Int)

	// Set the big.Int values
	low, ok := low.SetString(lowHex, 16)
	if !ok {
		return nil, fmt.Errorf("invalid low hex string: %s", lowHex)
	}

	high, ok = high.SetString(highHex, 16)
	if !ok {
		return nil, fmt.Errorf("invalid high hex string: %s", highHex)
	}

	// Shift the high part by 128 bits to the left (16 hex digits)
	high.Lsh(high, 128)

	// Add the low part to the shifted high part
	combined := new(big.Int).Add(low, high)

	return combined, nil
}
