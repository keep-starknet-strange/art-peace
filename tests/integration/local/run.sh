#!/bin/bash
#
# This script runs all parts of the stack for local development / testing.

# TODO: Check dependencies and install them if necessary?

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../../..
CANVAS_CONFIG_FILE=$WORK_DIR/configs/canvas.config.json
DATABASE_CONFIG_FILE=$WORK_DIR/configs/database.config.json
BACKEND_CONFIG_FILE=$WORK_DIR/configs/backend.config.json

OUTPUT_DIR=$HOME/.art-peace-tests
TIMESTAMP=$(date +%s)
LOG_DIR=$OUTPUT_DIR/logs/$TIMESTAMP
TMP_DIR=$OUTPUT_DIR/tmp/$TIMESTAMP

# TODO: Clean option to remove old logs and state
rm -rf $OUTPUT_DIR/logs/*
rm -rf $OUTPUT_DIR/tmp/*
mkdir -p $LOG_DIR
mkdir -p $TMP_DIR

echo "Running art-peace locally w/ outputs in $OUTPUT_DIR ..."

# Start the redis server
echo "Starting redis server ..."
kill $(ps aux | grep redis | grep 6379 | grep -v grep | awk '{print $2}')
REDIS_LOG_FILE=$LOG_DIR/redis.log
touch $REDIS_LOG_FILE
redis-server 2>&1 > $REDIS_LOG_FILE &
REDIS_PID=$!
sleep 2 # Wait for redis to start; TODO: Check if redis is actually running

# Start the art-peace-db with postgres
echo "Starting art-peace-db ..."
dropdb art-peace-db -f
createdb art-peace-db
psql -d art-peace-db -f $WORK_DIR/postgres/init.sql

# Start the art-peace backend
echo "Starting art-peace backend ..."
kill $(ps aux | grep go\ run\ main.go | grep -v grep | awk '{print $2}')
BACKEND_LOG_FILE=$LOG_DIR/backend.log
touch $BACKEND_LOG_FILE
cd $WORK_DIR/backend
go run main.go 2>&1 > $BACKEND_LOG_FILE &
BACKEND_PID=$!
sleep 2 # Wait for backend to start; TODO: Check if backend is actually running

# Start the art-peace indexer & local starknet node
# TODO: Split this into two separate commands & try w/o docker
echo "Starting art-peace indexer & local starknet node ..."
kill $(ps aux | grep docker\ compose\ up | grep -v grep | awk '{print $2}')
docker system prune -f
docker volume rm indexer_devnet indexer_dna
INDEXER_LOG_FILE=$LOG_DIR/indexer.log
touch $INDEXER_LOG_FILE
cd $WORK_DIR/indexer
docker compose up 2>&1 > $INDEXER_LOG_FILE &
INDEXER_PID=$!
sleep 2 # Wait for indexer to start; TODO: Check if indexer is actually running

# Deploy the art-peace contract(s)
echo "Deploying art-peace contracts ..."
DEPLOY_LOG_FILE=$LOG_DIR/deploy.log
touch $DEPLOY_LOG_FILE
$SCRIPT_DIR/deploy.sh 2>&1 > $DEPLOY_LOG_FILE
# Read last word of last line of deploy log
ART_PEACE_CONTRACT_ADDRESS=$(cat $DEPLOY_LOG_FILE | tail -n 1 | awk '{print $NF}')
echo "Deployed art-peace contract(s) at $ART_PEACE_CONTRACT_ADDRESS"

# Start the art-peace place_pixel indexer script
echo "Starting art-peace place_pixel indexer script ..."
kill $(ps aux | grep apibara\ run\ script.js | grep -v grep | awk '{print $2}')
INDEXER_SCRIPT_LOG_FILE=$LOG_DIR/indexer_script.log
touch $INDEXER_SCRIPT_LOG_FILE
cd $WORK_DIR/indexer
#TODO: apibara -> postgres automatically?
ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS apibara run script.js --allow-env-from-env ART_PEACE_CONTRACT_ADDRESS 2>&1 > $INDEXER_SCRIPT_LOG_FILE &
INDEXER_SCRIPT_PID=$!
sleep 2 # Wait for indexer script to start; TODO: Check if indexer script is actually running

# Initialize the art-peace canvas in the backend/redis
echo "Initializing art-peace canvas ..."
curl http://localhost:8080/initCanvas -X POST
curl http://localhost:8080/setContractAddress -X POST -d "$ART_PEACE_CONTRACT_ADDRESS"

# Start the art-peace frontend
echo "Starting art-peace frontend ..."
kill $(ps aux | grep npm\ start | grep -v grep | awk '{print $2}')
FRONTEND_LOG_FILE=$LOG_DIR/frontend.log
touch $FRONTEND_LOG_FILE
cd $WORK_DIR/frontend
REACT_CANVAS_CONFIG_FILE=$WORK_DIR/frontend/src/configs/canvas.config.json
REACT_BACKEND_CONFIG_FILE=$WORK_DIR/frontend/src/configs/backend.config.json
cp $CANVAS_CONFIG_FILE $REACT_CANVAS_CONFIG_FILE #TODO: Use a symlink instead?
cp $BACKEND_CONFIG_FILE $REACT_BACKEND_CONFIG_FILE
REACT_APP_ART_PEACE_CONTRACT_ADDRESS=$ART_PEACE_CONTRACT_ADDRESS REACT_APP_CANVAS_CONFIG_FILE=$REACT_CANVAS_CONFIG_FILE REACT_APP_BACKEND_CONFIG_FILE=$REACT_BACKEND_CONFIG_FILE npm start 2>&1 > $FRONTEND_LOG_FILE &
FRONTEND_PID=$!
sleep 2 # Wait for frontend to start; TODO: Check if frontend is actually running

# Wait for user to stop the stack
echo
echo "Art-peace stack is running. Press Ctrl+C to stop."
echo
# TODO: trap SIGINT and stop the stack?
while true; do
    sleep 1
done

# TODO: stash data on shutdown
# Shutdown
echo "Shutting down ..."
kill $REDIS_PID
kill $BACKEND_PID
kill $INDEXER_PID
kill $FRONTEND_PID
kill $INDEXER_SCRIPT_PID
docker system prune
