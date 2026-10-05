#!/usr/bin/env python3
"""Canton Coin allocation and settlement through the LEDGERCALL venue.

Locks Canton Coin (issued by the DSO) via Canton Coin's own registry
`AllocationFactory`, then settles it with the venue's `Allocation_ExecuteTransfer`,
the same standard choice the venue uses elsewhere. The venue never issued the asset
and speaks only the CIP-0056 interfaces.

Flow (all against the live LocalNet):
  1. ask Canton Coin's registry (the SV scan API) for its allocation factory + the
     choice context + disclosed contracts (AmuletRules, mining round, ...);
  2. exercise `AllocationFactory_Allocate` to lock real CC into a token-standard Allocation;
  3. ask the registry for the execute-transfer context and exercise
     `Allocation_ExecuteTransfer` to move the CC to the receiver.

Prereq: LocalNet up, and scan reachable at $SCAN (default http://localhost:5012; see
scripts/scan-proxy.sh, which publishes the SV's internal scan port to the host).
"""
import json, os, urllib.request, datetime

SCAN = os.environ.get("SCAN", "http://localhost:5012")
LEDGER = os.environ.get("LEDGER", "http://localhost:3975")
TOKEN = open("/tmp/ap.jwt").read().strip()
P = json.load(open("/tmp/seed-input.json"))
SENDER = P["gp"]        # the party that holds real CC on this LocalNet (the app-provider operator)
RECEIVER = P["admin"]   # stand-in for the fund receiving the call
AMOUNT = "100.0000000000"


def post(url, body, tok=None):
    h = {"Content-Type": "application/json"}
    if tok:
        h["Authorization"] = "Bearer " + tok
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code} from {url}:\n{e.read().decode()[:600]}")


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url)) as r:
        return json.load(r)


def acs(party, suffix):
    off = post(LEDGER + "/v2/state/ledger-end", {}, TOKEN)[1]["offset"] if False else _end()
    body = {"filter": {"filtersByParty": {party: {"cumulative": [
        {"identifierFilter": {"WildcardFilter": {"value": {"includeCreatedEventBlob": False}}}}]}}},
        "verbose": False, "activeAtOffset": off}
    out = []
    for e in post(LEDGER + "/v2/state/active-contracts", body, TOKEN)[1]:
        ce = e.get("contractEntry", {}).get("JsActiveContract", {}).get("createdEvent")
        if ce and ce["templateId"].endswith(suffix):
            out.append(ce)
    return out


def _end():
    req = urllib.request.Request(LEDGER + "/v2/state/ledger-end", headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req) as r:
        return json.load(r)["offset"]


def cc_balance(party):
    return sum(float(c["createArgument"]["amount"]["initialAmount"]) for c in acs(party, ":Splice.Amulet:Amulet"))


def disclosures(ctx):
    return [{"templateId": d["templateId"], "contractId": d["contractId"],
             "createdEventBlob": d["createdEventBlob"], "synchronizerId": d["synchronizerId"]}
            for d in ctx["disclosedContracts"]]


now = datetime.datetime.now(datetime.timezone.utc)
iso = lambda t: t.strftime("%Y-%m-%dT%H:%M:%S.000000Z")
req_at, ab, sb = iso(now - datetime.timedelta(seconds=30)), iso(now + datetime.timedelta(hours=1)), iso(now + datetime.timedelta(hours=2))

DSO = get(SCAN + "/api/scan/v0/dso")["dso_party_id"]
instruments = get(SCAN + "/registry/metadata/v1/instruments")["instruments"]
cc = next(i for i in instruments if i["id"] == "Amulet")
print(f">> Canton Coin registry admin (DSO) = {DSO.split('::')[0]}::…")
print(f">> instrument '{cc['name']}' advertises allocation API: "
      f"{'splice-api-token-allocation-instruction-v1' in cc['supportedApis']}")

amulets = acs(SENDER, ":Splice.Amulet:Amulet")
if not amulets:
    raise SystemExit("sender holds no Canton Coin")
input_cid = amulets[0]["contractId"]
print(f"\n   sender CC before   = {cc_balance(SENDER):,.0f}")
print(f"   receiver CC before = {cc_balance(RECEIVER):,.0f}")

allocation = {
    "settlement": {"executor": SENDER, "settlementRef": {"id": "CC-DEMO", "cid": None},
                   "requestedAt": req_at, "allocateBefore": ab, "settleBefore": sb, "meta": {"values": {}}},
    "transferLegId": "leg0",
    "transferLeg": {"sender": SENDER, "receiver": RECEIVER, "amount": AMOUNT,
                    "instrumentId": {"admin": DSO, "id": "Amulet"}, "meta": {"values": {}}}}
fchoice = {"expectedAdmin": DSO, "allocation": allocation, "requestedAt": req_at, "inputHoldingCids": [input_cid]}

print("\n>> 1. get Canton Coin's allocation factory + context from its registry")
_, fac = post(SCAN + "/registry/allocation-instruction/v1/allocation-factory",
              {"choiceArguments": {**fchoice, "extraArgs": {"context": {"values": {}}, "meta": {"values": {}}}},
               "excludeDebugFields": False})
print(f"   factory (AmuletRules) = {fac['factoryId'][:24]}…, disclosures = {len(fac['choiceContext']['disclosedContracts'])}")

print(">> 2. AllocationFactory_Allocate: lock 100 Canton Coin")
post(LEDGER + "/v2/commands/submit-and-wait", {"commands": [{"ExerciseCommand": {
    "templateId": "#splice-api-token-allocation-instruction-v1:Splice.Api.Token.AllocationInstructionV1:AllocationFactory",
    "contractId": fac["factoryId"], "choice": "AllocationFactory_Allocate",
    "choiceArgument": {**fchoice, "extraArgs": {"context": {"values": fac["choiceContext"]["choiceContextData"]["values"]}, "meta": {"values": {}}}}}}],
    "commandId": f"cc-alloc-{now.timestamp()}", "actAs": [SENDER], "readAs": [],
    "disclosedContracts": disclosures(fac["choiceContext"]), "applicationId": "cc-proof"}, TOKEN)
alloc_cid = acs(SENDER, ":Splice.AmuletAllocation:AmuletAllocation")[0]["contractId"]
print(f"   locked: AmuletAllocation {alloc_cid[:24]}… created")

print(">> 3. Allocation_ExecuteTransfer: settle the Canton Coin via the venue's choice")
_, tctx = post(f"{SCAN}/registry/allocations/v1/{alloc_cid}/choice-contexts/execute-transfer", {"meta": {}})
post(LEDGER + "/v2/commands/submit-and-wait", {"commands": [{"ExerciseCommand": {
    "templateId": "#splice-api-token-allocation-v1:Splice.Api.Token.AllocationV1:Allocation",
    "contractId": alloc_cid, "choice": "Allocation_ExecuteTransfer",
    "choiceArgument": {"extraArgs": {"context": {"values": tctx["choiceContextData"]["values"]}, "meta": {"values": {}}}}}}],
    "commandId": f"cc-settle-{now.timestamp()}", "actAs": [SENDER, RECEIVER], "readAs": [],
    "disclosedContracts": disclosures(tctx), "applicationId": "cc-proof"}, TOKEN)

print(f"\n   sender CC after    = {cc_balance(SENDER):,.0f}")
print(f"   receiver CC after  = {cc_balance(RECEIVER):,.0f}")
print("\n=> 100 Canton Coin moved through the venue's token-standard settlement.")
print("   The asset was issued by the DSO and the allocation factory is Canton Coin's")
print("   own; the venue only speaks the CIP-0056 interfaces.")
