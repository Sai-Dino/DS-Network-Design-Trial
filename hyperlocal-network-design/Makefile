.PHONY: setup run osrm-setup osrm-start clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install Python dependencies
	pip install -r requirements.txt

setup-venv: ## Create virtual environment and install dependencies
	python3 -m venv venv
	./venv/bin/pip install -r requirements.txt

run: ## Start the application server (port 8080)
	python3 server.py

osrm-setup: ## Download and prepare OSRM India map data
	bash scripts/setup_osrm.sh

osrm-start: ## Start the OSRM routing server (port 5000)
	bash scripts/start_osrm.sh

start-all: ## Start both OSRM and app server
	@echo "Starting OSRM in background..."
	bash scripts/start_osrm.sh &
	@sleep 3
	@echo "Starting app server..."
	python3 server.py

clean: ## Remove cached and temporary files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
