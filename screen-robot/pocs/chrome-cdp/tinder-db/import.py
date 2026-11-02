#!/usr/bin/env python3
"""Cria schema tinder e importa planilha + dumps JSON → Contabo Postgres."""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch, Json

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent
DUMP_DIR = BASE / 'tinder-conversas-nao-respondidas'
XLSX = BASE / 'tinder-conversas-germano.xlsx'
PEND = BASE / 'tinder-conversas-pendentes.json'
SCHEMA_SQL = ROOT / 'schema.sql'


def load_env():
    env = {}
    p = ROOT / '.env'
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    for k in ('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_SCHEMA', 'CONTA_SLUG'):
        if k in os.environ:
            env[k] = os.environ[k]
    return env


def connect(env):
    return psycopg2.connect(
        host=env['DB_HOST'],
        port=int(env.get('DB_PORT') or 5432),
        user=env['DB_USER'],
        password=env['DB_PASSWORD'],
        dbname=env['DB_NAME'],
        connect_timeout=15,
    )


def match_key(href: str) -> str:
    return (href or '').rstrip('/').split('/')[-1] or ''


def ensure_schema(cur):
    sql = SCHEMA_SQL.read_text()
    # psycopg2: um statement por execute
    parts = []
    buf = []
    for line in sql.splitlines():
        if line.strip().startswith('--'):
            continue
        buf.append(line)
        if ';' in line:
            parts.append('\n'.join(buf))
            buf = []
    if buf:
        parts.append('\n'.join(buf))
    for part in parts:
        stmt = part.strip()
        if not stmt:
            continue
        cur.execute(stmt)


def ensure_conta(cur, slug: str, nome: str) -> int:
    cur.execute(
        '''INSERT INTO tinder.contas (slug, nome) VALUES (%s, %s)
           ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
           RETURNING id''',
        (slug, nome),
    )
    return cur.fetchone()[0]


def upsert_perfil(cur, conta_id: int, href: str, nome: str, meta=None) -> int:
    cur.execute(
        '''INSERT INTO tinder.perfis (conta_id, href, match_key, nome, meta)
           VALUES (%s, %s, %s, %s, %s)
           ON CONFLICT (conta_id, href) DO UPDATE SET
             nome = COALESCE(EXCLUDED.nome, tinder.perfis.nome),
             match_key = EXCLUDED.match_key,
             meta = tinder.perfis.meta || EXCLUDED.meta,
             updated_at = now()
           RETURNING id''',
        (conta_id, href, match_key(href), nome, Json(meta or {})),
    )
    return cur.fetchone()[0]


def upsert_conversa(cur, conta_id, perfil_id, href, ultima, quem, respondi, bruto, total=None, dumped=False):
    cur.execute(
        '''INSERT INTO tinder.conversas
             (conta_id, perfil_id, href, ultima_mensagem, quem_enviou, respondi_por_ultimo, texto_bruto, total_mensagens, dumped_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s, CASE WHEN %s THEN now() ELSE NULL END)
           ON CONFLICT (conta_id, href) DO UPDATE SET
             perfil_id = EXCLUDED.perfil_id,
             ultima_mensagem = COALESCE(EXCLUDED.ultima_mensagem, tinder.conversas.ultima_mensagem),
             quem_enviou = COALESCE(EXCLUDED.quem_enviou, tinder.conversas.quem_enviou),
             respondi_por_ultimo = COALESCE(EXCLUDED.respondi_por_ultimo, tinder.conversas.respondi_por_ultimo),
             texto_bruto = COALESCE(EXCLUDED.texto_bruto, tinder.conversas.texto_bruto),
             total_mensagens = CASE
               WHEN EXCLUDED.total_mensagens > 0 THEN EXCLUDED.total_mensagens
               ELSE tinder.conversas.total_mensagens END,
             dumped_at = CASE WHEN %s THEN now() ELSE tinder.conversas.dumped_at END,
             updated_at = now()
           RETURNING id''',
        (conta_id, perfil_id, href, ultima, quem, respondi, bruto, total or 0, dumped, dumped),
    )
    return cur.fetchone()[0]


def replace_mensagens(cur, conversa_id: int, msgs: list):
    cur.execute('DELETE FROM tinder.mensagens WHERE conversa_id = %s', (conversa_id,))
    if not msgs:
        return
    rows = []
    for i, m in enumerate(msgs, 1):
        rows.append((
            conversa_id,
            i,
            m.get('quem') or 'match',
            m.get('nome_exibido'),
            m.get('texto') or '',
            m.get('hora'),
        ))
    execute_batch(
        cur,
        '''INSERT INTO tinder.mensagens (conversa_id, seq, quem, nome_exibido, texto, hora)
           VALUES (%s,%s,%s,%s,%s,%s)''',
        rows,
        page_size=200,
    )


def import_xlsx(cur, conta_id: int):
    from openpyxl import load_workbook
    if not XLSX.exists():
        print('xlsx ausente', XLSX)
        return 0
    wb = load_workbook(XLSX, read_only=True)
    ws = wb['Conversas']
    n = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        nome, ultima, quem, respondi, href, bruto = (list(row) + [None] * 6)[:6]
        if not href:
            continue
        respondi_bool = None
        if respondi == 'não':
            respondi_bool = False
        elif respondi == 'sim':
            respondi_bool = True
        perfil_id = upsert_perfil(cur, conta_id, href, str(nome))
        upsert_conversa(cur, conta_id, perfil_id, href, ultima, quem, respondi_bool, bruto)
        n += 1
        if n % 100 == 0:
            print(f'  xlsx {n}...', flush=True)
            # commit parcial para não perder tudo se cair
            cur.connection.commit()
    wb.close()
    return n


def import_dumps(cur, conta_id: int, only_href=None):
    files = sorted(DUMP_DIR.glob('*.json'))
    n = 0
    for jp in files:
        if jp.name.startswith('.'):
            continue
        data = json.loads(jp.read_text(encoding='utf-8'))
        href = data.get('href')
        if not href:
            continue
        if only_href and href not in only_href:
            continue
        nome = data.get('nome') or 'sem_nome'
        perfil_id = upsert_perfil(cur, conta_id, href, nome, meta={'source': 'dump', 'file': jp.name})
        msgs = data.get('mensagens') or []
        conv_id = upsert_conversa(
            cur, conta_id, perfil_id, href,
            data.get('ultima_lista'), 'match', False, None,
            total=len(msgs), dumped=True,
        )
        replace_mensagens(cur, conv_id, msgs)
        n += 1
    return n


def main():
    env = load_env()
    slug = env.get('CONTA_SLUG') or 'germano'
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'  # schema|xlsx|dumps|all

    conn = connect(env)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            if mode in ('schema', 'all'):
                ensure_schema(cur)
                print('schema ok', flush=True)
            conta_id = ensure_conta(cur, slug, 'Germano')
            print('conta', slug, conta_id, flush=True)
            if mode in ('xlsx', 'all'):
                n = import_xlsx(cur, conta_id)
                print('xlsx conversas', n, flush=True)
            if mode in ('dumps', 'all'):
                n = import_dumps(cur, conta_id)
                print('dumps', n, flush=True)
            cur.execute(
                '''SELECT
                     (SELECT count(*) FROM tinder.perfis WHERE conta_id=%s),
                     (SELECT count(*) FROM tinder.conversas WHERE conta_id=%s),
                     (SELECT count(*) FROM tinder.conversas WHERE conta_id=%s AND quem_enviou='match' AND respondi_por_ultimo IS FALSE),
                     (SELECT count(*) FROM tinder.mensagens m JOIN tinder.conversas c ON c.id=m.conversa_id WHERE c.conta_id=%s)
                ''',
                (conta_id, conta_id, conta_id, conta_id),
            )
            perfis, conversas, pend, msgs = cur.fetchone()
            print(f'counts perfis={perfis} conversas={conversas} pendentes={pend} mensagens={msgs}', flush=True)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()
