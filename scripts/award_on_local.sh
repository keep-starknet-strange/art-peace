#!/bin/bash

# Set environment and network details
ENVIRONMENT="local"
NETWORK_URL="http://localhost:5050"  # Use the URL from your console output
ART_PEACE_CONTRACT="0x6fe75e8821863019aa3e7b824cceaa8a42265bbf1374e3c92eebc698036d438"  # Updated contract address
CANVAS_NFT_CONTRACT="0x370eae686c423fcb7ef6e131223180406d5cfbf34504e43b0e391f38408032c"  # New contract address

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
if ! starkli class-hash-at $ART_PEACE_CONTRACT --rpc $NETWORK_URL > /dev/null 2>&1; then
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
    starkli invoke --rpc $NETWORK_URL --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
    --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT --keystore-password "$STARKNET_KEYSTORE_PASSWORD"

done