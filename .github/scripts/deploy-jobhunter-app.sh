#!/bin/bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/jobhunter}"

cd "$DEPLOY_DIR"

if [ -z "${GHCR_TOKEN:-}" ]; then
  echo "GHCR_TOKEN is required"
  exit 1
fi

if [ -z "${GIT_ACTOR:-}" ]; then
  echo "GIT_ACTOR is required"
  exit 1
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GIT_ACTOR" --password-stdin

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

upsert_env() {
  local key="$1"
  local value="${2:-}"

  [ -z "$value" ] && return 0

  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}

upsert_env BACKEND_IMAGE "${BACKEND_IMAGE:-}"
upsert_env UI_IMAGE "${UI_IMAGE:-}"
upsert_env BACKEND_PORT "${BACKEND_PORT:-}"
upsert_env UI_PORT "${UI_PORT:-}"
upsert_env POSTGRES_PORT "${POSTGRES_PORT:-}"
upsert_env POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
upsert_env VITE_API_BASE_URL "${VITE_API_BASE_URL:-}"

docker compose -f docker-compose.prod.yml pull backend ui
docker compose -f docker-compose.prod.yml up -d
docker image prune -f

echo "--- Running services ---"
docker compose -f docker-compose.prod.yml ps
