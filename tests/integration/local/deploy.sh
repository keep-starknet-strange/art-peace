#!/bin/bash
#
# This script runs the integration tests.

RPC_HOST="127.0.0.1"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../../..

#TODO: 2 seperate directories when called from the test script
OUTPUT_DIR=$HOME/.art-peace-tests
TIMESTAMP=$(date +%s)
LOG_DIR=$OUTPUT_DIR/logs/$TIMESTAMP
TMP_DIR=$OUTPUT_DIR/tmp/$TIMESTAMP

# TODO: Clean option to remove old logs and state
#rm -rf $OUTPUT_DIR/logs/*
#rm -rf $OUTPUT_DIR/tmp/*
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

#TODO: Issue if no declare done
CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CLASS_NAME | tail -n 1)
CLASS_HASH=$(echo $CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$CLASS_NAME\" with hash $CLASS_HASH"

CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
PLACE_DELAY=0x00
COLOR_COUNT=$(jq -r '.colors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG | sed 's/^/0x/')
END_TIME=3000000000

# [WIDTH, HEIGHT, TIME_BETWEEN_PIXELS, COLOR_PALLETE_LEN, COLORS, END_TIME, DAILY_QUESTS_LEN, DAILY_QUESTS, DAILY_QUESTS_LEN, MAIN_QUESTS]
CALLDATA=$(echo -n $WIDTH $HEIGHT $PLACE_DELAY $COLOR_COUNT $COLORS $END_TIME 0 0 0)
echo "Calldata: $CALLDATA"
# TODO: calldata passed as parameters
echo "Deploying contract \"$CLASS_NAME\"..."
echo "sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA"
CONTRACT_DEPLOY_RESULT=$(sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
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
