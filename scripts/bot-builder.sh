#!/bin/bash
#
# Use accounts to run builders

echo "Running bot builder"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

ACCOUNTS_DIR=$1
TEMPLATE_FILE=$2

# loop thru all files of format art-peace-<decimal>.json
for file in $ACCOUNTS_DIR/art-peace-*-signer.json; do
  SIGNER=$(basename $file)
  ACCOUNT=$(echo $SIGNER | sed 's/-signer.json/.json/')
  $SCRIPT_DIR/builder-full.sh $TEMPLATE_FILE $ACCOUNTS_DIR/$ACCOUNT $ACCOUNTS_DIR/$SIGNER &
  sleep 2
done
