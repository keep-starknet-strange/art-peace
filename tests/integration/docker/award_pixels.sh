#!/bin/bash

# Load environment variables from `.env` file
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Set environment and network details
ENVIRONMENT="local"
NETWORK_URL="http://localhost:5050"  # Use the URL from your console output
ART_PEACE_CONTRACT="0x6fe75e8821863019aa3e7b824cceaa8a42265bbf1374e3c92eebc698036d438"

# Define the JSON file path from command line argument
JSON_FILE_PATH="$1"

# Verify contract exists before proceeding
echo "Verifying contract at $ART_PEACE_CONTRACT..."
if ! starkli class-hash-at $ART_PEACE_CONTRACT --rpc $NETWORK_URL > /dev/null 2>&1; then
    echo "Error: ArtPeace contract not found at $ART_PEACE_CONTRACT"
    echo "Please verify the contract address is correct"
    exit 1
fi

echo "Contract verified successfully!"

# Iterate through each user address and amount in the JSON file
jq -c '.[]' "$JSON_FILE_PATH" | while read -r entry; do
    USER_ADDRESS=$(echo "$entry" | jq -r '.address')
    AMOUNT=$(echo "$entry" | jq -r '.amount')
    echo "Awarding $AMOUNT pixels to $USER_ADDRESS..."

    # Invoke the host_award_user function using starkli
    starkli invoke --rpc $NETWORK_URL --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
    --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT
done
