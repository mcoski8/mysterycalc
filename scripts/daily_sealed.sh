#!/bin/bash
# MysteryCalc daily sealed-price refresh — reads PokePrice's LOCAL tcgcsv mirror (newest archive
# + products) and upserts sealed_products. ZERO tcgcsv network (Decision 040: PokePrice is the sole
# tcgcsv consumer; the Vercel cron that fetched tcgcsv.com nightly is retired). Runs on the Mac at
# 07:50 via the LaunchAgent com.mysterycalc.sealed, after PokePrice's 07:30 mirror and PokeHolder's
# 07:45 job. Reuses PokePrice's venv (py7zr + certifi already installed there).
# See scripts/sync_sealed_from_mirror.py. Exit 3 = upsert failed (see the log).
set -u
PY="/Users/michaelchang/CODE/pokeprice/pipeline/.venv/bin/python"
SCRIPT="/Users/michaelchang/CODE/mysterycalc/scripts/sync_sealed_from_mirror.py"
LOG="/Users/michaelchang/pokeprice-data/mysterycalc-sealed.log"

echo "===== $(date '+%Y-%m-%d %H:%M:%S') mysterycalc sealed sync start =====" >> "$LOG"
"$PY" "$SCRIPT" >> "$LOG" 2>&1
code=$?
echo "===== done exit=$code $(date '+%H:%M:%S') =====" >> "$LOG"
exit 0
