#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3004}"
EMAIL="${EMAIL:-admin@southerneleven.com}"
PASSWORD="${PASSWORD:-password123}"

echo "Health: ${API_BASE_URL}/health"
curl -fsS "${API_BASE_URL}/health" >/dev/null

echo "Login: ${EMAIL}"
LOGIN_JSON="$(curl -fsS -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" \
  "${API_BASE_URL}/auth/login")"

TOKEN="$(python3 - <<PY
import json,sys
print(json.loads(sys.stdin.read())["access_token"])
PY
<<<"${LOGIN_JSON}")"

echo "Profile:"
curl -fsS -H "Authorization: Bearer ${TOKEN}" "${API_BASE_URL}/auth/profile" >/dev/null

echo "OK"

