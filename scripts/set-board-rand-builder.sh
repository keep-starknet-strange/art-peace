#!/bin/bash
#
# Draws something on the canvas

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

# Load env variable from `.env` only if they're not already set
if [ -z "$STARKNET_KEYSTORE" ] || [ -z "$STARKNET_ACCOUNT" ]; then
  source $WORK_DIR/.env
fi

# Check if required env variables are set, if not exit
if [ -z "$STARKNET_KEYSTORE" ]; then
  echo "Error: STARKNET_KEYSTORE is not set."
  exit 1
elif [ -z "$STARKNET_ACCOUNT" ]; then
  echo "Error: STARKNET_ACCOUNT is not set."
  exit 1
fi

GAME_CONTRACTS=$WORK_DIR/configs/sepolia-contracts.config.json
BOARD_CONTRACT=$(cat $GAME_CONTRACTS | jq -r '.artPeace')

TEMPLATE_FILE=$1
TEMPLATE_LEN=$(cat $TEMPLATE_FILE | wc -l)

RAND_POS=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
# Get the RAND_POS line in the template file
RAND_LINE=$(sed -n "$((RAND_POS+1))p" $TEMPLATE_FILE)
# Read pos and color from line formatted like: <pos> <color>
POSITION=$(echo $RAND_LINE | awk '{print $1}')
COLOR=$(echo $RAND_LINE | awk '{print $2}')

echo "Placing pixel at $POSITION with color $COLOR"

TIME=$(date +%s)

echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $BOARD_CONTRACT place_pixel $POSITION $COLOR $TIME"
starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $BOARD_CONTRACT place_pixel $POSITION $COLOR $TIME

# remove the line from the template file
sed -in "$((RAND_POS+1))d" $TEMPLATE_FILE
