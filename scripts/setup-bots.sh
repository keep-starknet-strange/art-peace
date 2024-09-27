#!/bin/bash
#
# Use accounts to run builders

echo "Setting up bots"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

ACCOUNTS_DIR=$1
ART_PEACE_CONTRACT=0x06fde2e43914b859e7e554585d3bc0dbf93d3b0187096a7bdb2c4fe1d4e1547d

# loop thru all files of format art-peace-<decimal>.json
for file in $ACCOUNTS_DIR/art-peace-*-signer.json; do
  SIGNER=$(basename $file)
  ACCOUNT=$(echo $SIGNER | sed 's/-signer.json/.json/')
  #$SCRIPT_DIR/builder-full.sh $TEMPLATE_FILE $ACCOUNTS_DIR/$ACCOUNT $ACCOUNTS_DIR/$SIGNER
  #TODO: randomize the faction
  starkli invoke --network sepolia --keystore $ACCOUNTS_DIR/$SIGNER --account $ACCOUNTS_DIR/$ACCOUNT --watch $ART_PEACE_CONTRACT join_faction 1
  starkli invoke --network sepolia --keystore $ACCOUNTS_DIR/$SIGNER --account $ACCOUNTS_DIR/$ACCOUNT --watch $ART_PEACE_CONTRACT join_chain_faction 1
done
