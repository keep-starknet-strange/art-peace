#!/bin/bash
#
# Generate a list of accounts to play art/peace

# Number of accounts to generate
NUM_ACCOUNTS=$1
OUT_DIR=$2
FUND_ACCOUNT=$3
FUND_KEY=$4

# Generate accounts
for i in $(seq 1 $NUM_ACCOUNTS); do
  echo "Creating account art-peace-$i"
  starkli signer keystore new --password "" $OUT_DIR/art-peace-$i-signer.json
  INIT_RES=$(starkli account oz init --keystore $OUT_DIR/art-peace-$i-signer.json --keystore-password "" $OUT_DIR/art-peace-$i.json 2>&1)
  EXPECTED_ADDRESS=$(echo $INIT_RES | grep -o "0x[0-9a-fA-F]*")
  echo "$EXPECTED_ADDRESS" > $OUT_DIR/art-peace-$i-address.txt
  echo "Account art-peace-$i created with address $EXPECTED_ADDRESS"
  # fund account
  starkli invoke --network sepolia --keystore $FUND_KEY --account $FUND_ACCOUNT --watch 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7 transfer $EXPECTED_ADDRESS 200000000000000000 0
  starkli account deploy --keystore $OUT_DIR/art-peace-$i-signer.json --keystore-password "" --network sepolia $OUT_DIR/art-peace-$i.json
done
