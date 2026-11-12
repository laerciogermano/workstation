import json, re, collections, statistics, html, sys
sys.path.insert(0, '.')
rows = json.load(open('rows2.json'))

# ---------- normalização ----------
ALIAS = [
    (r'OLIVIA DE SOUZA CLETO', 'Olivia de Souza Cleto'),
    (r'PROFARMA', 'Profarma Distribuidora'),
    (r'L P G EQUIP', 'LPG Equipamentos e Informática'),
    (r'TONIN', 'I. Tonin & Cia'),
    (r'FAST SHOP', 'Fast Shop'),
    (r'URBANO', 'Urbano SA (financeira)'),
    (r'CORREIOS', 'Correios (ECT)'),
    (r'MARDONIO', 'Mardonio Cargo Express'),
    (r'JAMEF', 'Jamef Transportes'),
    (r'ALFA TRANSPORTES', 'Alfa Transportes'),
    (r'ANALISARE', 'Analisare'),
    (r'SAFE2PAY', 'Safe2Pay'),
    (r'MARCELLO', 'Marcello A. B. Witzki'),
    (r'GILSON MAINARDES', 'Gilson Mainardes da Silva'),
    (r'HOSANA', 'Hosana Valentim de Melo'),
    (r'LAERCIO GERMANO', 'Laércio Germano (sócio)'),
    (r'PAGUE MENOS', 'Pague Menos'),
    (r'AMERICANAS', 'Americanas S.A.'),
    (r'PARKER', 'Parker Máquinas'),
    (r'AMAZON', 'Amazon'),
    (r'MAGALU', 'Magalu Pay'),
    (r'TRADEMASTER', 'Trademaster (antecipação)'),
    (r'SANTANDER ELITE', 'Cartão Santander Elite'),
    (r'BANCO SANTANDER', 'Banco Santander'),
    (r'CONECT CAMPINAS|CONECT C S E T', 'Conect Campinas'),
    (r'CONECT X PARTIC', 'Conect X Participações'),
    (r'CONECTX CWB|CONECTX CURITIBA', 'ConectX Curitiba'),
    (r'CONECT LONDRINA', 'Conect Londrina'),
    (r'CASAS BAHIA', 'Casas Bahia'),
]
def norm(c):
    u = c.upper()
    for pat, name in ALIAS:
        if re.search(pat, u):
            return name
    c = re.sub(r'^\d+ ', '', c)
    c = re.sub(r' \d{11}$', '', c)
    return c.strip()

for r in rows:
    r['who'] = norm(r['cp'])
    if r['who'] == 'FUJIOKA ELETRO IMAGEM S A':
        r['cat'] = 'Fornecedores (equipamentos e mercadorias)'
    r['ym'] = r['date'][:7]

MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
def ml(ym): y, m = ym.split('-'); return f"{MES[int(m)-1]}/{y[2:]}"
def brl(v, sign=False, dec=2):
    s = f"{abs(v):,.{dec}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    p = '-' if v < 0 else ('+' if sign and v > 0 else '')
    return f"{p}R$ {s}"
def k(v):
    a = abs(v)
    if a >= 1e6: s = f"{a/1e6:.2f}".replace('.', ',') + " mi"
    elif a >= 1e3: s = f"{a/1e3:.0f} mil"
    else: s = f"{a:.0f}"
    return ('-' if v < 0 else '') + 'R$ ' + s
def pct(x, d=1): return f"{x*100:.{d}f}%".replace('.', ',')
esc = html.escape

ALL_MONTHS = [f"2025-{m:02d}" for m in range(1, 13)] + [f"2026-{m:02d}" for m in range(1, 12)]
MONTHS = [m for m in ALL_MONTHS if m >= '2025-10']   # período com movimento

IN = [r for r in rows if r['v'] > 0]
OUT = [r for r in rows if r['v'] < 0]
tin = sum(r['v'] for r in IN); tout = -sum(r['v'] for r in OUT)
saldo_final = rows[-1]['saldo']
saldo_ini = rows[0]['saldo'] - rows[0]['v']

OPER_IN = {'Boletos de clientes', 'Clientes via Pix/TED'}
NONOP_OUT = {'Transferências ao sócio (Laércio)', 'Intercompany (grupo Conect)'}

mon = {m: dict(inn=0, out=0, bol=0, pix=0, opout=0, n=0) for m in ALL_MONTHS}
for r in rows:
    d = mon[r['ym']]; d['n'] += 1
    if r['v'] > 0:
        d['inn'] += r['v']
        if r['cat'] == 'Boletos de clientes': d['bol'] += r['v']
        if r['cat'] == 'Clientes via Pix/TED': d['pix'] += r['v']
    else:
        d['out'] -= r['v']
        if r['cat'] not in NONOP_OUT: d['opout'] -= r['v']
for m, d in mon.items():
    d['net'] = d['inn'] - d['out']; d['rec'] = d['bol'] + d['pix']; d['oper'] = d['rec'] - d['opout']
# saldo fim de mês
last = saldo_ini
for m in ALL_MONTHS:
    rs = [r for r in rows if r['ym'] == m]
    if rs: last = rs[-1]['saldo']
    mon[m]['saldo'] = last

catin = collections.defaultdict(float); catout = collections.defaultdict(float)
cntin = collections.Counter(); cntout = collections.Counter()
for r in IN: catin[r['cat']] += r['v']; cntin[r['cat']] += 1
for r in OUT: catout[r['cat']] -= r['v']; cntout[r['cat']] += 1

receita = catin['Boletos de clientes'] + catin['Clientes via Pix/TED']
opout = sum(v for c, v in catout.items() if c not in NONOP_OUT)
resultado_oper = receita - opout

bols = [r['v'] for r in IN if r['cat'] == 'Boletos de clientes']
bol_med = statistics.mean(bols); bol_mdn = statistics.median(bols)
bol_sorted = sorted(bols, reverse=True)
top10_bol_share = sum(bol_sorted[:10]) / sum(bols)

clientes = collections.defaultdict(float)
for r in IN:
    if r['cat'] == 'Clientes via Pix/TED': clientes[r['who']] += r['v']
cli_rank = sorted(clientes.items(), key=lambda x: -x[1])

benef = collections.defaultdict(lambda: [0.0, 0, ''])
for r in OUT:
    b = benef[r['who']]; b[0] -= r['v']; b[1] += 1; b[2] = r['cat']
benef_rank = sorted(benef.items(), key=lambda x: -x[1][0])

# pessoas físicas: fluxo bidirecional
pf_names = ['Laércio Germano (sócio)', 'Marcello A. B. Witzki', 'Gilson Mainardes da Silva', 'Hosana Valentim de Melo']
pf = []
for n in pf_names:
    i = sum(r['v'] for r in IN if r['who'] == n); o = -sum(r['v'] for r in OUT if r['who'] == n)
    pf.append((n, i, o, i - o))

inter = collections.defaultdict(lambda: [0.0, 0.0])
for r in rows:
    if r['cat'] == 'Intercompany (grupo Conect)':
        if r['v'] > 0: inter[r['who']][0] += r['v']
        else: inter[r['who']][1] -= r['v']
inter_rank = sorted(inter.items(), key=lambda x: -(x[1][1] + x[1][0]))

# saldo diário (fim do dia) e intradia
days = collections.OrderedDict()
intramin = collections.defaultdict(lambda: 1e18)
for r in rows:
    days[r['date']] = r['saldo']
    intramin[r['date']] = min(intramin[r['date']], r['saldo'])
neg_eod = [d for d, s in days.items() if s < 0]
neg_intra = [d for d, s in intramin.items() if s < 0]
min_intra_day = min(intramin.items(), key=lambda x: x[1])
max_eod = max(days.items(), key=lambda x: x[1])
avg_eod = statistics.mean(days.values())

# trimestres
def q(m): y, mm = m.split('-'); return f"T{(int(mm)-1)//3+1}/{y[2:]}"
qs = collections.OrderedDict()
for m in MONTHS:
    d = qs.setdefault(q(m), dict(rec=0, inn=0, out=0, opout=0, ms=[]))
    d['rec'] += mon[m]['rec']; d['inn'] += mon[m]['inn']; d['out'] += mon[m]['out']; d['opout'] += mon[m]['opout']; d['ms'].append(m)

# meses cheios (exclui out/25 de início e nov/26 parcial)
FULL = [m for m in MONTHS if '2025-11' <= m <= '2026-10']
rec_full = [mon[m]['rec'] for m in FULL]
rec_avg = statistics.mean(rec_full)
best_rec = max(FULL, key=lambda m: mon[m]['rec']); worst_rec = min(FULL, key=lambda m: mon[m]['rec'])
best_net = max(FULL, key=lambda m: mon[m]['net']); worst_net = min(FULL, key=lambda m: mon[m]['net'])
neg_months = [m for m in FULL if mon[m]['net'] < 0]
h1 = sum(mon[m]['rec'] for m in FULL[:6]); h2 = sum(mon[m]['rec'] for m in FULL[6:])
cv = statistics.pstdev(rec_full) / rec_avg
fuel = [r for r in OUT if r['cat'] == 'Postos de combustível']
cripto = [r for r in OUT if r['cat'] == 'Câmbio/cripto']
socio_out = catout['Transferências ao sócio (Laércio)']
socio_in = sum(r['v'] for r in IN if r['who'] == 'Laércio Germano (sócio)')
pm = clientes.get('Pague Menos', 0)
ident = receita
fin_out = catout['Bancos, cartões e financiamentos']
santander = benef['Banco Santander'][0]

# ---------- componentes de gráfico ----------
C_IN, C_OUT = 'var(--s-in)', 'var(--s-out)'

def tip(t): return f' data-tip="{esc(t)}"'

def rbar(x, y, w, h, fill, t, up=True, r=4):
    """barra com 4px arredondado só na ponta de dado"""
    if h <= 0: return ''
    r = min(r, w / 2, h)
    if up:   # ponta em cima, base embaixo
        d = f"M{x:.1f},{y+h:.1f} V{y+r:.1f} Q{x:.1f},{y:.1f} {x+r:.1f},{y:.1f} H{x+w-r:.1f} Q{x+w:.1f},{y:.1f} {x+w:.1f},{y+r:.1f} V{y+h:.1f} Z"
    else:    # ponta embaixo
        d = f"M{x:.1f},{y:.1f} V{y+h-r:.1f} Q{x:.1f},{y+h:.1f} {x+r:.1f},{y+h:.1f} H{x+w-r:.1f} Q{x+w:.1f},{y+h:.1f} {x+w:.1f},{y+h-r:.1f} V{y:.1f} Z"
    return f'<path d="{d}" fill="{fill}"{tip(t)}/>'

def nice(v):
    import math
    if v <= 0: return 1
    e = 10 ** math.floor(math.log10(v)); f = v / e
    for s in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if f <= s: return s * e

def yaxis(W, L, R, T, B, lo, hi, n=4):
    out = []; step = (hi - lo) / n
    for i in range(n + 1):
        v = lo + i * step; y = B - (v - lo) / (hi - lo) * (B - T)
        out.append(f'<line x1="{L}" y1="{y:.1f}" x2="{W-R}" y2="{y:.1f}" class="{"base" if abs(v)<1e-9 else "grid"}"/>')
        out.append(f'<text x="{L-8}" y="{y+4:.1f}" class="tick" text-anchor="end">{k(v)}</text>')
    return ''.join(out)

def grouped(months, series, H=300, W=1000):
    L, R, T, Bm = 70, 10, 16, 34; B = H - Bm
    import math
    mx = max(max(mon[m][s] for s, _, _ in series) for m in months); st = nice(mx / 5); hi = math.ceil(mx / st) * st
    g = [f'<svg viewBox="0 0 {W} {H}" role="img">', yaxis(W, L, R, T, B, 0, hi, round(hi / st))]
    cw = (W - L - R) / len(months); bw = min(14, (cw - 10) / len(series))
    for i, m in enumerate(months):
        x0 = L + i * cw + (cw - bw * len(series) - 2 * (len(series) - 1)) / 2
        for j, (s, col, name) in enumerate(series):
            v = mon[m][s]; h = v / hi * (B - T)
            g.append(rbar(x0 + j * (bw + 2), B - h, bw, h, col, f"{ml(m)} · {name}: {brl(v)}"))
        g.append(f'<rect x="{L+i*cw:.1f}" y="{T}" width="{cw:.1f}" height="{B-T}" fill="transparent" class="hit"{tip(ml(m)+" · "+" · ".join(n+": "+brl(mon[m][s]) for s,_,n in series))}/>')
        g.append(f'<text x="{L+i*cw+cw/2:.1f}" y="{H-12}" class="tick" text-anchor="middle">{ml(m)}</text>')
    g.append('</svg>'); return ''.join(g)

def stacked(months, series, H=300, W=1000, avg=None):
    L, R, T, Bm = 70, 10, 16, 34; B = H - Bm
    hi = nice(max(sum(mon[m][s] for s, _, _ in series) for m in months))
    g = [f'<svg viewBox="0 0 {W} {H}" role="img">', yaxis(W, L, R, T, B, 0, hi)]
    cw = (W - L - R) / len(months); bw = min(30, cw * .55)
    for i, m in enumerate(months):
        x = L + i * cw + (cw - bw) / 2; y = B; tot = sum(mon[m][s] for s, _, _ in series)
        for j, (s, col, name) in enumerate(series):
            v = mon[m][s]; h = v / hi * (B - T)
            if h <= 0: continue
            top = j == len(series) - 1 or all(mon[m][ss] <= 0 for ss, _, _ in series[j+1:])
            gap = 0 if j == 0 else 2
            if top: g.append(rbar(x, y - h, bw, h - gap, col, f"{ml(m)} · {name}: {brl(v)}"))
            else: g.append(f'<rect x="{x:.1f}" y="{y-h:.1f}" width="{bw:.1f}" height="{max(h-gap,0):.1f}" fill="{col}"{tip(ml(m)+" · "+name+": "+brl(v))}/>')
            y -= h
        g.append(f'<rect x="{L+i*cw:.1f}" y="{T}" width="{cw:.1f}" height="{B-T}" fill="transparent" class="hit"{tip(ml(m)+" · total "+brl(tot)+" · "+" · ".join(n+": "+brl(mon[m][s]) for s,_,n in series))}/>')
        g.append(f'<text x="{L+i*cw+cw/2:.1f}" y="{H-12}" class="tick" text-anchor="middle">{ml(m)}</text>')
    if avg:
        y = B - avg / hi * (B - T)
        g.append(f'<line x1="{L}" y1="{y:.1f}" x2="{W-R}" y2="{y:.1f}" class="ref"/>')
        g.append(f'<text x="{L+6}" y="{y-6:.1f}" class="lbl" text-anchor="start">média nov/25–out/26: {k(avg)}</text>')
    g.append('</svg>'); return ''.join(g)

def diverging(months, key, H=260, W=1000):
    L, R, T, Bm = 70, 10, 16, 34; B = H - Bm
    m_ = max(abs(mon[m][key]) for m in months); hi = nice(m_); lo = -hi
    g = [f'<svg viewBox="0 0 {W} {H}" role="img">', yaxis(W, L, R, T, B, lo, hi, 4)]
    zy = B - (0 - lo) / (hi - lo) * (B - T)
    cw = (W - L - R) / len(months); bw = min(30, cw * .55)
    for i, m in enumerate(months):
        v = mon[m][key]; h = abs(v) / (hi - lo) * (B - T); x = L + i * cw + (cw - bw) / 2
        t = f"{ml(m)} · {brl(v, True)}"
        if v >= 0: g.append(rbar(x, zy - h, bw, h, C_IN, t, True))
        else: g.append(rbar(x, zy, bw, h, C_OUT, t, False))
        g.append(f'<rect x="{L+i*cw:.1f}" y="{T}" width="{cw:.1f}" height="{B-T}" fill="transparent" class="hit"{tip(t)}/>')
        g.append(f'<text x="{L+i*cw+cw/2:.1f}" y="{H-12}" class="tick" text-anchor="middle">{ml(m)}</text>')
        if m in (best_net, worst_net):
            ly = zy - h - 6 if v >= 0 else zy + h + 14
            g.append(f'<text x="{x+bw/2:.1f}" y="{ly:.1f}" class="lbl" text-anchor="middle">{k(v)}</text>')
    g.append('</svg>'); return ''.join(g)

def balance_line(H=280, W=1000):
    L, R, T, Bm = 70, 10, 16, 34; B = H - Bm
    ds = list(days.items())
    import datetime as dt
    d0 = dt.date.fromisoformat(ds[0][0]); d1 = dt.date.fromisoformat(ds[-1][0]); span = (d1 - d0).days
    vals = [s for _, s in ds] + [s for s in intramin.values()]
    import math
    st = nice((max(vals) - min(vals)) / 5)
    lo = math.floor(min(vals) / st) * st; hi = math.ceil(max(vals) / st) * st
    g = [f'<svg viewBox="0 0 {W} {H}" role="img">', yaxis(W, L, R, T, B, lo, hi, round((hi - lo) / st))]
    X = lambda d: L + (dt.date.fromisoformat(d) - d0).days / span * (W - L - R)
    Y = lambda v: B - (v - lo) / (hi - lo) * (B - T)
    # intradia mínimo (pontos discretos, só negativos)
    for d, s in intramin.items():
        if s < 0:
            g.append(f'<circle cx="{X(d):.1f}" cy="{Y(s):.1f}" r="4" fill="var(--s-out)" stroke="var(--surface)" stroke-width="2"{tip(d[8:]+"/"+d[5:7]+"/"+d[:4]+" · mínimo intradia "+brl(s))}/>')
    pts = ' '.join(f"{X(d):.1f},{Y(s):.1f}" for d, s in ds)
    g.append(f'<polyline points="{pts}" fill="none" stroke="var(--s-in)" stroke-width="2" stroke-linejoin="round"/>')
    for d, s in ds:
        g.append(f'<rect x="{X(d)-4:.1f}" y="{T}" width="8" height="{B-T}" fill="transparent" class="hit"{tip(d[8:]+"/"+d[5:7]+"/"+d[:4]+" · saldo fim do dia "+brl(s)+" · mínimo no dia "+brl(intramin[d]))}/>')
    # rótulos de mês
    for m in MONTHS:
        d = m + '-01'
        if d < ds[0][0]: continue
        g.append(f'<text x="{X(d):.1f}" y="{H-12}" class="tick" text-anchor="start">{ml(m)}</text>')
    d, s = max_eod
    g.append(f'<text x="{X(d):.1f}" y="{Y(s)-8:.1f}" class="lbl" text-anchor="middle">pico {k(s)}</text>')
    d, s = min_intra_day
    g.append(f'<text x="{X(d)+8:.1f}" y="{Y(s)+4:.1f}" class="lbl">mín. {k(s)}</text>')
    g.append('</svg>'); return ''.join(g)

def hbars(items, total, color, W=1000, rowh=30, label_w=290, cnt=None):
    H = rowh * len(items) + 8; L = label_w; R = 190
    mx = max(v for _, v in items)
    g = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    for i, (n, v) in enumerate(items):
        y = 4 + i * rowh; w = v / mx * (W - L - R)
        extra = f" · {cnt[n]} lançamentos" if cnt and n in cnt else ''
        t = f"{n}: {brl(v)} ({pct(v/total)}){extra}"
        g.append(f'<text x="{L-10}" y="{y+rowh/2+4:.1f}" class="cat" text-anchor="end">{esc(n)}</text>')
        if w > 0:
            r = min(4, w / 2); hh = rowh - 12; yy = y + 6
            g.append(f'<path d="M{L},{yy} H{L+w-r:.1f} Q{L+w:.1f},{yy} {L+w:.1f},{yy+r} V{yy+hh-r} Q{L+w:.1f},{yy+hh} {L+w-r:.1f},{yy+hh} H{L} Z" fill="{color}"{tip(t)}/>')
        g.append(f'<text x="{L+w+8:.1f}" y="{y+rowh/2+4:.1f}" class="val">{brl(v,dec=0)} · {pct(v/total)}</text>')
        g.append(f'<rect x="0" y="{y}" width="{W}" height="{rowh}" fill="transparent" class="hit"{tip(t)}/>')
    g.append(f'<line x1="{L}" y1="0" x2="{L}" y2="{H}" class="base"/>')
    g.append('</svg>'); return ''.join(g)

# ---------- montagem ----------
sec = []
legend_io = '<div class="legend"><span><i style="background:var(--s-in)"></i>Entradas</span><span><i style="background:var(--s-out)"></i>Saídas</span></div>'
legend_rec = '<div class="legend"><span><i style="background:var(--s-in)"></i>Boletos de clientes</span><span><i style="background:var(--s-2)"></i>Clientes via Pix/TED</span></div>'

kpis = [
    ('Receita de clientes', brl(receita, dec=0), f"boletos + Pix/TED · {pct(receita/tin)} das entradas"),
    ('Entradas totais', brl(tin, dec=0), f"{len(IN)} lançamentos"),
    ('Saídas totais', brl(tout, dec=0), f"{len(OUT)} lançamentos"),
    ('Saldo em 03/11/2026', brl(saldo_final), f"variação no período {brl(saldo_final-saldo_ini, True)}"),
    ('Média mensal de receita', brl(rec_avg, dec=0), f"nov/25–out/26 · variação ±{pct(cv,0)}"),
    ('Resultado operacional de caixa', brl(resultado_oper, True, 0), 'receita − custos (exclui sócio e intercompany)'),
    ('Retiradas líquidas do sócio', brl(socio_out - socio_in, dec=0), f"{pct((socio_out-socio_in)/receita)} da receita"),
    ('Dias com saldo intradia negativo', f"{len(neg_intra)}", f"mínimo {brl(min_intra_day[1],dec=0)} em {min_intra_day[0][8:]}/{min_intra_day[0][5:7]}/{min_intra_day[0][2:4]}"),
]
kpi_html = '<div class="kpis">' + ''.join(f'<div class="kpi"><div class="l">{a}</div><div class="v">{b}</div><div class="s">{c}</div></div>' for a, b, c in kpis) + '</div>'

top3cli = sum(v for _, v in cli_rank[:3])
summary = f"""
<ul class="exec">
<li><b>Conta de passagem.</b> Entraram {brl(tin,dec=0)} e saíram {brl(tout,dec=0)} entre 17/10/2025 e 03/11/2026. A conta termina com {brl(saldo_final)}, ou seja, quase nenhum caixa fica parado aqui.</li>
<li><b>A receita existe, mas não se acumula.</b> Os clientes pagaram {brl(receita,dec=0)} ({k(rec_avg)} por mês em média). Tirando sócio e empresas do grupo, os custos levaram {brl(opout,dec=0)}. Sobrou {brl(resultado_oper,True,0)} de resultado operacional de caixa, e esse valor saiu da conta como retirada do sócio e repasses ao grupo Conect.</li>
<li><b>Pouca reserva de caixa.</b> O saldo nunca fechou um dia negativo. Mas, seguindo a ordem do extrato, ficou abaixo de zero durante o dia em {len(neg_intra)} dias (mínimo de {brl(min_intra_day[1],dec=0)}), porque os pagamentos saem no mesmo dia em que os recebimentos entram. Na média, sobra pouco caixa no fim do dia.</li>
<li><b>Receita concentrada.</b> Pague Menos responde por {pct(pm/receita)} de toda a receita. Pague Menos, Americanas e Profarma somam {pct(top3cli/receita)}. Os boletos ({pct(catin['Boletos de clientes']/receita)} da receita) não identificam o pagador no extrato.</li>
<li><b>Saídas para revisar.</b> Saíram {brl(sum(-r['v'] for r in fuel),dec=0)} para postos de combustível em {len(fuel)} Pix (média {brl(-statistics.mean(r['v'] for r in fuel),dec=0)}), {brl(sum(-r['v'] for r in cripto),dec=0)} para câmbio/cripto e {brl(santander,dec=0)} para o Banco Santander sem descrição de finalidade.</li>
</ul>"""

sec.append(f'<section><h2>Resumo executivo</h2>{summary}{kpi_html}</section>')

sec.append(f"""<section><h2>1. Entradas e saídas por mês</h2>
<p class="sub">Out/25 a Nov/26. Jan–Set/25 não teve lançamentos (CSV vazio, confirmado no novo download). Nov/26 vai só até o dia 03.</p>
{legend_io}{grouped(MONTHS, [('inn', C_IN, 'Entradas'), ('out', C_OUT, 'Saídas')])}
<p class="take">Os dois lados andam quase juntos todo mês: o que entra sai no mesmo mês. O mês de maior volume foi {ml(max(MONTHS,key=lambda m:mon[m]['inn']))}, com {brl(max(mon[m]['inn'] for m in MONTHS),dec=0)} de entradas.</p></section>""")

sec.append(f"""<section><h2>2. Resultado líquido do mês (entradas − saídas)</h2>
{diverging(MONTHS, 'net')}
<p class="take">{len(neg_months)} dos {len(FULL)} meses completos fecharam no negativo ({', '.join(ml(m) for m in neg_months)}). O melhor foi {ml(best_net)} ({brl(mon[best_net]['net'],True,0)}) e o pior {ml(worst_net)} ({brl(mon[worst_net]['net'],True,0)}). Nos meses negativos a conta gastou o próprio saldo ou recebeu aportes de pessoas físicas.</p></section>""")

sec.append(f"""<section><h2>3. Receita de clientes</h2>
<p class="sub">Considera só boletos liquidados e Pix/TED de empresas clientes. Ficam de fora aportes, intercompany e estornos.</p>
{legend_rec}{stacked(MONTHS, [('bol', C_IN, 'Boletos'), ('pix', 'var(--s-2)', 'Pix/TED')], avg=rec_avg)}
<p class="take">Maior receita em {ml(best_rec)} ({brl(mon[best_rec]['rec'],dec=0)}), menor em {ml(worst_rec)} ({brl(mon[worst_rec]['rec'],dec=0)}). O 2º semestre (mai–out/26) somou {brl(h2,dec=0)}, {pct(h2/h1-1) if h2>=h1 else pct(1-h2/h1)} {'acima' if h2>=h1 else 'abaixo'} do 1º (nov/25–abr/26, {brl(h1,dec=0)}). A receita varia bastante (±{pct(cv,0)} em torno da média) e depende de poucos pagamentos grandes.</p></section>""")

sec.append(f"""<section><h2>4. Saldo diário da conta</h2>
<p class="sub">A linha mostra o saldo no fim de cada dia com lançamento. Os pontos marcam os dias em que o saldo ficou negativo em algum momento.</p>
<div class="legend"><span><i style="background:var(--s-in);height:2px"></i>Saldo fim do dia</span><span><i style="background:var(--s-out);border-radius:50%"></i>Mínimo intradia negativo</span></div>
{balance_line()}
<p class="take">O saldo médio no fim do dia foi {brl(avg_eod,dec=0)} e o pico {brl(max_eod[1],dec=0)} ({max_eod[0][8:]}/{max_eod[0][5:7]}/{max_eod[0][:4]}). Nenhum dia fechou negativo, mas {len(neg_intra)} dias ficaram abaixo de zero durante o dia pela ordem do extrato. Os pagamentos são agendados contando com os recebimentos do mesmo dia. Vale confirmar com o Inter se houve uso de limite ou cobrança de juros. Um caixa mínimo de 1 a 2 semanas de custos ({k(opout/ (len(FULL)+0.5) /2)} a {k(opout/(len(FULL)+0.5))}) acabaria com essa dependência.</p></section>""")

in_items = sorted(catin.items(), key=lambda x: -x[1])
out_items = sorted(catout.items(), key=lambda x: -x[1])
sec.append(f"""<section><h2>5. De onde vem o dinheiro</h2>
{hbars(in_items, tin, C_IN, cnt=cntin)}
<p class="take">Os boletos são a principal fonte ({pct(catin['Boletos de clientes']/tin)}), com {len(bols)} títulos, ticket médio de {brl(bol_med,dec=0)} e mediana de {brl(bol_mdn,dec=0)}. Os 10 maiores boletos respondem por {pct(top10_bol_share)} do total recebido em boletos. Aportes e retornos de pessoas físicas ({brl(catin['Aportes/retornos de pessoas físicas'],dec=0)}) entraram para cobrir meses de caixa apertado.</p></section>""")

sec.append(f"""<section><h2>6. Para onde vai o dinheiro</h2>
{hbars(out_items, tout, C_OUT, cnt=cntout)}
<p class="take">Os dois maiores destinos são o sócio ({pct(catout['Transferências ao sócio (Laércio)']/tout)}) e pessoas físicas da equipe e prestadores ({pct(catout['Pessoas físicas (equipe/prestadores)']/tout)}). Quase todo pagamento é feito por Pix para pessoa física, sem folha ou nota formal visível no extrato. Bancos, cartões e financiamentos levaram {brl(fin_out,dec=0)} ({pct(fin_out/receita)} da receita), dos quais {brl(santander,dec=0)} foram para o Banco Santander.</p></section>""")

cli_tot = sum(v for _, v in cli_rank)
sec.append(f"""<section><h2>7. Concentração de clientes identificados (Pix/TED)</h2>
{hbars(cli_rank[:10], receita, 'var(--s-2)', label_w=230)}
<p class="sub">Percentuais calculados sobre a receita total de clientes ({brl(receita,dec=0)}). Os boletos não identificam o pagador no extrato e por isso não aparecem aqui.</p>
<p class="take">Pague Menos sozinha responde por {pct(pm/receita)} da receita. A Americanas ({brl(clientes.get('Americanas S.A.',0),dec=0)}) está em recuperação judicial, o que é risco de crédito para recebimentos futuros.</p></section>""")

rows_b = ''.join(f'<tr><td>{i+1}</td><td>{esc(n)}</td><td>{esc(v[2])}</td><td class="num">{v[1]}</td><td class="num">{brl(v[0])}</td><td class="num">{pct(v[0]/tout)}</td></tr>' for i, (n, v) in enumerate(benef_rank[:15]))
sec.append(f"""<section><h2>8. Os 15 maiores beneficiários de saídas</h2>
<table><thead><tr><th>#</th><th>Beneficiário</th><th>Categoria</th><th class="num">Qtd</th><th class="num">Valor</th><th class="num">% saídas</th></tr></thead><tbody>{rows_b}</tbody></table>
<p class="take">Os 15 maiores somam {pct(sum(v[0] for _,v in benef_rank[:15])/tout)} de todas as saídas.</p></section>""")

rows_pf = ''.join(f'<tr><td>{esc(n)}</td><td class="num">{brl(i)}</td><td class="num">{brl(o)}</td><td class="num {"neg" if s<0 else ""}">{brl(s,True)}</td></tr>' for n, i, o, s in pf)
rows_ic = ''.join(f'<tr><td>{esc(n)}</td><td class="num">{brl(v[0])}</td><td class="num">{brl(v[1])}</td><td class="num {"neg" if v[0]-v[1]<0 else ""}">{brl(v[0]-v[1],True)}</td></tr>' for n, v in inter_rank)
ic_in = sum(v[0] for _, v in inter_rank); ic_out = sum(v[1] for _, v in inter_rank)
sec.append(f"""<section><h2>9. Movimentação com sócios e com o grupo Conect</h2>
<div class="two"><div><h3>Pessoas físicas com dinheiro nos dois sentidos</h3>
<table><thead><tr><th>Pessoa</th><th class="num">Recebido</th><th class="num">Enviado</th><th class="num">Líquido p/ conta</th></tr></thead><tbody>{rows_pf}</tbody></table></div>
<div><h3>Empresas do grupo (intercompany)</h3>
<table><thead><tr><th>Empresa</th><th class="num">Recebido</th><th class="num">Enviado</th><th class="num">Líquido p/ conta</th></tr></thead><tbody>{rows_ic}</tbody></table></div></div>
<p class="take">A conta repassou ao grupo {brl(ic_out-ic_in,dec=0)} líquidos, principalmente para Conect X Participações e ConectX Curitiba. Com Hosana, Marcello e Gilson há valores indo e voltando, o que parece empréstimo informal. Sem contrato de mútuo, isso mistura o caixa da empresa com o das pessoas e pode gerar questionamento fiscal.</p></section>""")

rows_q = ''.join(f'<tr><td>{n}{" *" if n in ("T4/25","T4/26") else ""}</td><td class="num">{brl(d["rec"],dec=0)}</td><td class="num">{brl(d["inn"],dec=0)}</td><td class="num">{brl(d["out"],dec=0)}</td><td class="num">{brl(d["opout"],dec=0)}</td><td class="num {"neg" if d["rec"]-d["opout"]<0 else ""}">{brl(d["rec"]-d["opout"],True,0)}</td></tr>' for n, d in qs.items())
sec.append(f"""<section><h2>10. Visão trimestral</h2>
<table><thead><tr><th>Trimestre</th><th class="num">Receita clientes</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Custos operacionais</th><th class="num">Resultado oper.</th></tr></thead><tbody>{rows_q}</tbody></table>
<p class="sub">* T4/25 começa em 17/10/2025 e T4/26 vai até 03/11/2026, por isso são trimestres parciais. Custos operacionais = todas as saídas exceto as feitas ao sócio e ao grupo Conect.</p></section>""")

rec_items = [
    ('Criar um caixa mínimo', f"Deixar na conta pelo menos {k(opout/(len(FULL)+0.5)/2)} (cerca de 2 semanas de custos) e só fazer retiradas acima desse piso. Assim a conta deixa de depender dos recebimentos do mesmo dia."),
    ('Formalizar as retiradas do sócio', f"Foram {brl(socio_out,dec=0)} em {cntout['Transferências ao sócio (Laércio)']} Pix. O ideal é separar pró-labore (valor mensal fixo) e distribuição de lucros (depois do fechamento), com registro contábil."),
    ('Regularizar os fluxos com pessoas físicas', "Para Hosana, Marcello e Gilson, fazer contratos de mútuo ou classificar os valores como pagamento de serviço com nota. Ajustar o mesmo para equipe e prestadores pagos via Pix."),
    ('Revisar combustível e cripto', f"Os Pix a postos ({brl(sum(-r['v'] for r in fuel),dec=0)}) têm valores altos e redondos, longe do padrão de abastecimento comum. Câmbio/cripto somou {brl(sum(-r['v'] for r in cripto),dec=0)}. Conferir a finalidade e ter os comprovantes."),
    ('Reduzir dependência de poucos clientes', f"Pague Menos é {pct(pm/receita)} da receita. Acompanhar o prazo de pagamento dela e monitorar os recebíveis da Americanas (em recuperação judicial)."),
    ('Identificar os pagadores dos boletos', "Cruzar o nosso número dos boletos (112/…) com o sistema de cobrança para medir concentração por cliente, inadimplência e prazo médio de recebimento."),
    ('Rever o custo financeiro', f"Bancos, cartões e financeiras levaram {brl(fin_out,dec=0)}. Mapear o que é dívida, cartão e antecipação (Trademaster, Urbano) e renegociar ou cortar o que for mais caro."),
]
rec_html = '<ol class="recs">' + ''.join(f'<li><b>{a}.</b> {b}</li>' for a, b in rec_items) + '</ol>'
sec.append(f'<section><h2>11. Recomendações</h2>{rec_html}</section>')

rows_m = ''.join(f'<tr class="{"muted" if mon[m]["n"]==0 else ""}"><td>{ml(m)}{" *" if m=="2026-11" else ""}</td><td class="num">{mon[m]["n"]}</td><td class="num">{brl(mon[m]["rec"])}</td><td class="num">{brl(mon[m]["inn"])}</td><td class="num">{brl(mon[m]["out"])}</td><td class="num {"neg" if mon[m]["net"]<0 else ""}">{brl(mon[m]["net"],True)}</td><td class="num">{brl(mon[m]["saldo"])}</td></tr>' for m in ALL_MONTHS)
sec.append(f"""<section><h2>Anexo A: tabela mensal completa (jan/25–nov/26)</h2>
<table><thead><tr><th>Mês</th><th class="num">Lanç.</th><th class="num">Receita clientes</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Líquido</th><th class="num">Saldo fim</th></tr></thead><tbody>{rows_m}
<tr class="tot"><td>Total</td><td class="num">{len(rows)}</td><td class="num">{brl(receita)}</td><td class="num">{brl(tin)}</td><td class="num">{brl(tout)}</td><td class="num">{brl(tin-tout,True)}</td><td class="num">{brl(saldo_final)}</td></tr></tbody></table>
<p class="sub">* até 03/11/2026.</p></section>""")

meth = """<section><h2>Anexo B: metodologia e limitações</h2><ul class="meth">
<li>Fonte: 23 CSV mensais exportados do Banco Inter (conta corrente 471395897, jan/2025 a 03/11/2026), com 664 lançamentos. O total confere com o saldo final do extrato.</li>
<li>As categorias foram definidas pela descrição e pela contraparte de cada lançamento. "Clientes via Pix/TED" inclui só pagadores pessoa jurídica que não são do grupo. "Pessoas físicas (equipe/prestadores)" junta Pix a pessoas físicas, exceto o sócio. A classificação é automática e deve ser validada com a contabilidade.</li>
<li>"Resultado operacional de caixa" = receita de clientes − saídas, sem contar transferências ao sócio e ao grupo Conect. É regime de caixa, não DRE: não considera impostos de outras contas, provisões nem competência.</li>
<li>O saldo intradia segue a ordem dos lançamentos no extrato. Lançamentos do mesmo dia podem ter sido processados em outra ordem.</li>
</ul></section>"""
sec.append(meth)

CSS = """
.viz-root{color-scheme:light;--surface:#fcfcfb;--page:#f9f9f7;--ink:#0b0b0b;--ink2:#52514e;--muted:#898781;--grid:#e1e0d9;--axis:#c3c2b7;--s-in:#2a78d6;--s-out:#e34948;--s-2:#eb6834;--neg:#d03b3b;--ring:rgba(11,11,11,.10)}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .viz-root{color-scheme:dark;--surface:#1a1a19;--page:#0d0d0d;--ink:#f0efec;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--s-in:#3987e5;--s-out:#e66767;--s-2:#d95926;--neg:#e66767;--ring:rgba(255,255,255,.10)}}
:root[data-theme="dark"] .viz-root{color-scheme:dark;--surface:#1a1a19;--page:#0d0d0d;--ink:#f0efec;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--s-in:#3987e5;--s-out:#e66767;--s-2:#d95926;--neg:#e66767;--ring:rgba(255,255,255,.10)}
*{box-sizing:border-box}
body{margin:0;background:var(--page)}
.viz-root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--page);min-height:100vh}
.wrap{max-width:1080px;margin:0 auto;padding:40px 28px 72px}
header h1{font-size:1.75rem;font-weight:650;margin:0 0 6px;letter-spacing:-.01em}
header .meta{color:var(--ink2);font-size:.92rem}
section{background:var(--surface);border:1px solid var(--ring);border-radius:12px;padding:22px 26px;margin:18px 0}
h2{font-size:1.12rem;font-weight:620;margin:0 0 6px}
h3{font-size:.92rem;font-weight:600;margin:4px 0 8px;color:var(--ink2)}
.sub{color:var(--muted);font-size:.85rem;margin:2px 0 10px}
.take{color:var(--ink2);font-size:.92rem;line-height:1.55;margin:12px 0 0;max-width:80ch}
.exec{margin:6px 0 18px;padding-left:20px;line-height:1.6;font-size:.95rem}
.exec li{margin:6px 0}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kpi{border:1px solid var(--ring);border-radius:10px;padding:12px 14px}
.kpi .l{font-size:.78rem;color:var(--ink2)}
.kpi .v{font-size:1.32rem;font-weight:650;margin:4px 0 2px;letter-spacing:-.01em}
.kpi .s{font-size:.74rem;color:var(--muted);line-height:1.35}
.legend{display:flex;gap:18px;font-size:.82rem;color:var(--ink2);margin:6px 0 4px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:middle}
svg{width:100%;height:auto;display:block;overflow:visible}
svg .grid{stroke:var(--grid);stroke-width:1}
svg .base{stroke:var(--axis);stroke-width:1}
svg .ref{stroke:var(--ink2);stroke-width:1;opacity:.6}
svg .tick{fill:var(--muted);font-size:11px;font-variant-numeric:tabular-nums}
svg .lbl{fill:var(--ink2);font-size:11px;font-weight:600}
svg .cat{fill:var(--ink);font-size:12.5px}
svg .val{fill:var(--ink2);font-size:12px;font-variant-numeric:tabular-nums}
svg [data-tip]:not(.hit):hover{opacity:.82}
table{width:100%;border-collapse:collapse;font-size:.86rem}
th,td{padding:7px 8px;border-bottom:1px solid var(--grid);text-align:left}
th{font-weight:550;color:var(--ink2);font-size:.74rem;text-transform:uppercase;letter-spacing:.03em}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.neg{color:var(--neg)}
tr.muted td{color:var(--muted)}
tr.tot td{font-weight:650;border-top:1px solid var(--axis)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.recs{padding-left:22px;line-height:1.55;font-size:.93rem}.recs li{margin:8px 0}
.meth{padding-left:20px;color:var(--ink2);font-size:.86rem;line-height:1.55}
#tt{position:fixed;pointer-events:none;background:var(--ink);color:var(--surface);font-size:12px;padding:6px 9px;border-radius:6px;opacity:0;transition:opacity .08s;max-width:340px;z-index:9;font-variant-numeric:tabular-nums}
@media (max-width:760px){.kpis{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}}
@media print{@page{size:A4;margin:12mm}body,.viz-root{background:#fff}.wrap{padding:0;max-width:none}section{break-inside:avoid;border-color:#ddd}#tt{display:none}}
"""
JS = """<script>(()=>{const t=document.getElementById('tt');document.addEventListener('mousemove',e=>{const el=e.target.closest('[data-tip]');if(!el){t.style.opacity=0;return}t.textContent=el.dataset.tip;t.style.opacity=1;const w=t.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;t.style.left=x+'px';t.style.top=(e.clientY+14)+'px'})})()</script>"""

doc = f"""<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Relatório financeiro executivo — Conect · Banco Inter (out/2025–nov/2026)</title>
<style>{CSS}</style></head>
<body><div class="viz-root"><div class="wrap">
<header><h1>Relatório financeiro executivo: conta Inter Conect</h1>
<div class="meta">Banco Inter · conta 471395897 · extratos de jan/2025 a 03/11/2026 · {len(rows)} lançamentos · movimento a partir de 17/10/2025 · gerado em 04/11/2026</div></header>
{''.join(sec)}
</div><div id="tt"></div></div>{JS}</body></html>"""
out = sys.argv[1]
open(out, 'w').write(doc)
print('ok', out)
print(dict(receita=receita, opout=opout, res=resultado_oper, neg_intra=len(neg_intra), neg_eod=len(neg_eod), min=min_intra_day, h1=h1, h2=h2, cv=cv, pm=pm/receita, neg_months=neg_months, check=round(saldo_ini+tin-tout-saldo_final,2), saldo_ini=saldo_ini))
