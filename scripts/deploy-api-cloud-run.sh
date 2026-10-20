#!/usr/bin/env bash
# Run from Cloud Shell. This script deploys only the API, never Firebase.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
for name in PROJECT_ID REGION QUOTE_RECIPIENT_EMAIL QUOTE_SENDER_EMAIL \
  CORS_ALLOWED_ORIGINS SENDGRID_SECRET_VERSION HCAPTCHA_SECRET_VERSION; do
  if [[ -z "${!name:-}" ]]; then
    printf 'Falta la variable %s. Consulta docs/gcp.md.\n' "$name" >&2
    exit 1
  fi
  if [[ "${!name}" == *"|"* || "${!name}" == *$'\n'* ]]; then
    printf 'La variable %s no puede contener | ni saltos de línea.\n' "$name" >&2
    exit 1
  fi
done
for version in "$SENDGRID_SECRET_VERSION" "$HCAPTCHA_SECRET_VERSION"; do
  if [[ ! "$version" =~ ^[1-9][0-9]*$ ]]; then
    echo 'Usa versiones numéricas de Secret Manager, no latest.' >&2
    exit 1
  fi
done

SERVICE=prefabricados-api
RUNTIME_SA="prefabricados-api@${PROJECT_ID}.iam.gserviceaccount.com"
BUILD_SA="prefabricados-build@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=. \
  --build-service-account="projects/${PROJECT_ID}/serviceAccounts/${BUILD_SA}" \
  --service-account="$RUNTIME_SA" \
  --allow-unauthenticated \
  --ingress=all \
  --port=8080 \
  --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3 \
  --concurrency=20 --timeout=60 \
  --set-env-vars="^|^NODE_ENV=production|EMAIL_PROVIDER=sendgrid|QUOTE_RECIPIENT_EMAIL=${QUOTE_RECIPIENT_EMAIL}|QUOTE_SENDER_EMAIL=${QUOTE_SENDER_EMAIL}|CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}" \
  --set-secrets="SENDGRID_API_KEY=prefabricados-sendgrid:${SENDGRID_SECRET_VERSION},HCAPTCHA_SECRET_KEY=prefabricados-hcaptcha:${HCAPTCHA_SECRET_VERSION}"

API_URL="$(gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
bash scripts/check-api-health.sh "$API_URL"
