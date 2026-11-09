# Line editing (flow, rhythm, redundancy, engagement)

The line edit makes the prose move and hold the reader, sentence by sentence, in
service of the author's voice. This is the pass the author cares about most.
Drawn from Joseph Williams (*Style: Lessons in Clarity and Grace*), Ursula K. Le
Guin (*Steering the Craft*), Verlyn Klinkenborg (*Several Short Sentences About
Writing*), Browne & King (*Self-Editing for Fiction Writers*), Stephen King (*On
Writing*), and Strunk & White (*The Elements of Style*).

Golden rule: edit toward the author's voice, not toward a generic "correct"
prose. Many of these moves are about removing what's in the way of the voice, not
imposing a house style.

## 1. Flow and cohesion — old-to-new (Williams)

The deepest principle of readable prose. Sentences feel connected when each one
starts with **old/known information** and ends with **new information** — and the
new becomes the "old" the next sentence picks up. Choppy, disconnected paragraphs
usually break this chain.

> Choppy: We drove to the coast. A storm had knocked out the power lines the night
> before. Darkness covered every house we passed.
>
> Flows: We drove to the coast. The night before, a storm had knocked out the
> power lines, so darkness covered every house we passed.

Fix: reorder within and across sentences so each picks up the previous thread.
Also from Williams: prefer **characters as subjects and their actions as verbs**;
prose clogs when actions get buried in abstract nouns ("the implementation of the
decision" → "they decided").

## 2. Rhythm and sentence variety (Le Guin, Klinkenborg)

Prose has music, and music needs variety. Le Guin: "the rhythm of prose depends
very much on the length of the sentences." A run of same-length sentences lulls
the reader to sleep, however correct each one is.

- Vary sentence length deliberately. Put a short, blunt sentence after a long,
  winding one. Let a long sentence build like a crescendo when the moment earns
  it; cut to a four-word sentence to land a point.
- **Read it aloud** (Le Guin's and Klinkenborg's shared test). If you stumble, run
  out of breath, or it drones, the rhythm needs work.
- The `prose_stats.py` script reports sentence-length variance; low variance is a
  flag to check, not an automatic fault.

## 3. Cut redundancy — omit needless words (Strunk, King)

King's rule of thumb: **second draft = first draft minus 10%.** Strunk: "a
sentence should contain no unnecessary words." Cut:

- Throat-clearing openers: "What I want to say is," "It's interesting to note,"
  "At the end of the day."
- Trailing restatements that re-explain what the sentence already did.
- Redundant pairs: "each and every," "first and foremost," "end result."
- Words a stronger verb makes unnecessary: "walked quickly" → "hurried."
- Whole sentences that repeat a point already landed.

Watch for **repeated words and phrases** across nearby sentences (the stats script
lists the most frequent words) — unintentional repetition dulls prose; intentional
repetition is a device. Tell them apart.

## 4. Show, don't tell — and RUE (Browne & King)

Resist the Urge to Explain. Replace named emotion with what the reader can see,
hear, and infer.

> Tell: She was furious.
>
> Show: She set the cup down without a sound and lined the handle up square with
> the table edge.

And cut the explaining sentence that follows a scene that already showed it. If
the dialogue and action carry the meaning, the gloss is redundant. (This overlaps
with the humanizer's "telling the emotion" tell — the voice pass backs this up.)

## 5. Strong verbs, concrete nouns, few adverbs (King, Strunk)

- Prefer a precise verb over verb + adverb. "Said softly" → "murmured"; "ran
  fast" → "sprinted." The stats script reports adverb density.
- Prefer the concrete and specific over the abstract and general. "A vehicle" →
  "the rusted pickup."
- Trim qualifiers that weaken: "very," "really," "rather," "somewhat," "quite."

## 6. Beats in dialogue (Browne & King)

Thread small physical actions through dialogue so the reader stays oriented and
the scene stays embodied — but use them to replace adverb-laden tags, not to add
clutter. A beat ("She picked at the label on the bottle") often does more than
"she said, nervously."

## 7. Kill your darlings

The line the author is proudest of is often the one performing hardest for
attention. If a clever sentence serves the writer's ego more than the reader's
experience, flag it (gently — propose, don't delete unilaterally).

## 8. Echoes and callbacks

Watch for, and use, deliberate repetition. A word repeated on purpose across a
paragraph break ("the thing opens" → "music had been opening that doorway") is an
echo that knits prose together; the same word repeated by accident dulls it. When
you cut or rewrite, notice whether you're breaking a real echo. And at the level
of structure, a chapter or prologue that ends by calling back to its own opening
image (a bookend) feels complete in a way a fresh closing image does not — flag the
opportunity when it's there.

## 9. Filtering and distance

Cut filter words that put a narrator between reader and experience: "she saw,"
"he felt," "I noticed," "I realized," "it seemed." Usually you can state the thing
directly and pull the reader closer. (The humanizer checker counts these.)

## How to apply

- Apply small, clearly-correct fixes directly (a redundant word, an obvious
  flow reorder).
- **Propose** anything that changes rhythm, meaning, or voice, with a one-line
  before/after so the author can feel the difference.
- Group proposals by type ("flow," "cuts," "show-don't-tell") rather than a flat
  list, so the author can accept or reject whole categories.
- Always edit toward the voice profile, never toward generic correctness.
