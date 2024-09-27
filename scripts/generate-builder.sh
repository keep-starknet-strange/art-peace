#!/bin/bash
#
# Generates a template file

OUTPUT_FILE=$1
rm -f $OUTPUT_FILE
touch $OUTPUT_FILE

IDX=512
END_IDX=1024
while [ $IDX -lt $END_IDX ]; do
  COLOR=$(shuf -i 1-17 -n 1)
  echo "$IDX $COLOR" >> $OUTPUT_FILE
  IDX=$((IDX+1))
done
