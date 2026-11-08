# Platform icon contracts (iOS + Android)

Kit **platform/** must satisfy store and OS rules—not a single squashed PNG. Sources: [Android adaptive icons](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive), [Apple app icons (Xcode asset catalog)](https://developer.apple.com/documentation/xcode/configuring-your-app-icon).

## Android — adaptive launcher (API 26+)

| Concept | Value |
|--------|--------|
| Layer canvas | **108 × 108 dp** per density (foreground + background) |
| Visible mask viewport | **72 × 72 dp** inner (OEM mask clips outer **18 dp** per side) |
| Logo safe zone | Keep mark inside **66 × 66 dp** center so it is never clipped |
| Shapes | One asset; system applies circle, squircle, rounded square, etc. |
| Layers | **Background** (flat color or texture) + **Foreground** (mark on transparent). Optional **monochrome** for themed icons (API 33+). |

### Bitmap sizes (launcher layers)

| Folder | Scale | Layer (108 dp) | Safe (~66 dp) |
|--------|-------|----------------|---------------|
| `mipmap-mdpi` | 1× | 108 px | 66 px |
| `mipmap-hdpi` | 1.5× | 162 px | 99 px |
| `mipmap-xhdpi` | 2× | 216 px | 132 px |
| `mipmap-xxhdpi` | 3× | 324 px | 198 px |
| `mipmap-xxxhdpi` | 4× | 432 px | 264 px |

Kit output: `platform/android/mipmap-*/ic_launcher_foreground.png`, `ic_launcher_background.png`, composite `ic_launcher.png`, plus `adaptive-icon.xml` stub for `res/mipmap-anydpi-v26/`.

**Play / chrome PNGs:** under `platform/android/` — `play-store-icon.png` (512), `android-chrome-48x48.png` … `512x512` (no duplicates at `platform/` root).

## iOS / iPadOS — App Icon set

Apple applies the **squircle** mask; you ship **square** PNGs (no transparency on the main icon). Xcode can derive sizes from one **1024×1024** master; the kit still ships a full **AppIcon.appiconset** for hand-off.

| Usage | Points | Pixels (@2x / @3x) |
|-------|--------|---------------------|
| App Store | 1024×1024 @1x | **1024** |
| iPhone Home | 60pt | **120**, **180** |
| iPad Pro Home | 83.5pt @2x | **167** |
| iPad / mini Home | 76pt @2x | **152** |
| Spotlight | 40pt | **80**, **120** |
| Settings | 29pt | **58**, **87** |
| Notifications | 20pt | **40**, **60** |

Kit output: `platform/ios/AppIcon.appiconset/*.png` + `Contents.json`.

**iOS touch icon:** `platform/ios/apple-touch-icon.png` (180×180).

## Web — favicon + manifest

Under `platform/web/`:

| File | Role |
|------|------|
| `favicon.ico` | Multi-size ICO (from 16 + 32 PNG when ImageMagick available) |
| `favicon-16x16.png`, `favicon-32x32.png` | Modern `<link rel="icon">` |
| `site.webmanifest` | PWA; icon `src` points at `../android/android-chrome-*.png` |
| `head-snippet.html` | Copy-paste `<head>` links for docs sites |

## Shape preview (required in kit)

`platform/platform-shape-preview.html` shows the same Android foreground on **circle**, **squircle**, and **rounded-square** masks so reviewers see OEM variance before store upload.

## Skill workflow

1. Draw **512×512** `assets/icon.svg` with safe padding (this skill’s squircle plate is OK for README; adaptive foreground should ideally omit outer plate—see `export_platform_icons.py --split-plate` when you add a mark-only SVG).
2. Run `export_platform_icons.py` with `--theme-color` matching `--bg`.
3. Gate with `validate_kit.py` (checks adaptive layers + iOS 1024/180 + previews).
