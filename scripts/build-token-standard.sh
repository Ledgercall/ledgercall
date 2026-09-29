#!/usr/bin/env bash
# Rebuild the Canton Network Token Standard (CIP-0056) interface DARs that LEDGERCALL
# depends on, from the official splice source, and drop them into ./.lib/.
#
# These four DARs are already committed under .lib/ so the project builds out of the
# box. Run this only if you want to regenerate them (e.g. to re-pin a newer version).
#
# Requires: dpm (Daml SDK) on PATH, git, internet access.
set -euo pipefail

# Pinned so the build is reproducible. Bump deliberately, not by accident.
SPLICE_REPO="https://github.com/canton-network/splice"
SPLICE_REF="9c7ffd2cbbab14549d1d9dadf93e096cfa5c75d6"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
BUILD="$WORK/tsbuild"
PKGS=(
  splice-api-token-metadata-v1
  splice-api-token-holding-v1
  splice-api-token-allocation-v1
  splice-api-token-allocation-request-v1
)

echo ">> sparse-cloning splice token-standard @ ${SPLICE_REF:0:12}"
git clone --filter=blob:none --sparse "$SPLICE_REPO" "$WORK/splice" >/dev/null 2>&1
git -C "$WORK/splice" sparse-checkout set token-standard >/dev/null 2>&1
git -C "$WORK/splice" checkout -q "$SPLICE_REF"

echo ">> staging the four interface packages"
mkdir -p "$BUILD"
for p in "${PKGS[@]}"; do
  cp -r "$WORK/splice/token-standard/$p" "$BUILD/"
  # Build with the locally-installed SDK; LF target stays 2.1 via each package's build-options.
  sed -i 's/^sdk-version: .*/sdk-version: 3.5.12/' "$BUILD/$p/daml.yaml"
  # The upstream data-dependency paths use a "-current.dar" alias; point them at the real build output.
  sed -i 's/-current\.dar/-1.0.0.dar/g' "$BUILD/$p/daml.yaml"
done

echo ">> multi-package build (dependency order resolved by dpm)"
{
  echo "packages:"
  for p in "${PKGS[@]}"; do echo "  - ./$p"; done
} > "$BUILD/multi-package.yaml"
( cd "$BUILD" && dpm build --all )

echo ">> copying DARs into .lib/"
mkdir -p "$REPO_ROOT/.lib"
for p in "${PKGS[@]}"; do
  cp "$BUILD/$p/.daml/dist/$p-1.0.0.dar" "$REPO_ROOT/.lib/"
done

rm -rf "$WORK"
echo ">> done. .lib/ now contains:"
ls -1 "$REPO_ROOT/.lib/"
