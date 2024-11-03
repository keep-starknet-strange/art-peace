#!/bin/bash

# Set environment and network details
ENVIRONMENT="mainnet"
NETWORK="mainnet"
ART_PEACE_CONTRACT="0x067883deb1c1cb60756eb6e60d500081352441a040d5039d0e4ce9fed35d68c1"

# Set RPC URL for Mainnet
STARKNET_RPC="https://starknet-mainnet.public.blastapi.io"

# Define the JSON file paths from command line argument
JSON_FILE_PATH="$1"
STARKNET_KEYSTORE="$2"
STARKNET_ACCOUNT="$3"

if [ -z "$JSON_FILE_PATH" ] || [ -z "$STARKNET_KEYSTORE" ] || [ -z "$STARKNET_ACCOUNT" ]; then
    echo "Error: Please provide valid paths for the JSON rewards file, keystore, and account."
    exit 1
fi

# Verify contract exists before proceeding
echo "Verifying contract at $ART_PEACE_CONTRACT..."
if ! starkli class-hash-at $ART_PEACE_CONTRACT --network $NETWORK > /dev/null 2>&1; then
    echo "Error: ArtPeace contract not found at $ART_PEACE_CONTRACT"
    echo "Please verify the contract address is correct"
    exit 1
fi

echo "Contract verified successfully!"

# Store keystore password to avoid multiple prompts
if [ -z "$STARKNET_KEYSTORE_PASSWORD" ]; then
    read -s -p "Enter keystore password: " STARKNET_KEYSTORE_PASSWORD
    echo
    export STARKNET_KEYSTORE_PASSWORD
fi

# Iterate through each user address and amount in the JSON file
jq -c '.[]' "$JSON_FILE_PATH" | while read -r entry; do
    USER_ADDRESS=$(echo "$entry" | jq -r '.address')
    AMOUNT=$(echo "$entry" | jq -r '.amount')

    # Invoke the host_award_user function using starkli
    starkli invoke --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
    --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT --keystore-password "$STARKNET_KEYSTORE_PASSWORD"

done