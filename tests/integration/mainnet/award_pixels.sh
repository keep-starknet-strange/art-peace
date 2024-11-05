#!/bin/bash
#
# Award pixels to users

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../../..
PROJECT_ROOT=$WORK_DIR

# Load environment variables from `.env` file
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

ART_PEACE_CONTRACT=0x067883deb1c1cb60756eb6e60d500081352441a040d5039d0e4ce9fed35d68c1
NETWORK=mainnet

# Define the JSON file path from command line argument
JSON_FILE_PATH="$1"

# Verify contract exists before proceeding
echo "Verifying contract at $ART_PEACE_CONTRACT..."
if ! starkli class-hash-at $ART_PEACE_CONTRACT --network $NETWORK > /dev/null 2>&1; then
    echo "Error: ArtPeace contract not found at $ART_PEACE_CONTRACT"
    echo "Please verify the contract address is correct"
    exit 1
fi

# Iterate through each user address and amount in the JSON file
jq -c '.[]' "$JSON_FILE_PATH" | while read -r entry; do
    USER_ADDRESS=$(echo "$entry" | jq -r '.address')
    AMOUNT=$(echo "$entry" | jq -r '.amount')
    echo "Awarding $AMOUNT pixels to $USER_ADDRESS..."

    # Invoke the host_award_user function using starkli
    echo "starkli invoke --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
    --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT"
    starkli invoke --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
    --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT
done
