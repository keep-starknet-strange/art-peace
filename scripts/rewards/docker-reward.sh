#!/bin/bash
ENVIRONMENT="docker"
RPC_URL="http://localhost:5050"
ACCOUNT_FILE="~/.art-peace-tests/tmp/starknet_accounts.json"
ACCOUNT_NAME="art_peace_acct"
ART_PEACE_CONTRACT="" # Add contract address

source "$(dirname "$0")/reward.sh" "$1"