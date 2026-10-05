#!/usr/bin/env bash
# WazehTerms Cloud Run deploy procedure (docs/DEPLOYMENT.md §3 filled with
# real values; MT-7). Build/push/deploy commands are NOT run by automation —
# the owner executes them when promoting (per plans/phase-14/plan.md).
# Stages 1–2 and everything in this file were verified locally except the
# push + gcloud run deploy lines, which need the final promoted commit.
set -euo pipefail

PROJECT_ID="wazeh-terms"
REGION="asia-south1"
REPO="wazehterms"
SERVICE="wazehterms"
RUNTIME_SA="wazehterms-runtime@wazeh-terms.iam.gserviceaccount.com"
HOST="${REGION}-docker.pkg.dev"
IMAGE="${HOST}/${PROJECT_ID}/${REPO}/wazehterms:$(git rev-parse --short HEAD)"

echo "== Deploying ${IMAGE} =="
echo "Commit: $(git rev-parse HEAD)  (freeze: tests green, manifest, KB release, notice version)"

# 1. Push (final step — owner-run)
gcloud auth configure-docker "${HOST}" --quiet
docker build -t "${IMAGE}" -f Dockerfile .
docker push "${IMAGE}"
echo "== Pushed. Record the digest printed by docker push. =="

# 2. First deploy: staging revision, no traffic, revision tag `staging`
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE}" \
  --service-account "${RUNTIME_SA}" \
  --env-vars-file deploy/env.staging.yaml \
  --update-secrets "GEMINI_API_KEY=gemini-api-key:2,SANITY_ORGANIZATION_TOKEN=sanity-organization-token:1,REVIEW_HMAC_SECRET=review-hmac-secret:1,SANITY_READ_TOKEN=sanity-read-token:1" \
  --allow-unauthenticated \
  --no-traffic \
  --tag staging \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 40 \
  --timeout 120 \
  --max-instances 4

echo "== Validate at the staging tag URL (plans/phase-14/plan.md deliverable 6) =="

# 3. Promote to 100% only after the smoke passes:
#   gcloud run services update-traffic "${SERVICE}" --project "${PROJECT_ID}" \
#     --region "${REGION}" --to-tags staging=100
# Later normal deploys: rerun step 1 then this deploy WITHOUT --no-traffic/--tag.

# 4. Rollback drill (verify once on staging):
#   gcloud run services update-traffic "${SERVICE}" --region "${REGION}" \
#     --to-revisions <previous-known-good-revision>=100
#   …re-run smoke… then shift back.
