#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}" # local | remote
DB_NAME="${D1_DATABASE_NAME:-ggailabs-leadflow}"
STATE_DIR=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"

log() {
  printf "\n[cleanup-lid] %s\n" "$1"
}

delete_sql="
DELETE FROM messages WHERE contact_id LIKE '%@lid';
DELETE FROM contacts WHERE jid LIKE '%@lid';
"

count_sql="
SELECT
  (SELECT COUNT(*) FROM contacts WHERE jid LIKE '%@lid') AS contacts_lid,
  (SELECT COUNT(*) FROM messages WHERE contact_id LIKE '%@lid') AS messages_lid;
"

if [[ "$MODE" == "local" ]]; then
  if [[ ! -d "$STATE_DIR" ]]; then
    echo "Local D1 state directory not found: $STATE_DIR"
    exit 1
  fi

  DB_FILE="$(find "$STATE_DIR" -type f -name '*.sqlite' -size +0c -printf '%T@ %p\n' | sort -nr | head -n1 | cut -d' ' -f2-)"
  if [[ -z "$DB_FILE" ]]; then
    echo "No local D1 sqlite file found in $STATE_DIR"
    exit 1
  fi

  log "Using local DB: $DB_FILE"

  BEFORE="$(sqlite3 -json "$DB_FILE" "$count_sql")"
  log "Before cleanup: $BEFORE"

  BACKUP_FILE="$DB_FILE.bak.$(date +%Y%m%d%H%M%S)"
  cp "$DB_FILE" "$BACKUP_FILE"
  log "Backup created: $BACKUP_FILE"

  sqlite3 "$DB_FILE" "$delete_sql"

  AFTER="$(sqlite3 -json "$DB_FILE" "$count_sql")"
  log "After cleanup: $AFTER"
  log "Done"
  exit 0
fi

if [[ "$MODE" == "remote" ]]; then
  log "Using remote D1 database: $DB_NAME"

  BEFORE="$(npx wrangler d1 execute "$DB_NAME" --remote --json --command "$count_sql")"
  log "Before cleanup: $BEFORE"

  npx wrangler d1 execute "$DB_NAME" --remote --command "$delete_sql" >/dev/null

  AFTER="$(npx wrangler d1 execute "$DB_NAME" --remote --json --command "$count_sql")"
  log "After cleanup: $AFTER"
  log "Done"
  exit 0
fi

echo "Invalid mode: $MODE (use: local | remote)"
exit 1
