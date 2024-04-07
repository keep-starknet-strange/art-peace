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
