#!/bin/bash

# Check if JSON file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <rewards.json>"
  exit 1
fi

REWARDS_FILE=$1
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT=$SCRIPT_DIR/../..

# Check if required commands exist
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required but not installed. Please install jq first using 'brew install jq'"; exit 1; }

# Check if rewards file exists and is valid JSON
if [ ! -f "$REWARDS_FILE" ]; then
    echo "Error: Rewards file not found at: $REWARDS_FILE"
    echo "Please create a rewards.json file with the following format:"
    echo '{
        "rewards": [
            {
                "address": "0x123...",
                "amount": 10
            }
        ]
    }'
    exit 1
fi

# Validate environment variables
if [ "$ENVIRONMENT" = "docker" ]; then
    if [ -z "$RPC_URL" ] || [ -z "$ACCOUNT_FILE" ] || [ -z "$ACCOUNT_NAME" ]; then
        echo "Error: Docker environment variables not set"
        exit 1
    fi
else
    if [ -z "$STARKNET_KEYSTORE" ]; then
        echo "Error: STARKNET_KEYSTORE is not set"
        exit 1
    elif [ -z "$STARKNET_ACCOUNT" ]; then
        echo "Error: STARKNET_ACCOUNT is not set"
        exit 1
    fi
fi

# Read and process rewards JSON
REWARDS=$(cat $REWARDS_FILE | jq -r '.rewards[] | "\(.address) \(.amount)"')

while IFS= read -r line; do
    if [ -z "$line" ]; then
        continue
    fi
    
    ADDRESS=$(echo $line | cut -d' ' -f1)
    AMOUNT=$(echo $line | cut -d' ' -f2)
    
    echo "Awarding $AMOUNT pixels to $ADDRESS..."
    
    # Call contract based on environment
    if [ "$ENVIRONMENT" = "docker" ]; then
        echo "Running docker command:"
        echo "sncast --account $ACCOUNT_NAME call --url $RPC_URL --contract-address $ART_PEACE_CONTRACT --function host_award_user --calldata $ADDRESS $AMOUNT"
        sncast --account $ACCOUNT_NAME \
            call \
            --url $RPC_URL \
            --contract-address $ART_PEACE_CONTRACT \
            --function host_award_user \
            --calldata $ADDRESS $AMOUNT \
            --block-id latest
    else
        echo "Running starkli command:"
        echo "starkli invoke $ART_PEACE_CONTRACT host_award_user $ADDRESS $AMOUNT --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch"
        if ! starkli invoke $ART_PEACE_CONTRACT host_award_user $ADDRESS $AMOUNT \
            --network $NETWORK --keystore $STARKNET_KEYSTORE --account $STARKNET_ACCOUNT --watch; then
            echo "Error: Failed to award pixels. Make sure:"
            echo "1. The contract address is correct: $ART_PEACE_CONTRACT"
            echo "2. Your account has host privileges"
            echo "3. The address format is correct: $ADDRESS"
            echo "4. The amount is valid: $AMOUNT"
            exit 1
        fi
    fi
done <<< "$REWARDS"