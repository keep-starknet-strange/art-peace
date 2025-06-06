build: build-backend build-frontend build-contracts
test: contracts-test

build-backend:
	@echo "Building backend..."
	@cd backend && go build

build-frontend:
	@echo "Building frontend..."
	@cd frontend && npm run build

build-contracts:
	@echo "Building contracts..."
	@cd onchain && scarb build

contracts-test:
	@echo "Testing contracts..."
	@cd onchain && scarb test

integration-test-local:
	@echo "Running integration tests..."
	./scripts/run-local.sh

docker-build:
	$(eval APP_VERSION := $(shell cat infra/art-peace-infra/Chart.yaml | yq eval '.appVersion' -))
	$(eval COMMIT_SHA := $(shell git rev-parse --short HEAD))
	@echo "Building docker images with version $(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Building backend..."
	docker build . -f backend/Dockerfile.prod -t "brandonjroberts/art-peace-backend:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Building consumer..."
	docker build . -f backend/Dockerfile.consumer.prod -t "brandonjroberts/art-peace-consumer:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Building websocket..."
	docker build . -f backend/Dockerfile.websocket.prod -t "brandonjroberts/art-peace-websocket:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Building indexer main..."	
	docker build . -f indexer/Dockerfile.prod -t "brandonjroberts/art-peace-indexer:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Building indexer worlds..."	
	docker build . -f indexer/Dockerfile.worlds.prod -t "brandonjroberts/art-peace-worlds-indexer:$(APP_VERSION)-$(COMMIT_SHA)"

docker-push:
	$(eval APP_VERSION := $(shell cat infra/art-peace-infra/Chart.yaml | yq eval '.appVersion' -))
	$(eval COMMIT_SHA := $(shell git rev-parse --short HEAD))
	@echo "Pushing docker images with version $(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Pushing backend..."
	docker push "brandonjroberts/art-peace-backend:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Pushing consumer..."
	docker push "brandonjroberts/art-peace-consumer:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Pushing websocket..."
	docker push "brandonjroberts/art-peace-websocket:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Pushing indexer main..."
	docker push "brandonjroberts/art-peace-indexer:$(APP_VERSION)-$(COMMIT_SHA)"
	@echo "Pushing indexer worlds..."
	docker push "brandonjroberts/art-peace-worlds-indexer:$(APP_VERSION)-$(COMMIT_SHA)"

helm-uninstall:
	@echo "Uninstalling helm chart..."
	helm uninstall art-peace-infra

helm-install:
	$(eval COMMIT_SHA := $(shell git rev-parse --short HEAD))
	@echo "Installing helm chart..."
	helm install --set postgres.password=$(POSTGRES_PASSWORD) --set deployments.sha=$(COMMIT_SHA) --set apibara.authToken=$(AUTH_TOKEN) --set turboda.apiKey=$(TURBO_DA_API_KEY) art-peace-infra infra/art-peace-infra

helm-template:
	$(eval COMMIT_SHA := $(shell git rev-parse --short HEAD))
	@echo "Rendering helm chart..."
	helm template --set postgres.password=$(POSTGRES_PASSWORD) --set deployments.sha=$(COMMIT_SHA) --set apibara.authToken=$(AUTH_TOKEN) --set turboda.apiKey=$(TURBO_DA_API_KEY) art-peace-infra infra/art-peace-infra

helm-upgrade:
	$(eval COMMIT_SHA := $(shell git rev-parse --short HEAD))
	@echo "Upgrading helm chart..."
	helm upgrade --set postgres.password=$(POSTGRES_PASSWORD) --set deployments.sha=$(COMMIT_SHA) --set apibara.authToken=$(AUTH_TOKEN) --set turboda.apiKey=$(TURBO_DA_API_KEY) art-peace-infra infra/art-peace-infra

init-infra-prod:
	@echo "Initializing infra..."
	curl https://api.art-peace.net/init-canvas -X POST
	curl https://api.art-peace.net/init-quests -X POST -d "@configs/production-quests.config.json"

update-frontend-contracts:
	cat onchain/target/dev/art_peace_ArtPeace.contract_class.json| jq -r '.abi' > frontend/src/contracts/art_peace.abi.json
	cat onchain/target/dev/art_peace_CanvasNFT.contract_class.json| jq -r '.abi' > frontend/src/contracts/canvas_nft.abi.json
	cat onchain/target/dev/art_peace_UsernameStore.contract_class.json| jq -r '.abi' > frontend/src/contracts/username_store.abi.json
	cat onchain/target/dev/art_peace_MultiCanvas.contract_class.json | jq -r '.abi' > frontend/src/contracts/multi_canvas.abi.json
