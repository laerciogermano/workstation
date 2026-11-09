#!/usr/bin/env python3
"""
prose_stats.py — objective line-edit signal for a manuscript.

Measures the things a line editor checks for rhythm and redundancy. It does NOT
judge meaning or voice — it points you at spots worth a human look.

Reports:
  - word / sentence / paragraph counts
  - sentence-length distribution + variance (rhythm: low variance = flat,
    even cadence, a line-edit flag)
  - the longest sentences (candidates for breaking up)
  - most-repeated content words (unintentional redundancy)
  - adverb (-ly) density
  - filler / throat-clearing phrases
  - average paragraph length

Usage:
    python3 prose_stats.py FILE [FILE ...]
    cat draft.md | python3 prose_stats.py -

Strips Markdown headings, list markers, and emphasis so stats reflect prose.
"""

import re
import sys
from collections import Counter

STOPWORDS = set("""
a an the and or but so for nor yet of to in on at by with from up out off over
under as is are was were be been being am do does did have has had having will
would shall should can could may might must i you he she it we they me him her
us them my your his its our their this that these those there here then than
not no nor too very just only also even still my mine yours ours theirs what
which who whom whose when where why how all any both each few more most other
some such own same about into through during before after above below between
""".split())

FILLER = [
    "in order to", "due to the fact that", "at this point in time",
    "at the end of the day", "it is important to note", "it should be noted",
    "the fact that", "needless to say", "for all intents and purposes",
    "what i want to say is", "it is interesting to note", "in terms of",
]


def read_text(path):
    if path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def strip_markdown(text):
    out = []
    for line in text.splitlines():
        if re.match(r"\s*#", line):          # headings
            continue
        if re.match(r"\s*(-{3,}|\*{3,}|_{3,})\s*$", line):  # horizontal rules
            continue
        if re.match(r"\s*([-*+]|\d+\.)\s", line):  # list markers
            line = re.sub(r"^\s*([-*+]|\d+\.)\s+", "", line)
        line = re.sub(r"[*_`>#|]", "", line)  # emphasis / md punctuation
        out.append(line)
    return "\n".join(out)


# common -ly words that are not adverbs (reduce false adverb counts)
NOT_ADVERBS = set("""
only family early reply apply supply ally rely fly ply holy ugly silly lonely
friendly lovely lively elderly orderly costly homely lowly burly curly jelly
belly rally
""".split())


def split_sentences(text):
    flat = re.sub(r"\s+", " ", text).strip()
    if not flat:
        return []
    # split on . ! ? followed by space + capital/quote; keep it simple
    parts = re.split(r"(?<=[.!?])\s+(?=[\"'A-Z0-9])", flat)
    return [p.strip() for p in parts if p.strip()]


def wordcount(s):
    return len(re.findall(r"[A-Za-z']+", s))


def stats(path):
    raw = read_text(path)
    text = strip_markdown(raw)
    paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    sentences = split_sentences(text)
    words = re.findall(r"[A-Za-z']+", text)
    n_words = len(words)
    s_lens = [wordcount(s) for s in sentences if wordcount(s) > 0]

    print(f"\n=== {path} ===")
    print(f"words: {n_words}   sentences: {len(s_lens)}   "
          f"paragraphs: {len(paragraphs)}")

    if not s_lens:
        print("(no prose detected)")
        return

    mean = sum(s_lens) / len(s_lens)
    var = sum((x - mean) ** 2 for x in s_lens) / len(s_lens)
    sd = var ** 0.5
    print(f"\nSENTENCE LENGTH (words):")
    print(f"  mean {mean:.1f}, std dev {sd:.1f}, "
          f"shortest {min(s_lens)}, longest {max(s_lens)}")
    if sd < 5:
        print("  >> LOW variation: rhythm may be flat/monotonous. Vary lengths.")
    else:
        print("  >> healthy variation in sentence length.")

    # length buckets for a quick rhythm picture
    buckets = Counter()
    for L in s_lens:
        if L <= 8: buckets["1-8 (short)"] += 1
        elif L <= 18: buckets["9-18 (mid)"] += 1
        elif L <= 30: buckets["19-30 (long)"] += 1
        else: buckets["31+ (very long)"] += 1
    print("  distribution:")
    for k in ["1-8 (short)", "9-18 (mid)", "19-30 (long)", "31+ (very long)"]:
        print(f"    {k:18} {buckets.get(k, 0)}")

    # longest sentences
    ranked = sorted(sentences, key=wordcount, reverse=True)[:3]
    print("\nLONGEST SENTENCES (candidates to break up):")
    for s in ranked:
        print(f"  [{wordcount(s)}w] {s[:110]}{'...' if len(s) > 110 else ''}")

    # repeated content words
    content = [w.lower() for w in words
               if w.lower() not in STOPWORDS and len(w) > 3]
    common = [(w, c) for w, c in Counter(content).most_common(12) if c > 2]
    print("\nMOST-REPEATED WORDS (check for unintentional repetition):")
    if common:
        print("  " + ", ".join(f"{w} ({c})" for w, c in common))
    else:
        print("  none repeated notably.")

    # adverb density
    advs = [w for w in words if w.lower().endswith("ly") and len(w) > 3
            and w.lower() not in NOT_ADVERBS]
    per1000 = (len(advs) / n_words * 1000) if n_words else 0
    print(f"\nADVERBS (-ly): {len(advs)} total, {per1000:.1f} per 1000 words.")
    if per1000 > 15:
        print("  >> high adverb density; check for verb+adverb you can tighten.")

    # filler phrases
    low = text.lower()
    found = [(p, low.count(p)) for p in FILLER if p in low]
    print("\nFILLER / THROAT-CLEARING:")
    if found:
        for p, c in found:
            print(f"  '{p}' x{c}")
    else:
        print("  none found.")

    avg_para = (len(s_lens) / len(paragraphs)) if paragraphs else 0
    print(f"\nPARAGRAPHS: avg {avg_para:.1f} sentences each.")
    print("\n(Stats are signal, not verdict. A human decides what's intended.)")


def main():
    files = sys.argv[1:]
    if not files:
        print(__doc__)
        sys.exit(2)
    for path in files:
        try:
            stats(path)
        except FileNotFoundError:
            print(f"ERROR: file not found: {path}")
            sys.exit(2)


if __name__ == "__main__":
    main()
