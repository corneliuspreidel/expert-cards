#!/usr/bin/env python3
"""Check a deck against docs/DECK_SCHEMA.md. Usage: python tools/validate_deck.py decks/<id>/deck.json [--allow-placeholder]"""
import json
import re
import sys
from pathlib import Path

CARD_TYPES = {"info", "single_choice", "multi_choice", "verdict", "scale", "free_text"}
PLANNED = {"ab_compare", "find_error"}
TEMPLATES = {"duplex-plan", "section"}
HIGHLIGHTS = {"base", "party", "ext", "hwr", "hwrdoor", "flur", "keller"}


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    allow_placeholder = "--allow-placeholder" in argv
    if not args:
        print(__doc__)
        return 2
    path = Path(args[0])
    errors, warnings = [], []
    err = errors.append

    try:
        deck = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"cannot read {path}: {e}")
        return 1

    for k in ("schema", "id", "version", "language", "title", "sections", "verdict_options", "submission"):
        if k not in deck:
            err(f"missing top-level field: {k}")
    if deck.get("schema") != "expert-cards/deck@0.1":
        err(f"unknown schema {deck.get('schema')!r}")
    if deck.get("id") and path.parent.name != deck["id"]:
        err(f"deck id {deck['id']!r} does not match folder {path.parent.name!r}")

    refs = deck.get("references", {})
    verdict_ids = {o.get("id") for o in deck.get("verdict_options", [])}
    if len(verdict_ids) != len(deck.get("verdict_options", [])):
        err("duplicate verdict option ids")

    seen = {}
    all_cards = []
    for i, c in enumerate(deck.get("intro_cards", [])):
        if c.get("type") != "info":
            err(f"intro card {i + 1} must be type info")
        if c.get("id"):
            all_cards.append(c)
    for sec in deck.get("sections", []):
        if sec.get("reference") and sec["reference"] not in refs:
            err(f"section {sec.get('id')}: unknown reference {sec['reference']!r}")
        for c in sec.get("cards", []):
            all_cards.append(c)
            cid = c.get("id")
            if not cid:
                err(f"card without id in section {sec.get('id')}")
                continue
            if cid in seen:
                err(f"duplicate card id {cid}")
            seen[cid] = c
            t = c.get("type")
            if t in PLANNED:
                err(f"{cid}: card type {t} is not implemented yet")
            elif t not in CARD_TYPES:
                err(f"{cid}: unknown card type {t!r}")
            if t in ("single_choice", "multi_choice"):
                opts = c.get("options") or []
                if len(opts) < 2:
                    err(f"{cid}: needs at least 2 options")
                oids = [o.get("id") for o in opts]
                if len(set(oids)) != len(oids):
                    err(f"{cid}: duplicate option ids")
            if t == "verdict" and not (c.get("prompt") or sec.get("question")):
                err(f"{cid}: verdict card needs a prompt or a section question")
            if t == "verdict" and "changes" not in c:
                warnings.append(f"{cid}: verdict card without changes")
            fig = c.get("figure")
            if fig:
                if fig.get("template") not in TEMPLATES and not fig.get("image"):
                    err(f"{cid}: unknown figure template {fig.get('template')!r}")
                if fig.get("template") == "duplex-plan" and fig.get("highlight") not in HIGHLIGHTS:
                    err(f"{cid}: unknown highlight {fig.get('highlight')!r}")
                if fig.get("image") and not (path.parent / fig["image"]).exists():
                    err(f"{cid}: image file missing: {fig['image']}")
    for cid, c in seen.items():
        for r in c.get("related", []) or []:
            if r not in seen:
                err(f"{cid}: related card {r!r} does not exist")

    text = json.dumps(deck, ensure_ascii=False)
    if re.search(r"</?(mark|b|i|script|style)\b", text):
        err("HTML found in deck text; use ==mark== and **bold** markup")
    if re.search(r"\"(key|expected|expected_verdict|correct)\"\s*:", text):
        err("deck contains a field that looks like an answer key (key/expected/correct); keys must never be in the repository")

    sub = deck.get("submission", {})
    if sub.get("mode") not in ("email", "webhook"):
        err("submission.mode must be email or webhook")
    if sub.get("mode") == "email" and sub.get("to") in (None, "", "PLEASE_SET"):
        (warnings if allow_placeholder else errors).append("submission.to is not set")
    if sub.get("mode") == "webhook" and not str(sub.get("url", "")).startswith("https://"):
        err("submission.url must be an https URL")

    idx = path.parent.parent / "index.json"
    if idx.exists() and deck.get("id") not in {d.get("id") for d in json.loads(idx.read_text(encoding="utf-8")).get("decks", [])}:
        warnings.append("deck is not listed in decks/index.json")

    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("error:  ", e)
    print(f"{len(seen)} cards, {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
