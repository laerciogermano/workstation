#!/usr/bin/env python3
"""Gera src/data/funil.json a partir dos xlsx de Orçamentos, Pedidos e Faturamento.

Uso (de vendas/web):
    python3 scripts/build-funil.py [pasta-dos-xlsx]

Padrão da pasta: ../../docs/planilhas-funil (snapshot do Drive).
Lê as abas mensais (linha a linha), não os Resumos: o Resumo de Faturamento
soma a linha "Total: R$ …" junto com as linhas por vendedor em 12 meses.
"""
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent.parent.parent / "docs" / "planilhas-funil"
OUT = HERE.parent / "src" / "data" / "funil.json"

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
SEM_VENDEDOR = "(sem vendedor)"
IGNORAR_VENDEDOR = {"DEVOLUÇÃO"}


def month_key(sheet):
    m = re.fullmatch(r"([A-Z][a-z]{2})(\d{4})", sheet)
    if not m:
        return None
    return f"{m.group(2)}-{MESES.index(m.group(1)) + 1:02d}"


def data_rows(ws):
    """Linhas após o cabeçalho (linha 6), como dict."""
    header = [c for c in next(ws.iter_rows(min_row=6, max_row=6, values_only=True))]
    for r in ws.iter_rows(min_row=7, values_only=True):
        if not any(v is not None for v in r):
            continue
        yield {h: v for h, v in zip(header, r) if h}


def monthly_sheets(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    for name in wb.sheetnames:
        key = month_key(name)
        if key:
            yield key, wb[name]


def nome_cliente(s):
    """Portal repete razão social + fantasia; "A A" vira "A"."""
    s = re.sub(r"\s+", " ", s or "").strip()
    half = len(s) // 2
    return s[:half] if len(s) % 2 == 1 and s[:half] == s[half + 1:] else s


def num(v):
    return float(v) if isinstance(v, (int, float)) else 0.0


def main():
    cells = defaultdict(lambda: defaultdict(float))  # (mes, vendedor) -> métricas
    status = defaultdict(lambda: defaultdict(int))  # mes -> status -> qtd
    orc_by_num = {}  # nº orçamento -> (data, vendedor)
    clientes = defaultdict(lambda: {"valor": 0.0, "pedidos": 0, "vendedores": set()})
    orc_values = []  # para detectar orçamentos atípicos
    lead_days = []

    for mes, ws in monthly_sheets(SRC / "Funil-Orcamentos-2025-2026.xlsx"):
        for r in data_rows(ws):
            vend = r.get("Vendedor") or SEM_VENDEDOR
            st = r.get("Status") or "Sem status"
            total = num(r.get("Total"))
            c = cells[(mes, vend)]
            c["orc_qtd"] += 1
            c["orc_valor"] += total
            if st == "Aprovado":
                c["orc_aprov"] += 1
                c["orc_aprov_valor"] += total
            if st in ("Cancelado", "Reprovado"):
                c["orc_perdido"] += 1
            status[mes][st] += 1
            m = re.match(r"Nº\s*(\d+)\s+(.*)", str(r.get("Cliente") or ""))
            if m and r.get("Data"):
                orc_by_num[int(m.group(1))] = r["Data"]
            orc_values.append({"mes": mes, "vendedor": vend, "valor": total,
                               "cliente": nome_cliente(m.group(2) if m else r.get("Cliente")), "status": st})

    for mes, ws in monthly_sheets(SRC / "Funil-Pedidos-2025-2026.xlsx"):
        for r in data_rows(ws):
            vend = r.get("Vendedor") or SEM_VENDEDOR
            total = num(r.get("Total"))
            c = cells[(mes, vend)]
            c["ped_qtd"] += 1
            c["ped_valor"] += total
            cli = clientes[re.sub(r"[.\s]+$", "", nome_cliente(str(r.get("Cliente") or "—")))]
            cli["valor"] += total
            cli["pedidos"] += 1
            cli["vendedores"].add(vend)
            orc = r.get("Orçamento")
            if isinstance(orc, (int, float)) and int(orc) in orc_by_num and r.get("Data"):
                d = (r["Data"] - orc_by_num[int(orc)]).days
                if d >= 0:
                    lead_days.append({"mes": mes, "vendedor": vend, "dias": d})

    hoje = date.today()
    ultimo_mes = f"{hoje.year}-{hoje.month:02d}"
    descartados = []
    for mes, ws in monthly_sheets(SRC / "Funil-Faturamento-2025-2026.xlsx"):
        if mes > ultimo_mes:
            descartados.append(mes)
            continue
        for r in data_rows(ws):
            m = re.match(r"#\d+\s*-\s*(.+?)\s+R\$", str(r.get("Resumo") or ""))
            if not m:
                continue  # linha "Total: R$ …" (duplicaria o mês)
            vend = m.group(1).strip()
            if vend in IGNORAR_VENDEDOR:
                continue
            cells[(mes, vend)]["fat_valor"] += num(r.get("Total"))

    meses = sorted({k[0] for k in cells})
    vendedores_tot = defaultdict(float)
    for (mes, vend), c in cells.items():
        vendedores_tot[vend] += c["fat_valor"] + c["ped_valor"]
    vendedores = sorted((v for v in vendedores_tot if v != SEM_VENDEDOR),
                        key=lambda v: -vendedores_tot[v])
    if SEM_VENDEDOR in vendedores_tot:
        vendedores.append(SEM_VENDEDOR)

    keys = ["orc_qtd", "orc_aprov", "orc_perdido", "orc_valor", "orc_aprov_valor",
            "ped_qtd", "ped_valor", "fat_valor"]
    rows = []
    for (mes, vend), c in sorted(cells.items()):
        rows.append({"mes": mes, "vendedor": vend,
                     **{k: round(c[k], 2) if "valor" in k else int(c[k]) for k in keys}})

    top_clientes = sorted(
        ({"cliente": k, "valor": round(v["valor"], 2), "pedidos": v["pedidos"],
          "vendedores": sorted(v["vendedores"])} for k, v in clientes.items()),
        key=lambda x: -x["valor"])[:15]

    maiores_orc = sorted(orc_values, key=lambda x: -x["valor"])[:8]

    out = {
        "geradoEm": hoje.isoformat(),
        "fonte": "docs/planilhas-funil (snapshot Portal Franqueado)",
        "meses": meses,
        "vendedores": vendedores,
        "rows": rows,
        "status": {m: dict(s) for m, s in sorted(status.items())},
        "leadTime": lead_days,
        "topClientes": top_clientes,
        "maioresOrcamentos": [{**o, "valor": round(o["valor"], 2)} for o in maiores_orc],
        "qualidade": {
            "faturamentoMesesFuturosDescartados": descartados,
            "orcamentosSemVendedor": int(sum(c["orc_qtd"] for (m, v), c in cells.items() if v == SEM_VENDEDOR)),
            "pedidosLigadosAOrcamento": len(lead_days),
            "pedidosTotal": int(sum(c["ped_qtd"] for c in cells.values())),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1, default=str))
    print(f"ok {OUT} · {len(meses)} meses · {len(vendedores)} vendedores · {len(rows)} linhas")


if __name__ == "__main__":
    main()
