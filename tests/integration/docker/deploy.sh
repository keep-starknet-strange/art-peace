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
ART_PEACE_CLASS_NAME="ArtPeace"

#TODO: Issue if no declare done
ART_PEACE_CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $ART_PEACE_CLASS_NAME | tail -n 1)
ART_PEACE_CLASS_HASH=$(echo $ART_PEACE_CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$ART_PEACE_CLASS_NAME\" with hash $ART_PEACE_CLASS_HASH"

CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json
QUESTS_CONFIG=$WORK_DIR/configs/quests.config.json
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
PLACE_DELAY=0x00
COLOR_COUNT=$(jq -r '.colors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG | sed 's/^/0x/')
VOTABLE_COLOR_COUNT=$(jq -r '.votableColors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
VOTABLE_COLORS=$(jq -r '.votableColors[]' $CANVAS_CONFIG | sed 's/^/0x/')
DAILY_NEW_COLORS_COUNT=3
END_TIME=3000000000
DAILY_QUESTS_COUNT=$(jq -r '.daily.dailyQuestsCount' $QUESTS_CONFIG)

CALLDATA=$(echo -n $ACCOUNT_ADDRESS $WIDTH $HEIGHT $PLACE_DELAY $COLOR_COUNT $COLORS $VOTABLE_COLOR_COUNT $VOTABLE_COLORS $DAILY_NEW_COLORS_COUNT $END_TIME $DAILY_QUESTS_COUNT)

# Precalculated contract address
# echo "Precalculating contract address..."

# TODO: calldata passed as parameters
echo "Deploying contract \"$ART_PEACE_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $ART_PEACE_CLASS_HASH --constructor-calldata $CALLDATA"
ART_PEACE_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $ART_PEACE_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
ART_PEACE_CONTRACT_ADDRESS=$(echo $ART_PEACE_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$ART_PEACE_CLASS_NAME\" with address $ART_PEACE_CONTRACT_ADDRESS"


NFT_CLASS_NAME="CanvasNFT"

NFT_CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $NFT_CLASS_NAME | tail -n 1)
NFT_CLASS_HASH=$(echo $NFT_CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$NFT_CLASS_NAME\" with hash $NFT_CLASS_HASH"

NFT_NAME="0 318195848183955342120051 10"
NFT_SYMBOL="0 4271952 3"
CALLDATA=$(echo -n $NFT_NAME $NFT_SYMBOL)

echo "Deploying contract \"$NFT_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $NFT_CLASS_HASH --constructor-calldata $CALLDATA"
NFT_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $NFT_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
NFT_CONTRACT_ADDRESS=$(echo $NFT_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$NFT_CLASS_NAME\" with address $NFT_CONTRACT_ADDRESS"

echo "Setting up contract \"$ART_PEACE_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function set_nft_contract --calldata $NFT_CONTRACT_ADDRESS"
/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_nft_contract --calldata $NFT_CONTRACT_ADDRESS

USERNAME_STORE_CLASS_NAME="UsernameStore"

USERNAME_STORE_CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $USERNAME_STORE_CLASS_NAME | tail -n 1)
USERNAME_STORE_CLASS_HASH=$(echo $USERNAME_STORE_CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$USERNAME_STORE_CLASS_NAME\" with hash $USERNAME_STORE_CLASS_HASH"

echo "Deploying contract \"$USERNAME_STORE_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $USERNAME_STORE_CLASS_HASH"
USERNAME_STORE_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $USERNAME_STORE_CLASS_HASH | tail -n 1)
USERNAME_STORE_ADDRESS=$(echo $USERNAME_STORE_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$USERNAME_STORE_CLASS_NAME\" with address $USERNAME_STORE_ADDRESS"

ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS ACCOUNT_FILE=$ACCOUNT_FILE $SCRIPT_DIR/deploy_quests.sh

# TODO: Remove these lines?
echo "ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS" > /configs/configs.env
echo "REACT_APP_ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS" >> /configs/configs.env
echo "NFT_CONTRACT_ADDRESS=$NFT_CONTRACT_ADDRESS" >> /configs/configs.env
echo "REACT_APP_NFT_CONTRACT_ADDRESS=$NFT_CONTRACT_ADDRESS" >> /configs/configs.env
echo "USERNAME_STORE_ADDRESS=$USERNAME_STORE_ADDRESS" >> /configs/configs.env
echo "REACT_APP_USERNAME_STORE_ADDRESS=$USERNAME_STORE_ADDRESS" >> /configs/configs.env

# TODO
# MULTICALL_TEMPLATE_DIR=$CONTRACT_DIR/tests/multicalls
# 
# HELLO_STARKNET_MULTI_TEMPLATE=$MULTICALL_TEMPLATE_DIR/HelloStarknet.toml
# HELLO_STARKNET_MULTI=$TMP_DIR/HelloStarknet.toml
# sed "s/\$CONTRACT_ADDRESS/$CONTRACT_ADDRESS/g" $HELLO_STARKNET_MULTI_TEMPLATE > $HELLO_STARKNET_MULTI
# sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait multicall run --path $HELLO_STARKNET_MULTI
# 
# sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait call --contract-address $CONTRACT_ADDRESS --function get_balance --block-id latest
#
# TODO: exit 1 on failure
