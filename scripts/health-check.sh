#!/usr/bin/env bash

set -u

down_count=0

if (echo >/dev/tcp/localhost/5432) 2>/dev/null; then
  echo "✅ PostgreSQL — UP (localhost:5432)"
else
  echo "❌ PostgreSQL — DOWN (localhost:5432)"
  down_count=$((down_count + 1))
fi

backend_code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health || true)"
if [ "${backend_code}" = "200" ]; then
  echo "✅ Backend — UP (HTTP 200)"
else
  echo "❌ Backend — DOWN (HTTP ${backend_code})"
  down_count=$((down_count + 1))
fi

storefront_code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || true)"
case "${storefront_code}" in
  2*|3*)
    echo "✅ Storefront — UP (HTTP ${storefront_code})"
    ;;
  *)
    echo "❌ Storefront — DOWN (HTTP ${storefront_code})"
    down_count=$((down_count + 1))
    ;;
esac

if [ "${down_count}" -eq 0 ]; then
  echo "Environment: HEALTHY (all three up)"
  exit 0
fi

echo "Environment: DEGRADED (${down_count}/3 services down)"
exit 1
