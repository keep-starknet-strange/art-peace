#!/bin/bash
#
# Draws something on the canvas

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

TEMPLATE_FILE=$1
ACCOUNT_FILE=$2
SIGNER_FILE=$3

FILE_LEN=$(cat $TEMPLATE_FILE | wc -l)
# loop till file empty
while [ $FILE_LEN -gt 0 ]
do
  $SCRIPT_DIR/set-board-rand-builder4.sh $TEMPLATE_FILE $ACCOUNT_FILE $SIGNER_FILE
  # Wait 30 seconds
  sleep 30
  FILE_LEN=$(cat $TEMPLATE_FILE | wc -l)
done
