#!/bin/bash
# Trigger session reminders cron endpoint.
# Run every 30 minutes via system crontab:
#   */30 * * * * /path/to/app/scripts/cron-reminders.sh >> /var/log/cron-reminders.log 2>&1
#
# Required env vars (set in /etc/environment or sourced from .env):
#   APP_BASE_URL  e.g. http://localhost:3000
#   CRON_SECRET   must match CRON_SECRET in the app .env

set -euo pipefail

BASE_URL="${APP_BASE_URL:-http://localhost:3000}"
SECRET="${CRON_SECRET:?CRON_SECRET not set}"

response=$(curl -sf -w "\n%{http_code}" \
  -H "Authorization: Bearer ${SECRET}" \
  "${BASE_URL}/api/cron/session-reminders")

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

echo "$(date -Iseconds) status=${http_code} ${body}"

if [ "$http_code" != "200" ]; then
  echo "$(date -Iseconds) ERROR: cron returned ${http_code}" >&2
  exit 1
fi
