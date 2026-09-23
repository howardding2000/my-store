#!/usr/bin/env bash
#
# Manually installs Prisma engine binaries on THIS dev VM.
#
# WHY THIS EXISTS:
#   This VM's egress goes through an HTTP proxy and blocks direct HTTPS.
#   Prisma's fetch-engine does not route engine downloads through the proxy,
#   so the `postinstall` download of @prisma/engines always fails here
#   (ECONNRESET) and fails the whole `npm install`.
#
#   On a normal machine (and on Vercel) `npm install` just works — this
#   script is only needed on this VM.
#
# USAGE (this VM only):
#   npm install --ignore-scripts        # or: npm i <pkg> --ignore-scripts
#   bash scripts/setup-prisma-engines.sh
#   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
#
# The script downloads the official binaries via the proxy, verifies sha256
# checksums against Prisma's published values, and places the files where
# the Prisma CLI and the generated client expect them.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -d node_modules/@prisma/engines-version ]; then
  echo "error: node_modules/@prisma/engines-version not found." >&2
  echo "Run: npm install --ignore-scripts   (then re-run this script)" >&2
  exit 1
fi

SHA="$(node -e "console.log(require('./node_modules/@prisma/engines-version/package.json').prisma.enginesVersion)")"
TARGET="debian-openssl-3.0.x"
BASE="https://binaries.prisma.sh/all_commits/${SHA}/${TARGET}"

if [ -z "${HTTPS_PROXY:-}" ]; then
  echo "error: HTTPS_PROXY is not set; this script needs the egress proxy." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading Prisma engines (sha=${SHA}) via proxy..."
for f in libquery_engine.so.node schema-engine; do
  curl -sf -x "$HTTPS_PROXY" -o "$TMP/$f.gz" "$BASE/$f.gz"
  curl -sf -x "$HTTPS_PROXY" -o "$TMP/$f.gz.sha256" "$BASE/$f.gz.sha256"
  expected="$(cut -d' ' -f1 < "$TMP/$f.gz.sha256")"
  actual="$(sha256sum "$TMP/$f.gz" | cut -d' ' -f1)"
  if [ "$expected" != "$actual" ]; then
    echo "error: checksum mismatch for $f.gz" >&2
    echo "  expected: $expected" >&2
    echo "  actual:   $actual" >&2
    exit 1
  fi
  echo "  ok: $f.gz (sha256 verified)"
  gunzip -kf "$TMP/$f.gz"
done

for dir in node_modules/@prisma/engines node_modules/prisma; do
  cp "$TMP/libquery_engine.so.node" "$dir/libquery_engine-${TARGET}.so.node"
  cp "$TMP/schema-engine" "$dir/schema-engine-${TARGET}"
  chmod +x "$dir/schema-engine-${TARGET}"
done

echo "Engines installed to node_modules/@prisma/engines and node_modules/prisma."
echo "Next: PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate"
