#!/usr/bin/env bash
# Publish the SV's internal scan HTTP API (Canton Coin's registry API) to the host,
# so the Canton Coin demo can reach it at http://localhost:5012.
set -euo pipefail
NET=$(docker inspect canton --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
docker rm -f scanproxy >/dev/null 2>&1 || true
docker run -d --name scanproxy --network "$NET" -p 127.0.0.1:5012:5012 alpine/socat \
  tcp-listen:5012,fork,reuseaddr tcp-connect:splice:5012 >/dev/null
echo "scan proxy up: http://localhost:5012 -> splice:5012 (network $NET)"
