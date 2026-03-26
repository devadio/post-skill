#!/bin/bash
# ============================================================
# STEP 0: Get all connected social accounts
# Run this first to get the id_secure values you'll put
# into every other test payload under "integration": { "id": "..." }
# ============================================================

API_BASE="https://post.devad.io/api/public/v1"
API_TOKEN="YOUR_API_TOKEN_HERE"

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
# Copy the "id" (id_secure) values into the payloads below.
