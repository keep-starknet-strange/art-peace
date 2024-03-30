#!/bin/bash
#
# Print the board state

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

BOARD_CONTRACT=$1
TEMPLATE=$2

RPC_URL=http://localhost:5050
CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json

# Get the board dimensions
BOARD_WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
BOARD_HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
echo "Board dimensions: $BOARD_WIDTH x $BOARD_HEIGHT"

RAND_X=$(shuf -i 0-$((BOARD_WIDTH-1)) -n 1)
RAND_Y=$(shuf -i 0-$((BOARD_HEIGHT-1)) -n 1)
RAND_POS=$(($RAND_X + $RAND_Y * $BOARD_WIDTH))
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG)

FORMAT_STRING='#%[hex:p{'$RAND_X','$RAND_Y'}]'
TEMPLATE_PIXEL_VALUE=$(convert $TEMPLATE -format "$FORMAT_STRING" info:)

# Get color closest to the template pixel wrt r g b distance
R_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 2-3)
G_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 4-5)
B_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 6-7)
echo "Template pixel value: $TEMPLATE_PIXEL_VALUE - R: $R_VAL, G: $G_VAL, B: $B_VAL"

CLOSEST_COLOR=${COLORS[0]}
MIN_DIST=1000000
RAND_COLOR=0
IDX=0
for COLOR in $COLORS;
do
    R=$(echo $COLOR | cut -c 2-3)
    G=$(echo $COLOR | cut -c 4-5)
    B=$(echo $COLOR | cut -c 6-7)
    DIST=$(echo "sqrt(($R_VAL - $R)^2 + ($G_VAL - $G)^2 + ($B_VAL - $B)^2)" | bc -l)
    if (( $(echo "$DIST < $MIN_DIST" | bc -l) )); then
        MIN_DIST=$DIST
        CLOSEST_COLOR=$COLOR
        RAND_COLOR=$IDX
    fi
    IDX=$((IDX+1))
done

echo "Placing pixel at ($RAND_X, $RAND_Y) with color $CLOSEST_COLOR"

# Place a pixel
# ~/.art-peace-tests/tmp/1711605675/starknet_accounts.json
#$(ls $HOME/.l2-place-test/tmp/*/madara-dev-account.json)
ACCOUNT_FILE=~/.art-peace-tests/tmp/1711682661/starknet_accounts.json
ACCOUNT_NAME=art_peace_acct
echo "Placing pixel at ($RAND_X, $RAND_Y) with color $RAND_COLOR - POS: $RAND_POS"
sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME invoke --contract-address $BOARD_CONTRACT --function place_pixel --calldata $RAND_POS $RAND_COLOR
#echo "starkli invoke $BOARD_CONTRACT place_pixel $RAND_X $RAND_Y $RAND_COLOR --rpc $RPC_URL --account $ACCOUNT_FILE --keystore $KEYSTORE_FILE --keystore-password $KEYSTORE_PASSWORD"

# TODO: alternate async version
