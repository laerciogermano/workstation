#!/usr/bin/env python3
"""CLI: imagem → JSON [{text, bounds:{x,y,w,h}, confidence}] via PaddleOCR."""
import json
import os
import sys

# evita check de rede lento no import
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")


def _box_to_bounds(box):
    xs = [float(p[0]) for p in box]
    ys = [float(p[1]) for p in box]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    return {
        "x": int(x0),
        "y": int(y0),
        "w": max(1, int(x1 - x0)),
        "h": max(1, int(y1 - y0)),
    }


def _from_legacy_ocr(result):
    out = []
    # result: list per page; page: [[box, (text, score)], ...]
    pages = result if isinstance(result, list) else []
    for page in pages:
        if not page:
            continue
        for item in page:
            if not item or len(item) < 2:
                continue
            box, meta = item[0], item[1]
            if isinstance(meta, (list, tuple)) and len(meta) >= 2:
                text, score = meta[0], float(meta[1])
            else:
                continue
            text = str(text).strip()
            if not text:
                continue
            out.append(
                {
                    "text": text,
                    "confidence": score * 100.0 if score <= 1 else score,
                    "bounds": _box_to_bounds(box),
                }
            )
    return out


def _get(item, key, default=None):
    if item is None:
        return default
    if hasattr(item, "get"):
        try:
            return item.get(key, default)
        except Exception:
            pass
    try:
        return item[key]
    except Exception:
        return default


def _poly_points(poly):
    # numpy ndarray / list of points
    try:
        import numpy as np

        if isinstance(poly, np.ndarray):
            return poly.tolist()
    except Exception:
        pass
    return list(poly)


def _from_predict(result):
    out = []
    # PaddleOCR 3.x: list[OCRResult] com rec_texts / rec_scores / rec_polys
    for item in result or []:
        # OCRResult comporta-se como mapping (rec_texts/…); NÃO usar .json
        # (.json = {res:…} sem os campos de texto).
        texts = _get(item, "rec_texts") or _get(item, "texts") or []
        scores = _get(item, "rec_scores") or _get(item, "scores") or []
        polys = _get(item, "rec_polys") or _get(item, "dt_polys") or _get(item, "polys") or []
        if not texts and isinstance(_get(item, "res"), dict):
            nested = _get(item, "res")
            texts = nested.get("rec_texts") or []
            scores = nested.get("rec_scores") or []
            polys = nested.get("rec_polys") or nested.get("dt_polys") or []
        for i, text in enumerate(texts):
            text = str(text).strip()
            if not text:
                continue
            score = float(scores[i]) if i < len(scores) else 0.0
            if i >= len(polys):
                continue
            poly = _poly_points(polys[i])
            out.append(
                {
                    "text": text,
                    "confidence": score * 100.0 if score <= 1 else score,
                    "bounds": _box_to_bounds(poly),
                }
            )
    return out


def main():
    if len(sys.argv) < 2:
        print("usage: paddleocr_cli.py <image>", file=sys.stderr)
        sys.exit(2)
    path = sys.argv[1]
    from paddleocr import PaddleOCR

    # API 3.x: use_textline_orientation; lang en cobre UI LinkedIn
    try:
        engine = PaddleOCR(
            lang="en",
            use_textline_orientation=False,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
        )
    except TypeError:
        engine = PaddleOCR(lang="en")

    out = []
    if hasattr(engine, "predict"):
        try:
            out = _from_predict(engine.predict(path))
        except Exception as e:
            print(f"paddleocr predict failed: {e}", file=sys.stderr)
            out = []
    if not out and hasattr(engine, "ocr"):
        try:
            out = _from_legacy_ocr(engine.ocr(path))
        except Exception as e:
            print(f"paddleocr ocr failed: {e}", file=sys.stderr)
            if not out:
                raise

    json.dump(out, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
