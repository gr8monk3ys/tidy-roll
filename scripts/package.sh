#!/usr/bin/env bash
# Build the Chrome Web Store upload zip from extension/.
# The manifest must sit at the zip root, so we zip the folder's contents.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$ROOT/extension/manifest.json','utf8')).version")"
OUT="$ROOT/dist/tidy-roll-v$VERSION.zip"

mkdir -p "$ROOT/dist"
rm -f "$OUT"
(cd "$ROOT/extension" && zip -qr "$OUT" . -x '*.DS_Store')

echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
