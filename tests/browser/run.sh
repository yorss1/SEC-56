#!/usr/bin/env bash
# Prueba en Chromium real (Playwright para Python). Opcional: no forma parte de `npm test`.
# Usa contenido de EJEMPLO copiado a una carpeta temporal; no modifica content/.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$AQUI/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'kill "${PID:-0}" 2>/dev/null || true; rm -rf "$TMP"' EXIT
cp -r "$RAIZ/content" "$TMP/content"
cp "$RAIZ"/tests/fixtures/avisos-ejemplo/*.json "$TMP/content/avisos/"
CONTENT_DIR="$TMP/content" OUT_DIR="$TMP/dist" BUILD_DATE=2026-10-14 PORT=4180 node "$RAIZ/scripts/serve.mjs" > "$TMP/serve.log" 2>&1 &
PID=$!
sleep 2
mkdir -p "$TMP/capturas"
python3 "$AQUI/browser-test.py" "$TMP/capturas" http://127.0.0.1:4180
