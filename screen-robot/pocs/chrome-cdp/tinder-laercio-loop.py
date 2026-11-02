#!/usr/bin/env python3
"""Loop eterno: última não lida → resposta no tom Laércio → próxima. CDP :9230."""
from __future__ import annotations

import asyncio
import json
import random
import re
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

try:
    import websockets
except ImportError:
    raise SystemExit("pip install websockets")

CDP = "http://127.0.0.1:9230"
STATE = Path("/tmp/tinder-laercio-loop-state.json")
LOG = Path("/tmp/tinder-laercio-loop.log")
TZ = ZoneInfo("America/Sao_Paulo")

done: set[str] = set()
if STATE.exists():
    try:
        done = set(json.loads(STATE.read_text()).get("done") or [])
    except Exception:
        pass

recent_phrases: list[str] = []

EXTRACT = r"""(() => {
  const out=[];
  for (const el of document.querySelectorAll('div.msg')) {
    const r=el.getBoundingClientRect();
    if (r.width<8||r.height<8||r.left<350) continue;
    let raw=(el.innerText||'').trim();
    if (!raw||raw.length>2500||/^(Enviado|Digite|Emoji|Enviar|Sent|Send)$/i.test(raw)) continue;
    let who=null,text=raw; const nl=raw.indexOf('\n');
    if (nl>0&&nl<80&&raw.slice(0,nl).endsWith(':')){who=raw.slice(0,nl-1).trim();text=raw.slice(nl+1).trim()}
    else { const m=raw.match(/^([^:\n]{1,60}):\s*([\s\S]+)$/); if(m){who=m[1].trim();text=m[2].trim()} }
    if(!text) continue;
    const mine=/^(Você|Voce|You)$/i.test(who||'')||r.left>innerWidth*0.58;
    out.push({who:who||(mine?'Você':'match'),text,mine:!!mine,y:Math.round(r.top)});
  }
  out.sort((a,b)=>a.y-b.y);
  const seen=new Set(); const msgs=[];
  for (const m of out){ const k=m.who+'|'+m.text+'|'+Math.round(m.y/10); if(seen.has(k)) continue; seen.add(k); msgs.push({who:m.who,text:m.text,mine:m.mine}); }
  return {url:location.href, msgs};
})()"""

PROFILE = r"""(() => {
  const cards=[];
  for (const el of document.querySelectorAll('div,span,p,h1,h2,li')) {
    const r=el.getBoundingClientRect();
    if (r.width<30||r.height<10||r.left<900) continue;
    const t=(el.innerText||'').trim();
    if (!t||t.length<2||t.length>280) continue;
    if (el.children.length>6) continue;
    cards.push(t);
  }
  const seen=new Set(); const uniq=[];
  for (const t of cards) { if (seen.has(t)) continue; seen.add(t); uniq.push(t); if (uniq.length>35) break; }
  const body=(document.body.innerText||'');
  const matchLine=(body.split('\n').map(l=>l.trim()).find(l=>/Match com/i.test(l))||'');
  const nameAge=(uniq.find(t=>/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,28}\d{2}$/.test(t.replace(/\s+/g,'')))||'');
  const bioIdx=uniq.findIndex(t=>/^Sobre mim$/i.test(t));
  let bio='';
  if (bioIdx>=0) {
    for (let i=bioIdx+1;i<Math.min(bioIdx+4,uniq.length);i++) {
      if (/^Informações básicas|^Tô procurando|^Mais sobre|^Bloquear|^Denunciar/i.test(uniq[i])) break;
      if (uniq[i].length>8) { bio=uniq[i]; break; }
    }
  }
  const dist=(uniq.find(t=>/quilômetro|km daqui/i.test(t))||'');
  const job=(uniq.find(t=>/Empreended|gestão|enferme|advogad|médic|estud|trabalh|software|designer|profess/i.test(t)&&t.length<60)||'');
  const looking=(uniq.find(t=>/Algo sério|Relacionamento|Algo casual|Ainda não sei|Amizade/i.test(t))||'');
  return {matchLine, nameAge, bio:bio.slice(0,220), dist, job, looking, cards:uniq.slice(0,20)};
})()"""


def log(*a):
    # só stdout — nohup já redireciona p/ LOG
    print(time.strftime("%H:%M:%S") + " " + " ".join(str(x) for x in a), flush=True)


def save():
    STATE.write_text(json.dumps({"done": list(done), "n": len(done)}, ensure_ascii=False))


def get_tab():
    tabs = json.load(urllib.request.urlopen(f"{CDP}/json/list", timeout=10))
    return next(t for t in tabs if t.get("type") == "page" and "tinder.com" in (t.get("url") or ""))


def _pick(options: list):
    global recent_phrases
    scored = []
    for opt in options:
        key = opt if isinstance(opt, str) else "|".join(opt)
        score = sum(1 for r in recent_phrases[-60:] if r == key)
        scored.append((score, random.random(), opt))
    scored.sort(key=lambda x: (x[0], x[1]))
    choice = scored[0][2]
    key = choice if isinstance(choice, str) else "|".join(choice)
    recent_phrases.append(key)
    recent_phrases[:] = recent_phrases[-100:]
    return [choice] if isinstance(choice, str) else list(choice)


def hour_now() -> int:
    return datetime.now(TZ).hour


def bio_hook(bio: str) -> list[str] | None:
    if not bio:
        return None
    b = bio.lower()
    if "sotaque" in b or "xiado" in b:
        return _pick([["Sotaque xiado de onde?"], ["Esse sotaque xiado", "Eh de onde?"]])
    if re.search(r"\b(jiu|muay|luta|boxe|treino|academia)\b", b):
        return _pick([["Tu treina oq?"], ["Treino tbm", "Qual luta?"]])
    if re.search(r"\b(vinho|cerveja|bar)\b", b):
        return _pick([["Curtidora de vinho tbm?"], ["Boa", "Curto vinho"]])
    if re.search(r"\b(curitiba|cwb|floripa|paraná|parana)\b", b):
        return _pick([["Mora em CWB tbm?"], ["Daqui de CWB?"]])
    if "atitude" in b or "primeira mensagem" in b:
        return _pick([["Atitude ok kkk", "Me conta algo de ti"], ["Ok", "O que tu faz da vida?"]])
    if re.search(r"leves|sem esforço|conversas que fluem", b):
        return _pick([["Curti isso", "Papo leve é raro"], ["Boa", "Tu é de onde?"]])
    m = re.search(r"(?:moro em|sou de|morando em)\s+([A-Za-zÀ-ÿ]{3,24})", b)
    if m:
        city = m.group(1).strip().title()
        return _pick([[f"De {city}?", "Eu tô em CWB"], [f"{city} massa", "Vem pra cá as vezes?"]])
    return None


def decide_msgs(chat: dict, profile: dict | None = None) -> list[str]:
    msgs = chat.get("msgs") or []
    theirs = [m for m in msgs if not m.get("mine")]
    mine = [m for m in msgs if m.get("mine")]
    last = (theirs[-1]["text"] if theirs else "").strip()
    last_l = last.lower().strip()
    prior = " ".join(m["text"] for m in theirs[:-1]).lower() if len(theirs) > 1 else ""
    blob = (prior + " " + last_l).strip()
    n_ex = len(msgs)
    already_wine = any(re.search(r"\bvinho\b", m["text"], re.I) for m in mine)
    my_texts = " ".join(m["text"].lower() for m in mine[-4:])
    hour = hour_now()
    bio = (profile or {}).get("bio") or ""
    job = (profile or {}).get("job") or ""
    dist = (profile or {}).get("dist") or ""

    opening = bool(re.match(r"^(o+i+e*|oie+|oi+|oii+|olá|ola|opa|hey|hi|hello|eai|e aí|e ai)[\s!.?]*$", last_l))
    sorry = bool(re.search(r"demora|desculp|perd[aã]o|s[oó] vi|agora vi|tava ocup", last_l))
    how_are = bool(
        re.search(
            r"(tudo\s*(bem|bom|certo)|td\s*(bem|bom)|to bem|tô bem|estou bem|como\s*(você|vc|tu)|e\s*(aí|ai|vc|você)\??|bem\?\s*$|bem e (você|vc|tu)|certinho)",
            last_l,
        )
    )
    asks = "?" in last
    number = bool(re.search(r"(\+?\d[\d\s\-()]{7,}\d)|whats|zap|wpp|instagram|\binsta\b|@\w{3,}", last_l))
    emoji_only = len(last) <= 6 and not re.search(r"[a-zA-ZÀ-ÿ]{2,}", last)
    loc = bool(
        re.search(
            r"\b(moro|morando|sou de|fico em|moro em|bairro|cidade|curitiba|cwb|floripa|jaragu[aá]|joinville|blumenau|sc\b|pr\b|centro|batel|água verde|agua verde|port[aã]o|aqui em|perto)\b",
            blob,
        )
    )
    work = bool(re.search(r"\b(trabalh|estudo|facul|curso|empresa|plant[aã]o|home office|enferme|médic|medic|advogad|profess|empreend|gestão)\b", last_l))
    night = bool(re.search(r"\b(hoje|amanh[aã]|fds|fim de semana|noite|sair|tomar|bar|rol[eê])\b", last_l))
    flirty = bool(re.search(r"(gatinh|bonit|lind[oa]|safad|quero te|me chama)", last_l))
    yesish = bool(re.match(r"^(s+|sim+|ss+|claro|pode|bora|vamos|vam|ok|okay|top|fechou)[\s!.k]*$", last_l))
    giving_up = bool(re.search(r"desist|cansei|saio do app|quase saindo", last_l))
    ghost = bool(re.search(r"\b(some|sumiu|ghost|desaparec|muda totalmente|rola alguma coisa)\b", blob))
    longish = len(last) > 45 or n_ex >= 6
    city = None
    m = re.search(r"(?:sou de|moro em|morando em|aqui em)\s+([A-Za-zÀ-ÿ\s]{2,40}?)(?:\s*[,\-]|$)", last_l)
    if not m:
        m = re.search(r"\b(jaragu[aá] do sul|joinville|blumenau|curitiba|floripa|florian[oó]polis|são josé|sao jose)\b", blob)
    if m:
        city = m.group(1).strip().title()

    if already_wine:
        if yesish or re.search(r"\b(bora|vamos|quero|top|aceito)\b", last_l):
            return _pick([["Qual dia fica bom pra ti?"], ["Amanhã ou outro dia?"], ["Prefere semana ou fds?"], ["Te busco ou a gente se encontra?"]])
        if loc or re.search(r"\b(onde|lugar|bar|qual)\b", last_l):
            return _pick([["Conheço uns lugares bons"], ["Tem um spotzinho daora", "Te mostro"], ["Centro ou mais pra algum bairro?"]])
        if how_are or asks:
            return _pick([["Tô de boa", "Fecha um dia pro vinho?"], ["Por aqui suave", "Que dia rola?"]])
        return _pick([["Tá livre esses dias?"], ["Que dia tu curte mais?"], ["Me fala um dia q dá"]])

    if number:
        return _pick([["Boa", "Te chamo la"], ["Fechei", "Já te mando msg"], ["Top", "Vou te chamar"]])

    if giving_up:
        return _pick([["Kkk mesma coisa", "Mas ainda n desisti"], ["Entendo kkk", "Ainda tô na luta"], ["Kkk clássico", "Mas tu ainda tá aqui"]])

    if ghost:
        return _pick(
            [
                ["Kkk clássico", "Pior parte disso"],
                ["Te entendo", "Muita gente some mesmo"],
                ["Pqp", "Por isso n arrasto papo eterno"],
                ["Real", "Melhor filtrar cedo"],
            ]
        )

    if sorry:
        return _pick([["Tranquilo kkk", "E aí, bem?"], ["De boa", "O que tu tava fazendo?"], ["Suave kkk", "Tá por onde?"], ["Sem stress", "Como foi teu dia?"]])

    if emoji_only:
        return _pick([["Kkk", "E aí?"], ["Haha", "Bem?"], ["Kkk gostei", "Tá fazendo oq?"]])

    if city or (loc and not opening):
        c = city or "aí"
        if how_are:
            return _pick([["Tô bem", f"{c} eh longe um pouco né"], ["Tudo certo", "Sou de Curitiba", f"{c} visita as vezes?"]])
        return _pick([[f"Ah {c}", "Eu tô em Curitiba"], ["Daora", "Fica longe de CWB?"], [f"{c} massa", "Tu vem pra cá as vezes?"]])

    if opening and n_ex <= 4:
        opts = [["E aí", "Tudo bem?"], ["Opa", "Como tu tá?"], ["Oiee", "O que tá rolando de bom?"], ["Fala", "Sumida kkk"], ["Bem?"], ["Oii", "Que bom te ver por aqui"]]
        if 22 <= hour or hour < 6:
            opts = [["E aí", "Ainda acordada?"], ["Opa", "O que tá rolando?"], ["Oiee"], ["Bem?"]]
        hook = bio_hook(bio)
        if hook and n_ex <= 2:
            return _pick([["Oii", hook[0]], ["E aí", hook[0]]])
        return _pick(opts)

    if how_are:
        # answer + hook if unused
        if bio and "sotaque" not in my_texts and bio_hook(bio):
            h = bio_hook(bio)
            return _pick([["Bem tbm"] + h, ["Tô bem"] + h, ["Bem por aqui"] + h])
        if job and "trabalh" not in my_texts and "software" not in my_texts:
            return _pick([["Bem tbm", "Tu trabalha com oq?"], ["Tô bem", f"Vi {job.split()[0].lower()} no perfil"], ["De boa", "O que tá rolando?"]])
        if 22 <= hour or hour < 6:
            return _pick([["Bem tbm", "Ainda acordada?"], ["Tô bem", "O que tá rolando?"], ["De boa", "Tá fazendo oq?"]])
        return _pick([["Tudo bem", "E tu?"], ["De boa", "Como foi teu dia?"], ["Bem por aqui", "Conta aí"], ["Tô bem", "Tu tá onde agora?"]])

    if work:
        return _pick([["Massa", "Curtindo?"], ["Daora", "É puxado?"], ["Boa", "Eu mexo com software"], ["Interessante", "Como é a rotina?"]])

    if flirty:
        return _pick([["Kkk parado aí", "Tu é assim direto?"], ["Olha a ousadia kkk", "Gostei"], ["Haha cuidado", "Vai me conquistar assim"]])

    if night and not already_wine and n_ex >= 4:
        return _pick([["Boa ideia", "Bora tomar um vinho então"], ["Curti", "Vinho cai bem nisso"], ["Top", "Marca um dia comigo"]])

    if asks and not opening:
        if re.search(r"\b(idade|anos|quantos)\b", last_l):
            return _pick([["27", "E tu?"], ["27 kkk", "E tu?"]])
        if re.search(r"\b(trabalh|faz da vida|profiss|emprego)\b", last_l):
            return _pick([["Mexo com software", "E tu?"], ["Tecnologia", "Tu trabalha com oq?"]])
        if re.search(r"\b(mora|onde|cidade|bairro)\b", last_l):
            return _pick([["Curitiba", "E tu?"], ["Por CWB", "Tu é de onde?"]])
        if re.search(r"\b(nome|te chamas|se chama)\b", last_l):
            return _pick([["Germano", "Prazer"], ["Laércio Germano", "E o teu?"]])
        if re.search(r"\b(de onde|sotaque)\b", last_l):
            return _pick([["CWB", "E o teu?"], ["Curitiba", "Tu?"]])
        return _pick([["Kkk depende", "Me conta mais de ti"], ["Boa pergunta", "Tu primeiro"], ["Hmm", "Prefiro falar pessoalmente"]])

    if longish and not already_wine and n_ex >= 5:
        hook = bio_hook(bio)
        if hook:
            return hook
        return _pick([["Entendi", "E aí, curte sair?"], ["Daora isso", "Faz tempo?"], ["Gostei de saber", "O que tu faz no tempo livre?"]])

    if yesish:
        return _pick([["Kkk", "Do que tu tá falando exatamente?"], ["Top", "Então me conta mais"], ["Fechou", "Tá onde por ai?"]])

    if n_ex <= 5:
        hook = bio_hook(bio)
        if hook:
            return hook
        if "127" in dist or re.search(r"\b([5-9]\d|[1-9]\d{2,})\s*quilômetro", dist):
            return _pick([["Vi q tu tá longe um pouco", "Vem pra CWB as vezes?"], ["Daora", "Mora longe né"]])
        opts = [
            ["Conta aí", "O que tu curte?"],
            ["E aí", "Trabalha com oq?"],
            ["Daora", "Faz oq da vida?"],
            ["Kkk", "Tu é de onde?"],
            ["Boa", "Tá mais pra treino ou pra sofá?"],
            ["Olha", "Me fala uma coisa aleatória de ti"],
        ]
        if not (22 <= hour or hour < 6):
            opts.append(["Hmm", "Como foi teu fds?"])
        else:
            opts.append(["Hmm", "O que tá rolando de bom?"])
        return _pick(opts)

    return _pick(
        [
            ["Tô curtindo o papo", "Bora tomar um vinho esses dias"],
            ["Daora te conhecer melhor", "Um vinho ia bem"],
            ["Olha", "Melhor continuar isso pessoalmente num vinho"],
            ["Sem pressa", "Mas topa um vinho um dia?"],
        ]
    )


async def send_text(send, js, click_xy, text):
    info = None
    for _ in range(20):
        info = await js(
            """(() => {
          const ta=document.querySelector('textarea,[contenteditable="true"],div[role="textbox"]');
          if(!ta) return null; const r=ta.getBoundingClientRect(); if(r.width<20) return null;
          return {x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)};
        })()"""
        )
        if info:
            break
        await asyncio.sleep(0.12)
    if not info:
        return False
    await click_xy(info["x"], info["y"])
    await asyncio.sleep(0.04)
    await send("Input.dispatchKeyEvent", {"type": "keyDown", "key": "a", "code": "KeyA", "modifiers": 2, "windowsVirtualKeyCode": 65})
    await send("Input.dispatchKeyEvent", {"type": "keyUp", "key": "a", "code": "KeyA", "modifiers": 2, "windowsVirtualKeyCode": 65})
    await send("Input.insertText", {"text": text})
    await asyncio.sleep(0.08)
    via = await js(
        """(() => {
      for (const b of document.querySelectorAll('button,[role="button"]')) {
        const t=(b.innerText||b.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();
        if (/^enviar$/i.test(t)||/^send$/i.test(t)) { if(!b.disabled){ b.click(); return t } }
      }
      return null;
    })()"""
    )
    if not via:
        await send("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13, "nativeVirtualKeyCode": 13})
        await send("Input.dispatchKeyEvent", {"type": "keyUp", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13, "nativeVirtualKeyCode": 13})
        via = "Enter"
    return via


async def one_cycle(ws):
    nid = 0

    async def send(method, params=None):
        nonlocal nid
        nid += 1
        await ws.send(json.dumps({"id": nid, "method": method, "params": params or {}}))
        while True:
            r = json.loads(await ws.recv())
            if r.get("id") == nid:
                if r.get("error"):
                    raise RuntimeError(r["error"])
                return r

    async def js(expr):
        r = await send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        return (r.get("result") or {}).get("result", {}).get("value")

    async def click_xy(x, y):
        await send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x, "y": y, "button": "left", "buttons": 1, "clickCount": 1})
        await send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x, "y": y, "button": "left", "buttons": 0, "clickCount": 1})

    await js(
        """(() => { for (const b of document.querySelectorAll('button,a,[role="tab"]')) { if ((b.innerText||'').trim()==='Mensagens') { b.click(); return true } } return false })()"""
    )
    await asyncio.sleep(0.55)

    rows = await js(
        """(() => {
      const items=[], seen=new Set();
      for (const a of document.querySelectorAll('a[href*="/app/messages/"]')) {
        const href=a.getAttribute('href')||''; if(!href||seen.has(href)) continue;
        const r=a.getBoundingClientRect();
        if (r.width<80||r.height<40||r.left>420||r.top<80) continue;
        const blob=((a.getAttribute('aria-label')||'')+' '+(a.innerText||'')).toLowerCase();
        if (!(/última mensagem de|ultima mensagem de|last message from/.test(blob))) continue;
        if (/última mensagem de você|ultima mensagem de você|ultima mensagem de voce|last message from you/.test(blob)) continue;
        seen.add(href);
        items.push({href, text:(a.innerText||'').replace(/\\s+/g,' ').trim().slice(0,140),
          x:Math.round(r.left+r.width/2), y:Math.round(r.top+40), top:Math.round(r.top)});
      }
      items.sort((a,b)=>a.top-b.top); return items;
    })()"""
    ) or []

    targets = [r for r in rows if r["href"] not in done]
    # prefer visible; if none, scroll
    visible = [r for r in targets if 80 <= r["top"] <= 900]
    if not visible:
        # try click via querySelector scrollIntoView for first pending in DOM
        pending = await js(
            """(() => {
          const items=[], seen=new Set();
          for (const a of document.querySelectorAll('a[href*="/app/messages/"]')) {
            const href=a.getAttribute('href')||''; if(!href||seen.has(href)) continue;
            const blob=((a.getAttribute('aria-label')||'')+' '+(a.innerText||'')).toLowerCase();
            if (!(/última mensagem de|ultima mensagem de|last message from/.test(blob))) continue;
            if (/última mensagem de você|ultima mensagem de você|ultima mensagem de voce|last message from you/.test(blob)) continue;
            seen.add(href);
            items.push(href);
          }
          return items;
        })()"""
        ) or []
        pending = [h for h in pending if h not in done]
        if not pending:
            scr = await js(
                """(() => {
              const scrollers=[...document.querySelectorAll('div')].filter(d=>{
                const r=d.getBoundingClientRect();
                return r.left<50 && r.width>200 && r.width<420 && d.scrollHeight>d.clientHeight+40;
              });
              const s=scrollers.sort((a,b)=>b.scrollHeight-a.scrollHeight)[0];
              if(!s) return {ok:false};
              const before=s.scrollTop; s.scrollTop += 380;
              return {ok:true, before, top:s.scrollTop, atEnd:s.scrollTop>=s.scrollHeight-s.clientHeight-2};
            })()"""
            )
            log("scroll", scr, "done", len(done))
            await asyncio.sleep(0.4)
            return "scroll"
        href = pending[0]
        await js(
            f"""(() => {{
          const a=document.querySelector('a[href="{href}"]');
          if(!a) return false;
          a.scrollIntoView({{block:'center'}});
          a.click();
          return true;
        }})()"""
        )
        t = {"href": href, "text": href[-18:]}
    else:
        t = visible[0]
        # prefer DOM click for reliability when partially off
        clicked = await js(
            f"""(() => {{
          const a=document.querySelector('a[href="{t["href"]}"]');
          if(!a) return false;
          a.scrollIntoView({{block:'nearest'}});
          a.click();
          return true;
        }})()"""
        )
        if not clicked:
            await click_xy(t["x"], t["y"])

    log("→", (t.get("text") or "")[:90], t["href"][-18:])
    await asyncio.sleep(0.95)

    chat = {"msgs": []}
    for _ in range(25):
        chat = await js(EXTRACT) or {"msgs": []}
        if chat.get("msgs"):
            break
        await asyncio.sleep(0.12)

    if chat.get("msgs") and chat["msgs"][-1].get("mine"):
        log("skip already mine", (chat["msgs"][-1].get("text") or "")[:40], t["href"][-16:])
        done.add(t["href"])
        save()
        return "skip"

    profile = await js(PROFILE) or {}

    if not chat.get("msgs"):
        log("empty chat", t["href"][-16:])
        chat = {"msgs": [{"who": "match", "text": t.get("text", ""), "mine": False}]}

    replies = decide_msgs(chat, profile)[:4]
    log(
        "chat",
        json.dumps([{"w": m["who"][:10], "t": m["text"][:60]} for m in (chat.get("msgs") or [])[-6:]], ensure_ascii=False),
    )
    log("profile", json.dumps({k: profile.get(k) for k in ("nameAge", "bio", "dist", "job", "looking") if profile.get(k)}, ensure_ascii=False)[:180])
    log("replies", replies)

    for msg in replies:
        ok = await send_text(send, js, click_xy, msg)
        log("sent", msg, ok)
        if not ok:
            done.add(t["href"])
            save()
            return "fail"
        await asyncio.sleep(0.4)

    done.add(t["href"])
    save()
    await asyncio.sleep(0.3)
    return "ok"


async def main():
    log("start done=", len(done), "laercio-loop=1")
    empty = 0
    while True:
        try:
            tab = get_tab()
            async with websockets.connect(tab["webSocketDebuggerUrl"], max_size=8_000_000, open_timeout=20) as ws:
                while True:
                    try:
                        r = await one_cycle(ws)
                        empty = empty + 1 if r == "scroll" else 0
                        if empty >= 15:
                            # reset scroll to top
                            await asyncio.sleep(0.2)
                            # reconnect cycle will re-query
                            empty = 0
                            log("reset-scroll-top")
                            # scroll to top via js on next cycle
                        if r == "scroll":
                            await asyncio.sleep(0.35)
                        else:
                            await asyncio.sleep(0.55)
                    except Exception as e:
                        log("cycle_err", type(e).__name__, e)
                        await asyncio.sleep(1.2)
                        break
        except Exception as e:
            log("reconnect", type(e).__name__, e)
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
