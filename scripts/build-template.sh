#!/bin/bash
#
# Build a template on the canvas contract with multiple accounts

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

CANVAS_CONTRACT=$1
TEMPLATE=$2

CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
TOTAL_PIXELS=$((WIDTH * HEIGHT))

ACCOUNT_1=$HOME/.art-peace-accounts/starknet_accounts_1.json
ACCOUNT_2=$HOME/.art-peace-accounts/starknet_accounts_2.json
ACCOUNT_3=$HOME/.art-peace-accounts/starknet_accounts_3.json
ACCOUNT_4=$HOME/.art-peace-accounts/starknet_accounts_4.json
ACCOUNT_5=$HOME/.art-peace-accounts/starknet_accounts_5.json
ACCOUNT_6=$HOME/.art-peace-accounts/starknet_accounts_6.json

# TODO: load all 10 accounts and do this with each of them
X=0
Y=0
while [ $Y -lt $HEIGHT ]; do
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $Y $ACCOUNT_1
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $(($Y + 1)) $ACCOUNT_2
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $(($Y + 2)) $ACCOUNT_3
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $(($Y + 3)) $ACCOUNT_4
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $(($Y + 4)) $ACCOUNT_5
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $(($Y + 5)) $ACCOUNT_6
  # Sleep for 500ms
  # sleep 0.2
  X=$((X + 1))
  if [ $X -eq $WIDTH ]; then
    X=0
    Y=$((Y + 6))
  fi
done
