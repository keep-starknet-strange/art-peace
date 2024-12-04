#!/bin/bash
#
# This script deploys the ArtPeace contract to the StarkNet devnet in docker

RPC_HOST="devnet"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

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

/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE account add --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY

CONTRACT_DIR=$WORK_DIR/onchain
CANVAS_CONTRACT_NAME="Canvas"

CANVAS_CLASS_DECLARATION_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CANVAS_CONTRACT_NAME | tail -n 1)
CANVAS_CLASS_HASH=$(echo $CANVAS_CLASS_DECLARATION_RESULT | jq -r '.class_hash')

CANVAS_FACTORY_CLASS_NAME="CanvasFactory"

#TODO: Issue if no declare done
CANVAS_FACTORY_CLASS_DECLARATION_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CANVAS_FACTORY_CLASS_NAME | tail -n 1)
CANVAS_FACTORY_CLASS_HASH=$(echo $CANVAS_FACTORY_CLASS_DECLARATION_RESULT | jq -r '.class_hash')
echo "Declared class \"$CANVAS_FACTORY_CLASS_NAME\" with hash $CANVAS_FACTORY_CLASS_HASH"

CALLDATA=$(echo -n $ACCOUNT_ADDRESS $CANVAS_CLASS_HASH)

# Precalculated contract address
# echo "Precalculating contract address..."

# TODO: calldata passed as parameters
echo "Deploying contract \"$CANVAS_FACTORY_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CANVAS_FACTORY_CLASS_HASH --constructor-calldata $CALLDATA"
CANVAS_FACTORY_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CANVAS_FACTORY_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
CANVAS_FACTORY_CONTRACT_ADDRESS=$(echo $CANVAS_FACTORY_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$CANVAS_FACTORY_CLASS_NAME\" with address $CANVAS_FACTORY_CONTRACT_ADDRESS"


# TODO: Remove these lines?
echo "CANVAS_FACTORY_CONTRACT_ADDRESS=$CANVAS_FACTORY_CONTRACT_ADDRESS" > /configs/configs.env
echo "REACT_APP_CANVAS_FACTORY_CONTRACT_ADDRESS=$CANVAS_FACTORY_CONTRACT_ADDRESS" >> /configs/configs.env
