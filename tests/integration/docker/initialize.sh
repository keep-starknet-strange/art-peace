#!/bin/bash

sleep 10

echo "Deploying the application"
./deploy.sh

echo "Initializing the canvas"
curl http://backend:8080/initCanvas -X POST

echo "Set the contract address"
CONTRACT_ADDRESS=$(cat /deployment/.env | grep "^ART_PEACE_CONTRACT_ADDRESS" | cut -d '=' -f2)
curl http://backend:8080/setContractAddress -X POST -d "$CONTRACT_ADDRESS"
