#!/usr/bin/env python3
"""Dump Trello starred boards: board/coluna/card → titulo, descricao, comentarios, imagens (capa + URLs). Sem anexos gerais."""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = Path.home() / ".trello-cli" / "default" / "config.json"

c = json.loads(CONFIG.read_text(encoding="utf-8"))
KEY, TOKEN = c["apiKey"], c["token"]


def api_get(path, **params):
    params = {**params, "key": KEY, "token": TOKEN}
    url = f"https://api.trello.com/1/{path}?{urllib.parse.urlencode(params, doseq=True)}"
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2**attempt)
                continue
            raise
    raise RuntimeError(f"rate limited: {path}")


def download(url, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    u = url
    if any(x in url for x in ("trello.com", "trello-attachments", "api.trello.com", "trello-backgrounds")):
        sep = "&" if "?" in url else "?"
        u = f"{url}{sep}key={KEY}&token={TOKEN}"
    req = urllib.request.Request(u, headers={"User-Agent": "trello-dump/1.0"})
    try:
        with urllib.request.urlopen(req) as r:
            data = r.read()
        dest.write_bytes(data)
        return True, len(data)
    except Exception as e:
        dest.with_suffix(dest.suffix + ".erro.txt").write_text(f"{url}\n{e}", encoding="utf-8")
        return False, str(e)


def slug(name: str, maxlen=100) -> str:
    name = unescape(name or "").strip() or "sem-titulo"
    name = re.sub(r'[\\/:*?"<>|\n\r\t]+', "-", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return (name[:maxlen] or "sem-titulo").rstrip(".")


def unique_dir(parent: Path, name: str) -> Path:
    base = slug(name)
    p = parent / base
    if not p.exists():
        return p
    i = 2
    while True:
        p = parent / f"{base} ({i})"
        if not p.exists():
            return p
        i += 1


IMG_URL_RE = re.compile(
    r"!\[([^\]]*)\]\((https?://[^)\s]+)\)|(?<![(\w])(https?://[^\s<>\"]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s<>\"]*)?)",
    re.I,
)


def extract_image_urls(text: str):
    urls = []
    for m in IMG_URL_RE.finditer(text or ""):
        u = m.group(2) or m.group(3)
        if u:
            urls.append(u.rstrip(").,;\"'"))
    seen, out = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def ext_from_url(url: str, default=".img") -> str:
    ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or default
    if len(ext) > 6 or "?" in ext:
        return default
    return ext


def dump_board(board):
    bdir = unique_dir(ROOT, board["name"])
    bdir.mkdir(parents=True, exist_ok=True)
    (bdir / "_board.json").write_text(
        json.dumps(
            {"id": board["id"], "name": board["name"], "url": board.get("url")},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    lists = sorted(
        api_get(f"boards/{board['id']}/lists", fields="id,name,pos", filter="open"),
        key=lambda x: x.get("pos", 0),
    )
    list_by_id = {l["id"]: l for l in lists}
    list_dirs = {}
    for l in lists:
        d = unique_dir(bdir, l["name"])
        d.mkdir(parents=True, exist_ok=True)
        list_dirs[l["id"]] = d

    cards = sorted(
        api_get(
            f"boards/{board['id']}/cards",
            fields="id,name,desc,idList,url,due,dateLastActivity,cover,labels,pos",
            filter="open",
        ),
        key=lambda x: x.get("pos", 0),
    )

    n_ok = 0
    for card in cards:
        lid = card["idList"]
        if lid not in list_dirs:
            od = bdir / "_sem-coluna"
            od.mkdir(exist_ok=True)
            list_dirs[lid] = od
        cdir = unique_dir(list_dirs[lid], card["name"])
        cdir.mkdir(parents=True, exist_ok=True)
        img_dir = cdir / "imagens"
        img_dir.mkdir(exist_ok=True)

        (cdir / "titulo.txt").write_text(card.get("name") or "", encoding="utf-8")
        (cdir / "descricao.md").write_text(card.get("desc") or "", encoding="utf-8")
        (cdir / "meta.json").write_text(
            json.dumps(
                {
                    "id": card["id"],
                    "url": card.get("url"),
                    "list": list_by_id.get(lid, {}).get("name"),
                    "dateLastActivity": card.get("dateLastActivity"),
                    "due": card.get("due"),
                    "labels": [
                        {"name": x.get("name"), "color": x.get("color")}
                        for x in (card.get("labels") or [])
                    ],
                    "cover": {
                        k: (card.get("cover") or {}).get(k)
                        for k in ("color", "size", "brightness", "idAttachment", "idUploadedBackground")
                    },
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        actions = api_get(
            f"cards/{card['id']}/actions",
            filter="commentCard",
            fields="id,data,date,idMemberCreator",
            memberCreator="true",
            memberCreator_fields="fullName,username",
        )
        actions = list(reversed(actions))
        comments_md = []
        for i, a in enumerate(actions, 1):
            mc = a.get("memberCreator") or {}
            who = mc.get("fullName") or mc.get("username") or "?"
            text = ((a.get("data") or {}).get("text") or "")
            comments_md.append(f"### {i}. {who} — {a.get('date')}\n\n{text}\n")
            for j, u in enumerate(extract_image_urls(text), 1):
                download(u, img_dir / f"comentario-{i}-{j}{ext_from_url(u)}")
        (cdir / "comentarios.md").write_text("\n".join(comments_md), encoding="utf-8")

        for j, u in enumerate(extract_image_urls(card.get("desc") or ""), 1):
            download(u, img_dir / f"descricao-{j}{ext_from_url(u)}")

        cover = card.get("cover") or {}
        cover_url = None
        scaled = cover.get("scaled") or []
        if scaled:
            cover_url = sorted(scaled, key=lambda s: s.get("width", 0) * s.get("height", 0))[-1].get("url")
        if not cover_url and cover.get("idAttachment"):
            try:
                att = api_get(f"cards/{card['id']}/attachments/{cover['idAttachment']}")
                previews = att.get("previews") or []
                if previews:
                    cover_url = sorted(
                        previews, key=lambda p: p.get("width", 0) * p.get("height", 0)
                    )[-1].get("url")
                cover_url = cover_url or att.get("url")
            except Exception:
                pass
        if cover_url:
            download(cover_url, img_dir / f"capa{ext_from_url(cover_url, '.jpg')}")

        if img_dir.exists() and not any(img_dir.iterdir()):
            img_dir.rmdir()

        n_ok += 1
        print(f"  · {list_by_id.get(lid, {}).get('name')}/{card.get('name')}")

    return len(lists), n_ok


def main():
    # limpa dumps anteriores (mantém este script)
    for child in list(ROOT.iterdir()):
        if child.name == "_dump_starred.py":
            continue
        if child.is_dir():
            import shutil

            shutil.rmtree(child)
        elif child.name != "_dump_starred.py":
            child.unlink()

    boards = api_get("members/me/boards", filter="starred", fields="id,name,url")
    boards = sorted(boards, key=lambda b: b["name"].lower())
    print(f"Boards favoritos: {len(boards)}")
    summary = []
    for b in boards:
        print(f"\n== {b['name']} ==")
        nlists, ncards = dump_board(b)
        summary.append((b["name"], nlists, ncards))
        print(f"  → {nlists} colunas, {ncards} cards")

    print("\n=== RESUMO ===")
    total = 0
    for name, nl, nc in summary:
        print(f"{name}: {nl} colunas, {nc} cards")
        total += nc
    print(f"TOTAL cards: {total}")
    print(f"Destino: {ROOT}")


if __name__ == "__main__":
    main()
