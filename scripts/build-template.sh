#!/bin/bash
#
# Continuous load test

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

CANVAS_CONTRACT=$1
TEMPLATE=$2

CANVAS_CONFIG=$WORK_DIR/configs/canvas.config.json
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
TOTAL_PIXELS=$((WIDTH * HEIGHT))

# TODO: load all 10 accounts and do this with each of them
X=0
Y=0
while [ $Y -lt $HEIGHT ]; do
  $SCRIPT_DIR/set-board-template.sh $CANVAS_CONTRACT $TEMPLATE $X $Y
  # Sleep for 500ms
  # sleep 0.2
  X=$((X + 1))
  if [ $X -eq $WIDTH ]; then
    X=0
    Y=$((Y + 1))
  fi
done
