#!/bin/bash

# Start a new block every 6 minutes
echo "Starting the block producer"

INTERVAL=360

while true
do
    curl http://devnet:5050/mint -X POST -H "Content-Type: application/json" -d '{"amount": 1, "address": "0x1"}'
    sleep $INTERVAL
done
