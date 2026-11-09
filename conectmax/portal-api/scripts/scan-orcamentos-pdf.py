#!/usr/bin/env python3
"""Varre /orcamento/{id} (PDF público), atribui franquia pelo CNPJ da EMPRESA e grava em portal_franqueado.orcamento.

  python3 scripts/scan-orcamentos-pdf.py --from=60000 --to=66000
  python3 scripts/scan-orcamentos-pdf.py --from=1 --to=66000 --concurrency=16

Caminho inverso: DELETE dos orçamentos com id global inseridos por este script (synced via PDF);
stubs antigos (id≈numero local) podem ser removidos depois do relink.
"""
from __future__ import annotations

import argparse
import asyncio
import io
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

try:
    import httpx
    import psycopg
    from pypdf import PdfReader
except ImportError:
    import subprocess

    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-q", "httpx", "pypdf", "psycopg[binary]"]
    )
    import httpx
    import psycopg
    from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
API_ENV = ROOT / "../connectmax/vendas/api/.env"

FRANQ_CNPJ = {
    "51687136000152": 1,
    "61571397000166": 2,
    "60169241000190": 3,
    "59642703000166": 4,
    "48713160000104": 5,
    "62184037000174": 8,
    "62248210000150": 9,
    "59859764000180": 12,
    "66763041000148": 13,
}


def load_db():
    text = API_ENV.read_text(encoding="utf-8")
    m = {}
    for line in text.splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        m[k.strip()] = v.strip()
    return {
        "host": m["DB_HOST"],
        "port": int(m.get("DB_PORT") or 5432),
        "user": m["DB_USER"],
        "password": m["DB_PASSWORD"],
        "dbname": m["DB_NAME"],
    }


def norm_cnpj(s: str | None) -> str:
    return re.sub(r"\D", "", s or "")


def parse_pdf(buf: bytes) -> dict | None:
    if len(buf) < 20_000:
        return None
    try:
        text = "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(buf)).pages)
    except Exception:
        return None
    if len(text.strip()) < 40:
        return None
    cnpjs = re.findall(r"CNPJ:\s*([\d./-]+)", text, re.I)
    emp = cnpjs[-1] if cnpjs else None
    fid = FRANQ_CNPJ.get(norm_cnpj(emp))
    if not fid:
        return {"skip": True, "emp": emp}
    num = re.search(r"Orçamento nº\s*(\d+)", text, re.I)
    tot = re.search(r"TOTAL:\s*R\$\s*([\d.]+),(\d{2})", text, re.I)
    vend = re.search(r"VENDEDOR:\s*([^\n]+)", text, re.I)
    cli = re.search(r"CLIENTE:\s*([^\n]+(?:\n(?![A-Z]{3,}:)[^\n]+)*)", text, re.I)
    data = re.search(r"Data:\s*(\d{2}/\d{2}/\d{4})", text, re.I)
    cliente = None
    if cli:
        cliente = re.sub(r"\s+", " ", cli.group(1)).strip()
        cliente = re.split(r"\bCPF/CNPJ:", cliente, flags=re.I)[0].strip()
    total = None
    if tot:
        total = float(tot.group(1).replace(".", "") + "." + tot.group(2))
    total_texto = f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if total is not None else None
    return {
        "franquia_id": fid,
        "numero": int(num.group(1)) if num else None,
        "total": total,
        "total_texto": total_texto,
        "vendedor": vend.group(1).strip() if vend else None,
        "cliente": cliente,
        "data": data.group(1) if data else None,
        "emp": emp,
    }


UPSERT = """
INSERT INTO portal_franqueado.orcamento
  (id, franquia_id, numero, data, status, cliente_nome, vendedor_nome, total, total_texto, synced_at)
VALUES
  (%(id)s, %(franquia_id)s, %(numero)s, %(data)s, %(status)s,
   %(cliente)s, %(vendedor)s, %(total)s, %(total_texto)s, now())
ON CONFLICT (franquia_id, id) DO UPDATE SET
  numero = COALESCE(EXCLUDED.numero, portal_franqueado.orcamento.numero),
  data = COALESCE(EXCLUDED.data, portal_franqueado.orcamento.data),
  status = COALESCE(EXCLUDED.status, portal_franqueado.orcamento.status),
  cliente_nome = COALESCE(EXCLUDED.cliente_nome, portal_franqueado.orcamento.cliente_nome),
  vendedor_nome = COALESCE(EXCLUDED.vendedor_nome, portal_franqueado.orcamento.vendedor_nome),
  total = COALESCE(EXCLUDED.total, portal_franqueado.orcamento.total),
  total_texto = COALESCE(EXCLUDED.total_texto, portal_franqueado.orcamento.total_texto),
  synced_at = now()
"""


async def fetch_status(client: httpx.AsyncClient, cookie: str | None, oid: int) -> str | None:
    if not cookie:
        return None
    url = f"https://franqueado.conectmax.com/franqueado/?page=orcamentos_edicao&id_orcamento={oid}"
    try:
        r = await client.get(url, headers={"Cookie": cookie}, timeout=30.0)
        html = r.text
    except Exception:
        return None
    m = re.search(
        r'name=["\']status["\'][^>]*value=["\']([^"\']+)["\'][^>]*checked|value=["\']([^"\']+)["\']\s+checked[^>]*name=["\']status["\']',
        html,
        re.I,
    )
    if not m:
        return None
    return m.group(1) or m.group(2)


def load_cookie() -> str | None:
    p = Path.home() / ".config/conectmax-franqueado/cookies.txt"
    if not p.exists():
        return None
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) >= 7 and parts[5] == "PHPSESSID":
            return f"PHPSESSID={parts[6]}"
    return None


async def run(args):
    db = load_db()
    cookie = load_cookie()
    ids = list(range(args.start, args.end + 1))
    if args.reverse:
        ids.reverse()
    sem = asyncio.Semaphore(args.concurrency)
    lock = asyncio.Lock()
    counts = Counter()
    batch: list[dict] = []
    t0 = time.time()
    done = 0

    conn = psycopg.connect(**db, connect_timeout=30)
    conn.execute("SET statement_timeout = 0")

    def reconnect():
        nonlocal conn
        try:
            conn.close()
        except Exception:
            pass
        conn = psycopg.connect(**db, connect_timeout=30)
        conn.execute("SET statement_timeout = 0")
        print("db reconnected", flush=True)

    def flush_sync():
        nonlocal batch
        if not batch:
            return
        pending = batch
        for attempt in range(3):
            try:
                with conn.cursor() as cur:
                    for row in pending:
                        cur.execute(UPSERT, row)
                conn.commit()
                counts["upserted"] += len(pending)
                batch = []
                return
            except Exception as e:
                print(f"flush error attempt={attempt+1}: {e}", flush=True)
                try:
                    conn.rollback()
                except Exception:
                    pass
                reconnect()
                time.sleep(1 + attempt)
        raise RuntimeError(f"flush failed after retries ({len(pending)} rows)")

    async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
        async def one(oid: int):
            nonlocal done
            async with sem:
                try:
                    r = await client.get(f"https://franqueado.conectmax.com/orcamento/{oid}")
                    parsed = parse_pdf(r.content)
                except Exception:
                    async with lock:
                        counts["error"] += 1
                        done += 1
                    return
                status = None
                row = None
                if parsed and not parsed.get("skip"):
                    if args.with_status:
                        status = await fetch_status(client, cookie, oid)
                    row = {
                        "id": oid,
                        "franquia_id": parsed["franquia_id"],
                        "numero": parsed["numero"],
                        "data": parsed["data"],
                        "status": status,
                        "cliente": parsed["cliente"],
                        "vendedor": parsed["vendedor"],
                        "total": parsed["total"],
                        "total_texto": parsed["total_texto"],
                    }
                async with lock:
                    done += 1
                    if not parsed:
                        counts["empty"] += 1
                    elif parsed.get("skip"):
                        counts["unk_cnpj"] += 1
                    else:
                        batch.append(row)
                        counts[f"f{parsed['franquia_id']}"] += 1
                    should_flush = done % 100 == 0
                    if should_flush:
                        flush_sync()
                        elapsed = time.time() - t0
                        rate = done / elapsed if elapsed else 0
                        eta = (len(ids) - done) / rate if rate else 0
                        print(
                            f"progress {done}/{len(ids)} ({100*done/len(ids):.1f}%) "
                            f"rate={rate:.1f}/s eta={eta/60:.1f}m upserted={counts['upserted']} {dict(counts)}",
                            flush=True,
                        )

        try:
            await asyncio.gather(*[one(i) for i in ids])
            async with lock:
                flush_sync()
        finally:
            try:
                conn.close()
            except Exception:
                pass

    print("DONE", dict(counts), f"sec={time.time()-t0:.0f}", flush=True)

    # relink pedidos: orcamento_id local(numero) → id global
    with psycopg.connect(**db) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE portal_franqueado.pedido p
                SET orcamento_id = o.id
                FROM portal_franqueado.orcamento o
                WHERE o.franquia_id = p.franquia_id
                  AND o.numero = p.orcamento_id
                  AND o.id <> p.orcamento_id
                  AND p.orcamento_id IS NOT NULL
                """
            )
            linked = cur.rowcount
            # remove stubs (id = numero) when exists global with same numero
            cur.execute(
                """
                DELETE FROM portal_franqueado.orcamento s
                WHERE s.id = s.numero
                  AND EXISTS (
                    SELECT 1 FROM portal_franqueado.orcamento g
                    WHERE g.franquia_id = s.franquia_id
                      AND g.numero = s.numero
                      AND g.id <> s.id
                  )
                """
            )
            deleted = cur.rowcount
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT franquia_id, count(*)::int n, count(total)::int com_total
                FROM portal_franqueado.orcamento
                GROUP BY 1 ORDER BY 1
                """
            )
            print("counts_by_franquia", cur.fetchall(), flush=True)
        print(f"relinked_pedidos={linked} deleted_stubs={deleted}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="start", type=int, default=1)
    ap.add_argument("--to", dest="end", type=int, default=66000)
    ap.add_argument("--concurrency", type=int, default=16)
    ap.add_argument("--reverse", action="store_true")
    ap.add_argument("--with-status", action="store_true", help="também busca status via orcamentos_edicao")
    args = ap.parse_args()
    if args.end < args.start:
        args.start, args.end = args.end, args.start
    print(
        f"scan orcamentos PDF {args.start}..{args.end} conc={args.concurrency} status={args.with_status}",
        flush=True,
    )
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
