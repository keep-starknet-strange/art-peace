FROM node:21.7.1-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN apk add --no-cache bash git jq curl

WORKDIR /app
COPY ./frontend/package.json ./frontend/pnpm-lock.yaml ./
COPY ./frontend/patches ./patches
RUN pnpm install
COPY ./frontend ./
COPY ./configs/canvas.config.json ./src/configs/canvas.config.json
COPY ./configs/docker-backend.config.json ./src/configs/backend.config.json

SHELL ["/bin/bash", "-c"]
# Clear the entrypoint
ENTRYPOINT []
CMD ["npm", "start"]
