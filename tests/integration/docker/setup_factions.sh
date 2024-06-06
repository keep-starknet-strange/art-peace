#!/bin/bash
#
# This script runs the integration tests.

# TODO: Host?
RPC_HOST="devnet"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../../..

ACCOUNT_NAME=art_peace_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_PROFILE=starknet-devnet

FACTIONS_CONFIG_FILE="/configs/factions.config.json"

for entry in $(cat $FACTIONS_CONFIG_FILE | jq -r '.factions.[] | @base64'); do
  _jq() {
    echo ${entry} | base64 --decode | jq -r ${1}
  }

  FACTION_ID=$(_jq '.id')
  FACTION_NAME=$(_jq '.name')
  FACTION_LEADER=$(_jq '.leader')
  FACTION_POOL=$(_jq '.pool')
  FACTION_PER_MEMBER=$(_jq '.per_member')
  FACTION_MEMBERS=$(_jq '.members')

  # Add faction onchain
  FACTION_NAME_HEX=0x$(echo -n $FACTION_NAME | xxd -p)
  FACTION_MEMBERS_COUNT=$(echo $FACTION_MEMBERS | jq '. | length')
  FACTION_MEMBERS_CALLDATA=$(echo $FACTION_MEMBERS | jq -r '[.[]] | join(" ")')

  if [ $FACTION_PER_MEMBER == "true" ]; then
    POOL=$(($FACTION_POOL * $FACTION_MEMBERS_COUNT))
  else
    POOL=$FACTION_POOL
  fi

  CALLDATA="$FACTION_NAME_HEX $FACTION_LEADER $POOL $FACTION_MEMBERS_COUNT $FACTION_MEMBERS_CALLDATA"
  echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function init_faction --calldata $CALLDATA"
  /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function init_faction --calldata $CALLDATA
done

# #TODO: rename script and make more generic
