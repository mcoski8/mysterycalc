#!/usr/bin/env python3
"""Populate / refresh MysteryCalc's `sealed_products` from PokePrice's LOCAL tcgcsv mirror.

WHY (Decision 040, 2026-09-12): tcgcsv.com is one hobbyist's mirror that blocked us once for
over-fetching. PokePrice is the SOLE tcgcsv consumer for every one of the owner's projects — it
mirrors the daily price archive (~/pokeprice-data/tcgcsv_archive/prices-YYYY-MM-DD.ppmd.7z, every
game) and the product metadata (~/pokeprice-data/tcgcsv_products/3/<groupId>.json, weekly). Until
today MysteryCalc ALSO fetched tcgcsv.com nightly from a Vercel cron (~435 requests per run, from
cloud IPs). That path is retired; this script produces the same rows from the local files.
0 tcgcsv network. Bulk data never leaves the Mac except as the final upsert.

WHAT: newest archive -> Pokémon EN (category 3) prices per set; products from the local mirror;
sealed = no "Number" AND no "Rarity" in extendedData (mirrors lib/sealed/classify.ts, Decision 032 —
keep the two in sync); product_type label = the same regex table as classify.ts; best price = a
marketPrice > 0, preferring the "Normal" printing (mirrors lib/sealed/sync.ts#bestPrice). Upserts
into sealed_products on product_id via PostgREST with the service-role key from .env.local.

Runs on the Mac via launchd `com.mysterycalc.sealed` at 07:50 (after PokePrice's 07:30 mirror),
using PokePrice's venv (py7zr + certifi). See scripts/daily_sealed.sh.

Run:
    python3 scripts/sync_sealed_from_mirror.py --dry-run     # counts only, no DB writes
    python3 scripts/sync_sealed_from_mirror.py               # upsert newest archive day
    python3 scripts/sync_sealed_from_mirror.py --file ~/pokeprice-data/tcgcsv_archive/prices-2026-09-11.ppmd.7z

Exit: 0 ok · 1 no archive / config error · 3 upsert failed.
GOTCHA: a set released since the last Sunday product-mirror refresh has prices but no product
metadata yet; its sealed rows appear after PokePrice's next weekly products run (logged as
"groups without products").
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import ssl
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone

import certifi
import py7zr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_MIRROR = os.path.expanduser("~/pokeprice-data/tcgcsv_archive")
DEFAULT_PRODUCTS = os.path.expanduser("~/pokeprice-data/tcgcsv_products/3")
POKEMON_EN_CAT = "3"
CHUNK = 500
_FILE_RE = re.compile(r"^prices-(\d{4}-\d{2}-\d{2})\.ppmd\.7z$")
_CTX = ssl.create_default_context(cafile=certifi.where())

# Same table, same order, as lib/sealed/classify.ts TYPE_RULES (first match wins).
TYPE_RULES = [
    ("Pokémon Center ETB", re.compile(r"pokemon center elite trainer box|pokemon center etb", re.I)),
    ("Elite Trainer Box", re.compile(r"elite trainer box|\betb\b", re.I)),
    ("Booster Box", re.compile(r"booster box", re.I)),
    ("Build & Battle", re.compile(r"build & battle|build and battle", re.I)),
    ("Booster Bundle", re.compile(r"booster bundle|booster.*bundle", re.I)),
    ("Blister", re.compile(r"blister|checklane", re.I)),
    ("Booster Pack", re.compile(r"booster pack|\bpack\b", re.I)),
    ("Tin", re.compile(r"\btin\b", re.I)),
    ("Collection", re.compile(r"collection|\bbox\b|chest|premium", re.I)),
    ("Starter / Deck", re.compile(r"starter|theme deck|battle deck|\bdeck\b", re.I)),
]


def load_env() -> dict:
    env = {}
    with open(os.path.join(ROOT, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def newest_archive(mirror: str) -> str | None:
    best = None
    if os.path.isdir(mirror):
        for f in os.listdir(mirror):
            if _FILE_RE.match(f) and os.path.getsize(os.path.join(mirror, f)) > 0:
                if best is None or f > best:
                    best = f
    return os.path.join(mirror, best) if best else None


def prices_by_group(path: str, iso_date: str) -> dict[str, list]:
    """{groupId: [price rows]} for Pokémon EN. Layout inside the 7z: <date>/<cat>/<group>/prices."""
    prefix = f"{iso_date}/{POKEMON_EN_CAT}/"
    tmp = tempfile.mkdtemp(prefix="mc_sealed_")
    try:
        with py7zr.SevenZipFile(path, "r") as z:
            targets = [n for n in z.getnames() if n.startswith(prefix)]
            z.extract(path=tmp, targets=targets)
        catdir = os.path.join(tmp, iso_date, POKEMON_EN_CAT)
        if not os.path.isdir(catdir) or not os.listdir(catdir):
            # Belt-and-braces: some py7zr versions need the full tree; extract everything.
            shutil.rmtree(tmp, ignore_errors=True)
            os.makedirs(tmp, exist_ok=True)
            with py7zr.SevenZipFile(path, "r") as z:
                z.extractall(tmp)
        out: dict[str, list] = {}
        for grp in os.listdir(catdir):
            pf = os.path.join(catdir, grp, "prices")
            if not os.path.isfile(pf):
                continue
            try:
                obj = json.loads(open(pf, "rb").read())
            except Exception:
                continue
            out[grp] = obj.get("results", []) if isinstance(obj, dict) else obj
        return out
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def is_sealed(extended) -> bool:
    """classify.ts#isSealed: no facts at all -> sealed; else neither "Number" nor "Rarity"."""
    if not extended:
        return True
    names = {(e.get("name") or "").strip().lower() for e in extended}
    return "number" not in names and "rarity" not in names


def product_type(name: str | None) -> str:
    n = (name or "").strip()
    if not n:
        return "Other"
    for label, rx in TYPE_RULES:
        if rx.search(n):
            return label
    return "Other"


def best_price(rows: list) -> dict | None:
    priced = [r for r in rows if isinstance(r.get("marketPrice"), (int, float)) and r["marketPrice"] > 0]
    if not priced:
        return None
    for r in priced:
        if (r.get("subTypeName") or "").lower() == "normal":
            return r
    return priced[0]


def postgrest_upsert(env: dict, rows: list[dict]) -> None:
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]  # writes need the service role (RLS blocks anon)
    url = f"{base}/rest/v1/sealed_products?on_conflict=product_id"
    for i in range(0, len(rows), CHUNK):
        batch = rows[i:i + CHUNK]
        req = urllib.request.Request(
            url, method="POST", data=json.dumps(batch).encode(),
            headers={
                "apikey": key, "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        with urllib.request.urlopen(req, timeout=120, context=_CTX) as resp:
            if resp.status not in (200, 201, 204):
                raise RuntimeError(f"upsert HTTP {resp.status}")
        print(f"[sealed]   wrote {min(i + len(batch), len(rows))}/{len(rows)} rows", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mirror", default=DEFAULT_MIRROR)
    ap.add_argument("--products", default=DEFAULT_PRODUCTS)
    ap.add_argument("--file", default=None, help="explicit archive .7z (default: newest in --mirror)")
    ap.add_argument("--dry-run", action="store_true", help="count + classify, no DB writes")
    args = ap.parse_args()

    path = args.file or newest_archive(args.mirror)
    if not path or not os.path.isfile(path):
        print(f"[sealed] no archive file found in {args.mirror} — run PokePrice's mirror first", file=sys.stderr)
        return 1
    m = _FILE_RE.match(os.path.basename(path))
    if not m:
        print(f"[sealed] cannot parse date from {path}", file=sys.stderr)
        return 1
    as_of = m.group(1)
    groups_file = os.path.join(args.products, "_groups.json")
    if not os.path.isfile(groups_file):
        print(f"[sealed] no products mirror at {args.products} — run PokePrice's products mirror first", file=sys.stderr)
        return 1
    group_names = {str(g.get("groupId")): g.get("name") for g in json.load(open(groups_file))}
    print(f"[sealed] archive={os.path.basename(path)} as_of={as_of} | products mirror: {len(group_names)} groups", flush=True)

    prices = prices_by_group(path, as_of)
    prices_at = f"{as_of}T00:00:00Z"   # prices are dated by the ARCHIVE, not the run
    synced_at = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []
    no_products: list[str] = []
    types: dict[str, int] = {}
    for gid, price_rows in prices.items():
        pfile = os.path.join(args.products, f"{gid}.json")
        if not os.path.isfile(pfile):
            no_products.append(gid)
            continue
        products = json.load(open(pfile))
        by_product: dict[int, list] = {}
        for r in price_rows:
            by_product.setdefault(r.get("productId"), []).append(r)
        for p in products:
            if not is_sealed(p.get("extendedData")):
                continue
            best = best_price(by_product.get(p.get("productId"), []))
            if not best:
                continue
            label = product_type(p.get("name"))
            types[label] = types.get(label, 0) + 1
            rows.append({
                "product_id": p["productId"],
                "name": p.get("name") or "Unknown sealed product",
                "clean_name": p.get("cleanName"),
                "set_name": group_names.get(gid),
                "group_id": int(gid),
                "image_url": p.get("imageUrl"),
                "market_price": best["marketPrice"],
                "low_price": best.get("lowPrice"),
                "product_type": label,
                "prices_updated_at": prices_at,
                "synced_at": synced_at,
            })

    print(f"[sealed] groups with prices={len(prices)} | groups without products={len(no_products)} "
          f"{no_products[:8] if no_products else ''} | sealed found={len(rows)}", flush=True)
    print("[sealed] by type: " + ", ".join(f"{k}={v}" for k, v in sorted(types.items(), key=lambda kv: -kv[1])), flush=True)
    if args.dry_run:
        print("[sealed] DRY RUN — no writes.")
        return 0
    try:
        postgrest_upsert(load_env(), rows)
    except Exception as e:
        print(f"[sealed] upsert FAILED: {e}", file=sys.stderr)
        return 3
    print(f"[sealed] DONE wrote={len(rows)} as_of={as_of}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
