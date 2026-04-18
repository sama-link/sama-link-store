#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}" || exit 1

PID_FILE=".dev.pids"

terminate_children() {
  local parent_pid="$1"
  local child_pids
  child_pids="$(ps -e -f 2>/dev/null | awk -v target="${parent_pid}" '$3 == target { print $2 }')"

  if [ -z "${child_pids}" ]; then
    return
  fi

  for child_pid in ${child_pids}; do
    terminate_children "${child_pid}"
    if kill -0 "${child_pid}" 2>/dev/null; then
      kill "${child_pid}" 2>/dev/null || true
    fi
  done
}

docker compose -f docker-compose.dev.yml down

if [ ! -f "${PID_FILE}" ]; then
  echo "No running environment found (.dev.pids missing). Services may have been stopped already."
  exit 0
fi

while IFS= read -r entry; do
  [ -z "${entry}" ] && continue

  label="${entry%%:*}"
  pid="${entry#*:}"

  if [ -z "${label}" ] || [ -z "${pid}" ] || ! [[ "${pid}" =~ ^[0-9]+$ ]]; then
    echo "Skipping malformed PID entry: ${entry}"
    continue
  fi

  if kill -0 "${pid}" 2>/dev/null; then
    echo "Stopping ${label} (PID ${pid})..."
    terminate_children "${pid}"
    kill "${pid}" 2>/dev/null || true

    waited=0
    while kill -0 "${pid}" 2>/dev/null && [ "${waited}" -lt 10 ]; do
      sleep 1
      waited=$((waited + 1))
    done

    if kill -0 "${pid}" 2>/dev/null; then
      echo "${label} (PID ${pid}) did not stop after 10s. Sending SIGKILL."
      kill -9 "${pid}" 2>/dev/null || true
    fi
  else
    echo "${label} (PID ${pid}) is not running."
  fi
done < "${PID_FILE}"

rm -f "${PID_FILE}"
echo "All services stopped."
