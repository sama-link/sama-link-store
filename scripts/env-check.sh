#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}" || exit 1

BACKEND_ENV_FILE="apps/backend/.env"
STOREFRONT_ENV_FILE="apps/storefront/.env.local"

required_backend_keys=(
  "DATABASE_URL"
  "JWT_SECRET"
  "COOKIE_SECRET"
  "MEDUSA_ADMIN_EMAIL"
  "MEDUSA_ADMIN_PASSWORD"
  "STORE_CORS"
  "ADMIN_CORS"
  "AUTH_CORS"
)

storefront_key="NEXT_PUBLIC_MEDUSA_BACKEND_URL"
backend_missing=0

echo "Checking backend environment file: ${BACKEND_ENV_FILE}"
if [ ! -f "${BACKEND_ENV_FILE}" ]; then
  echo "ERROR: ${BACKEND_ENV_FILE} is missing."
  echo "Copy .env.example to ${BACKEND_ENV_FILE} and fill in real values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${BACKEND_ENV_FILE}"
set +a

for key in "${required_backend_keys[@]}"; do
  if [ -n "${!key:-}" ]; then
    echo "✅ ${key} — present"
  else
    echo "❌ ${key} — missing or empty"
    backend_missing=1
  fi
done

echo "Checking storefront environment file: ${STOREFRONT_ENV_FILE}"
if [ ! -f "${STOREFRONT_ENV_FILE}" ]; then
  echo "WARNING: ${STOREFRONT_ENV_FILE} is missing."
  echo "Copy .env.example to ${STOREFRONT_ENV_FILE} to define storefront overrides."
else
  set -a
  # shellcheck disable=SC1090
  source "${STOREFRONT_ENV_FILE}"
  set +a

  if [ -n "${!storefront_key:-}" ]; then
    echo "✅ ${storefront_key} — present"
  else
    echo "❌ ${storefront_key} — missing or empty"
  fi
fi

if [ "${backend_missing}" -ne 0 ]; then
  exit 1
fi

exit 0
