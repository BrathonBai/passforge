#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./manifest.json').version")"
OUT_DIR="$ROOT/dist"
OUT="$OUT_DIR/passforge-${VERSION}.zip"

command -v zip >/dev/null 2>&1 || {
  echo "Error: the 'zip' command is required." >&2
  exit 1
}

mkdir -p "$OUT_DIR"
rm -f "$OUT"

# Only ship files Chrome needs. Keep README, tests and store assets out of the
# package uploaded to the Chrome Web Store.
zip -X -q "$OUT" \
  manifest.json \
  background.js \
  popup.html \
  popup.css \
  popup.js \
  generator.js \
  fill-page.js \
  icons/icon16.png \
  icons/icon32.png \
  icons/icon48.png \
  icons/icon128.png

echo "Built $OUT"
