FROM node:21.7.1-alpine

RUN apk add --no-cache bash git jq curl

WORKDIR /app
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend ./
COPY ./configs/canvas.config.json ./src/configs/canvas.config.json
COPY ./configs/docker-backend.config.json ./src/configs/backend.config.json

SHELL ["/bin/bash", "-c"]
# Clear the entrypoint
ENTRYPOINT []
CMD ["npm", "start"]
