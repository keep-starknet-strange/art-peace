#!/bin/bash
#
# Print the board state

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

CANVAS_CONTRACT=$1
TEMPLATE=$2
X=$3
Y=$4
ACCOUNT_FILE=$5

RPC_URL=http://localhost:5050

# Get the board dimensions
CANVAS_CONFIG_FILE=$WORK_DIR/configs/canvas.config.json
CANVAS_WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG_FILE)
#$(starkli call $CANVAS_CONTRACT get_width --rpc $RPC_URL | jq -r '.[0]' | xargs printf "%d")
CANVAS_HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG_FILE)
#$(starkli call $CANVAS_CONTRACT get_height --rpc $RPC_URL | jq -r '.[0]' | xargs printf "%d")
echo "Board dimensions: $CANVAS_WIDTH x $CANVAS_HEIGHT"

POS=$(($X + $Y * $CANVAS_WIDTH))
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG_FILE)

FORMAT_STRING='#%[hex:p{'$X','$Y'}]'
TEMPLATE_PIXEL_VALUE=$(convert $TEMPLATE -format "$FORMAT_STRING" info:)

# Get color closest to the template pixel wrt r g b distance
R_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 2-3)
G_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 4-5)
B_VAL=$(echo $TEMPLATE_PIXEL_VALUE | cut -c 6-7)
echo "Template pixel value: $TEMPLATE_PIXEL_VALUE - R: $R_VAL, G: $G_VAL, B: $B_VAL"

CLOSEST_COLOR=${COLORS[0]}
MIN_DIST=1000000
PLACE_COLOR=0
IDX=0
for COLOR in $COLORS;
do
    R=$(echo $COLOR | cut -c 1-2)
    G=$(echo $COLOR | cut -c 3-4)
    B=$(echo $COLOR | cut -c 5-6)
    echo "Color: $COLOR - R: $R, G: $G, B: $B"
    DIST=$(echo "sqrt(($R_VAL - $R)^2 + ($G_VAL - $G)^2 + ($B_VAL - $B)^2)" | bc -l)
    if (( $(echo "$DIST < $MIN_DIST" | bc -l) )); then
        MIN_DIST=$DIST
        CLOSEST_COLOR=$COLOR
        PLACE_COLOR=$IDX
    fi
    IDX=$((IDX+1))
done

echo "Placing pixel at ($X, $Y) with color $CLOSEST_COLOR"

# Place a pixel
# ~/.art-peace-tests/tmp/1711605675/starknet_accounts.json
#$(ls $HOME/.l2-place-test/tmp/*/madara-dev-account.json)
ACCOUNT_NAME=art_peace_acct
#if [ $PLACE_COLOR -eq 0 ]; then
#  echo "Skipping base color"
#  exit 1
#fi
echo "Placing pixel at ($X, $Y) with color $PLACE_COLOR - POS: $POS"
sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME invoke --contract-address $CANVAS_CONTRACT --function place_pixel --calldata $POS $PLACE_COLOR
#echo "starkli invoke $CANVAS_CONTRACT place_pixel $X $Y $PLACE_COLOR --rpc $RPC_URL --account $ACCOUNT_FILE --keystore $KEYSTORE_FILE --keystore-password $KEYSTORE_PASSWORD"

# TODO: alternate async version
