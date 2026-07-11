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

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "POSTGRES_PASSWORD is required"
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
upsert_env POSTGRES_HOST "${POSTGRES_HOST:-}"
upsert_env POSTGRES_DB "${POSTGRES_DB:-}"
upsert_env POSTGRES_USER "${POSTGRES_USER:-}"
upsert_env POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
upsert_env VITE_API_BASE_URL "${VITE_API_BASE_URL:-}"
upsert_env VITE_GOOGLE_CLIENT_ID "${VITE_GOOGLE_CLIENT_ID:-}"
upsert_env AUTHENTICATION__GOOGLE__CLIENTID "${AUTHENTICATION__GOOGLE__CLIENTID:-}"

bootstrap_shared_postgres() {
  local postgres_container="${POSTGRES_HOST:-shared_postgres}"
  local db="${POSTGRES_DB:-jobhunterdb}"
  local user="${POSTGRES_USER:-jobhunter_user}"
  local password="${POSTGRES_PASSWORD}"

  if ! docker ps --format '{{.Names}}' | grep -qx "$postgres_container"; then
    echo "Shared PostgreSQL container '$postgres_container' is not running"
    exit 1
  fi

  docker exec -i "$postgres_container" psql -U postgres \
    -v ON_ERROR_STOP=1 \
    -v db="$db" \
    -v user="$user" \
    -v password="$password" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'user', :'password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'user') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'user', :'password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db') \gexec
GRANT ALL PRIVILEGES ON DATABASE :"db" TO :"user";
SQL

  docker exec -i "$postgres_container" psql -U postgres -d "$db" \
    -v ON_ERROR_STOP=1 \
    -v user="$user" <<'SQL'
GRANT ALL ON SCHEMA public TO :"user";
ALTER SCHEMA public OWNER TO :"user";
SQL
}

bootstrap_shared_postgres

docker compose -f docker-compose.prod.yml pull backend ui
docker compose -f docker-compose.prod.yml up -d
docker image prune -f

echo "--- Running services ---"
docker compose -f docker-compose.prod.yml ps
