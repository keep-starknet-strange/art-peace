#!/bin/bash
#
# This script deploys both MultiCanvas and ArtPeace contracts to the StarkNet devnet in docker

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

mkdir -p $LOG_DIR
mkdir -p $TMP_DIR

ACCOUNT_NAME=art_peace_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_PROFILE=starknet-devnet
ACCOUNT_FILE=$TMP_DIR/starknet_accounts.json

/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE account add --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY

CONTRACT_DIR=$WORK_DIR/onchain

# First deploy MultiCanvas
CANVAS_FACTORY_CLASS_NAME="MultiCanvas"

#TODO: Issue if no declare done
CANVAS_FACTORY_CLASS_DECLARATION_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CANVAS_FACTORY_CLASS_NAME | tail -n 1)
CANVAS_FACTORY_CLASS_HASH=$(echo $CANVAS_FACTORY_CLASS_DECLARATION_RESULT | jq -r '.class_hash')
echo "Declared class \"$CANVAS_FACTORY_CLASS_NAME\" with hash $CANVAS_FACTORY_CLASS_HASH"

CALLDATA=$(echo -n $ACCOUNT_ADDRESS)

echo "Deploying contract \"$CANVAS_FACTORY_CLASS_NAME\"..."
CANVAS_FACTORY_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CANVAS_FACTORY_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
CANVAS_FACTORY_CONTRACT_ADDRESS=$(echo $CANVAS_FACTORY_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$CANVAS_FACTORY_CLASS_NAME\" with address $CANVAS_FACTORY_CONTRACT_ADDRESS"

# Then deploy ArtPeace
ART_PEACE_CLASS_NAME="ArtPeace"

ART_PEACE_CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $ART_PEACE_CLASS_NAME | tail -n 1)
ART_PEACE_CLASS_HASH=$(echo $ART_PEACE_CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$ART_PEACE_CLASS_NAME\" with hash $ART_PEACE_CLASS_HASH"

CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
PLACE_DELAY=30
COLOR_COUNT=$(jq -r '.colors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG | sed 's/^/0x/')
VOTABLE_COLOR_COUNT=0
VOTABLE_COLORS=""
DAILY_NEW_COLORS_COUNT=0
START_TIME=0
END_TIME=3000000000
DAILY_QUESTS_COUNT=0
DEVNET_MODE=1

CALLDATA=$(echo -n $ACCOUNT_ADDRESS $WIDTH $HEIGHT $PLACE_DELAY $COLOR_COUNT $COLORS $VOTABLE_COLOR_COUNT $VOTABLE_COLORS $DAILY_NEW_COLORS_COUNT $START_TIME $END_TIME $DAILY_QUESTS_COUNT $DEVNET_MODE)

echo "Deploying contract \"$ART_PEACE_CLASS_NAME\"..."
ART_PEACE_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $ART_PEACE_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
ART_PEACE_CONTRACT_ADDRESS=$(echo $ART_PEACE_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$ART_PEACE_CLASS_NAME\" with address $ART_PEACE_CONTRACT_ADDRESS"

# Write both addresses to configs.env
echo "CANVAS_FACTORY_CONTRACT_ADDRESS=$CANVAS_FACTORY_CONTRACT_ADDRESS" > /configs/configs.env
echo "REACT_APP_CANVAS_FACTORY_CONTRACT_ADDRESS=$CANVAS_FACTORY_CONTRACT_ADDRESS" >> /configs/configs.env
echo "ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS" >> /configs/configs.env
echo "REACT_APP_ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS" >> /configs/configs.env
