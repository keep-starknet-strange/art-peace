#!/bin/bash
#
# Continuous load test

BOARD_CONTRACT=$1

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# TODO: load all 10 accounts and do this with each of them
while true; do
  $SCRIPT_DIR/set-board-rand.sh $BOARD_CONTRACT &
  # Sleep for 100ms
  sleep 0.1
done
