# Copyediting, proofreading, and the style sheet

The mechanical passes. The author drafts freely and ignores grammar and spelling
on purpose, so here you clean it up — but carefully, because voice often lives in
choices that look like errors.

## Auto-fix silently (the author asked you to)

These are clear errors with no stylistic upside. Fix them without asking and note
the count in the change log:

- Typos and misspellings.
- Doubled words ("the the").
- Obvious punctuation errors (missing terminal punctuation, unmatched brackets or
  quotes, space before a comma).
- Clear subject/verb and tense agreement errors that aren't dialect/voice.
- Double spaces, stray spaces, obvious capitalisation slips at sentence start.

## Flag, don't auto-change (possible deliberate choices)

Voice frequently uses "incorrect" constructions on purpose. Never standardise
these silently — flag and ask, or leave and note:

- **Sentence fragments** used for rhythm or emphasis. ("No warning. None.")
- **Comma splices** used deliberately for pace.
- **Starting sentences with "And" / "But"** — fine in most modern prose.
- **Invented or unusual words**, deliberate misspellings, eye-dialect.
- **Dialect, slang, and non-standard grammar in dialogue** — characters don't
  speak in standard English, and "fixing" it erases them.
- **Idiosyncratic punctuation** that's consistent enough to be a choice.

Rule: if a construction recurs consistently, assume it's a choice and confirm
before changing.

## The style sheet (keep one per manuscript)

A style sheet is how a copyeditor keeps a book internally consistent. Maintain a
running list as you go — save it alongside the manuscript (e.g.
`STYLE-SHEET.md`). Track:

- **Names and spellings:** every character and place name, spelled the way the
  author uses it (e.g. "Aiden" not "Aidan"; "the Haolai River").
- **Hyphenation and compound choices:** "well-being" vs "wellbeing," "grey" vs
  "gray" — pick the author's preference and apply it throughout.
- **Numbers:** spelled out vs numerals, and the threshold (e.g. spell out under
  100).
- **Capitalisation:** of titles, invented terms, the author's stylistic caps.
- **Punctuation conventions:** serial (Oxford) comma yes/no; single vs double
  quotes; how em dashes are handled (note: the humanizer voice pass removes them
  — keep the style sheet consistent with whatever was decided there).
- **Timeline and continuity facts:** ages, dates, eye colour, who knows what
  when. Catch contradictions ("she was 12" in one chapter, "11 that summer" in
  another).
- **Spelling variant:** UK vs US English — pick one and hold it.

Apply the style sheet's decisions consistently across the whole manuscript, and
flag any contradiction you find against it.

## Proofreading (final sweep only)

On near-final text, after everything else:

- Remaining typos, missed in earlier passes.
- Spacing and formatting glitches (stray blank lines, inconsistent heading
  levels, list formatting).
- Punctuation strays.
- Consistency against the style sheet.
- Run the bundled checker once more as a mechanical backstop:
  `python3 scripts/check_tells.py manuscript.md`

Proofreading changes nothing substantive. If you find yourself wanting to rewrite
a sentence at this stage, that's a line edit — note it separately rather than
doing it during proof.
