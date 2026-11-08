## What this changes

<!-- One or two sentences. -->

## Why

<!--
If this changes a script: what was broken?
If this changes a design rule: which real failure does it prevent?
-->

## Checklist

- [ ] `python -m pytest` passes
- [ ] `python scripts/validate_svg.py examples/demo` exits clean
- [ ] No new dependencies (the scripts must run on a bare Python install)
- [ ] New script behaviour has a test that trips it and one that does not
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
