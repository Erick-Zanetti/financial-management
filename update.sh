#!/usr/bin/env bash
set -euo pipefail

APP_ID="financial-management"
UMBREL_ROOT="/root/umbrel"
APP_DIR="${UMBREL_ROOT}/app-data/${APP_ID}"

cd "$APP_DIR"

JWT_SECRET=$(docker exec umbrel cat /data/secrets/jwt 2>/dev/null || echo "")

run_app_script() {
  local cmd="$1"
  docker exec \
    -e SCRIPT_UMBREL_ROOT=/data \
    -e SCRIPT_DOCKER_FRAGMENTS=/opt/umbreld/source/modules/apps/legacy-compat/ \
    -e SCRIPT_APP_REPO_DIR="" \
    -e REMOTE_TOR_ACCESS=false \
    -e BITCOIN_NETWORK=mainnet \
    -e TOR_PROXY_IP=10.21.21.11 \
    -e TOR_PROXY_PORT=9050 \
    -e JWT_SECRET="$JWT_SECRET" \
    umbrel /opt/umbreld/source/modules/apps/legacy-compat/app-script "$cmd" "$APP_ID"
}

echo "==> Pulling latest changes..."
git pull

echo "==> Stopping app via Umbrel..."
run_app_script stop

echo "==> Starting app via Umbrel (will rebuild)..."
run_app_script start

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Copying icon..."
docker cp "${APP_DIR}/icon.svg" umbrel:/opt/umbreld/ui/figma-exports/app-${APP_ID}.svg

echo "==> Sending SIGUSR1 to umbreld to refresh UI..."
UMBRELD_PID=$(ps aux | grep '[/]usr/local/bin/node.*cli.ts --data-directory' | awk '{print $2}' | head -1)
if [ -n "$UMBRELD_PID" ]; then
  kill -SIGUSR1 "$UMBRELD_PID"
  echo "    Sent to PID ${UMBRELD_PID}"
else
  echo "    WARNING: Could not find umbreld process"
fi

echo "==> Done!"
