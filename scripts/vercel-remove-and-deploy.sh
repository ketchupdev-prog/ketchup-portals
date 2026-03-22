#!/usr/bin/env bash
# Remove old Vercel portal projects and deploy ketchup-portals (Buffr team).
# Run from repo root: ./scripts/vercel-remove-and-deploy.sh
set -e

SCOPE="buffr"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Using Vercel scope: $SCOPE ==="
echo ""

echo "--- Removing old portal projects ---"
for project in ketchup-portal agent-portal government-portal; do
  if vercel remove "$project" --yes --scope "$SCOPE" 2>/dev/null; then
    echo "Removed: $project"
  else
    echo "Skip or error (may already be removed): $project"
  fi
done

echo ""
echo "--- Deploying ketchup-portals (production) ---"
vercel --prod --scope "$SCOPE" --yes

echo ""
echo "Done. Add domain portal.ketchup.cc and env vars in Vercel Dashboard if needed."
