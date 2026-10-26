#!/usr/bin/env bash
# Builds a Chrome Web Store upload zip with only the files the extension needs.
set -euo pipefail
cd "$(dirname "$0")"
version=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)
out="applyladder-job-saver-$version.zip"
rm -f "$out"
zip -r "$out" manifest.json popup.html popup.css icons src \
  -x "src/local-settings*.json" "src/assests/*" "src/*.example.json" "*.DS_Store"
echo "Built $out"
unzip -l "$out" | grep -i "local-settings" && { echo "ERROR: secrets in zip"; exit 1; } || true
