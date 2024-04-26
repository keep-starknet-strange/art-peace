#!/bin/bash

sleep 10

echo "Deploying the application"
./deploy.sh

echo "Initializing the canvas"
curl http://backend:8080/init-canvas -X POST

echo "Set the contract address"
CONTRACT_ADDRESS=$(cat /configs/configs.env | grep "^ART_PEACE_CONTRACT_ADDRESS" | cut -d '=' -f2)
curl http://backend:8080/set-contract-address -X POST -d "$CONTRACT_ADDRESS"

echo "Setup the colors from the color config"
# flatten colors with quotes and join them with comma and wrap in []
COLORS=$(cat /configs/canvas.config.json | jq -r '.colors | map("\"\(.)\"") | join(",")')
curl http://backend:8080/init-colors -X POST -d "[$COLORS]"
