#!/usr/bin/env python3
"""Mint an unsafe HS256 JWT that the cn-quickstart LocalNet ledger API accepts.

LocalNet configures `type = unsafe-jwt-hmac-256`, `secret = "unsafe"`,
`target-audience = https://canton.network.global`, `max-token-lifetime = Inf`.
So a token is just {"sub": <user>, "aud": <audience>} signed HS256 with "unsafe".

Usage: mint-localnet-token.py [sub] [audience] [secret]
  defaults: sub=ledger-api-user  aud=https://canton.network.global  secret=unsafe
"""
import sys, json, hmac, hashlib, base64


def b64(b: bytes) -> bytes:
    return base64.urlsafe_b64encode(b).rstrip(b"=")


sub = sys.argv[1] if len(sys.argv) > 1 else "ledger-api-user"
aud = sys.argv[2] if len(sys.argv) > 2 else "https://canton.network.global"
secret = sys.argv[3] if len(sys.argv) > 3 else "unsafe"

header = {"alg": "HS256", "typ": "JWT"}
payload = {"sub": sub, "aud": aud}
signing_input = b64(json.dumps(header).encode()) + b"." + b64(json.dumps(payload).encode())
sig = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
print((signing_input + b"." + b64(sig)).decode())
