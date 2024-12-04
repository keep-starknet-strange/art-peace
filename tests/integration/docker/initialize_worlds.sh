#!/bin/bash

sleep 10

echo "Deploying the worlds multicanvas application"
./deploy_worlds.sh

echo "Set the contract address"
CONTRACT_ADDRESS=$(cat /configs/configs.env | grep "^CANVAS_FACTORY_CONTRACT_ADDRESS" | cut -d '=' -f2)
echo "Setting the contract address to $CONTRACT_ADDRESS"
curl http://backend:8080/set-factory-contract-address -X POST -d "$CONTRACT_ADDRESS"
