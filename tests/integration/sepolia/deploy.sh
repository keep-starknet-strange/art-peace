#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT=$SCRIPT_DIR/../../..

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

# TODO: Host & ...
display_help() {
  echo "Usage: $0 [option...]"
  echo
  echo "   -H, --host ADDR                         Host address for ArtPeace contract"
  echo "                                            (required)"
  echo
  echo "   -h, --help                               display help"

  echo
  echo "Example: $0 --host 0x0"
}

# Transform long options to short ones
for arg in "$@"; do
  shift
  case "$arg" in
    "--host") set -- "$@" "-H" ;;
    "--help") set -- "$@" "-h" ;;
    --*) unrecognized_options+=("$arg") ;;
    *) set -- "$@" "$arg"
  esac
done

# Check if unknown options are passed, if so exit
if [ ! -z "${unrecognized_options[@]}" ]; then
  echo "Error: invalid option(s) passed ${unrecognized_options[*]}" 1>&2
  exit 1
fi

# Parse command line arguments
while getopts ":hH:" opt; do
  case ${opt} in
    H )
      HOST=$OPTARG
      ;;
    h )
      display_help
      exit 0
      ;;
    \? )
      echo "Invalid Option: -$OPTARG" 1>&2
      display_help
      exit 1
      ;;
    : )
      echo "Invalid Option: -$OPTARG requires an argument" 1>&2
      display_help
      exit 1
      ;;
  esac
done

# Check if required options are set, if not exit
if [ -z "$HOST" ]; then
  echo "Error: --host is required."
  exit 1
fi

ONCHAIN_DIR=$PROJECT_ROOT/onchain
ART_PEACE_SIERRA_FILE=$ONCHAIN_DIR/target/dev/art_peace_ArtPeace.contract_class.json

# Build the contract
echo "Building the contract..."
cd $ONCHAIN_DIR && scarb build

# Declaring the contract
echo "Declaring the contract..."
echo "starkli declare --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_SIERRA_FILE"
ART_PEACE_DECLARE_OUTPUT=$(starkli declare --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_SIERRA_FILE 2>&1)
ART_PEACE_CONTRACT_CLASSHASH=$(echo $ART_PEACE_DECLARE_OUTPUT | tail -n 1 | awk '{print $NF}')
echo "Contract class hash: $ART_PEACE_CONTRACT_CLASSHASH"

# Deploying the contract
CANVAS_CONFIG=$PROJECT_ROOT/configs/canvas.config.json
QUESTS_CONFIG=$PROJECT_ROOT/configs/quests.config.json

ACCOUNT_ADDRESS=$(cat $STARKNET_ACCOUNT | jq -r '.deployment.address')
WIDTH=$(jq -r '.canvas.width' $CANVAS_CONFIG)
HEIGHT=$(jq -r '.canvas.height' $CANVAS_CONFIG)
PLACE_DELAY=0x78
COLOR_COUNT=$(jq -r '.colors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
COLORS=$(jq -r '.colors[]' $CANVAS_CONFIG | sed 's/^/0x/')
VOTABLE_COLOR_COUNT=$(jq -r '.votableColors[]' $CANVAS_CONFIG | wc -l | tr -d ' ')
VOTABLE_COLORS=$(jq -r '.votableColors[]' $CANVAS_CONFIG | sed 's/^/0x/')
END_TIME=1716359880

DAILY_QUESTS_COUNT=$(jq -r '.daily.dailyQuestsCount' $QUESTS_CONFIG)

CALLDATA=$(echo -n $ACCOUNT_ADDRESS $WIDTH $HEIGHT $PLACE_DELAY $COLOR_COUNT $COLORS $VOTABLE_COLOR_COUNT $VOTABLE_COLORS $END_TIME $DAILY_QUESTS_COUNT)

echo "Deploying the contract..."
echo "starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_CLASSHASH $CALLDATA"
starkli deploy --network sepolia --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch $ART_PEACE_CONTRACT_CLASSHASH $CALLDATA
