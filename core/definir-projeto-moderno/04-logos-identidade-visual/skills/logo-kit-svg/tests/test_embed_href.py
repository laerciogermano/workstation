import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from svglib_repo import embed_href


class EmbedHrefTest(unittest.TestCase):
    def test_relative_to_host_svg(self) -> None:
        host = ROOT / "examples/logo-kit-svg/kit/concept-sheet.svg"
        mark = ROOT / "examples/logo-kit-svg/kit/concepts/a-orbit-shipped.svg"
        self.assertEqual(embed_href(mark, host), "concepts/a-orbit-shipped.svg")

    def test_final_tiles_board(self) -> None:
        host = ROOT / "examples/logo-kit-svg/kit/tiles-board.svg"
        icon = ROOT / "examples/logo-kit-svg/icon.svg"
        self.assertEqual(embed_href(icon, host), "../icon.svg")


if __name__ == "__main__":
    unittest.main()
