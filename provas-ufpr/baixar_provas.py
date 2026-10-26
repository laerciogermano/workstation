#!/usr/bin/env python3
"""Baixa provas/gabaritos do Processo Seletivo UFPR (NC)."""
from __future__ import annotations

import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
UA = "Mozilla/5.0 (compatible; provas-ufpr-downloader/1.1)"
INDEX = "https://servicos.nc.ufpr.br/PortalNC/VestibularesAnteriores"
PDF_RE = re.compile(r"""(?:href|src)=["']([^"']+\.pdf)["']""", re.I)
HREF_RE = re.compile(r"""href=["']([^"']+)["']""", re.I)
PROVA_PATH = re.compile(r"(prova|gabarito|/cpt|conhecimentos|2fase|1fase)", re.I)


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch(url: str, timeout: int = 45) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception as e:
        log(f"  FAIL {url}: {e}")
        return None


def abs_url(base: str, href: str) -> str | None:
    href = (href or "").strip()
    if not href or href.startswith(("#", "javascript:", "mailto:")):
        return None
    return urllib.parse.urljoin(base, href)


def safe_name(url: str) -> str:
    name = os.path.basename(urllib.parse.urlparse(url).path) or "arquivo.pdf"
    return re.sub(r"[^\w.\-]+", "_", urllib.parse.unquote(name))


def is_pdf(data: bytes) -> bool:
    return bool(data) and (data[:5] == b"%PDF-" or b"%PDF-" in data[:1024])


def download_pdf(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        log(f"  skip {dest.relative_to(BASE)}")
        return True
    data = fetch(url)
    if not data or not is_pdf(data):
        log(f"  not-pdf {url}")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    log(f"  OK {dest.relative_to(BASE)} ({len(data)} B)")
    return True


def extract_ps_links(html: str) -> list[tuple[str, str]]:
    m = re.search(
        r"Processos Seletivos da UFPR(.*?)(?:SISU|Processos Seletivos - SEPT)",
        html,
        re.S | re.I,
    )
    block = m.group(1) if m else html
    out: list[tuple[str, str]] = []
    for row in re.finditer(
        r"Processo Seletivo UFPR\s*([0-9]{4}/[0-9]{4}).{0,400}?href=\"([^\"]+)\"",
        block,
        re.S | re.I,
    ):
        label = row.group(1).replace("/", "-")
        out.append((label, row.group(2)))
    return out


def year_folder(label: str) -> str:
    parts = label.split("-")
    return f"PS{parts[1]}" if len(parts) == 2 else f"PS{label}"


def subdir_for(url: str) -> str:
    low = url.lower()
    if "2fase" in low or "2_fase" in low:
        return "2fase"
    if "1fase" in low or "1_fase" in low:
        return "1fase"
    if any(x in low for x in ("gabarito", "definitivo", "provisorio", "anulad")):
        return "gabaritos"
    return "provas"


def collect_pdfs(page_url: str, year_num: str) -> set[str]:
    pdfs: set[str] = set()
    html_pages = [page_url]

    # páginas conhecidas de provas
    for u in (
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/2fase/provas_2fase.html",
        f"https://servicos.nc.ufpr.br/documentos/PS{year_num}/provas1fase/",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/1fase/",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/",
    ):
        html_pages.append(u)

    # PDFs candidatos diretos
    for u in (
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/definitivo/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/provisorio/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/2fase/001-CPT.pdf",
    ):
        pdfs.add(u)

    seen_html: set[str] = set()
    for html_url in html_pages:
        if html_url in seen_html:
            continue
        seen_html.add(html_url)
        data = fetch(html_url)
        if not data:
            continue
        # se a própria URL for PDF
        if is_pdf(data):
            pdfs.add(html_url)
            continue
        try:
            html = data.decode("utf-8", "ignore")
        except Exception:
            continue

        for href in PDF_RE.findall(html):
            u = abs_url(html_url, href)
            if not u:
                continue
            if PROVA_PATH.search(u) or "/provas/" in u.lower():
                pdfs.add(u)

        # seguir só links HTML claramente de provas (1 nível)
        for href in HREF_RE.findall(html):
            u = abs_url(html_url, href)
            if not u or u in seen_html:
                continue
            lu = u.lower()
            if not PROVA_PATH.search(lu):
                continue
            if "publicacaodocumento" in lu:
                continue
            if not any(host in lu for host in ("nc.ufpr.br", "servicos.nc.ufpr.br")):
                continue
            if lu.endswith((".htm", ".html", "/")) or "provas" in lu:
                seen_html.add(u)
                data2 = fetch(u)
                time.sleep(0.05)
                if not data2:
                    continue
                if is_pdf(data2):
                    pdfs.add(u)
                    continue
                try:
                    html2 = data2.decode("utf-8", "ignore")
                except Exception:
                    continue
                for href2 in PDF_RE.findall(html2):
                    u2 = abs_url(u, href2)
                    if u2 and (PROVA_PATH.search(u2) or "/provas/" in u2.lower()):
                        pdfs.add(u2)
        time.sleep(0.05)
    return pdfs


def main() -> None:
    log("Lendo índice…")
    raw = fetch(INDEX)
    if not raw:
        sys.exit("Índice indisponível")
    years = extract_ps_links(raw.decode("utf-8", "ignore"))
    log(f"{len(years)} processos.")

    lines: list[str] = []
    for label, page in years:
        folder = year_folder(label)
        year_num = folder.replace("PS", "")
        dest_root = BASE / folder
        log(f"\n=== {label} → {folder}")
        pdfs = collect_pdfs(page, year_num)
        ok = 0
        for pdf in sorted(pdfs):
            dest = dest_root / subdir_for(pdf) / safe_name(pdf)
            if download_pdf(pdf, dest):
                ok += 1
                lines.append(f"{folder}\t{pdf}\t{dest}")
            time.sleep(0.08)
        log(f"  → {ok}/{len(pdfs)} ok")

    (BASE / "manifest.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("\nConcluído.")


if __name__ == "__main__":
    main()
