import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from platform_contracts import (
    ANDROID_LAYER_DP,
    ANDROID_SAFE_DP,
    android_layer_px,
    android_safe_px,
)


class PlatformContractsTest(unittest.TestCase):
    def test_android_xxxhdpi(self) -> None:
        self.assertEqual(android_layer_px(4.0), ANDROID_LAYER_DP * 4)
        self.assertEqual(android_safe_px(4.0), ANDROID_SAFE_DP * 4)

    def test_android_mdpi(self) -> None:
        self.assertEqual(android_layer_px(1.0), 108)
        self.assertEqual(android_safe_px(1.0), 66)


if __name__ == "__main__":
    unittest.main()
