#!/bin/bash
#
# This script runs the integration tests.

# TODO: Host?
RPC_HOST="127.0.0.1"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR

OUTPUT_DIR=$HOME/.art-peace-test
TIMESTAMP=$(date +%s)
LOG_DIR=$OUTPUT_DIR/logs/$TIMESTAMP
TMP_DIR=$OUTPUT_DIR/tmp/$TIMESTAMP

# TODO: Clean option to remove old logs and state
rm -rf $OUTPUT_DIR/logs/*
rm -rf $OUTPUT_DIR/tmp/*
mkdir -p $LOG_DIR
mkdir -p $TMP_DIR

ACCOUNT_NAME=art_peace_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_PROFILE=starknet-devnet
ACCOUNT_FILE=$TMP_DIR/starknet_accounts.json

sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE account add --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY


CONTRACT_DIR=$WORK_DIR/onchain
CLASS_NAME="ArtPeace"

CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CLASS_NAME | tail -n 1)
CLASS_HASH=$(echo $CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$CLASS_NAME\" with hash $CLASS_HASH"

CONTRACT_DEPLOY_RESULT=$(sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH | tail -n 1)
CONTRACT_ADDRESS=$(echo $CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$CLASS_NAME\" with address $CONTRACT_ADDRESS"

# TODO
# MULTICALL_TEMPLATE_DIR=$CONTRACT_DIR/tests/multicalls
# 
# HELLO_STARKNET_MULTI_TEMPLATE=$MULTICALL_TEMPLATE_DIR/HelloStarknet.toml
# HELLO_STARKNET_MULTI=$TMP_DIR/HelloStarknet.toml
# sed "s/\$CONTRACT_ADDRESS/$CONTRACT_ADDRESS/g" $HELLO_STARKNET_MULTI_TEMPLATE > $HELLO_STARKNET_MULTI
# sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait multicall run --path $HELLO_STARKNET_MULTI
# 
# sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait call --contract-address $CONTRACT_ADDRESS --function get_balance --block-id latest
