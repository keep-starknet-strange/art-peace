#!/bin/bash
#
# This script deploys the ArtPeace contract to the StarkNet devnet in docker

RPC_HOST="devnet"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

ACCOUNT_NAME=art_peace_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_PROFILE=starknet-devnet

CONTRACT_DIR=$WORK_DIR/onchain

QUESTS_CONFIG=$WORK_DIR/configs/quests.config.json
echo "Declaring quest contracts..."
echo
CONTRACT_TYPES=$(jq -r '[.daily.dailyQuests[].quests[].questContract.type,.main.mainQuests[].questContract.type] | unique | .[]' $QUESTS_CONFIG)
DECLARED_CONTRACT_TYPES=( )
DECLARED_CONTRACT_HASHES=( )
# For each contract type echo
for CONTRACT_TYPE in $CONTRACT_TYPES; do
  echo "  Declaring $CONTRACT_TYPE contract..."
  CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --contract-name $CONTRACT_TYPE | tail -n 1)
  CLASS_HASH=$(echo $CLASS_DECLARE_RESULT | jq -r '.class_hash')
  echo "    Declared class \"$CONTRACT_TYPE\" with hash $CLASS_HASH"
  if [[ ! -z $CLASS_HASH && $CLASS_HASH != "null" ]]; then
    DECLARED_CONTRACT_TYPES+=( $CONTRACT_TYPE )
    DECLARED_CONTRACT_HASHES+=( $CLASS_HASH )
  fi
done
echo "Declared contracts: ${DECLARED_CONTRACT_TYPES[@]}"
echo "Class hashes: ${DECLARED_CONTRACT_HASHES[@]}"

echo
echo "Deploying daily quest contracts..."
echo
DAILY_QUESTS=$(jq -r '[.daily.dailyQuests[]]' $QUESTS_CONFIG)
for entry in $(echo $DAILY_QUESTS | jq -r '.[] | @base64'); do
  _jq() {
    echo ${entry} | base64 --decode | jq -r ${1}
  }
  QUEST_DAY=$(_jq '.day')
  DAY_IDX=$(($QUEST_DAY-1))
  echo "  Deploying daily quest for day $QUEST_DAY..."
  echo
  QUESTS=$(_jq '[.quests[]]')
  DAILY_QUEST_CONTRACTS=( )
  for quest in $(echo $QUESTS | jq -r '.[] | @base64'); do
    _jq() {
      echo ${quest} | base64 --decode | jq -r ${1}
    }
    QUEST_NAME=$(_jq '.name')
    QUEST_REWARD=$(_jq '.reward')
    QUEST_TYPE=$(_jq '.questContract.type')
    QUEST_INIT_PARAMS=$(_jq '.questContract.initParams')
    # Do init params substitutions for $ART_PEACE_CONTRACT,$REWARD,$DAY_IDX
    QUEST_INIT_PARAMS=$(echo $QUEST_INIT_PARAMS | sed "s/\$ART_PEACE_CONTRACT/$ART_PEACE_CONTRACT_ADDRESS/g" | sed "s/\$REWARD/$QUEST_REWARD/g" | sed "s/\$DAY_IDX/$DAY_IDX/g" | sed "s/\$USERNAME_STORE_CONTRACT/$USERNAME_STORE_CONTRACT/g" | sed "s/\$CANVAS_NFT_CONTRACT/$CANVAS_NFT_CONTRACT/g")
    if [[ ! " ${DECLARED_CONTRACT_TYPES[@]} " =~ " ${QUEST_TYPE} " ]]; then
      echo "    Contract type \"$QUEST_TYPE\" not declared, skipping deployment..."
      DAILY_QUEST_CONTRACTS+=( "0x0" )
      continue
    fi
    echo "    Deploying \"$QUEST_NAME\" quest's contract..."
    echo "      Day: $QUEST_DAY -- $DAY_IDX"
    echo "      Contract type: $QUEST_TYPE"
    CALLDATA=$(echo -n $QUEST_INIT_PARAMS | jq -r '[.[]] | join(" ")')
    echo "      Contract calldata: $CALLDATA"
    CLASS_HASH_IDX=$(echo ${DECLARED_CONTRACT_TYPES[@]} | tr ' ' '\n' | grep -n ^$QUEST_TYPE$ | cut -d: -f1)
    echo "      Class hash index: $CLASS_HASH_IDX"
    CLASS_HASH=${DECLARED_CONTRACT_HASHES[$CLASS_HASH_IDX-1]}
    echo "      Using class hash $CLASS_HASH"
    echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA"
    CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
    CONTRACT_ADDRESS=$(echo $CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
    echo "      Deployed contract \"$QUEST_NAME\" with address $CONTRACT_ADDRESS"
    DAILY_QUEST_CONTRACTS+=( $CONTRACT_ADDRESS )
    echo
  done
  echo "  Deployed daily quest contracts: ${DAY_IDX} -- ${DAILY_QUEST_CONTRACTS[@]}"
  echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_daily_quests --calldata $DAY_IDX ${#DAILY_QUEST_CONTRACTS[@]} ${DAILY_QUEST_CONTRACTS[@]}"
  /root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_daily_quests --calldata $DAY_IDX ${#DAILY_QUEST_CONTRACTS[@]} ${DAILY_QUEST_CONTRACTS[@]}
  DAILY_QUEST_CONTRACTS=( )
done

echo
echo "Deploying main quest contracts..."
echo
MAIN_QUESTS=$(jq -r '[.main.mainQuests[]]' $QUESTS_CONFIG)
MAIN_QUEST_CONTRACTS=( )
for entry in $(echo $MAIN_QUESTS | jq -r '.[] | @base64'); do
  _jq() {
    echo ${entry} | base64 --decode | jq -r ${1}
  }
  QUEST_NAME=$(_jq '.name')
  QUEST_REWARD=$(_jq '.reward')
  QUEST_TYPE=$(_jq '.questContract.type')
  QUEST_INIT_PARAMS=$(_jq '.questContract.initParams')
  # Do init params substitutions for $ART_PEACE_CONTRACT,$REWARD
  QUEST_INIT_PARAMS=$(echo $QUEST_INIT_PARAMS | sed "s/\$ART_PEACE_CONTRACT/$ART_PEACE_CONTRACT_ADDRESS/g" | sed "s/\$REWARD/$QUEST_REWARD/g" | sed "s/\$USERNAME_STORE_CONTRACT/$USERNAME_STORE_CONTRACT/g" | sed "s/\$CANVAS_NFT_CONTRACT/$CANVAS_NFT_CONTRACT/g")
  if [[ ! " ${DECLARED_CONTRACT_TYPES[@]} " =~ " ${QUEST_TYPE} " ]]; then
    echo "  Contract type \"$QUEST_TYPE\" not declared, skipping deployment..."
    MAIN_QUEST_CONTRACTS+=( "0x0" )
    continue
  fi
  echo "  Deploying \"$QUEST_NAME\" quest's contract..."
  echo "    Contract type: $QUEST_TYPE"
  CALLDATA=$(echo -n $QUEST_INIT_PARAMS | jq -r '[.[]] | join(" ")')
  echo "    Contract calldata: $CALLDATA"
  CLASS_HASH_IDX=$(echo ${DECLARED_CONTRACT_TYPES[@]} | tr ' ' '\n' | grep -n ^$QUEST_TYPE$ | cut -d: -f1)
  echo "    Class hash index: $CLASS_HASH_IDX"
  CLASS_HASH=${DECLARED_CONTRACT_HASHES[$CLASS_HASH_IDX-1]}
  echo "    Using class hash $CLASS_HASH"
  echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA"
  CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --class-hash $CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
  CONTRACT_ADDRESS=$(echo $CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
  echo "    Deployed contract \"$QUEST_NAME\" with address $CONTRACT_ADDRESS"
  MAIN_QUEST_CONTRACTS+=( $CONTRACT_ADDRESS )
  echo
done
echo "Deployed main quest contracts: ${MAIN_QUEST_CONTRACTS[@]}"
echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_main_quests --calldata ${#MAIN_QUEST_CONTRACTS[@]} ${MAIN_QUEST_CONTRACTS[@]}"
/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_main_quests --calldata ${#MAIN_QUEST_CONTRACTS[@]} ${MAIN_QUEST_CONTRACTS[@]}

#echo "Setting up contract \"$ART_PEACE_CLASS_NAME\"..."
#echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function set_nft_contract --calldata $NFT_CONTRACT_ADDRESS"
#/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_nft_contract --calldata $NFT_CONTRACT_ADDRESS
