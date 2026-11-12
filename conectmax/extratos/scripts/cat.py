import json,re,collections
rows=json.load(open('rows.json'))
def cp(desc):
    m=re.search(r'Cp :\d+-(.*?)"',desc)
    if m: return m.group(1).strip()
    m=re.search(r':\s*"(.*?)"',desc); s=m.group(1) if m else desc
    s=re.sub(r'^\d{3} \d+ \d+ ','',s); s=re.sub(r'^00019 \d+ ','',s)
    return s.strip()
def has(s,*ks): s=s.upper(); return any(k in s for k in ks)
INTER=('CONECT',)
def cat(r):
    d=r['desc']; c=cp(d); v=r['v']
    if v>0:
        if d.startswith('Boleto'): return 'Boletos de clientes'
        if d.startswith('Pix enviado devolvido') or d.startswith('Estorno'): return 'Devoluções e estornos'
        if has(c,*INTER): return 'Intercompany (grupo Conect)'
        if has(c,'LAERCIO','HOSANA','MARCELLO','WITZKI','GILSON','BRUNO DE AZEVEDO'): return 'Aportes/retornos de pessoas físicas'
        return 'Clientes via Pix/TED'
    if has(c,*INTER): return 'Intercompany (grupo Conect)'
    if has(c,'LAERCIO GERMANO'): return 'Transferências ao sócio (Laércio)'
    if has(c,'SANTANDER','URBANO','RANDON','NU PAGAMENTOS','BANCO DO BRASIL','LUIZACRED','PAGALEVE','TRADEMASTER'): return 'Bancos, cartões e financiamentos'
    if has(c,'POSTO','COMBUSTIVE'): return 'Postos de combustível'
    if has(c,'CORREIOS','CARGO','TRANSPORT','JADLOG','RODONAVES','AGUIA BRANCA','JAMEF','LOGISTICA'): return 'Logística e fretes'
    if has(c,'EXCHANGE','TROCA COIN'): return 'Câmbio/cripto'
    if has(c,'CARVALHO SERVICOS','BC SERVICOS','ANALISARE','SAFE2PAY','PAGAR ME','CONSULTORIA'): return 'Serviços, sistemas e consultoria'
    if re.search(r'LTDA|S\.?A\b|SA$|S/A|AMAZON|MAGALU|MARKETPLACE|SHOP|KALUNGA|TONIN|CASA PRATICA|DIFERECON|MAEX|ABISSAL|BRINGIT|INFORMATICA|EIRELI|ME$',c.upper()): return 'Fornecedores (equipamentos e mercadorias)'
    return 'Pessoas físicas (equipe/prestadores)'
for r in rows: r['cp']=cp(r['desc']); r['cat']=cat(r)
json.dump(rows,open('rows2.json','w'),ensure_ascii=False)
s=collections.defaultdict(lambda:[0,0.0]); who=collections.defaultdict(lambda:collections.defaultdict(float))
for r in rows: s[('IN' if r['v']>0 else 'OUT',r['cat'])][0]+=1; s[('IN' if r['v']>0 else 'OUT',r['cat'])][1]+=r['v']; who[r['cat']][r['cp']]+=r['v']
for k,v in sorted(s.items(),key=lambda x:(x[0][0],-abs(x[1][1]))): print(k,v[0],round(v[1],2))
for k in ['Pessoas físicas (equipe/prestadores)','Fornecedores (equipamentos e mercadorias)','Clientes via Pix/TED']:
    print('==',k); print(sorted(((round(b,0),a) for a,b in who[k].items()))[:40] if 'Clientes' not in k else sorted(((round(b,0),a) for a,b in who[k].items()),reverse=True))
