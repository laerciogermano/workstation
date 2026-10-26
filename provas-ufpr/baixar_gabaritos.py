#!/usr/bin/env python3
"""Baixa gabaritos do Processo Seletivo UFPR e salva em PS*/gabaritos/."""
from __future__ import annotations

import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
UA = "Mozilla/5.0 (compatible; provas-ufpr-gabaritos/1.0)"
INDEX = "https://servicos.nc.ufpr.br/PortalNC/VestibularesAnteriores"
GAB_RE = re.compile(r"gabarito|anulad", re.I)
PDF_RE = re.compile(r"""(?:href|src)=["']([^"']+\.pdf)["']""", re.I)
HREF_RE = re.compile(r"""href=["']([^"']+)["']""", re.I)


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch(url: str, timeout: int = 45) -> tuple[bytes | None, str]:
    url = url.replace(" ", "%20")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read(), r.geturl()
    except Exception as e:
        log(f"  FAIL {url}: {e}")
        return None, url


def is_pdf(data: bytes | None) -> bool:
    return bool(data) and (data[:5] == b"%PDF-" or b"%PDF-" in data[:1024])


def abs_url(base: str, href: str) -> str | None:
    href = (href or "").strip()
    if not href or href.startswith(("#", "javascript:", "mailto:")):
        return None
    return urllib.parse.urljoin(base, href)


def safe_name(url: str, default: str = "gabarito.pdf") -> str:
    name = os.path.basename(urllib.parse.urlparse(url).path) or default
    name = urllib.parse.unquote(name)
    name = re.sub(r"[^\w.\-]+", "_", name)
    return name or default


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
        out.append((row.group(1).replace("/", "-"), row.group(2)))
    return out


def year_folder(label: str) -> str:
    parts = label.split("-")
    return f"PS{parts[1]}" if len(parts) == 2 else f"PS{label}"


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        log(f"  skip {dest.relative_to(BASE)}")
        return True
    data, _ = fetch(url)
    if not is_pdf(data):
        log(f"  not-pdf {url}")
        return False
    assert data is not None
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    log(f"  OK {dest.relative_to(BASE)} ({len(data)} B)")
    return True


def pdfs_near_gabarito_text(html: str, page_url: str) -> set[str]:
    """PDFs ligados em trechos que mencionam gabarito."""
    found: set[str] = set()
    # href com gabarito/anulad no path
    for href in PDF_RE.findall(html):
        u = abs_url(page_url, href)
        if u and GAB_RE.search(u):
            found.add(u)
    # janela de texto ao redor da palavra gabarito
    for m in re.finditer(r"(?is).{0,400}gabarito.{0,400}", html):
        chunk = m.group(0)
        for href in PDF_RE.findall(chunk):
            u = abs_url(page_url, href)
            if u:
                found.add(u)
        for href in HREF_RE.findall(chunk):
            u = abs_url(page_url, href)
            if u and u.lower().endswith(".pdf"):
                found.add(u)
    # Geral.pdf sob /provas/ (padrão NC = gabarito geral 1ª fase)
    for href in PDF_RE.findall(html):
        u = abs_url(page_url, href)
        if not u:
            continue
        low = u.lower()
        if "/provas/" in low and (
            low.endswith("/geral.pdf")
            or "/definitivo/geral.pdf" in low
            or "/provisorio/geral.pdf" in low
            or "anulad" in low
        ):
            found.add(u)
    return found


def collect_from_old_site(page_url: str) -> set[str]:
    """Frameset legado: segue frames e páginas com gabarito."""
    found: set[str] = set()
    seen: set[str] = set()

    def walk(url: str, depth: int = 0) -> None:
        if url in seen or depth > 3:
            return
        seen.add(url)
        data, final = fetch(url)
        if not data:
            return
        if is_pdf(data):
            if GAB_RE.search(final) or "geral" in final.lower():
                found.add(final)
            return
        html = data.decode("latin-1", "ignore")
        found.update(pdfs_near_gabarito_text(html, final))
        for src in re.findall(
            r'<(?:frame|iframe)[^>]+src=["\']([^"\']+)["\']', html, re.I
        ):
            walk(urllib.parse.urljoin(final, src), depth + 1)
        for href in HREF_RE.findall(html):
            if not GAB_RE.search(href) and "geral" not in href.lower():
                continue
            u = abs_url(final, href)
            if not u:
                continue
            if u.lower().endswith(".pdf"):
                found.add(u)
            elif u.lower().endswith((".htm", ".html")) and depth < 3:
                walk(u, depth + 1)

    walk(page_url)
    return found


def candidate_urls(year_num: str, page: str) -> set[str]:
    urls: set[str] = set()
    # padrões modernos
    for u in (
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/definitivo/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/provisorio/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/PS{year_num}/provas/definitivo/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/PS{year_num}/provas/Geral.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/definitivo/relatorio-anuladas-alteradas.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/definitivo/anuladas_alteradas_ps{year_num}.pdf",
        f"https://servicos.nc.ufpr.br/documentos/ps{year_num}/provas/anuladas_alteradas_ps{year_num}.pdf",
    ):
        urls.add(u)

    data, final = fetch(page)
    if data and not is_pdf(data):
        html = data.decode("utf-8", "ignore")
        urls |= pdfs_near_gabarito_text(html, final)
        # se for site antigo (nc.ufpr.br frameset)
        if "nc.ufpr.br" in page and "servicos.nc" not in page:
            # tentar inf_YYYY.htm
            root = page.rsplit("/", 1)[0] + "/"
            y = year_num
            for inf in (
                f"inf_{y}.htm",
                f"inf_v_{y}.htm",
                f"inf_{y}.html",
            ):
                urls |= collect_from_old_site(urllib.parse.urljoin(root, inf))
            urls |= collect_from_old_site(page)
    return urls


def classify_name(url: str) -> str:
    low = url.lower()
    name = safe_name(url)
    if "provisorio" in low or "preliminar" in low:
        return f"gabarito-preliminar-{name}" if "geral" in name.lower() else name
    if "definitivo" in low and "anulad" not in low:
        return f"gabarito-definitivo-{name}" if name.lower() == "geral.pdf" else name
    if name.lower() == "geral.pdf":
        return "gabarito-geral.pdf"
    return name


def main() -> None:
    log("Lendo índice…")
    raw, _ = fetch(INDEX)
    if not raw:
        sys.exit("Índice indisponível")
    years = extract_ps_links(raw.decode("utf-8", "ignore"))
    log(f"{len(years)} processos.")

    lines: list[str] = []
    for label, page in years:
        folder = year_folder(label)
        year_num = folder.replace("PS", "")
        dest_root = BASE / folder / "gabaritos"
        log(f"\n=== {label} → {folder}/gabaritos")
        urls = candidate_urls(year_num, page)
        # filtrar lixo (isenção, bancas, etc.)
        clean: set[str] = set()
        for u in urls:
            low = u.lower()
            if any(
                x in low
                for x in (
                    "isencao",
                    "isenção",
                    "banca",
                    "registroacademico",
                    "homologad",
                    "chamada",
                    "programa",
                    "edital",
                )
            ):
                continue
            if not (
                GAB_RE.search(low)
                or re.search(r"/provas/.*/geral\.pdf|/provas/geral\.pdf", low)
                or "anulad" in low
            ):
                continue
            clean.add(u)

        ok = 0
        for u in sorted(clean):
            dest = dest_root / classify_name(u)
            # evitar colisão preliminar/definitivo ambos Geral.pdf
            if download(u, dest):
                ok += 1
                lines.append(f"{folder}\t{u}\t{dest}")
            time.sleep(0.08)
        log(f"  → {ok}/{len(clean)} ok")

    (BASE / "manifest-gabaritos.txt").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    log("\nConcluído.")


if __name__ == "__main__":
    main()
