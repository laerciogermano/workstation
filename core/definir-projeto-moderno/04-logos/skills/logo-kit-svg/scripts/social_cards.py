#!/usr/bin/env python3
"""Compose standard social / OG card SVGs (icon + title or banner)."""

from __future__ import annotations

import argparse
import html
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = ROOT / "assets" / "kit" / "social"
RENDER_PNG = ROOT / "scripts" / "render_png.py"

DEFAULT_BG = "#12100c"
DEFAULT_FG = "#f0e6d2"
DEFAULT_MUTED = "#a99b83"

# name -> (width, height, filename)
CARD_SPECS: dict[str, tuple[int, int, str]] = {
    "og": (1200, 630, "og-image.svg"),
    "twitter": (1200, 630, "twitter-card.svg"),
    "github": (1280, 640, "github-social-preview.svg"),
    "square": (1080, 1080, "square-1080.svg"),
}


def _rel_href(path: Path, base: Path) -> str:
    rel = os.path.relpath(path.resolve(), base.resolve())
    return html.escape(rel.replace("\\", "/"))


def _compose_card(
    width: int,
    height: int,
    icon_href: str,
    title: str | None,
    tagline: str | None,
    banner_href: str | None,
    bg: str,
    fg: str,
    muted: str,
) -> str:
    pad = max(32, width // 30)
    icon_box = min(height - 2 * pad, int(width * 0.28))
    icon_x = pad
    icon_y = (height - icon_box) // 2
    text_x = icon_x + icon_box + pad
    text_w = width - text_x - pad

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">',
        f'<rect width="100%" height="100%" fill="{html.escape(bg)}"/>',
        f'<image href="{icon_href}" x="{icon_x}" y="{icon_y}" width="{icon_box}" height="{icon_box}" preserveAspectRatio="xMidYMid meet"/>',
    ]

    if banner_href:
        banner_h = min(int(icon_box * 0.55), height - 2 * pad)
        banner_w = min(text_w, int(banner_h * (904 / 256)))
        by = (height - banner_h) // 2
        parts.append(
            f'<image href="{banner_href}" x="{text_x}" y="{by}" width="{banner_w}" height="{banner_h}" preserveAspectRatio="xMidYMid meet"/>'
        )
        if tagline:
            ty = by + banner_h + int(pad * 0.6)
            parts.append(
                f'<text x="{text_x}" y="{ty}" fill="{html.escape(muted)}" font-family="system-ui, sans-serif" font-size="{max(18, width // 55)}">{html.escape(tagline)}</text>'
            )
    else:
        title_size = max(28, width // 28)
        tag_size = max(18, width // 55)
        title_y = height // 2 - (8 if tagline else 0)
        if title:
            parts.append(
                f'<text x="{text_x}" y="{title_y}" fill="{html.escape(fg)}" font-family="system-ui, sans-serif" font-size="{title_size}" font-weight="600">{html.escape(title)}</text>'
            )
        if tagline:
            ty = title_y + title_size + int(pad * 0.5)
            parts.append(
                f'<text x="{text_x}" y="{ty}" fill="{html.escape(muted)}" font-family="system-ui, sans-serif" font-size="{tag_size}">{html.escape(tagline)}</text>'
            )

    parts.append("</svg>")
    return "\n".join(parts)


_EPILOG = """
Examples:
  python3 scripts/social_cards.py --icon assets/icon.svg --title "My Repo" --tagline "CLI diff for patches" \\
    --theme-bg "#12100c" --theme-fg "#f0e6d2"

  python3 scripts/social_cards.py --icon assets/icon.svg --banner assets/logo.svg --tagline "Ship faster" --png
"""


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=_EPILOG,
    )
    ap.add_argument("--icon", type=Path, required=True)
    ap.add_argument("--banner", type=Path, help="Horizontal logo SVG on the right (mutually optional with --title)")
    ap.add_argument("--title", help="Wordmark text when not using --banner")
    ap.add_argument("--tagline", default="")
    ap.add_argument("--theme-bg", default=DEFAULT_BG, dest="theme_bg")
    ap.add_argument("--theme-fg", default=DEFAULT_FG, dest="theme_fg")
    ap.add_argument(
        "-o",
        "--output-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Directory for SVG outputs (default: assets/kit/social/)",
    )
    ap.add_argument(
        "--cards",
        nargs="+",
        choices=sorted(CARD_SPECS),
        default=sorted(CARD_SPECS),
        help="Which card sizes to emit (default: all)",
    )
    ap.add_argument("--png", action="store_true", help="Rasterize each SVG via scripts/render_png.py")
    args = ap.parse_args()

    if not args.icon.is_file():
        print(f"social_cards: missing {args.icon}", file=sys.stderr)
        raise SystemExit(1)
    if args.banner and not args.banner.is_file():
        print(f"social_cards: missing {args.banner}", file=sys.stderr)
        raise SystemExit(1)
    if not args.title and not args.banner:
        print("social_cards: provide --title or --banner", file=sys.stderr)
        raise SystemExit(1)

    out_dir = args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    icon_href = _rel_href(args.icon, out_dir)
    banner_href = _rel_href(args.banner, out_dir) if args.banner else None
    title = args.title or None
    tagline = args.tagline.strip() or None

    written: list[Path] = []
    for key in args.cards:
        w, h, filename = CARD_SPECS[key]
        svg = _compose_card(
            w,
            h,
            icon_href,
            title,
            tagline,
            banner_href,
            args.theme_bg,
            args.theme_fg,
            DEFAULT_MUTED,
        )
        dest = out_dir / filename
        dest.write_text(svg, encoding="utf-8")
        written.append(dest)
        print(dest)

        if args.png:
            png_path = dest.with_suffix(".png")
            proc = subprocess.run(
                [
                    sys.executable,
                    str(RENDER_PNG),
                    str(dest),
                    "-o",
                    str(png_path),
                    "-w",
                    str(w),
                    "--height",
                    str(h),
                ],
                cwd=ROOT,
            )
            if proc.returncode != 0:
                raise SystemExit(proc.returncode)
            print(png_path)


if __name__ == "__main__":
    main()
