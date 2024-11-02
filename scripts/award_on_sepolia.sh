#!/bin/bash

# Set environment and network details
ENVIRONMENT="sepolia"
NETWORK="sepolia"
ART_PEACE_CONTRACT="0x078f4e772300472a68a19f2b1aedbcb7cf2acd6f67a2236372310a528c7eaa67"

# Use Sepolia keystore/account paths
STARKNET_KEYSTORE="$HOME/.starkli-wallets/deployer/keystore.json"
STARKNET_ACCOUNT="$HOME/.starkli-wallets/deployer/account.json"

# Set RPC URL for Sepolia
export STARKNET_RPC="https://starknet-sepolia.public.blastapi.io"

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

# Define the user address and amount to award
USER_ADDRESS="0x05e01dB693CBF7461a016343042786DaC5A6000104813cF134a1E8B1D0a6810b"
AMOUNT=100  # Amount to award

# Call the host_award_user function using starkli
starkli invoke --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT \
  --watch $ART_PEACE_CONTRACT host_award_user $USER_ADDRESS $AMOUNT