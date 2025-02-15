FROM node:21.7.1-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk add --no-cache bash git jq curl

WORKDIR /app
COPY ./frontend-next/package.json ./frontend-next/pnpm-lock.yaml ./
RUN pnpm install
COPY ./frontend-next ./
COPY ./configs/canvas.config.json ./src/configs/canvas.config.json
COPY ./configs/docker-backend.config.json ./src/configs/backend.config.json

SHELL ["/bin/bash", "-c"]
# Clear the entrypoint
ENTRYPOINT []
CMD ["npm", "run", "dev"]
