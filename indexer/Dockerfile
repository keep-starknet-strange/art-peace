FROM quay.io/apibara/sink-webhook:0.6.0 as sink-webhook

WORKDIR /indexer
COPY ./indexer/docker-script.js .

CMD ["run", "docker-script.js", "--allow-env", "/deployment/.env"]
