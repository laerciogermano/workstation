#!/usr/bin/env python3
"""CLI: imagem → JSON [{text, bounds:{x,y,w,h}, confidence}] via EasyOCR."""
import json
import sys

def main():
    if len(sys.argv) < 2:
        print("usage: easyocr_cli.py <image>", file=sys.stderr)
        sys.exit(2)
    path = sys.argv[1]
    import easyocr

    # gpu=False: AVD/CI sem CUDA; langs en+pt cobrem LinkedIn UI
    reader = easyocr.Reader(["en", "pt"], gpu=False, verbose=False)
    result = reader.readtext(path)
    out = []
    for item in result or []:
        box, text, score = item[0], item[1], float(item[2])
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        out.append(
            {
                "text": str(text).strip(),
                "confidence": score * 100.0,
                "bounds": {
                    "x": int(x0),
                    "y": int(y0),
                    "w": max(1, int(x1 - x0)),
                    "h": max(1, int(y1 - y0)),
                },
            }
        )
    json.dump(out, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
