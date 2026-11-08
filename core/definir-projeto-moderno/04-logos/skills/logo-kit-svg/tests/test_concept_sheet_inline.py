import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONCEPT = ROOT / "scripts" / "concept_sheet.py"
MARK = ROOT / "examples" / "logo-kit-svg" / "kit" / "concepts" / "a-orbit-shipped.svg"


class ConceptSheetInlineTest(unittest.TestCase):
    def test_inlines_geometry_not_external_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "concept-sheet.svg"
            proc = subprocess.run(
                [
                    sys.executable,
                    str(CONCEPT),
                    str(MARK),
                    str(MARK),
                    "--names",
                    "A",
                    "B",
                    "-o",
                    str(out),
                ],
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            text = out.read_text(encoding="utf-8")
            self.assertNotIn('<image href="', text)
            self.assertIn("<circle", text)
            self.assertIn('width="180"', text)


if __name__ == "__main__":
    unittest.main()
