.PHONY: help setup setup-venv run run-prod worker test lint docker-up docker-down osrm-setup osrm-start start-all clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ────────────────────────────────────────────────────

setup: ## Install Python dependencies
	pip install -r requirements.txt

setup-venv: ## Create virtual environment and install dependencies
	python3 -m venv venv
	./venv/bin/pip install -r requirements.txt

# ── Run ──────────────────────────────────────────────────────

run: ## Start dev server (Flask, port 8080)
	python3 run.py

run-legacy: ## Start legacy monolith server
	python3 server.py

run-prod: ## Start production server (Gunicorn)
	gunicorn -c gunicorn.conf.py 'app:create_app()'

worker: ## Start Celery worker for background tasks
	celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4

# ── Quality ──────────────────────────────────────────────────

test: ## Run test suite
	APP_ENV=testing pytest tests/ -v --tb=short

lint: ## Run linter
	ruff check app/ tests/

lint-fix: ## Auto-fix lint issues
	ruff check --fix app/ tests/

# ── Docker ───────────────────────────────────────────────────

docker-up: ## Start full stack with Docker Compose
	docker compose up --build -d

docker-down: ## Stop Docker Compose stack
	docker compose down

docker-logs: ## Tail Docker Compose logs
	docker compose logs -f

# ── OSRM ─────────────────────────────────────────────────────

osrm-setup: ## Download and prepare OSRM India map data
	bash scripts/setup_osrm.sh

osrm-start: ## Start the OSRM routing server (port 5000)
	bash scripts/start_osrm.sh

start-all: ## Start both OSRM and app server
	@echo "Starting OSRM in background..."
	bash scripts/start_osrm.sh &
	@sleep 3
	@echo "Starting app server..."
	python3 run.py

# ── Cleanup ──────────────────────────────────────────────────

clean: ## Remove cached and temporary files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.db" -delete 2>/dev/null || true
