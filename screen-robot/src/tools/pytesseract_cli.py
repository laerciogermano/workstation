#!/usr/bin/env python3
"""CLI: imagem → JSON [{text, bounds:{x,y,w,h}, confidence}] via pytesseract (binário tesseract)."""
import json
import sys


def main():
    if len(sys.argv) < 2:
        print("usage: pytesseract_cli.py <image>", file=sys.stderr)
        sys.exit(2)
    path = sys.argv[1]
    import pytesseract
    from PIL import Image

    img = Image.open(path)
    data = pytesseract.image_to_data(img, lang="eng+por", output_type=pytesseract.Output.DICT)
    out = []
    n = len(data.get("text") or [])
    for i in range(n):
        text = str(data["text"][i] or "").strip()
        if not text:
            continue
        conf = float(data["conf"][i])
        if conf < 0:
            continue
        x, y, w, h = (
            int(data["left"][i]),
            int(data["top"][i]),
            int(data["width"][i]),
            int(data["height"][i]),
        )
        if w <= 0 or h <= 0:
            continue
        out.append(
            {
                "text": text,
                "confidence": conf,
                "bounds": {"x": x, "y": y, "w": w, "h": h},
            }
        )
    json.dump(out, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
