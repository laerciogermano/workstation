import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "scripts" / "svg_audit_repo_logo.py"
FIX = ROOT / "tests" / "fixtures"


class SvgAuditTests(unittest.TestCase):
    def _run(self, *paths: Path) -> int:
        proc = subprocess.run(
            [sys.executable, str(AUDIT), *[str(p) for p in paths]],
            capture_output=True,
            text=True,
        )
        return proc.returncode

    def test_applydiff_icons_pass(self) -> None:
        icon = ROOT / "examples" / "applydiff" / "icon.svg"
        logo = ROOT / "examples" / "applydiff" / "logo.svg"
        self.assertEqual(self._run(icon, logo), 0)

    def test_bad_viewbox_fails(self) -> None:
        self.assertNotEqual(self._run(FIX / "icon-bad-viewbox.svg"), 0)

    def test_bad_comment_fails(self) -> None:
        self.assertNotEqual(self._run(FIX / "icon-bad-comment.svg"), 0)


if __name__ == "__main__":
    unittest.main()
