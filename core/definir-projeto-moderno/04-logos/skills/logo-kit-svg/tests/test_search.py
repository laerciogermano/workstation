import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SearchScriptsTests(unittest.TestCase):
    def test_examples_catalog_nonempty(self) -> None:
        data = json.loads((ROOT / "examples" / "catalog.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(data.get("examples", [])), 1)

    def test_search_library_summary(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "search_library.py"), "--summary"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0)
        self.assertIn("match", proc.stdout.lower())

    def test_search_library_macro_emea(self) -> None:
        proc = subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts" / "search_library.py"),
                "--macro",
                "emea",
                "--summary",
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, msg=proc.stderr)
        self.assertIn("region_in=", proc.stdout)
        self.assertIn("eu", proc.stdout)


if __name__ == "__main__":
    unittest.main()
