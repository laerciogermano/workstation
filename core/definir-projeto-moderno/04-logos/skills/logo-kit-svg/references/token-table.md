# Theme token roles (12)

Read from the project's theme file before drawing. Full worksheet: [templates/logo-brief.md](../templates/logo-brief.md).

| Token role | CSS variable example | SVG usage |
|---|---|---|
| Canvas background | `--bg` | Outer squircle / banner fill |
| Card surface | `--surface` | Document and terminal card |
| Chrome / elevated | `--surface2` | Top bar, folded corner |
| Subtle border | `--line` | Dividers |
| Prominent border | `--line2` | Card stroke, spine |
| Primary text | `--fg` | Wordmark part 1, added text |
| Secondary text | `--muted` | Tagline, labels |
| Dim text | `--dim` | Line numbers, motto |
| Primary accent | `--accent` | Wordmark part 2, cursor, seal |
| Accent chip | `--amber-bg` / `--accent-dim` | Pills, chips |
| Deleted state | `--del` / `--del-bg` | Red `-` hunk (column 3 mode `diff-hunks` only) |
| Added state | `--add` / `--add-bg` | Green `+` hunk (column 3 mode `diff-hunks` only) |

When banner column 3 is not diff-themed, omit `--del` / `--add` from the card; use `--accent`, `--fg`, `--muted` instead. If you use hunks, keep semantic red/green even when brand accent is blue, amber, or purple.
