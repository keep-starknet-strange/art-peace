#!/bin/bash
ENVIRONMENT="mainnet"
NETWORK="mainnet"
ART_PEACE_CONTRACT="0x067883deb1c1cb60756eb6e60d500081352441a040d5039d0e4ce9fed35d68c1"

export STARKNET_RPC="https://starknet-mainnet.public.blastapi.io"

source "$(dirname "$0")/reward.sh" "$1"