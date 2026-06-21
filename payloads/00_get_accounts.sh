#!/bin/bash
# ============================================================
# STEP 0: Get connected CORE POST accounts
# Run this first to get account IDs for dry-run/live-gated CORE payloads.
# ============================================================

API_BASE="${DEVAD_POST_API_BASE:-https://devad.io/api/v1/post}"
API_TOKEN="${DEVAD_POST_API_KEY:-${DEVAD_POST_TOKEN:-${DEVAD_WORKSPACE_API_KEY:-}}}"

if [ -z "$API_TOKEN" ]; then
  echo "Missing DEVAD_POST_API_KEY, DEVAD_POST_TOKEN, or DEVAD_WORKSPACE_API_KEY" >&2
  exit 1
fi

case "$API_TOKEN" in
  wsk_*) ;;
  *)
    echo "CORE POST requires a workspace API key with the wsk_ prefix" >&2
    exit 1
    ;;
esac

curl -s -X GET "$API_BASE/accounts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" | jq '.'

# Expected response shape:
# [
#   { "id": "abc123xyz", "provider": "instagram", "name": "My Brand", "category": "profile" },
#   { "id": "def456uvw", "provider": "facebook",  "name": "My Page",  "category": "page"    },
#   ...
# ]
#
# Copy the "id" values into private payloads only. Do not commit real account IDs.
