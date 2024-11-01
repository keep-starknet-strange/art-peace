#!/bin/bash
ENVIRONMENT="docker"
NETWORK="docker"
ART_PEACE_CONTRACT="" # Add contract address

export STARKNET_RPC="http://localhost:5050"

source "$(dirname "$0")/reward.sh" "$1"