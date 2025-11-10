#!/usr/bin/env bash

set -euo pipefail

WORKFLOW_FILE=".github/workflows/pages.yml"
BRANCH="${1:-main}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install from https://cli.github.com/." >&2
  exit 1
fi

REPO_URL="$(git config --get remote.origin.url)"
if [[ -z "${REPO_URL}" ]]; then
  echo "Unable to determine remote origin URL." >&2
  exit 1
fi

if [[ "${REPO_URL}" == git@github.com:* ]]; then
  GH_REPO="${REPO_URL#git@github.com:}"
  GH_REPO="${GH_REPO%.git}"
elif [[ "${REPO_URL}" == https://github.com/* ]]; then
  GH_REPO="${REPO_URL#https://github.com/}"
  GH_REPO="${GH_REPO%.git}"
else
  echo "Unsupported GitHub remote URL: ${REPO_URL}" >&2
  exit 1
fi

if ! git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "Branch '${BRANCH}' does not exist locally." >&2
  exit 1
fi

HEAD_SHA="$(git rev-parse "${BRANCH}")"
echo "Triggering '${WORKFLOW_FILE}' for ${GH_REPO}@${BRANCH} (${HEAD_SHA})..."
gh workflow run "${WORKFLOW_FILE}" --repo "${GH_REPO}" --ref "${BRANCH}" >/dev/null

echo "Waiting for workflow to start..."
RUN_ID=""
for _ in {1..40}; do
  RUN_ID="$(gh run list \
    --repo "${GH_REPO}" \
    --branch "${BRANCH}" \
    --workflow "${WORKFLOW_FILE}" \
    --json databaseId,headSha \
    --jq "map(select(.headSha==\"${HEAD_SHA}\"))[0].databaseId" \
    --limit 5 | tr -d '\n')"
  if [[ -n "${RUN_ID}" ]]; then
    break
  fi
  sleep 3
done

if [[ -z "${RUN_ID}" ]]; then
  echo "Could not locate workflow run for commit ${HEAD_SHA}." >&2
  exit 1
fi

echo "Watching run ${RUN_ID}..."
gh run watch "${RUN_ID}" --repo "${GH_REPO}"

OWNER="${GH_REPO%%/*}"
REPO_NAME="${GH_REPO##*/}"
PAGE_URL="https://${OWNER}.github.io/${REPO_NAME}/"
echo "If the deployment succeeded, your site is available at: ${PAGE_URL}"
