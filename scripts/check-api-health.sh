#!/usr/bin/env bash
# Works in Cloud Shell without Node, Python, or credentials.
set -euo pipefail
base_url="${1:?Uso: bash scripts/check-api-health.sh https://URL-DEL-SERVICIO}"
if [[ ! "$base_url" =~ ^https?://[^/?#]+/?$ ]]; then
  echo 'Indica solo el origen del servicio, sin /api ni parámetros.' >&2
  exit 1
fi
body="$(curl --fail-with-body --silent --show-error \
  --connect-timeout 10 --max-time 60 --retry 3 \
  "${base_url%/}/api/healthz")"
if [[ ! "$body" =~ ^[[:space:]]*\{[[:space:]]*\"status\"[[:space:]]*:[[:space:]]*\"ok\"[[:space:]]*\}[[:space:]]*$ ]]; then
  echo 'Respuesta de salud inesperada: se esperaba {"status":"ok"}.' >&2
  exit 1
fi
printf 'API disponible: %s/api/healthz — %s\n' "${base_url%/}" "$body"
