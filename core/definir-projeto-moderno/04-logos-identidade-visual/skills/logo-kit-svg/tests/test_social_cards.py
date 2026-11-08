"""Smoke test for social_cards.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SocialCardsTests(unittest.TestCase):
    def test_generates_svgs(self) -> None:
        icon = ROOT / "examples" / "logo-kit-svg" / "profile.svg"
        self.assertTrue(icon.is_file())
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            proc = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "scripts" / "social_cards.py"),
                    "--icon",
                    str(icon),
                    "--title",
                    "Smoke",
                    "--tagline",
                    "test card",
                    "--output-dir",
                    str(out),
                    "--cards",
                    "og",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            og = out / "og-image.svg"
            self.assertTrue(og.is_file())
            text = og.read_text(encoding="utf-8")
            self.assertIn('viewBox="0 0 1200 630"', text)
            self.assertIn("Smoke", text)


if __name__ == "__main__":
    unittest.main()
