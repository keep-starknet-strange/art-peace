#!/bin/bash
#
# Continuous load test

CANVAS_CONTRACT=$1
ACCOUNTS_DIR=$HOME/.art-peace-accounts/
ACCOUNTS=($(ls $ACCOUNTS_DIR))

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# TODO: load all 10 accounts and do this with each of them
IDX=0
while true; do
  $SCRIPT_DIR/set-board-rand.sh $CANVAS_CONTRACT $ACCOUNTS_DIR/${ACCOUNTS[$IDX]} &
  IDX=$((IDX+1))
  if [ $IDX -eq ${#ACCOUNTS[@]} ]; then
    IDX=0
  fi
done
