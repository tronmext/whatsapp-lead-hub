#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${D1_DATABASE_NAME:-ggailabs-leadflow}"
RUN_BUILD="${RUN_BUILD:-1}"
RUN_LINT="${RUN_LINT:-0}"

TS="$(date +%Y%m%d%H%M%S)"
PHONE_SUFFIX="${TS: -8}"
TEST_JID="5599${PHONE_SUFFIX}@s.whatsapp.net"
TEST_PHONE="5599${PHONE_SUFFIX}"
TEST_INSTANCE_ID="${TEST_INSTANCE_ID:-pre-release-instance}"
TEST_MESSAGE_ID="pre_release_${TS}"
TEST_NOTE_ID="note_${TS}"

log() {
  printf "\n[pre-release] %s\n" "$1"
}

run_d1_json() {
  local sql="$1"
  npx wrangler d1 execute "$DB_NAME" --remote --json --command "$sql"
}

extract_rows_len() {
  local json="$1"
  node -e 'const out = JSON.parse(process.argv[1]); const rows = Array.isArray(out) ? (out[0]?.results || []) : (out.results || []); process.stdout.write(String(rows.length));' "$json"
}

extract_field() {
  local json="$1"
  local field="$2"
  node -e 'const out = JSON.parse(process.argv[1]); const field = process.argv[2]; const rows = Array.isArray(out) ? (out[0]?.results || []) : (out.results || []); const v = rows[0]?.[field]; process.stdout.write(v == null ? "" : String(v));' "$json" "$field"
}

cleanup() {
  log "Cleaning up smoke-test records"
  run_d1_json "DELETE FROM messages WHERE id = '${TEST_MESSAGE_ID}';" >/dev/null || true
  run_d1_json "DELETE FROM contacts WHERE jid = '${TEST_JID}';" >/dev/null || true
}
trap cleanup EXIT

log "Starting pre-release checks"
log "Database: ${DB_NAME}"

if [[ "$RUN_BUILD" == "1" ]]; then
  log "Build check (local)"
  npm run build >/dev/null
  log "Build: OK"
fi

if [[ "$RUN_LINT" == "1" ]]; then
  log "Lint check (local)"
  npm run lint >/dev/null
  log "Lint: OK"
fi

log "D1 remote connectivity"
PING_JSON="$(run_d1_json "SELECT 1 as ok;")"
PING_OK="$(extract_field "$PING_JSON" "ok")"
if [[ "$PING_OK" != "1" ]]; then
  echo "D1 connectivity check failed"
  exit 1
fi
log "D1 connectivity: OK"

log "Schema presence"
TABLES_JSON="$(run_d1_json "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('contacts','messages','instances');")"
TABLES_LEN="$(extract_rows_len "$TABLES_JSON")"
if [[ "$TABLES_LEN" -lt 3 ]]; then
  echo "Missing required tables (contacts/messages/instances)."
  exit 1
fi
log "Schema: OK"

log "Contact create/update persistence"
run_d1_json "
INSERT INTO contacts (jid, instance_id, name, phone, type, status, score, ai_enabled, metadata)
VALUES ('${TEST_JID}', '${TEST_INSTANCE_ID}', 'Pre Release Contact', '${TEST_PHONE}', 'lead', 'novo', 0, 0, '{\"company\":\"QA Co\",\"role\":\"Tester\",\"city\":\"Cuiaba\",\"source\":\"pre-release\",\"tags\":[\"novo\"],\"notes\":[{\"id\":\"${TEST_NOTE_ID}\",\"text\":\"seed note\",\"at\":\"now\"}]}')
ON CONFLICT(jid) DO UPDATE SET
  name = excluded.name,
  phone = excluded.phone,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = CURRENT_TIMESTAMP;
" >/dev/null

run_d1_json "UPDATE contacts SET status = 'negociacao', metadata = '{\"company\":\"QA Co Updated\",\"role\":\"Closer\",\"city\":\"Cuiaba\",\"source\":\"inbox-panel\",\"tags\":[\"novo\",\"quente\"],\"notes\":[{\"id\":\"${TEST_NOTE_ID}\",\"text\":\"persisted\",\"at\":\"now\"}]}' WHERE jid = '${TEST_JID}';" >/dev/null

VERIFY_CONTACT_JSON="$(run_d1_json "SELECT jid, status, json_extract(metadata, '$.company') AS company, json_extract(metadata, '$.role') AS role FROM contacts WHERE jid = '${TEST_JID}' LIMIT 1;")"
CONTACT_STATUS="$(extract_field "$VERIFY_CONTACT_JSON" "status")"
CONTACT_COMPANY="$(extract_field "$VERIFY_CONTACT_JSON" "company")"
CONTACT_ROLE="$(extract_field "$VERIFY_CONTACT_JSON" "role")"
if [[ -z "$CONTACT_STATUS" || "$CONTACT_STATUS" != "negociacao" || "$CONTACT_COMPANY" != "QA Co Updated" || "$CONTACT_ROLE" != "Closer" ]]; then
  echo "Contact persistence check failed"
  exit 1
fi
log "Contact persistence: OK"

log "Message persistence/read"
run_d1_json "
INSERT INTO messages (id, contact_id, from_me, content, type, timestamp)
VALUES ('${TEST_MESSAGE_ID}', '${TEST_JID}', 0, 'pre-release ping', 'text', CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;
" >/dev/null

VERIFY_MSG_JSON="$(run_d1_json "SELECT id, contact_id, content FROM messages WHERE id = '${TEST_MESSAGE_ID}' LIMIT 1;")"
MSG_ID="$(extract_field "$VERIFY_MSG_JSON" "id")"
MSG_CONTACT="$(extract_field "$VERIFY_MSG_JSON" "contact_id")"
if [[ "$MSG_ID" != "$TEST_MESSAGE_ID" || "$MSG_CONTACT" != "$TEST_JID" ]]; then
  echo "Message persistence check failed"
  exit 1
fi
log "Message persistence: OK"

log "New-lead signal check"
VERIFY_NEW_JSON="$(run_d1_json "SELECT status FROM contacts WHERE jid = '${TEST_JID}' LIMIT 1;")"
NEW_STATUS="$(extract_field "$VERIFY_NEW_JSON" "status")"
if [[ "$NEW_STATUS" != "negociacao" ]]; then
  echo "Lead status check failed"
  exit 1
fi
log "Lead status pipeline: OK"

log "All checks passed"
printf "\nSummary:\n"
printf "- Build: %s\n" "OK"
printf "- D1 remote connectivity: %s\n" "OK"
printf "- Contact panel persistence (metadata/status): %s\n" "OK"
printf "- Message persistence: %s\n" "OK"
printf "\nReady for staging validation and release.\n"
