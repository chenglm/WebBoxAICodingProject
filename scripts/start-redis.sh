#!/usr/bin/env sh
set -eu

WEBBOX_PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
WEBBOX_REDIS_PORT="${WEBBOX_REDIS_PORT:-6380}"
WEBBOX_REDIS_RUNTIME_DIR="${WEBBOX_PROJECT_ROOT}/.runtime/redis"

if redis-cli -p "${WEBBOX_REDIS_PORT}" ping >/dev/null 2>&1; then
  echo "WebBox Redis is already running on port ${WEBBOX_REDIS_PORT}."
  exit 0
fi

mkdir -p "${WEBBOX_REDIS_RUNTIME_DIR}"
redis-server \
  --bind 127.0.0.1 \
  --protected-mode yes \
  --port "${WEBBOX_REDIS_PORT}" \
  --dir "${WEBBOX_REDIS_RUNTIME_DIR}" \
  --dbfilename dump.rdb \
  --appendonly yes \
  --appendfilename appendonly.aof \
  --daemonize yes \
  --pidfile "${WEBBOX_REDIS_RUNTIME_DIR}/redis.pid" \
  --logfile "${WEBBOX_REDIS_RUNTIME_DIR}/redis.log"

WEBBOX_ATTEMPT=0
while [ "${WEBBOX_ATTEMPT}" -lt 20 ]; do
  if redis-cli -p "${WEBBOX_REDIS_PORT}" ping >/dev/null 2>&1; then
    echo "WebBox Redis started on 127.0.0.1:${WEBBOX_REDIS_PORT}."
    exit 0
  fi
  WEBBOX_ATTEMPT=$((WEBBOX_ATTEMPT + 1))
  sleep 1
done

echo "Redis did not start; inspect ${WEBBOX_REDIS_RUNTIME_DIR}/redis.log." >&2
exit 1
