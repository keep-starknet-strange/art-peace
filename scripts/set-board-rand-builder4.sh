#!/bin/bash
#
# Draws something on the canvas

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..
STARKNET_ACCOUNT=$2
STARKNET_KEYSTORE=$3

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

RAND_POS1=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
RAND_POS2=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
RAND_POS3=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
RAND_POS4=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
# Ensure that the random position is not the same as the previous one
if [ $TEMPLATE_LEN -gt 4 ]; then
  while [ $RAND_POS2 -eq $RAND_POS1 ]; do
    RAND_POS2=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
  done
  while [ $RAND_POS3 -eq $RAND_POS1 ] || [ $RAND_POS3 -eq $RAND_POS2 ]; do
    RAND_POS3=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
  done
  while [ $RAND_POS4 -eq $RAND_POS1 ] || [ $RAND_POS4 -eq $RAND_POS2 ] || [ $RAND_POS4 -eq $RAND_POS3 ]; do
    RAND_POS4=$(shuf -i 0-$((TEMPLATE_LEN-1)) -n 1)
  done
fi
# Get the RAND_POS line in the template file
RAND_LINE1=$(sed -n "$((RAND_POS1+1))p" $TEMPLATE_FILE)
RAND_LINE2=$(sed -n "$((RAND_POS2+1))p" $TEMPLATE_FILE)
RAND_LINE3=$(sed -n "$((RAND_POS3+1))p" $TEMPLATE_FILE)
RAND_LINE4=$(sed -n "$((RAND_POS4+1))p" $TEMPLATE_FILE)
# Read pos and color from line formatted like: <pos> <color>
POSITION1=$(echo $RAND_LINE1 | awk '{print $1}')
POSITION2=$(echo $RAND_LINE2 | awk '{print $1}')
POSITION3=$(echo $RAND_LINE3 | awk '{print $1}')
POSITION4=$(echo $RAND_LINE4 | awk '{print $1}')
COLOR1=$(echo $RAND_LINE1 | awk '{print $2}')
COLOR2=$(echo $RAND_LINE2 | awk '{print $2}')
COLOR3=$(echo $RAND_LINE3 | awk '{print $2}')
COLOR4=$(echo $RAND_LINE4 | awk '{print $2}')

echo "Placing pixels at positions $POSITION1, $POSITION2, $POSITION3, $POSITION4 with colors $COLOR1, $COLOR2, $COLOR3, $COLOR4"

TIME=$(date +%s)
sed -in "$((RAND_POS1+1))d;$((RAND_POS2+1))d;$((RAND_POS3+1))d;$((RAND_POS4+1))d" $TEMPLATE_FILE

echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $BOARD_CONTRACT place_extra_pixels 4 $POSITION1 $POSITION2 $POSITION3 $POSITION4 4 $COLOR1 $COLOR2 $COLOR3 $COLOR4 $TIME"
starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --keystore-password "" --account $STARKNET_ACCOUNT --watch $BOARD_CONTRACT place_extra_pixels 4 $POSITION1 $POSITION2 $POSITION3 $POSITION4 4 $COLOR1 $COLOR2 $COLOR3 $COLOR4 $TIME

# remove the lines from the template file
