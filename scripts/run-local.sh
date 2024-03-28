#!/bin/bash
#
# Run the full pipeline locally.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

$WORK_DIR/tests/integration/local/run.sh
