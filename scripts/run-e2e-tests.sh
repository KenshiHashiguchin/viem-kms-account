#!/bin/bash

# Exit on error
set -e

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for Geth to be ready
echo "Waiting for Geth to be ready..."
sleep 10

# Run e2e tests
echo "Running e2e tests..."
RUN_E2E=true npx jest --testMatch="**/test/e2e/**/*.e2e.test.ts"

# Stop Docker containers
echo "Stopping Docker containers..."
docker-compose down

echo "E2E tests completed."