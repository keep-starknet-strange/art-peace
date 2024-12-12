#!/bin/bash

sleep 10

echo "Deploying the worlds multicanvas application"
./deploy_worlds.sh

echo "Set the factory contract address"
FACTORY_ADDRESS=$(cat /configs/configs.env | grep "^CANVAS_FACTORY_CONTRACT_ADDRESS" | cut -d '=' -f2)
echo "Setting the factory contract address to $FACTORY_ADDRESS"
curl http://backend:8080/set-factory-contract-address -X POST -d "$FACTORY_ADDRESS"

echo "Set the art peace contract address"
ART_PEACE_ADDRESS=$(cat /configs/configs.env | grep "^ART_PEACE_CONTRACT_ADDRESS" | cut -d '=' -f2)
echo "Setting the art peace contract address to $ART_PEACE_ADDRESS"
curl http://backend:8080/set-contract-address -X POST -d "$ART_PEACE_ADDRESS"
