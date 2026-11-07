# unslop-ui-skill

**Stop your AI from building generic, AI-looking UI.**

A drop-in design skill (and ruleset) for AI coding tools - Claude Code, Cursor,
Windsurf, v0, Lovable, Bolt.

Cursor, Claude Code, v0, Lovable, and Bolt all reach for the same defaults, and the
result is instantly recognizable: Inter everywhere, a purple-to-blue gradient, a cream
background, grey low-contrast text, a little pill above the hero, three icon cards in a
row, em-dashes in every sentence, everything fading up on scroll.

This is a skill that names every one of those "tells" and turns them into hard rules your
AI obeys, so what it builds looks deliberately designed instead of generated. It is a
plain Markdown skill plus a researched catalog. No install, no dependencies, framework
agnostic. MIT licensed.

## A taste of what it catches

| The tell | The fix |
|---|---|
| Purple-to-blue gradient (the `#1` AI tell) | One deliberate solid accent |
| Inter / Geist as the default everything | A typeface with a point of view |
| Cream `#faf8f4` "minimalist" background | Clean white or a real, chosen surface |
| Grey `gray-400/500` body text | Near-black, WCAG AA contrast |
| A pill / eyebrow floating above the hero | Let the heading lead |
| The icon-card grid (3 lucide icons in rounded squares) | Real content, screenshots, numbers |
| Em-dashes in every sentence | Spaced hyphens or a period |
| Fade-up-on-everything on scroll | Sparing, intentional motion |

That is 8 of roughly 100. The full list, with the reason each one reads as AI and the fix,
is in [`TELLS.md`](./TELLS.md): 9 categories covering typography, color, backgrounds,
layout, components, imagery, icons, copy, and motion, plus consistency and responsive rules.

## Use it with your tool

The skill is one file: [`.claude/skills/no-ai-slop/SKILL.md`](./.claude/skills/no-ai-slop/SKILL.md).
Point your AI at it however your tool loads rules.

**Claude Code** - copy the skill folder in; it is picked up automatically:
```bash
# this project only
cp -r .claude/skills/no-ai-slop your-project/.claude/skills/
# or for every project
cp -r .claude/skills/no-ai-slop ~/.claude/skills/
```

**Cursor** - save the skill as an always-on rule:
```bash
mkdir -p your-project/.cursor/rules
cp .claude/skills/no-ai-slop/SKILL.md your-project/.cursor/rules/no-ai-slop.mdc
```

**Windsurf** - append `SKILL.md` to `.windsurfrules` in your project root.

**v0 / Lovable / Bolt / ChatGPT / anything else** - paste the contents of `SKILL.md`
into the project's custom instructions, system prompt, or rules. Keep `TELLS.md` on hand
for the full catalog.

Then tell it what to build. Before it finishes, have it run the self-check at the bottom
of `SKILL.md` against its own output.

## What's in here
- `.claude/skills/no-ai-slop/SKILL.md` - the skill: the always-on anti-tell rules plus one
  sample style direction.
- `TELLS.md` - the full catalog (~100 tells, 9 categories), each with why it reads as AI
  and the fix.
- `examples/aerolaunch-hero/` - a real landing-page hero built with the skill. Open
  `index.html` in a browser.

## How well does it work?
A fresh agent given only this skill, with no other guidance, rebuilt a slop-prone landing
page clean and on-direction. The same model without the skill kept reaching for the tells
above. The skill does the steering, not your taste.

## Going further
The base here makes your AI stop shipping slop. The full product adds **design directions**
(neo-brutalism, editorial, and more), each with a matching **UI kit** of real prebuilt
components your AI assembles from, so the output is consistent and on-brand instead of
improvised every time. You pick a direction and export a ready-to-install package. From the
makers of [AeroLaunch](https://aerolaunch.app).

## Contributing
AI defaults shift, so the catalog is meant to stay current. Spotted a tell that is not here,
or a sharper fix? Open an issue or a PR.

## License
MIT - see [`LICENSE`](./LICENSE). Use it, fork it, ship it.
