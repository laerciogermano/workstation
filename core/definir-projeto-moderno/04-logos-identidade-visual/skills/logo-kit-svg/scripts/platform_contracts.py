"""iOS + Android platform icon size tables (see references/platform-icon-contracts.md)."""

from __future__ import annotations

ANDROID_LAYER_DP = 108
ANDROID_SAFE_DP = 66

ANDROID_MIPMAP: dict[str, float] = {
    "mipmap-mdpi": 1.0,
    "mipmap-hdpi": 1.5,
    "mipmap-xhdpi": 2.0,
    "mipmap-xxhdpi": 3.0,
    "mipmap-xxxhdpi": 4.0,
}

# PWA / legacy launcher PNGs (under platform/android/)
ANDROID_CHROME_PNGS: dict[str, int] = {
    "android-chrome-48x48.png": 48,
    "android-chrome-72x72.png": 72,
    "android-chrome-96x96.png": 96,
    "android-chrome-144x144.png": 144,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

# Under platform/web/
WEB_FAVICON_PNGS: dict[str, int] = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
}

IOS_APPLE_TOUCH_PX = 180

# Removed from platform/ root (cleanup on export)
LEGACY_PLATFORM_ROOT_FILES = [
    *ANDROID_CHROME_PNGS.keys(),
    *WEB_FAVICON_PNGS.keys(),
    "apple-touch-icon.png",
    "site.webmanifest",
]


def android_layer_px(scale: float) -> int:
    return round(ANDROID_LAYER_DP * scale)


def android_safe_px(scale: float) -> int:
    return round(ANDROID_SAFE_DP * scale)


# filename, pixel size, idiom, size field, scale
IOS_APPICON: list[tuple[str, int, str, str, str]] = [
    ("icon-1024.png", 1024, "ios-marketing", "1024x1024", "1x"),
    ("icon-180.png", 180, "iphone", "60x60", "3x"),
    ("icon-120.png", 120, "iphone", "60x60", "2x"),
    ("icon-167.png", 167, "ipad", "83.5x83.5", "2x"),
    ("icon-152.png", 152, "ipad", "76x76", "2x"),
    ("icon-120-spotlight.png", 120, "iphone", "40x40", "3x"),
    ("icon-80.png", 80, "iphone", "40x40", "2x"),
    ("icon-87.png", 87, "iphone", "29x29", "3x"),
    ("icon-58.png", 58, "iphone", "29x29", "2x"),
    ("icon-60.png", 60, "iphone", "20x20", "3x"),
    ("icon-40.png", 40, "ipad", "20x20", "2x"),
]
