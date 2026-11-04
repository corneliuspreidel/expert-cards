#!/usr/bin/env python3
"""Read collected answers into one CSV.

Inputs (any mix, files or folders):
  * backup files (.json) downloaded by the experts ("Sicherungsdatei")
  * e-mails saved as .eml / .txt / .mbox containing the block
    ---BEGIN EXPERT-CARDS JSON--- ... ---END EXPERT-CARDS JSON---

Usage:
  python tools/import_answers.py INPUT [INPUT ...] [--deck decks/<id>/deck.json]
                                 [--out answers/answers.csv] [--transcribe]

Output: long CSV, one row per expert and card. Audio memos from backup files are written to
<out dir>/audio/. With --transcribe they are transcribed locally (faster-whisper or openai-whisper,
whichever is installed); nothing is sent to a service.

If several files carry the same invite code (and deck version), the one with the newest
`updatedAt` wins. Never commit the output: `answers/` is in .gitignore.
"""
import argparse
import base64
import csv
import email
import json
import mimetypes
import re
import sys
from email import policy
from pathlib import Path

BEGIN, END = "---BEGIN EXPERT-CARDS JSON---", "---END EXPERT-CARDS JSON---"
FORMAT = "expert-cards/answers@1"


def text_of_mail(raw: bytes) -> str:
    """Plain text of an e-mail (decodes quoted-printable/base64); falls back to the raw text."""
    try:
        msg = email.message_from_bytes(raw, policy=policy.default)
        parts = [p.get_content() for p in msg.walk() if p.get_content_type() == "text/plain"]
        if parts:
            return "\n".join(parts)
    except Exception:  # noqa: BLE001
        pass
    return raw.decode("utf-8", errors="replace")


def extract_blocks(text: str):
    # mail clients may wrap or quote lines; remove leading "> " and soft-wrapping whitespace inside the block
    for m in re.finditer(re.escape(BEGIN) + r"(.*?)" + re.escape(END), text, re.S):
        body = "".join(line.lstrip("> ").strip() for line in m.group(1).splitlines())
        try:
            yield json.loads(body)
        except json.JSONDecodeError as e:
            print(f"warning: unreadable JSON block ({e})", file=sys.stderr)


def load_inputs(paths):
    files = []
    for p in map(Path, paths):
        files += sorted(f for f in p.rglob("*") if f.is_file()) if p.is_dir() else [p]
    found = []
    for f in files:
        if f.name.startswith(".") or f.suffix.lower() in (".csv", ".wav", ".mp3", ".m4a", ".webm"):
            continue
        raw = f.read_bytes()
        records = []
        if f.suffix.lower() == ".json":
            try:
                obj = json.loads(raw.decode("utf-8"))
                records = obj if isinstance(obj, list) else [obj]
            except json.JSONDecodeError as e:
                print(f"warning: {f}: {e}", file=sys.stderr)
        else:
            records = list(extract_blocks(text_of_mail(raw)))
            if not records:
                records = list(extract_blocks(raw.decode("utf-8", errors="replace")))
        for r in records:
            if isinstance(r, dict) and r.get("format") == FORMAT:
                found.append((f, r))
            else:
                print(f"warning: {f}: no expert-cards answers found", file=sys.stderr)
    return found


def newest(found):
    best = {}
    for f, r in found:
        key = (r["deck"]["id"], r["deck"]["version"], r.get("code") or f"anon:{f.name}")
        if key not in best or (r.get("updatedAt") or "") > (best[key][1].get("updatedAt") or ""):
            best[key] = (f, r)
    return list(best.values())


def card_order(deck_path):
    if not deck_path:
        return {}
    deck = json.loads(Path(deck_path).read_text(encoding="utf-8"))
    order = {}
    n = 0
    for s in deck.get("sections", []):
        for c in s["cards"]:
            n += 1
            order[c["id"]] = (n, s["id"], c["type"])
    return order


def transcribe_all(items, lang):
    model = None
    try:
        from faster_whisper import WhisperModel  # type: ignore
        model = ("fw", WhisperModel("large-v3", device="auto"))
    except ImportError:
        try:
            import whisper  # type: ignore
            model = ("ow", whisper.load_model("large-v3"))
        except ImportError:
            print("warning: neither faster-whisper nor openai-whisper is installed; skipping transcription", file=sys.stderr)
            return {}
    out = {}
    for key, path in items.items():
        if model[0] == "fw":
            segs, _ = model[1].transcribe(str(path), language=lang)
            out[key] = " ".join(s.text.strip() for s in segs)
        else:
            out[key] = model[1].transcribe(str(path), language=lang)["text"].strip()
        print(f"transcribed {path.name}")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+")
    ap.add_argument("--deck", help="deck.json, only used to order the rows and add the card type")
    ap.add_argument("--out", default="answers/answers.csv")
    ap.add_argument("--transcribe", action="store_true")
    ap.add_argument("--lang", default="de")
    args = ap.parse_args()

    found = newest(load_inputs(args.inputs))
    if not found:
        print("nothing found")
        return 1
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    order = card_order(args.deck)

    audio_files = {}
    for f, r in found:
        for a in r.get("audio") or []:
            ext = mimetypes.guess_extension((a.get("mime") or "").split(";")[0]) or ".bin"
            if ext == ".mp4":
                ext = ".m4a"
            who = re.sub(r"[^\w-]", "_", r.get("code") or f.stem)
            p = out.parent / "audio" / f"{who}_{a['card']}{ext}"
            p.parent.mkdir(exist_ok=True)
            p.write_bytes(base64.b64decode(a["base64"]))
            audio_files[(r.get("code") or f.stem, a["card"])] = p
    transcripts = transcribe_all(audio_files, args.lang) if args.transcribe else {}

    rows = []
    for f, r in found:
        ident = r.get("code") or f.stem
        person = r.get("person") or {}
        card_ids = set(r.get("answers", {})) | set(r.get("timing_ms", {}))
        for cid in card_ids:
            a = r.get("answers", {}).get(cid, {})
            v = a.get("v")
            rows.append({
                "deck": r["deck"]["id"], "deck_version": r["deck"]["version"], "code": r.get("code") or "",
                "name": person.get("name", ""), "role": person.get("role", ""),
                "years": person.get("years", ""), "lbo": person.get("lbo", ""),
                "card_id": cid, "card_type": order.get(cid, (0, "", ""))[2], "section": order.get(cid, (0, "", ""))[1],
                "value": "|".join(map(str, v)) if isinstance(v, list) else ("" if v is None else v),
                "confidence": a.get("conf", ""), "reason": a.get("reason", ""), "note": a.get("note", ""),
                "time_s": round((r.get("timing_ms", {}).get(cid) or 0) / 1000, 1),
                "changes": r.get("changes", {}).get(cid, 0),
                "audio_file": str(audio_files.get((ident, cid), "")),
                "transcript": transcripts.get((ident, cid), ""),
                "submitted_at": r.get("submittedAt") or "", "updated_at": r.get("updatedAt") or "",
                "_o": order.get(cid, (10**6, "", ""))[0],
            })
    rows.sort(key=lambda x: (x["code"], x["_o"], x["card_id"]))
    fields = [k for k in rows[0] if k != "_o"]
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"{len(found)} expert(s), {len(rows)} rows -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
