#!/usr/bin/env python3
"""Agreement statistics for verdict/choice answers.

Usage:
  python tools/agreement.py answers/answers.csv [--key /path/outside/repo/key.csv] [--cards B1,B2,...]

answers.csv comes from tools/import_answers.py. The key is a CSV with columns `card_id,expected`
and must live OUTSIDE this repository; the script refuses a key inside a git work tree.

Reports (no dependencies):
  * per expert against the key: accuracy and Cohen's kappa
  * among all experts: Fleiss' kappa over cards that every expert answered (needs >= 2 experts)
  * per card: answer distribution and the share agreeing with the key
"""
import argparse
import csv
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path


def inside_git_repo(path: Path) -> bool:
    try:
        r = subprocess.run(["git", "-C", str(path.resolve().parent), "rev-parse", "--is-inside-work-tree"],
                           capture_output=True, text=True)
        return r.returncode == 0 and r.stdout.strip() == "true"
    except FileNotFoundError:
        return False


def cohen_kappa(a, b):
    n = len(a)
    if n == 0:
        return float("nan")
    po = sum(x == y for x, y in zip(a, b)) / n
    ca, cb = Counter(a), Counter(b)
    pe = sum(ca[k] * cb[k] for k in set(ca) | set(cb)) / (n * n)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)


def fleiss_kappa(table):
    """table: list of Counter (category -> raters), equal number of raters per item."""
    N = len(table)
    n = sum(table[0].values())
    cats = sorted({c for row in table for c in row})
    if N == 0 or n < 2:
        return float("nan")
    p_j = [sum(row[c] for row in table) / (N * n) for c in cats]
    P_i = [(sum(row[c] ** 2 for c in cats) - n) / (n * (n - 1)) for row in table]
    Pbar, Pe = sum(P_i) / N, sum(p * p for p in p_j)
    return 1.0 if Pe == 1 else (Pbar - Pe) / (1 - Pe)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("answers")
    ap.add_argument("--key")
    ap.add_argument("--cards", help="comma-separated card ids to include (default: all with a value)")
    ap.add_argument("--types", default="verdict,single_choice", help="card types to include when the CSV has them")
    args = ap.parse_args()

    rows = list(csv.DictReader(open(args.answers, encoding="utf-8")))
    wanted = set(args.cards.split(",")) if args.cards else None
    types = set(args.types.split(","))
    data = defaultdict(dict)  # card -> expert -> value
    for r in rows:
        if not r["value"] or "|" in r["value"]:
            continue
        if wanted and r["card_id"] not in wanted:
            continue
        if r["card_type"] and r["card_type"] not in types:
            continue
        data[r["card_id"]][r["code"] or r["name"] or "?"] = r["value"]
    experts = sorted({e for d in data.values() for e in d})
    print(f"{len(experts)} expert(s), {len(data)} card(s)")

    key = {}
    if args.key:
        kp = Path(args.key)
        if inside_git_repo(kp):
            print("refusing: the key file is inside a git work tree. Keep it outside the repository.", file=sys.stderr)
            return 2
        key = {r["card_id"]: r["expected"] for r in csv.DictReader(open(kp, encoding="utf-8"))}

    if key:
        print("\nPer expert vs key")
        for e in experts:
            cards = [c for c in data if e in data[c] and c in key]
            a = [data[c][e] for c in cards]
            b = [key[c] for c in cards]
            acc = sum(x == y for x, y in zip(a, b)) / len(cards) if cards else float("nan")
            print(f"  {e:12} n={len(cards):3}  accuracy={acc:.2f}  kappa={cohen_kappa(a, b):.2f}")

    common = [c for c in data if all(e in data[c] for e in experts)]
    if len(experts) >= 2 and common:
        table = [Counter(data[c][e] for e in experts) for c in common]
        print(f"\nFleiss' kappa among {len(experts)} experts over {len(common)} common cards: {fleiss_kappa(table):.2f}")
    elif len(experts) >= 2:
        print("\nNo card was answered by all experts; Fleiss' kappa not computed.")

    print("\nPer card")
    for c in sorted(data):
        dist = Counter(data[c].values())
        share = f"  key={key[c]} agree={dist[key[c]] / len(data[c]):.2f}" if c in key else ""
        print(f"  {c:5} " + ", ".join(f"{k}:{v}" for k, v in sorted(dist.items())) + share)
    return 0


if __name__ == "__main__":
    sys.exit(main())
