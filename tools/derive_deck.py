#!/usr/bin/env python3
"""Derive a deck from a source deck (e.g. the MBO version from the BayBO version), so both keep identical
card ids, cases and options. Usage:
  python3 tools/derive_deck.py decks/<id>/derive.json          # write the target deck.json
  python3 tools/derive_deck.py decks/<id>/derive.json --check  # exit 1 if the target is out of date
The spec (JSON) holds: source, source_version, target, renumber{pattern, template, map}, replace{old: new},
set{dotted.path: value}, section_reference{old: new}, identity_patch{field_id: {key: value|null}},
append_cards[{section, card, after?}]. Strings in `set` and `append_cards` are taken as they are."""
import copy, json, re, sys
from pathlib import Path

def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))

def derive(spec):
    src = load(spec["source"])
    rn = spec.get("renumber")
    rx = re.compile(rn["pattern"]) if rn else None
    unknown = set()

    def conv(s):
        if rx:
            def sub(m):
                n = m.group(1)
                if n not in rn["map"]:
                    unknown.add(m.group(0)); return m.group(0)
                return rn["template"].format(n=rn["map"][n])
            s = rx.sub(sub, s)
        for a, b in spec.get("replace", {}).items():
            s = s.replace(a, b)
        return s

    def walk(o):
        if isinstance(o, dict): return {k: walk(v) for k, v in o.items()}
        if isinstance(o, list): return [walk(v) for v in o]
        return conv(o) if isinstance(o, str) else o

    refs = src.pop("references", None)
    d = walk(src)
    if refs is not None: d["references"] = refs  # replaced by `set` below in normal use
    for path, val in spec.get("set", {}).items():
        cur, keys = d, path.split(".")
        for k in keys[:-1]:
            cur = cur[int(k)] if isinstance(cur, list) else cur.setdefault(k, {})
        last = keys[-1]
        if isinstance(cur, list): cur[int(last)] = copy.deepcopy(val)
        else: cur[last] = copy.deepcopy(val)
    for sec in d.get("sections", []):
        r = sec.get("reference")
        if r in spec.get("section_reference", {}): sec["reference"] = spec["section_reference"][r]
    for f in d.get("identity_fields", []):
        for k, v in spec.get("identity_patch", {}).get(f["id"], {}).items():
            if v is None: f.pop(k, None)
            else: f[k] = v
    for ap in spec.get("append_cards", []):
        sec = next(s for s in d["sections"] if s["id"] == ap["section"])
        cards = sec["cards"]
        i = len(cards) if not ap.get("after") else next(j for j, c in enumerate(cards) if c["id"] == ap["after"]) + 1
        cards.insert(i, copy.deepcopy(ap["card"]))
    return d, src.get("version"), unknown

def main(argv):
    if not argv: print(__doc__); return 2
    spec = load(argv[0]); check = "--check" in argv
    d, src_version, unknown = derive(spec)
    if unknown: print(f"WARNING: references without mapping left unchanged: {sorted(unknown)}")
    if src_version != spec.get("source_version"):
        print(f"NOTE: source is now version {src_version}, spec was written for {spec.get('source_version')}. "
              "Review the change, raise `set.version` of the target, then update `source_version`.")
    out = json.dumps(d, ensure_ascii=False, indent=1) + "\n"
    target = Path(spec["target"])
    if check:
        same = target.exists() and json.loads(target.read_text(encoding="utf-8")) == d
        print("up to date" if same else f"OUT OF DATE: {target}")
        return 0 if same else 1
    target.write_text(out, encoding="utf-8")
    print(f"wrote {target}")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
