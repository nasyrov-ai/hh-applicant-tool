#!/usr/bin/env bash
set -euo pipefail

# Deploy hh-worker to remote server
# Usage: ./deploy-worker.sh user@host

REMOTE="${1:?Usage: $0 user@host}"
APP_DIR="/opt/hh-applicant-tool"

echo "==> Syncing code to $REMOTE:$APP_DIR"
rsync -avz --exclude .venv --exclude node_modules --exclude dashboard \
    --exclude __pycache__ --exclude .git --exclude data \
    . "$REMOTE:$APP_DIR/"

echo "==> Installing dependencies on remote"
ssh "$REMOTE" <<EOF
cd $APP_DIR
python3 -m venv .venv 2>/dev/null || true
$APP_DIR/.venv/bin/pip install -e ".[dashboard]" croniter 2>&1 | tail -5

# Install systemd service
sudo cp deploy/hh-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hh-worker
sudo systemctl restart hh-worker

echo "==> Worker status:"
sudo systemctl status hh-worker --no-pager | head -15
EOF

echo "==> Done!"
