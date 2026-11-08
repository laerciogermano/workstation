#!/usr/bin/env python3
"""Export web, iOS AppIcon set, and Android adaptive launcher PNGs from assets/icon.svg."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from platform_contracts import (  # noqa: E402
    ANDROID_CHROME_PNGS,
    ANDROID_MIPMAP,
    IOS_APPICON,
    IOS_APPLE_TOUCH_PX,
    LEGACY_PLATFORM_ROOT_FILES,
    WEB_FAVICON_PNGS,
    android_layer_px,
    android_safe_px,
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ICON = ROOT / "assets" / "icon.svg"
DEFAULT_OUT = ROOT / "assets" / "kit" / "platform"

ADAPTIVE_ICON_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""

HTML_SNIPPET = """<!-- Drop into <head> (paths relative to site root if you mirror platform/web + platform/ios) -->
<link rel="icon" href="favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png" />
<link rel="apple-touch-icon" href="../ios/apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />
"""


def _have_rsvg() -> bool:
    return bool(shutil.which("rsvg-convert"))


def _have_magick() -> bool:
    return bool(shutil.which("magick"))


def render_flat(src: Path, dest: Path, size: int) -> None:
    if _have_rsvg():
        subprocess.run(
            ["rsvg-convert", "-w", str(size), "-h", str(size), str(src), "-o", str(dest)],
            check=True,
        )
        return
    if _have_magick():
        subprocess.run(
            ["magick", "-background", "none", str(src), "-resize", f"{size}x{size}", str(dest)],
            check=True,
        )
        return
    raise RuntimeError("install rsvg-convert or magick")


def solid_bg_svg(hex_color: str, px: int) -> Path:
    tmp = Path(tempfile.gettempdir()) / f"logo-kit-bg-{px}.svg"
    tmp.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{px}" height="{px}">'
        f'<rect width="100%" height="100%" fill="{hex_color}"/></svg>',
        encoding="utf-8",
    )
    return tmp


def render_adaptive_layers(
    src: Path,
    fg: Path,
    bg: Path,
    layer_px: int,
    safe_px: int,
    bg_hex: str,
) -> None:
    render_flat(solid_bg_svg(bg_hex, layer_px), bg, layer_px)
    tmp = fg.with_suffix(".mark.png")
    render_flat(src, tmp, safe_px)
    if _have_magick():
        subprocess.run(
            [
                "magick",
                "-size",
                f"{layer_px}x{layer_px}",
                "xc:none",
                str(tmp),
                "-gravity",
                "center",
                "-composite",
                str(fg),
            ],
            check=True,
        )
    else:
        subprocess.run(
            ["rsvg-convert", "-w", str(layer_px), "-h", str(layer_px), str(src), "-o", str(fg)],
            check=True,
        )
    tmp.unlink(missing_ok=True)


def composite_launcher(bg: Path, fg: Path, dest: Path) -> None:
    if _have_magick():
        subprocess.run(["magick", str(bg), str(fg), "-composite", str(dest)], check=True)
        return
    shutil.copy2(fg, dest)


def write_favicon_ico(web_dir: Path, png16: Path, png32: Path) -> Path:
    ico = web_dir / "favicon.ico"
    if _have_magick() and png16.is_file() and png32.is_file():
        subprocess.run(["magick", str(png16), str(png32), str(ico)], check=True)
        return ico
    if png32.is_file():
        shutil.copy2(png32, ico)
    return ico


def ios_contents_json(entries: list[dict]) -> str:
    return (
        json.dumps(
            {"images": entries, "info": {"version": 1, "author": "logo-kit-svg"}},
            indent=2,
        )
        + "\n"
    )


def write_shape_preview(out: Path, launcher_rel: str) -> None:
    doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Platform shape preview</title>
<style>
body{{font-family:system-ui;background:#0e1218;color:#eef2f6;padding:24px}}
.grid{{display:flex;gap:28px;flex-wrap:wrap;margin-top:20px}}
.tile{{width:168px;height:168px;background:url('{launcher_rel}') center/cover}}
.circle{{border-radius:50%}}
.squircle{{border-radius:38%}}
.rounded{{border-radius:24%}}
.cap{{font-size:12px;color:#8b99a8;margin-top:10px;text-align:center}}
</style></head><body>
<h1>Launcher under OEM masks</h1>
<p>Same <code>ic_launcher</code> composite as circle, squircle, and rounded square.</p>
<div class="grid">
  <div><div class="tile circle"></div><p class="cap">Circle</p></div>
  <div><div class="tile squircle"></div><p class="cap">Squircle</p></div>
  <div><div class="tile rounded"></div><p class="cap">Rounded square</p></div>
</div>
</body></html>"""
    out.write_text(doc, encoding="utf-8")


def remove_legacy_root(out_dir: Path) -> None:
    for name in LEGACY_PLATFORM_ROOT_FILES:
        p = out_dir / name
        if p.is_file():
            p.unlink()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--icon", type=Path, default=DEFAULT_ICON)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--name", default="App", help="Short name for webmanifest")
    ap.add_argument("--theme-color", default="#12181f")
    args = ap.parse_args()

    if not args.icon.is_file():
        print(f"export_platform_icons: missing {args.icon}", file=sys.stderr)
        raise SystemExit(1)
    if not _have_rsvg() and not _have_magick():
        print("export_platform_icons: install rsvg-convert or magick", file=sys.stderr)
        raise SystemExit(2)

    out = args.out_dir
    web_dir = out / "web"
    android_root = out / "android"
    ios_root = out / "ios"
    web_dir.mkdir(parents=True, exist_ok=True)
    android_root.mkdir(parents=True, exist_ok=True)
    ios_root.mkdir(parents=True, exist_ok=True)
    remove_legacy_root(out)

    written: list[Path] = []

    for filename, size in WEB_FAVICON_PNGS.items():
        dest = web_dir / filename
        render_flat(args.icon, dest, size)
        written.append(dest)

    ico = write_favicon_ico(web_dir, web_dir / "favicon-16x16.png", web_dir / "favicon-32x32.png")
    written.append(ico)

    for filename, size in ANDROID_CHROME_PNGS.items():
        dest = android_root / filename
        render_flat(args.icon, dest, size)
        written.append(dest)

    play = android_root / "play-store-icon.png"
    render_flat(args.icon, play, 512)
    written.append(play)

    launcher_rel = "android/mipmap-xxxhdpi/ic_launcher.png"
    for folder, scale in ANDROID_MIPMAP.items():
        mip = android_root / folder
        mip.mkdir(parents=True, exist_ok=True)
        layer = android_layer_px(scale)
        safe = android_safe_px(scale)
        fg = mip / "ic_launcher_foreground.png"
        bg = mip / "ic_launcher_background.png"
        launcher = mip / "ic_launcher.png"
        render_adaptive_layers(args.icon, fg, bg, layer, safe, args.theme_color)
        composite_launcher(bg, fg, launcher)
        written.extend([fg, bg, launcher])

    adaptive_xml = android_root / "adaptive-icon.xml"
    adaptive_xml.write_text(ADAPTIVE_ICON_XML, encoding="utf-8")
    written.append(adaptive_xml)

    ios_touch = ios_root / "apple-touch-icon.png"
    render_flat(args.icon, ios_touch, IOS_APPLE_TOUCH_PX)
    written.append(ios_touch)

    ios_dir = ios_root / "AppIcon.appiconset"
    ios_dir.mkdir(parents=True, exist_ok=True)
    catalog_entries: list[dict] = []
    for filename, px, idiom, size_field, scale in IOS_APPICON:
        dest = ios_dir / filename
        render_flat(args.icon, dest, px)
        written.append(dest)
        catalog_entries.append(
            {"filename": filename, "idiom": idiom, "scale": scale, "size": size_field}
        )
    contents = ios_dir / "Contents.json"
    contents.write_text(ios_contents_json(catalog_entries), encoding="utf-8")
    written.append(contents)

    manifest = {
        "name": args.name,
        "short_name": args.name[:12],
        "icons": [
            {"src": "../android/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "../android/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": args.theme_color,
        "background_color": args.theme_color,
        "display": "standalone",
    }
    manifest_path = web_dir / "site.webmanifest"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    written.append(manifest_path)

    (web_dir / "head-snippet.html").write_text(HTML_SNIPPET, encoding="utf-8")
    written.append(web_dir / "head-snippet.html")

    preview = out / "platform-shape-preview.html"
    write_shape_preview(preview, launcher_rel)
    written.append(preview)

    readme = out / "README.txt"
    readme.write_text(
        "Platform pack — references/platform-icon-contracts.md\n"
        "  web/     favicon.ico, favicon-*.png, site.webmanifest, head-snippet.html\n"
        "  android/ chrome PNGs, mipmap-*, play-store-icon.png, adaptive-icon.xml\n"
        "  ios/     AppIcon.appiconset/, apple-touch-icon.png\n"
        "  platform-shape-preview.html\n",
        encoding="utf-8",
    )

    for p in written:
        print(p)


if __name__ == "__main__":
    main()
