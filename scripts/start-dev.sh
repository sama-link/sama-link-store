#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}" || exit 1

PID_FILE=".dev.pids"

if [ -f "${PID_FILE}" ]; then
  echo "Existing PID file detected. Attempting cleanup before startup..."
  bash scripts/stop-dev.sh || true
fi

if ! bash scripts/env-check.sh; then
  echo "Environment check failed. Fix .env files before starting."
  exit 1
fi

: > "${PID_FILE}"

echo "Starting backend with Docker Compose..."
docker compose -f docker-compose.dev.yml up -d --build

echo "Starting storefront natively..."
nohup bash -lc "cd \"${REPO_ROOT}/apps/storefront\" && exec npm run dev" >"${REPO_ROOT}/.dev.storefront.log" 2>&1 &
storefront_pid=$!
echo "storefront:${storefront_pid}" >> "${PID_FILE}"
echo "Tracked storefront PID: ${storefront_pid}"

is_http_up() {
  case "$1" in
    2*|3*) return 0 ;;
    *) return 1 ;;
  esac
}

backend_ready=0
backend_wait=0
while [ "${backend_wait}" -le 120 ]; do
  backend_code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health || true)"
  if [ "${backend_code}" = "200" ]; then
    echo "Backend health endpoint is up (HTTP 200)."
    backend_ready=1
    break
  fi

  if [ "${backend_wait}" -eq 120 ]; then
    break
  fi

  echo "Waiting for backend health (HTTP ${backend_code})... ${backend_wait}s elapsed"
  sleep 10
  backend_wait=$((backend_wait + 10))
done

if [ "${backend_ready}" -ne 1 ]; then
  echo "Backend did not return HTTP 200 within the timeout window."
  echo "Last 30 lines of backend log:"
  echo "────────────────────────────────"
  if [ -f "${REPO_ROOT}/.dev.backend.log" ]; then
    tail -30 "${REPO_ROOT}/.dev.backend.log"
  else
    echo "(no log file found)"
  fi
  echo "────────────────────────────────"
fi

storefront_ready=0
storefront_wait=0
while [ "${storefront_wait}" -le 60 ]; do
  storefront_code_root="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || true)"
  storefront_code_ar="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar || true)"

  if is_http_up "${storefront_code_root}" || is_http_up "${storefront_code_ar}"; then
    echo "Storefront is up (/ HTTP ${storefront_code_root}, /ar HTTP ${storefront_code_ar})."
    storefront_ready=1
    break
  fi

  if [ "${storefront_wait}" -eq 60 ]; then
    break
  fi

  echo "Waiting for storefront (/ HTTP ${storefront_code_root}, /ar HTTP ${storefront_code_ar})... ${storefront_wait}s elapsed"
  sleep 5
  storefront_wait=$((storefront_wait + 5))
done

if [ "${storefront_ready}" -ne 1 ]; then
  echo "Storefront did not return a 2xx/3xx response within 60 seconds."
fi

health_status=0
bash scripts/health-check.sh || health_status=$?

if [ "${backend_ready}" -eq 1 ] && [ "${storefront_ready}" -eq 1 ] && [ "${health_status}" -eq 0 ]; then
  echo "────────────────────────────────"
  echo "Local environment is ready"
  echo "Storefront:  http://localhost:3000"
  echo "Backend:     http://localhost:9000"
  echo "Admin API:   http://localhost:9000/app"
  echo "PID file:    .dev.pids"
  echo "Logs: .dev.root.log (or .dev.backend.log / .dev.storefront.log)"
  echo "────────────────────────────────"
  exit 0
fi

echo "Startup completed with errors. Check the health output above."
exit 1
