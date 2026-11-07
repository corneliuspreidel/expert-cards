#!/usr/bin/env python3
"""Rebuild decks/index.json from every decks/<id>/deck.json.

Static hosting cannot list folders, so the start-screen catalog reads index.json.
Run this after adding or renaming a deck:

  python3 tools/sync_decks_index.py

Existing catalog fields (group, label, hint, status, group_title) are kept when the
same id is still present. New decks get status "draft" and title/language from deck.json.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECKS = ROOT / "decks"
INDEX = DECKS / "index.json"


def main() -> int:
    old = {}
    if INDEX.exists():
        try:
            prev = json.loads(INDEX.read_text(encoding="utf-8"))
            for d in prev.get("decks", []):
                if d.get("id"):
                    old[d["id"]] = d
        except Exception as e:  # noqa: BLE001
            print(f"warn: could not read old index ({e}); rewriting from decks only", file=sys.stderr)

    entries = []
    for path in sorted(DECKS.glob("*/deck.json")):
        folder = path.parent.name
        try:
            deck = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print(f"error: {path}: {e}", file=sys.stderr)
            return 1
        did = deck.get("id") or folder
        if did != folder:
            print(f"error: {path}: id {did!r} does not match folder {folder!r}", file=sys.stderr)
            return 1
        prev = old.get(did, {})
        entry = {
            "id": did,
            "title": deck.get("title") or did,
            "language": deck.get("language") or "de",
            "status": prev.get("status") or "draft",
        }
        for k in ("group", "group_title", "label", "hint"):
            if prev.get(k):
                entry[k] = prev[k]
        if not entry.get("hint") and deck.get("subtitle"):
            entry["hint"] = deck["subtitle"]
        entries.append(entry)

    INDEX.write_text(json.dumps({"decks": entries}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {INDEX.relative_to(ROOT)} ({len(entries)} deck{'s' if len(entries) != 1 else ''})")
    for e in entries:
        extra = f"  [{e['group']}]" if e.get("group") else ""
        print(f"  - {e['id']}: {e['title']}{extra}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
