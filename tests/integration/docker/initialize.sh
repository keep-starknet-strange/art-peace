#!/bin/bash

sleep 10

echo "Deploying the application"
./deploy.sh

echo "Initializing the canvas"
curl http://backend:8080/init-canvas -X POST

echo "Set the contract address"
CONTRACT_ADDRESS=$(cat /configs/configs.env | grep "^ART_PEACE_CONTRACT_ADDRESS" | cut -d '=' -f2)
curl http://backend:8080/set-contract-address -X POST -d "$CONTRACT_ADDRESS"

echo "Set the username store address"
USERNAME_STORE_ADDRESS=$(cat /configs/configs.env | grep "^USERNAME_STORE_ADDRESS" | cut -d '=' -f2)
curl http://backend:8080/set-username-store-address -X POST -d "$USERNAME_STORE_ADDRESS"

echo "Setup the colors from the color config"
# flatten colors with quotes and join them with comma and wrap in []
COLORS=$(cat /configs/canvas.config.json | jq -r '.colors | map("\"\(.)\"") | join(",")')
curl http://backend:8080/init-colors -X POST -d "[$COLORS]"

echo "Setup the quests from the quest config"
QUESTS_CONFIG_FILE="/configs/quests.config.json"
curl http://backend:8080/init-quests -X POST -d "@$QUESTS_CONFIG_FILE"

echo "Setup the factions from the faction config"
FACTIONS_CONFIG_FILE="/configs/factions.config.json"
curl http://backend:8080/init-factions -X POST -d "@$FACTIONS_CONFIG_FILE"

echo "Setup the faction icons"
FACTION_ICONS="/icons/"
for icon in $FACTION_ICONS*.png; do
  curl http://backend:8080/upload-faction-icon -X POST -F "icon=@$icon"
done
