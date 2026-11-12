import glob,re,collections,json,sys
rows=[]
for f in sorted(glob.glob('/Users/laerciogermano/Documents/works/conectmax/extratos/inter/*.csv')):
    for line in open(f,encoding='utf-8-sig'):
        p=line.rstrip('\n').split(';')
        if len(p)>=4 and re.match(r'\d\d/\d\d/\d{4}',p[0]):
            d,m,y=p[0].split('/')
            v=float(p[2].replace('.','').replace(',','.'))
            s=float(p[3].replace('.','').replace(',','.'))
            rows.append(dict(date=f"{y}-{m}-{d}",desc=p[1],v=v,saldo=s))
rows.sort(key=lambda r:r['date'])
json.dump(rows,open('rows.json','w'),ensure_ascii=False)
print(len(rows))
def key(desc):
    t=desc.split(':')[0]
    m=re.search(r'Cp :\d+-(.*?)"',desc)
    return t, (m.group(1) if m else desc.split(':',1)[-1].strip(' "'))
c=collections.defaultdict(lambda:[0,0.0])
for r in rows:
    t,cp=key(r['desc']); k=(('IN' if r['v']>0 else 'OUT'),t,cp); c[k][0]+=1;c[k][1]+=r['v']
for k,v in sorted(c.items(),key=lambda x:-abs(x[1][1]))[:90]:
    print(k[0],k[1][:30],'|',k[2][:55],v[0],round(v[1],2))
