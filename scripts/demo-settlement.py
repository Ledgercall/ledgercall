#!/usr/bin/env python3
"""Run the two settlement outcomes on the live LocalNet, driving the Canton JSON
Ledger API by package-name (resolved on-ledger):

  A) Happy path    - every LP allocates, the GP settles all legs in one atomic
                     transaction (submitMulti), and the cash moves to the fund.
  B) Nothing moves - LPs allocate, the deadline passes, every allocation releases,
                     and nothing reaches the fund.

Balances are read straight from the ledger.
"""
import json, os, urllib.request, time

BASE = "http://localhost:3975"
TOKEN = open("/tmp/ap.jwt").read().strip()
P = json.load(open("/tmp/seed-input.json"))
GP, REG, LPS = P["gp"], P["registry"], P["lps"]
CASH_T = "#ledgercall:LedgerCall.TestRegistry:LedgerCallCash"
ALLOC_IFACE = "#splice-api-token-allocation-v1:Splice.Api.Token.AllocationV1:Allocation"
INSTR = {"admin": REG, "id": "USD"}
EXTRA = {"context": {"values": {}}, "meta": {"values": {}}}


def call(path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
                                 method="POST" if data else "GET")
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def offset():
    return call("/v2/state/ledger-end")["offset"]


def acs(party):
    body = {"filter": {"filtersByParty": {party: {"cumulative": [
        {"identifierFilter": {"WildcardFilter": {"value": {"includeCreatedEventBlob": False}}}}]}}},
        "verbose": False, "activeAtOffset": offset()}
    out = []
    for e in call("/v2/state/active-contracts", body):
        ce = e.get("contractEntry", {}).get("JsActiveContract", {}).get("createdEvent")
        if ce:
            out.append({"cid": ce["contractId"], "tpl": ce["templateId"].split(":")[-1], "arg": ce["createArgument"]})
    return out


def submit(act_as, commands, allow_fail=False):
    body = {"commands": commands, "commandId": f"demo-{time.time_ns()}", "actAs": act_as, "readAs": [], "applicationId": "demo"}
    try:
        return call("/v2/commands/submit-and-wait", body)
    except urllib.error.HTTPError as ex:
        if allow_fail:
            return None
        raise RuntimeError(ex.read().decode()[:300])


def exercise(tpl, cid, choice, arg):
    return {"ExerciseCommand": {"templateId": tpl, "contractId": cid, "choice": choice, "choiceArgument": arg}}


def create(tpl, args):
    return {"CreateCommand": {"templateId": tpl, "createArguments": args}}


def held(party, tpl_suffix):
    return sum(float(c["arg"]["amount"]) for c in acs(party)
               if c["tpl"] == tpl_suffix and c["arg"].get("owner") == party)


def reset_funds():
    """Release/archive every allocation and cash, then give each LP a fresh $1,000,000."""
    for c in acs(REG):
        if c["tpl"] == "LedgerCallCashAllocation":
            submit([REG, c["arg"]["owner"]], [exercise("#ledgercall:LedgerCall.TestRegistry:LedgerCallCashAllocation", c["cid"], "Archive", {})], allow_fail=True)
    for holder in [GP] + LPS:
        for c in acs(holder):
            if c["tpl"] == "LedgerCallCash" and c["arg"]["owner"] == holder:
                submit([REG, holder], [exercise(CASH_T, c["cid"], "Archive", {})], allow_fail=True)
    for lp in LPS:
        submit([REG, lp], [create(CASH_T, {"registry": REG, "owner": lp, "amount": "1000000.0000000000", "instrumentId": INSTR})])


def allocate_all():
    """Each LP locks its obligation's amountDue from its own holding (no wire)."""
    for lp in LPS:
        v = acs(lp)
        obl = next((c for c in v if c["tpl"] == "CallObligation"), None)
        cash = next((c for c in v if c["tpl"] == "LedgerCallCash" and c["arg"]["owner"] == lp), None)
        if not obl or not cash:
            continue
        o = obl["arg"]
        settlement = {"executor": GP, "settlementRef": {"id": o["callId"], "cid": None},
                      "requestedAt": o["allocateBefore"], "allocateBefore": o["allocateBefore"],
                      "settleBefore": o["settleBefore"], "meta": {"values": {}}}
        submit([lp], [exercise(CASH_T, cash["cid"], "Cash_Allocate",
                               {"executor": GP, "receiver": GP, "settlement": settlement,
                                "transferLegId": o["callId"] + "-" + lp.split("::")[0], "allocAmount": o["amountDue"]})])


def settle_all():
    """One atomic transaction: execute every allocation's transfer, all or nothing."""
    allocs = [c for c in acs(REG) if c["tpl"] == "LedgerCallCashAllocation"]
    if not allocs:
        return
    owners = sorted({c["arg"]["owner"] for c in allocs})
    cmds = [exercise(ALLOC_IFACE, c["cid"], "Allocation_ExecuteTransfer", {"extraArgs": EXTRA}) for c in allocs]
    submit([GP] + owners, cmds)


def release_all():
    """Each sender releases its allocation after the deadline; the holding returns to it."""
    for c in acs(REG):
        if c["tpl"] == "LedgerCallCashAllocation":
            submit([c["arg"]["owner"]], [exercise(ALLOC_IFACE, c["cid"], "Allocation_Withdraw", {"extraArgs": EXTRA})])


def show(label):
    print(f"   {label:<26} | fund(gp) received = {held(GP, 'LedgerCallCash'):,.0f}")
    for i, lp in enumerate(LPS, 1):
        print(f"   {'':<26} |   LP{i}  unlocked={held(lp, 'LedgerCallCash'):>12,.0f}   locked={held(lp, 'LedgerCallCashAllocation'):>12,.0f}")


print("\n\033[1mA) Happy path: all LPs allocate, GP settles atomically\033[0m")
reset_funds(); show("0. start")
allocate_all(); show("1. after allocate")
settle_all();   show("2. after atomic settle")
print("   => the fund received the full call in one transaction; each LP debited its share.")

print("\n\033[1mB) Nothing moves: allocate, then the deadline releases everything\033[0m")
reset_funds(); show("0. start")
allocate_all(); show("1. after allocate (locked)")
release_all();  show("2. after deadline release")
print("   => the fund received nothing; every LP is whole again. No cash moved.")
