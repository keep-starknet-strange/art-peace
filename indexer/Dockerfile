FROM quay.io/apibara/sink-webhook:0.6.0 as sink-webhook

# Generate a random unique ID
# RUN apt-get update && apt-get install -y uuid-runtime
# ENV INDEXER_ID=$(uuidgen)
ENV INDEXER_ID="seun"

# Set environment variables
ENV PERSIST_TO_REDIS=redis://redis:6379

WORKDIR /indexer
COPY script.js 

RUN echo $INDEXER_ID
CMD ["run", "script.js", "--sink-id", "INDEXER_ID", "--allow-env", "/configs/configs.env", "--allow-env-from-env", "BACKEND_TARGET_URL, APIBARA_STREAM_URL, PERSIST_TO_REDIS"]