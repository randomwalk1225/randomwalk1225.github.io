#!/usr/bin/env bash
# Safe production deploy for mathhub.io (Cloudflare Pages project: gitblog1104).
#
# WHY THIS SCRIPT EXISTS:
#   `wrangler pages deploy .` uploads the ENTIRE directory and does NOT honor
#   .gitignore or .assetsignore. So internal folders (docs/, scripts/) would be
#   served publicly. This script moves them out, deploys, then restores them.
#   It also forces --branch main so the deploy lands on PRODUCTION even when the
#   current git branch is a feature branch.
#
# PREREQ: `npx wrangler login` once (OAuth).
# USAGE:  bash scripts/deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

HOLD="$(mktemp -d)"
EXCLUDE=(docs scripts marketing)

echo "▶ Moving internal folders out of the deploy directory…"
for d in "${EXCLUDE[@]}"; do
  [ -e "$d" ] && mv "$d" "$HOLD/" && echo "  held: $d"
done

restore() {
  echo "▶ Restoring internal folders…"
  for d in "${EXCLUDE[@]}"; do
    [ -e "$HOLD/$d" ] && mv "$HOLD/$d" . && echo "  restored: $d"
  done
  rmdir "$HOLD" 2>/dev/null || true
}
trap restore EXIT

echo "▶ Deploying to production (mathhub.io)…"
npx wrangler pages deploy . --project-name gitblog1104 --branch main --commit-dirty true

echo "✓ Deploy done. Verify: https://mathhub.io/"
