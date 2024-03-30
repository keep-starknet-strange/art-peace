#TODO: setup all, list dependencies, etc

build: contracts-build
test: contracts-test

contracts-build:
	@echo "Building contracts..."
	@cd onchain && scarb build

contracts-test:
	@echo "Testing contracts..."
	@cd onchain && scarb test

integration-test-local:
	@echo "Running integration tests..."
	./scripts/run-local.sh
