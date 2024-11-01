#!/bin/bash
ENVIRONMENT="docker"
NETWORK="docker"
ART_PEACE_CONTRACT="0x1ab2cbeca04513431467026958fe15833ae4fb7dfd2466043161dc02a2efb7a"

# Set up account variables
TIMESTAMP=$(date +%s)
TMP_DIR=$HOME/.art-peace-tests/tmp/$TIMESTAMP
mkdir -p $TMP_DIR

ACCOUNT_NAME=art_peace_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_FILE=$TMP_DIR/starknet_accounts.json
export RPC_URL="http://localhost:5050"

# Add the test account credentials
sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE account add \
    --name $ACCOUNT_NAME \
    --address $ACCOUNT_ADDRESS \
    --private-key $ACCOUNT_PRIVATE_KEY

source "$(dirname "$0")/reward.sh" "$1"