#!/bin/bash
#
# This script deploys the ArtPeace contract to the StarkNet devnet in docker

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT=$SCRIPT_DIR/../../..
WORK_DIR=$PROJECT_ROOT

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
CANVAS_NFT_CONTRACT=0x040d7f7a6ec27d8ffc9e993ac9b307007356c3b3c6d5b12717953659ccd3df51
USERNAME_STORE_CONTRACT=0x073128a9f7b38d2bcdb6c1f9ef4fea357de4dfe2fab5832c1e7b51e9aae97c51

CONTRACT_DIR=$WORK_DIR/onchain

QUESTS_CONFIG=$WORK_DIR/configs/production-quests.config.json
echo "Declaring quest contracts..."
echo
CONTRACT_TYPES=$(jq -r '[.daily.dailyQuests[].quests[].questContract.type,.main.mainQuests[].questContract.type] | unique | .[]' $QUESTS_CONFIG)
DECLARED_CONTRACT_TYPES=( )
DECLARED_CONTRACT_HASHES=( )
# For each contract type echo
for CONTRACT_TYPE in $CONTRACT_TYPES; do
  echo "  Declaring $CONTRACT_TYPE contract..."
  QUEST_SIERRA_FILE=$CONTRACT_DIR/target/dev/art_peace_$CONTRACT_TYPE.contract_class.json
  echo "starkli declare --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $QUEST_SIERRA_FILE"
  QUEST_DECLARE_OUTPUT=$(starkli declare --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $QUEST_SIERRA_FILE 2>&1)
  CLASS_HASH=$(echo $QUEST_DECLARE_OUTPUT | tail -n 1 | awk '{print $NF}')
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
    CLASS_HASH=${DECLARED_CONTRACT_HASHES[$CLASS_HASH_IDX-1]}
    echo "      Using class hash $CLASS_HASH"
    echo "starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $CLASS_HASH $CALLDATA"
    QUEST_DEPLOY_OUTPUT=$(starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $CLASS_HASH $CALLDATA 2>&1)
    CONTRACT_ADDRESS=$(echo $QUEST_DEPLOY_OUTPUT | tail -n 1 | awk '{print $NF}')
    echo "      Deployed contract \"$QUEST_NAME\" with address $CONTRACT_ADDRESS"
    DAILY_QUEST_CONTRACTS+=( $CONTRACT_ADDRESS )
    echo
  done
  echo "  Deployed daily quest contracts: ${DAY_IDX} -- ${DAILY_QUEST_CONTRACTS[@]}"
  echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS add_daily_quests $DAY_IDX ${#DAILY_QUEST_CONTRACTS[@]} ${DAILY_QUEST_CONTRACTS[@]}"
  starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS add_daily_quests $DAY_IDX ${#DAILY_QUEST_CONTRACTS[@]} ${DAILY_QUEST_CONTRACTS[@]}
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
  CLASS_HASH=${DECLARED_CONTRACT_HASHES[$CLASS_HASH_IDX-1]}
  echo "    Using class hash $CLASS_HASH"
  echo "starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $CLASS_HASH $CALLDATA"
  QUEST_DEPLOY_OUTPUT=$(starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $CLASS_HASH $CALLDATA 2>&1)
  CONTRACT_ADDRESS=$(echo $QUEST_DEPLOY_OUTPUT | tail -n 1 | awk '{print $NF}')
  echo "    Deployed contract \"$QUEST_NAME\" with address $CONTRACT_ADDRESS"
  MAIN_QUEST_CONTRACTS+=( $CONTRACT_ADDRESS )
  echo
done
echo "Deployed main quest contracts: ${MAIN_QUEST_CONTRACTS[@]}"
echo "starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS add_main_quests ${#MAIN_QUEST_CONTRACTS[@]} ${MAIN_QUEST_CONTRACTS[@]}"
starkli invoke --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_ADDRESS add_main_quests ${#MAIN_QUEST_CONTRACTS[@]} ${MAIN_QUEST_CONTRACTS[@]}

#echo "Setting up contract \"$ART_PEACE_CLASS_NAME\"..."
#echo "/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function set_nft_contract --calldata $NFT_CONTRACT_ADDRESS"
#/root/.local/bin/sncast --url $RPC_URL --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $ART_PEACE_CONTRACT_ADDRESS --function add_nft_contract --calldata $NFT_CONTRACT_ADDRESS
