FROM quay.io/apibara/sink-webhook:0.6.0 as sink-webhook

WORKDIR /indexer
COPY ./indexer/script.js .

CMD ["run", "script.js", "--allow-env", "/configs/configs.env", "--allow-env-from-env", "CONSUMER_TARGET_URL,APIBARA_STREAM_URL,PERSIST_TO_REDIS,INDEXER_ID", "--allow-net", "--sink-id", "art-peace-sink-id"]
