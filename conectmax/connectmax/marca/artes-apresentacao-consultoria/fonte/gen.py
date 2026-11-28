CSS="""
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:'Outfit',sans-serif;position:relative;overflow:hidden;padding:80px 72px;display:flex;flex-direction:column}
.dark{background:radial-gradient(900px 700px at 100% 0,#0b2a5c 0,transparent 60%),radial-gradient(700px 600px at 0 100%,#071a3a 0,transparent 60%),#02060f;color:#fff}
.light{background:#F3F5F9;color:#0F131C}
.blue{background:linear-gradient(160deg,#0070BC,#005490 60%,#161745);color:#fff}
.logo{height:84px;align-self:flex-start}
.eyebrow{font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:24px;color:#4A9FE0;display:flex;align-items:center;gap:18px;margin-top:44px}
.eyebrow:before{content:'';width:56px;height:2px;background:#4A9FE0}
.light .eyebrow{color:#0070BC}.light .eyebrow:before{background:#0070BC}
h1{font-weight:800;letter-spacing:-.03em;line-height:.98;font-size:100px;margin-top:20px}.sp{min-height:24px}
h1 em{font-style:normal;color:#4A9FE0}.light h1 em{color:#0070BC}
p.sub{font-size:34px;line-height:1.35;color:#B4BCCC;margin-top:24px;font-weight:400;max-width:900px}
.light p.sub{color:#3A4254}
.sp{flex:1}
.cta{display:flex;align-items:center;justify-content:center;min-height:124px;background:linear-gradient(90deg,#0070BC,#2f86e8);border-radius:70px;padding:26px 38px;box-shadow:0 0 50px rgba(47,134,232,.45);color:#fff}
.cta b{font-size:38px;font-weight:700;line-height:1.1}
.foot{font-size:22px;color:#8C95A8;margin-top:26px;text-align:center}
.card{background:rgba(255,255,255,.04);border:1px solid #1d3a6e;border-radius:26px;padding:22px 30px}
.light .card{background:#fff;border:1px solid #DADEE7}
.card b{font-size:34px;font-weight:700;display:block}
.card small{font-size:25px;color:#A9B4C8;display:block;margin-top:6px;line-height:1.3}
.light .card small{color:#5A6377}
.grid{display:grid;gap:20px}
.g2{grid-template-columns:1fr 1fr}
.num{width:64px;height:64px;border-radius:50%;border:2px solid #4A9FE0;display:grid;place-items:center;font-weight:700;font-size:30px;flex:none;color:#fff}
.light .num{background:#0070BC;border-color:#0070BC;color:#fff}
"""
def cta(t="Fale com um consultor"):
    return f'<div class="cta"><b>{t}</b></div>'
def page(n,cls,body,logo="noite"):
    open(f"arte-{n}.html","w").write(f'<!DOCTYPE html><html lang="pt-BR"><meta charset="utf-8"><style>{CSS}</style><body class="{cls}"><img class="logo" src="logo-tech-{logo}.png">{body}</body></html>')
FOOT='<div class="foot">ConectMax · Soluções em Tecnologia · Desde 2017 · Atendimento B2B</div>'

page("01-destrava-crescimento","dark",f'''
<div class="eyebrow">Consultoria em tecnologia</div>
<h1>Tecnologia que <em>destrava</em> o crescimento do seu negócio.</h1>
<p class="sub">Estratégia, software e automação para empresas que querem decidir melhor e operar com mais eficiência.</p>
<div class="sp"></div>
<div class="grid g2" style="margin-bottom:44px">
<div class="card"><b>Consultoria em TI</b><small>Diagnóstico e roadmap</small></div>
<div class="card"><b>Software sob medida</b><small>Feito para o seu fluxo</small></div>
<div class="card"><b>Automação e IA</b><small>Menos trabalho manual</small></div>
<div class="card"><b>Integrações</b><small>ERP, CRM e e-commerce</small></div></div>
{cta("Agende uma conversa")}{FOOT}''')

page("02-por-onde-comecar","dark",f'''
<div class="eyebrow">Sem compromisso</div>
<h1 style="font-size:88px">Por onde <em>começar</em> a tecnologia da sua empresa?</h1>
<p class="sub">A gente mapeia o cenário, indica o melhor caminho e acompanha a execução.</p>
<div class="sp"></div>
<div style="display:flex;flex-direction:column;gap:18px;margin-bottom:44px">
<div class="card" style="display:flex;gap:26px;align-items:center"><div class="num">1</div><div><b>Diagnóstico</b><small>Entendemos processos, sistemas e onde está o maior ganho.</small></div></div>
<div class="card" style="display:flex;gap:26px;align-items:center"><div class="num">2</div><div><b>Plano e proposta</b><small>Escopo, prazo e investimento claros.</small></div></div>
<div class="card" style="display:flex;gap:26px;align-items:center"><div class="num">3</div><div><b>Execução acompanhada</b><small>Entregas quinzenais, você vê o avanço.</small></div></div></div>
{cta("Peça um diagnóstico inicial")}{FOOT}''')

page("03-menos-complexidade","dark",f'''
<div class="sp"></div>
<h1 style="font-size:118px">Menos complexidade.<br><em>Mais resultado.</em></h1>
<p class="sub" style="font-size:38px">Consultoria em tecnologia para empresas que querem fazer mais com o que já têm.</p>
<div class="sp"></div><div class="sp"></div>
{cta("Vamos conversar?")}{FOOT}''')

steps=[("Diagnóstico","Entendemos o negócio e os processos"),("Proposta","Escopo, prazo e investimento definidos"),("Protótipo","Telas navegáveis antes de programar"),("Desenvolvimento","Sprints curtas com demonstração"),("Implantação","Treinamento e suporte contínuo")]
st="".join(f'<div class="card" style="display:flex;gap:26px;align-items:center;padding:16px 34px"><div class="num">{i+1}</div><div><b>{a}</b><small>{b}</small></div></div>' for i,(a,b) in enumerate(steps))
page("04-do-diagnostico-ao-sistema","light",f'''
<div class="eyebrow">Como trabalhamos</div>
<h1 style="font-size:84px">Do diagnóstico ao <em>sistema em produção.</em></h1>
<div class="sp" style="max-height:40px"></div>
<div style="display:flex;flex-direction:column;gap:16px;margin-top:20px">{st}</div>
<div class="sp"></div>
{cta("Fale com um consultor")}<div class="foot" style="color:#5A6377">ConectMax · Soluções em Tecnologia · Desde 2017</div>''',"claro")

nums=[("2017","Ano de fundação"),("+1.000","Empresas atendidas"),("8","Unidades: PR, SC, RS e SP"),("B2B","Atendimento exclusivo a empresas")]
nc="".join(f'<div class="card"><b style="font-size:64px;color:#4A9FE0;letter-spacing:-.03em;line-height:1">{a}</b><small style="font-size:27px">{b}</small></div>' for a,b in nums)
page("05-mesmo-parceiro","dark",f'''
<div class="eyebrow">Quem somos</div>
<h1 style="font-size:76px">O parceiro que abastece sua tecnologia agora <em>constrói seus sistemas.</em></h1>
<p class="sub">Consultoria e desenvolvimento de software, da cotação à implantação.</p>
<div class="sp"></div>
<div class="grid g2" style="margin-bottom:44px">{nc}</div>
{cta("Fale com um consultor")}{FOOT}''')

sv=["Consultoria em TI","Software sob medida","Portal de compras B2B","Aplicativos mobile","Integrações e modernização","Dados e dashboards","IA na sua empresa","Automação de processos"]
sc="".join(f'<div style="border:1.5px solid rgba(255,255,255,.35);border-radius:22px;padding:22px 28px;font-size:32px;font-weight:600;background:rgba(255,255,255,.08)">{s}</div>' for s in sv)
page("06-servicos-cartao","blue",f'''
<div class="eyebrow" style="color:#A5F3FC">Consultoria e desenvolvimento de software</div>
<style>.blue .eyebrow:before{{background:#A5F3FC}}</style>
<h1 style="font-size:92px">Pensamos, desenhamos e <span style="color:#A5F3FC">entregamos.</span></h1>
<div class="sp" style="max-height:50px"></div>
<div class="grid g2" style="margin-top:30px">{sc}</div>
<div class="sp"></div>
{cta("Solicite uma proposta")}<div class="foot" style="color:#C9D1E0">ConectMax · Soluções em Tecnologia · Desde 2017 · Atendimento B2B</div>''')
