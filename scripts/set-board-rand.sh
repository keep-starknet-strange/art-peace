#!/bin/bash
#
# Print the board state

BOARD_CONTRACT=$1

RPC_URL=http://localhost:5050

# Get the board dimensions
BOARD_WIDTH=16 #$(starkli call $BOARD_CONTRACT get_width --rpc $RPC_URL | jq -r '.[0]' | xargs printf "%d")
BOARD_HEIGHT=16 #$(starkli call $BOARD_CONTRACT get_height --rpc $RPC_URL | jq -r '.[0]' | xargs printf "%d")
echo "Board dimensions: $BOARD_WIDTH x $BOARD_HEIGHT"

RAND_X=$(shuf -i 0-$((BOARD_WIDTH-1)) -n 1)
RAND_Y=$(shuf -i 0-$((BOARD_HEIGHT-1)) -n 1)
RAND_POS=$(($RAND_X + $RAND_Y * $BOARD_WIDTH))
RAND_COLOR=$(shuf -i 1-5 -n 1)
echo "Placing pixel at ($RAND_X, $RAND_Y) with color $RAND_COLOR"

# Place a pixel
# ~/.art-peace-tests/tmp/1711605675/starknet_accounts.json
ACCOUNT_FILE=$HOME/.art-peace-tests/tmp/1711605675/starknet_accounts.json #$(ls $HOME/.l2-place-test/tmp/*/madara-dev-account.json)
ACCOUNT_NAME=art_peace_acct
sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME invoke --contract-address $BOARD_CONTRACT --function place_pixel --calldata $RAND_POS $RAND_COLOR
#echo "starkli invoke $BOARD_CONTRACT place_pixel $RAND_X $RAND_Y $RAND_COLOR --rpc $RPC_URL --account $ACCOUNT_FILE --keystore $KEYSTORE_FILE --keystore-password $KEYSTORE_PASSWORD"

# TODO: alternate async version
