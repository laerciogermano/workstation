# Visual brief: ApplyDiff logo cuts

## Source

- Topic: the logo session that produced the ApplyDiff brand files
- Source files: `assets/icon.svg`, `assets/icon-animated.svg`, `assets/logo.svg`, `assets/logo-animated.svg` in the ApplyDiff repo, plus `web/assets/tokens-root.css`
- Audience: someone about to run the `logo-kit-svg` skill
- Platform and dimensions: skill README, 1200 x 640

## Evidence pack

| Claim or asset | Status | Source | Limitation |
|---|---|---|---|
| User asked for both a plain and an animated logo in the README | verified | session request, 17 Oct 2026 | wording paraphrased |
| User rejected horizontal strip backgrounds and asked for the app's main color | verified | session correction | |
| User reported a truncated W between CLI, TUI and the next pill | verified | session correction | the clipped glyph was `W` in `Web` |
| User asked to restore the complete logo, then add the red and green commit colors from the first version | verified | two later corrections | |
| Shipped files are the four SVGs named above | verified | repo `assets/` | |
| Token hex values in the diagram | verified | `web/assets/tokens-root.css` | |

## Five-second takeaway

After seeing this image for five seconds, the viewer should understand that the shipped logo is what remained after four specific cuts: stripes, a clipped pill, amber-only hunks, and a wordmark-only banner.

## Visual decision

- Primary job: compare
- Information topology: before/after on one shared list of four decisions
- Layout family: binary-comparison
- Why this structure fits: both columns name the same four decisions, in the same order, at the same type size
- Dominant visual element: the strike through the left column
- Accent color and its function: red marks a rejected choice, green marks the kept set
- Production method: deterministic SVG

## Copy

- Insight-led title: Four cuts. Then the logo could be read.
- Supporting line: Same product, same canvas size. The left column is what failed review. The right column is what shipped.
- Labels: the four thrown-out lines and the four shipped lines
- Source line: ApplyDiff logo session, 17 Oct 2026, tokens from `web/assets/tokens-root.css`
- CTA: none

## Batch check

- Other layout families in this batch: none. This is one diagram, not a batch of four.
- Closest visual sibling: the product banner itself, which is a real artifact, not a second infographic
- What makes this composition distinct: a strike list, not a card grid

## Receipt

- Final file: `examples/applydiff/four-cuts.svg`
- Dimensions: 1200 x 640
- Production method: hand-written SVG
- QA score: 16/16
- Known limitations: the left column describes rejected drafts. It does not reproduce those drafts as pictures.
