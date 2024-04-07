FROM ubuntu:24.04

# Install prerequisites
RUN apt-get update && apt-get install -y \
curl jq
RUN curl -sL https://install.apibara.com | bash

SHELL ["/bin/bash", "-c"]
RUN /root/.local/share/apibara/bin/apibara plugins install sink-webhook

WORKDIR /indexer
COPY ./indexer/docker-script.js .

CMD ["source", "/deployment/.env", "&&", "/root/.local/share/apibara/bin/apibara", "run", "docker-script.js", "--allow-env-from-env", "ART_PEACE_CONTRACT_ADDRESS"]
