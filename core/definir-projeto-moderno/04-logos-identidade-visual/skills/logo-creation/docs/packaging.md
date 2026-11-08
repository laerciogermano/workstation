# Packaging reference

`scripts/package_brand.py` — turns a finished identity system into the single
archive you send to the client.

```bash
python scripts/package_brand.py out/logo/ --name "Brand Name"
python scripts/package_brand.py out/logo/ --name "Acme" --exports out/exports/
python scripts/package_brand.py out/logo/ --name "Acme" --out dist/acme.zip --force
```

Standard library only. It **collects and organises; it does not convert.**
Generate the PNG, PDF and EPS exports first — via Affinity, Inkscape, or any
renderer that reproduces your SVG faithfully — then point `--exports` at them.

## Options

| Flag | Effect |
| :-- | :-- |
| `--name` | Required. Names the brand in `README.txt` and derives the default filename |
| `--exports DIR` | A directory of PNG/PDF/EPS exports. Repeatable |
| `--out FILE` | Output path. Default: `<brand-slug>-brand-kit.zip` |
| `--force` | Build despite missing required deliverables, listing them |
| `--no-ico` | Skip `favicon.ico` generation |

## Where files go

Destination is decided by **extension**, not by source directory — exports
usually land in one folder, and the client should never have to know that.

| Source | Destination |
| :-- | :-- |
| `*.svg` | `logo/` |
| `*.png` | `png/` |
| `*.pdf`, `*.eps` | `print/` |
| `BRAND.*` | archive root |
| `contact-sheet.*` | `preview/` |

Two files are generated rather than copied: `README.txt` and `favicon.ico`.

## The generated favicon.ico

Built from the square icon PNGs at 16, 32 and 48&nbsp;px already in the kit,
wrapping the PNG payloads directly rather than re-encoding to BMP — every browser
and Windows version still in service reads PNG-in-ICO. Dimensions are read from
each PNG's own `IHDR` chunk, not trusted from the filename, so a mislabelled
export cannot produce a corrupt icon.

If no suitable PNGs are present the step is skipped with a note rather than
failing the build.

## Completeness enforcement

The packager checks the same matrix as
[`references/deliverables.md`](../references/deliverables.md).

**Required** — missing any of these exits `1` and writes nothing:

- `icon-`, `wordmark-`, `horizontal-`, `stacked-` × `color`, `black`, `white`
- `favicon.svg`
- a `BRAND` usage document

**Noted but not fatal** — the build proceeds and names the gap:

- `icon-darkmode.svg`, `horizontal-darkmode.svg`
- square PNGs at 16, 32, 48, 180, 192, 512, 1024
- at least one PDF and one EPS in `print/`

The asymmetry is deliberate. A missing `-white` variant means someone will
eventually place the colour mark on a dark photo; a missing 192&nbsp;px PNG means
someone resizes one, which is recoverable. An absent EPS is worth a loud note
because it is the file that blocks a sign shop from quoting a job.

## Reproducibility

Every entry is written with a fixed timestamp, so rebuilding an unchanged kit
produces a byte-identical archive. Useful in CI, and it means a client asking
"is this the same zip you sent in March?" has a checkable answer.

## What is deliberately excluded

Editable source files, rejected explorations, fonts, and mockups. The reasoning
is in [`references/handoff.md`](../references/handoff.md) — in short, everything
in the archive should be something the client is meant to *use*, and nothing in
it should invite them to redraw the mark.
