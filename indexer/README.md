# art/peace Indexer

This directory contains the Apibara indexer setup for `art/peace`, which indexes and relays `art/peace` state change information to be stored in the Redis and Postgres DBs.

## Running

```
# Setup Indexer/DNA w/ docker compose or other options
# Create an indexer.env file with the following : 
#  ART_PEACE_CONTRACT_ADDRESS=... # Example: 0x78223f7ab13216727ed426380079c169578cafad83a3178c7b33ba7ca307713
#  APIBARA_STREAM_URL=... # Example: http://localhost:7171
#  CONSUMER_TARGET_URL=... # Example: http://localhost:8081/consume-indexer-msg
apibara run scripts.js --allow-env indexer.env
```
