#TODO: setup all, list dependencies, etc

build: backend-build frontend-build contracts-build
test: contracts-test

backend-build:
	@echo "Building backend..."
	@cd backend && go build

frontend-build:
	@echo "Building frontend..."
	@cd frontend && npm run build

contracts-build:
	@echo "Building contracts..."
	@cd onchain && scarb build

contracts-test:
	@echo "Testing contracts..."
	@cd onchain && scarb test

integration-test-local:
	@echo "Running integration tests..."
	./scripts/run-local.sh
