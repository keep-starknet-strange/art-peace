FROM golang:1.22.2-alpine

RUN apk add --no-cache bash curl git jq

SHELL ["/bin/bash", "-c"]
RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | bash -s -- -v 2.6.3
RUN curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | bash
RUN /bin/bash /root/.local/bin/snfoundryup --version 0.21.0

# Copy over the configs
WORKDIR /configs
COPY ./configs/ .
COPY ./configs/docker-database.config.json ./database.config.json
COPY ./configs/docker-backend.config.json ./backend.config.json

# Copy over the scripts
WORKDIR /scripts
COPY ./tests/integration/docker/ .

# Copy over the app
WORKDIR /app
COPY ./backend/go.mod ./backend/go.sum ./
RUN go mod download
COPY ./backend .

# Build the app & run it
RUN go build -o main ./cmd/backend/backend.go

EXPOSE 8080

CMD ["./main", "--admin"]
