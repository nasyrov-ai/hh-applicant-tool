#!/usr/bin/env bash
# Sync Claude Code tokens from macOS Keychain to Hetzner server.
# Tokens refresh automatically on the Mac; this script pushes them to the server
# so the headless worker can use Claude CLI for AI-generated replies.
#
# Usage:
#   ./scripts/sync-claude-token.sh              # one-time sync
#   Add to crontab for periodic sync (every 4 hours):
#   0 */4 * * * /path/to/sync-claude-token.sh >> /tmp/claude-token-sync.log 2>&1

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-root@204.168.135.143}"
REMOTE_EMAIL="${REMOTE_EMAIL:-rustamnasyrov624@gmail.com}"
KEYCHAIN_SERVICE="Claude Code-credentials"
KEYCHAIN_ACCOUNT="${USER}"

echo "[$(date)] Starting Claude token sync..."

# Extract tokens from macOS Keychain
CREDS=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w 2>/dev/null) || {
    echo "ERROR: Cannot read credentials from Keychain. Is Claude Code logged in?"
    exit 1
}

# Convert Keychain format (camelCase) to server format (snake_case claude-*.json)
SERVER_JSON=$(echo "$CREDS" | python3 -c "
import json, sys
from datetime import datetime, timezone

data = json.loads(sys.stdin.read())
oauth = data.get('claudeAiOauth', {})

if not oauth.get('accessToken'):
    print('ERROR: No access token in Keychain', file=sys.stderr)
    sys.exit(1)

expires_at = oauth.get('expiresAt', '')
if isinstance(expires_at, (int, float)):
    dt = datetime.fromtimestamp(expires_at / 1000 if expires_at > 1e12 else expires_at, tz=timezone.utc)
    expired_str = dt.strftime('%Y-%m-%dT%H:%M:%S%z')
else:
    expired_str = str(expires_at)

# Insert colon in timezone offset for compatibility
if expired_str and '+' in expired_str and ':' not in expired_str.split('+')[-1]:
    expired_str = expired_str[:-2] + ':' + expired_str[-2:]

now_str = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S%z')
if now_str and '+' in now_str and ':' not in now_str.split('+')[-1]:
    now_str = now_str[:-2] + ':' + now_str[-2:]

server_creds = {
    'access_token': oauth['accessToken'],
    'disabled': False,
    'email': '${REMOTE_EMAIL}',
    'expired': expired_str,
    'id_token': '',
    'last_refresh': now_str,
    'refresh_token': oauth.get('refreshToken', ''),
    'type': 'claude'
}

print(json.dumps(server_creds, indent=2))
") || exit 1

# Upload to server
echo "$SERVER_JSON" | ssh "$REMOTE_HOST" "cat > ~/.claude/claude-${REMOTE_EMAIL}.json && chmod 600 ~/.claude/claude-${REMOTE_EMAIL}.json"

echo "[$(date)] Token synced successfully to $REMOTE_HOST"
echo "  Expires: $(echo "$SERVER_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["expired"])')"
