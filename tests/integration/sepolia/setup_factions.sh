#!/bin/bash
#
# This script runs the integration tests.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../../..
PROJECT_ROOT=$WORK_DIR

# Load env variable from `.env` only if they're not already set
if [ -z "$STARKNET_KEYSTORE" ] || [ -z "$STARKNET_ACCOUNT" ]; then
  source $PROJECT_ROOT/.env
fi

# Check if required env variables are set, if not exit
if [ -z "$STARKNET_KEYSTORE" ]; then
  echo "Error: STARKNET_KEYSTORE is not set."
  exit 1
elif [ -z "$STARKNET_ACCOUNT" ]; then
  echo "Error: STARKNET_ACCOUNT is not set."
  exit 1
fi

ART_PEACE_CONTRACT_ADDRESS=0x04d88b27976e74363163d97d6eb4505007c102b7c7cdb8b7bac5ea75fec6e998

FACTIONS_CONFIG_FILE=$WORK_DIR/configs/factions.config.json

for entry in $(cat $FACTIONS_CONFIG_FILE | jq -r '.factions.[] | @base64'); do
  _jq() {
    echo ${entry} | base64 --decode | jq -r ${1}
  }

  FACTION_ID=$(_jq '.id')
  FACTION_NAME=$(_jq '.name')
  FACTION_LEADER=$(_jq '.leader')
  JOINABLE=$(_jq '.joinable')
  ALLOCATION=$(_jq '.allocation')

  # Add faction onchain
  FACTION_NAME_HEX=0x$(echo -n $FACTION_NAME | xxd -p)
  FACTION_JOINABLE_HEX=1
  if [ "$JOINABLE" = "false" ]; then
    FACTION_JOINABLE_HEX=0
  fi

  CALLDATA="$FACTION_NAME_HEX $FACTION_LEADER $FACTION_JOINABLE_HEX $ALLOCATION"
  echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS init_faction $CALLDATA"
  starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS init_faction $CALLDATA
done

for entry in $(cat $FACTIONS_CONFIG_FILE | jq -r '.chain_factions.[]'); do
  FACTION_NAME=$entry
  FACTION_NAME_HEX=0x$(echo -n $FACTION_NAME | xxd -p)

  CALLDATA="$FACTION_NAME_HEX"
  echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS init_chain_faction $CALLDATA"
  starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS init_chain_faction $CALLDATA
done

# #TODO: rename script and make more generic
