#!/bin/bash

# Start a new block every 30 seconds
echo "Starting the block producer"

INTERVAL=30

while true
do
    curl http://devnet:5050/mint -X POST -H "Content-Type: application/json" -d '{"amount": 1, "address": "0x1"}'
    sleep $INTERVAL
done
