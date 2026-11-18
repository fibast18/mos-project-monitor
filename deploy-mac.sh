#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo 'Open this script from your GitHub-cloned mos-project-monitor repository.' >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo 'Switch to the main branch before deploying.' >&2
  exit 1
fi
node --check sw.js
node scripts/validate-pages.mjs
# Stage only public website files, never private backups or credentials.
git add -- index.html sw.js manifest.webmanifest apple-touch-icon.png icon-192.png icon-512.png CNAME scripts/validate-pages.mjs .github/workflows/deploy-pages.yml
if ! git diff --cached --quiet; then
  git commit -m "${1:-Update MOS Project Monitor website}"
fi
git push origin main
printf '\nPushed to GitHub. Check the Actions tab for CI/CD status.\n'
