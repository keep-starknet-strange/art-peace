#!/bin/bash
ENVIRONMENT="sepolia" 
NETWORK="sepolia"
ART_PEACE_CONTRACT="0x078f4e772300472a68a19f2b1aedbcb7cf2acd6f67a2236372310a528c7eaa67"

export STARKNET_RPC="https://starknet-sepolia.public.blastapi.io"

source "$(dirname "$0")/reward.sh" "$1"