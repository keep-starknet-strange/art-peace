#!/bin/bash

# Load environment variables from `.env` file
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Set environment and network details
ENVIRONMENT="sepolia"
NETWORK="sepolia"
ART_PEACE_CONTRACT="0x078f4e772300472a68a19f2b1aedbcb7cf2acd6f67a2236372310a528c7eaa67"

# Set RPC URL for Sepolia
STARKNET_RPC="https://starknet-sepolia.public.blastapi.io"

# Define the JSON file path from command line argument
JSON_FILE_PATH="$1"

if [ -z "$JSON_FILE_PATH" ] || [ -z "$STARKNET_KEYSTORE" ] || [ -z "$STARKNET_ACCOUNT" ]; then
    echo "Error: Please provide a valid JSON rewards file and ensure STARKNET_KEYSTORE and STARKNET_ACCOUNT are set in the .env file."
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