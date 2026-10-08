#!/usr/bin/env bash
# Download Rohingya Language Book 2 V1.00 for local reference.
# Do not commit the PDF (copyright + size). See src/lib/sources/book2.ts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/reference/pdfs"
mkdir -p "$DIR"
URL="${1:-https://www.rohingyalanguage.com/wp-content/uploads/2018/10/Rohingya-Language-Book-2-V1.00-Light.pdf}"
OUT="$DIR/Rohingya-Language-Book-2-V1.00.pdf"
echo "Fetching $URL"
curl -fL --retry 3 -o "$OUT" "$URL"
ls -lh "$OUT"
echo "Kept out of git via /reference/pdfs/. Use as a human reference only."
echo "Lesson pages are scanned Rohingya-only drills; do not OCR them into PHRASES."
