#!/usr/bin/env python3
"""Gera ../livro.html: o livro inteiro (caps. 1–7 de eternos-mutaveis.html) para ler no navegador,
com a capa D (dominó em pé) e uma trilha que muda a cada capítulo (crossfade).
Músicas em assets/musica/ (domínio público / CC0 / CC BY, Wikimedia Commons)."""
import os, re, json, sys

MODE = sys.argv[1] if len(sys.argv) > 1 else ""
V2 = MODE in ("v2", "v3")   # pranchas P&B vindas do próprio capítulo
GRAV = {  # pranchas: gravuras renascentistas (domínio público / CC0), em assets/gravuras/
    "cap1": ("Albrecht Dürer, Adão e Eva, 1504 (gravura a buril)", "Adão e Eva de pé entre árvores, nus, no instante antes da queda; a serpente entrega o fruto a Eva; animais ao redor."),
    "cap2": ("Albrecht Dürer, São Jerônimo no estúdio, 1514 (gravura a buril)", "Um sábio escreve sozinho num estúdio iluminado pela janela; um leão dorme no chão; um crânio no parapeito."),
    "cap3": ("A Roda da Fortuna, A Nau dos Insensatos, Basileia, 1494 (xilogravura)", "Uma roda gira sobre um pedestal com figuras de tolos subindo e caindo; uma mão sai das nuvens e gira a manivela."),
    "cap4": ("Gravura Flammarion, 1888 (xilogravura à maneira antiga)", "Um peregrino ajoelhado atravessa a abóbada do céu estrelado com a cabeça e vê, do outro lado, as rodas e o mecanismo do universo."),
    "cap5": ("Giorgio Ghisi segundo Rafael, A Escola de Atenas, 1550 (gravura a buril)", "Filósofos reunidos sob arcos; no centro, Platão aponta para o alto e Aristóteles estende a mão para a terra."),
    "cap6": ("Heinrich Khunrath, Anfiteatro da Sabedoria Eterna, 1595: oratório e laboratório (gravura)", "Uma sala dividida: à esquerda, o oratório, onde se reza diante de uma tenda; à direita, o laboratório, com fornos e frascos; a mesa de música no meio."),
    "cap7": ("Albrecht Dürer, O Cavaleiro, a Morte e o Diabo, 1513 (gravura a buril)", "Um cavaleiro de armadura segue firme a cavalo, sem olhar para a Morte com a ampulheta nem para o Diabo que o acompanham."),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V2:  # texto 2.0 / 3.0 (v2/_build_v2.py, v3/_build_v3.py): pranchas P&B, títulos novos, sem imagens repetidas
    src = open(os.path.join(ROOT, MODE, f"eternos-mutaveis-{MODE}.html"), encoding="utf-8").read().replace('src="../', 'src="')
else:
    src = open(os.path.join(ROOT, "eternos-mutaveis.html"), encoding="utf-8").read()
caps = re.findall(r'<section class="cap" id="(cap\d)">(.*?)</section>', src, re.S)
assert len(caps) == 7, len(caps)

M = "assets/musica/"
TRACKS = {
    "abertura": dict(f=M + "00-satie-gymnopedie-1.mp3", t="Gymnopédie nº 1", a="Erik Satie",
                     why="Lenta e dolorosa, como a pergunta que abre o livro.", lic="Domínio público",
                     src="https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg"),
    "cap1": dict(f=M + "01-bach-air.mp3", t="Air (Suíte orquestral nº 3)", a="J. S. Bach",
                 why="A criação: graça e queda, a centelha que o homem recebe e esquece.", lic="Domínio público",
                 src="https://commons.wikimedia.org/wiki/File:Air_(Bach).ogg"),
    "cap2": dict(f=M + "02-satie-gnossienne-1.mp3", t="Gnossienne nº 1", a="Erik Satie",
                 why="O nome vem de gnose: a busca pelas tradições, sem compasso fixo.", lic="Domínio público",
                 src="https://commons.wikimedia.org/wiki/File:Satie_-_Gnossienne_1.ogg"),
    "cap3": dict(f=M + "03-grieg-montanha.mp3", t="Na gruta do rei da montanha", a="Edvard Grieg",
                 why="O mesmo tema repetido, cada vez mais rápido: o inferno cíclico.", lic="Domínio público (Musopen)",
                 src="https://commons.wikimedia.org/wiki/File:Musopen_-_In_the_Hall_Of_The_Mountain_King.ogg"),
    "cap4": dict(f=M + "04-bach-preludio-do-maior.mp3", t="Prelúdio em Dó maior, BWV 846", a="J. S. Bach · Kimiko Ishizaka",
                 why="Um único padrão que se desdobra com clareza: o conhecimento que liberta.", lic="CC0",
                 src="https://commons.wikimedia.org/wiki/File:Kimiko_Ishizaka_-_Bach_-_Well-Tempered_Clavier,_Book_1_-_01_Prelude_No._1_in_C_major,_BWV_846.ogg"),
    "cap5": dict(f=M + "05-chopin-preludio-mi-menor.mp3", t="Prelúdio op. 28 nº 4 em mi menor", a="F. Chopin · Ivan Ilić",
                 why="A melodia presa sobre acordes que descem: o erro que aprisiona o verbo.", lic="CC BY 3.0 · Ivan Ilić",
                 src="https://commons.wikimedia.org/wiki/File:Ivan_Ili%C4%87-Chopin_Prelude_Opus_28_n.4.ogg"),
    "cap6": dict(f=M + "06-debussy-clair-de-lune.mp3", t="Clair de lune", a="Claude Debussy",
                 why="Luz na escuridão: o alfabeto da dualidade.", lic="Domínio público",
                 src="https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg"),
    "cap7": dict(f=M + "07-bach-jesus-alegria.mp3", t="Jesus, alegria dos homens (BWV 147)", a="J. S. Bach",
                 why="De pé, com luz no peito: a superação adâmica.", lic="CC0",
                 src="https://commons.wikimedia.org/wiki/File:Bach,_BWV_147,_10._Jesus_bleibet_meine_Freude.ogg"),
}
TRACKS["fim"] = TRACKS["cap7"]

WHY = {  # por que cada música foi escolhida (fim do livro)
    "abertura": "Satie escreveu na partitura: lento e doloroso. Dois acordes se alternam sem pressa enquanto a melodia procura o seu caminho, sem chegar a lugar nenhum. É o estado de quem abre o livro com as perguntas e ainda não tem nenhuma resposta.",
    "cap1": "Uma linha longa que desce devagar sobre um baixo que caminha sem parar. Tem a serenidade do jardim e, ao mesmo tempo, o peso de algo que já começou a descer. Acompanha o instante antes da queda que a gravura de Dürer mostra: tudo ainda em paz, e o fruto já na mão.",
    "cap2": "O nome vem de gnose. Satie a escreveu sem barras de compasso e encheu a partitura de indicações estranhas ao pianista, como “pergunte” e “com conhecimento”. É música de quem procura sem mapa, atravessando tradições antigas, como Jerônimo à mesa traduzindo de uma língua para outra.",
    "cap3": "O mesmo tema curto se repete do começo ao fim, cada vez mais alto e mais rápido, até explodir. Nada muda além da velocidade. É a roda de Íxion: um giro que acelera sem sair do lugar, como o desejo e o tédio que se alternam no inferno cíclico.",
    "cap4": "Um único padrão de acordes partidos se desdobra compasso após compasso, e a certa altura o ouvido percebe a forma inteira de uma vez. É a sensação do insight: o que parecia uma sucessão de notas soltas se revela uma estrutura, como o mecanismo que o viajante de Flammarion vê do outro lado do céu.",
    "cap5": "A melodia quase não se move, presa a poucas notas, enquanto os acordes embaixo descem meio tom de cada vez. Há movimento, mas ele está trancado por baixo, como o verbo preso no objeto e o corpo preso na grade do desenhista de Dürer. Foi tocado no funeral do próprio Chopin.",
    "cap6": "Debussy tirou o título de um poema de Verlaine sobre almas mascaradas sob a luz da lua. A música vive do contraste entre claro e escuro, sem um tema que se fixe, e só existe enquanto passa. Acompanha a gnose: o alfabeto da dualidade, o chão de casas claras e escuras e a música no centro da sala de Khunrath.",
    "cap7": "Uma melodia corre sem parar em tercinas enquanto o coral, por cima, avança firme e devagar. São duas velocidades ao mesmo tempo: o mutável que flui e o eterno que sustenta. É o passo do cavaleiro de Dürer, que segue sem pressa enquanto tudo em volta se move.",
}


titles = []
PLATE_CREDITS = []
SECS = {}
body = []
for cid, html in caps:
    h1 = re.search(r"<h1>(.*?)</h1>", html, re.S).group(1)
    num, name = (h1.split(". ", 1) + [""])[:2] if ". " in h1 else ("", h1)
    titles.append((cid, num, name))
    tr = TRACKS[cid]
    rest = re.sub(r"<h1>.*?</h1>", "", html, count=1, flags=re.S)
    top = '<div class="dom"><span class="b"></span><span class="w"></span></div>'
    if V2:
        m = re.search(r'<figure>(<img src="assets/(?:gravuras|banners-gravura)/[^>]*>)(?:<figcaption>(.*?)</figcaption>)?</figure>', rest, re.S)
        rest = rest[:m.start()] + rest[m.end():]
        top = f'<figure class="plate">{m.group(1)}<figcaption>{m.group(2) or ""}</figcaption></figure>'
        PLATE_CREDITS.append(m.group(2) or "")
    k = [0]
    def _sid(m):
        k[0] += 1
        SECS.setdefault(cid, []).append((f"{cid}-s{k[0]}", re.sub(r"<[^>]+>", "", m.group(1))))
        return f'<h2 id="{cid}-s{k[0]}"><span class="sn">{cid[3:]}.{k[0]}</span>{m.group(1)}</h2>'
    rest = re.sub(r"<h2>(.*?)</h2>", _sid, rest, flags=re.S)
    body.append(f'''<section class="cap" id="{cid}" data-track="{cid}">
<header class="opener">{top}
<p class="n">Capítulo {num}</p><h1>{name}</h1>
<p class="tr"><span class="note">♪</span> {tr["t"]} · {tr["a"]}</p><p class="why">{tr["why"]}</p></header>
<div class="txt">{rest}</div></section>''')

toc = "".join(f'<li><a href="#{c}"><span>{n}</span>{t}</a><ol class="ts">' + "".join(f'<li><a href="#{i}"><span class="sn">{i.split("-s")[0][3:]}.{i.split("-s")[1]}</span>{x}</a></li>' for i, x in SECS.get(c, [])) + "</ol></li>" for c, n, t in titles)
credits = "".join(f'<li><b>{TRACKS[k]["t"]}</b> · {TRACKS[k]["a"]} <span>({TRACKS[k]["lic"]})</span> — capítulo {k[3:] if k.startswith("cap") else "de abertura"} · <a href="{TRACKS[k]["src"]}" target="_blank" rel="noopener">fonte</a></li>'
                  for k in ["abertura"] + [c for c, _, _ in titles])
tracks_js = json.dumps({k: dict(f=v["f"], t=v["t"], a=v["a"]) for k, v in TRACKS.items()}, ensure_ascii=False)

CSS = r"""
:root{--paper:#F4F2EC;--ink:#0B0B0B;--mute:#6E6B64;--line:#D9D5CB;--bar:#0B0B0B;--bar-ink:#F4F2EC}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"EB Garamond",Georgia,serif;font-size:20px;line-height:1.62;-webkit-font-smoothing:antialiased}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
/* capa */
.cover{min-height:100vh;display:grid;place-items:center;background:#1a1a1a;padding:24px 16px 90px}
.cover .book{position:relative;width:min(420px,78vw);aspect-ratio:2/3;box-shadow:0 30px 80px rgba(0,0,0,.55);border-radius:2px 6px 6px 2px;overflow:hidden}
.cover img{width:100%;height:100%;display:block}
.cover .open{margin-top:28px;background:var(--paper);color:var(--ink);border:0;border-radius:99px;padding:14px 28px;font:600 18px "Cormorant Garamond",serif;letter-spacing:.06em;cursor:pointer;display:inline-flex;gap:10px;align-items:center}
.cover .open:hover{background:#fff}.cover .hint{color:#9a978f;font-size:14px;margin-top:12px;text-align:center}
.cover .stack{display:flex;flex-direction:column;align-items:center}
/* folha de rosto e sumário */
.front{max-width:720px;margin:0 auto;padding:18vh 24px 10vh;text-align:center}
.front h1{font:600 clamp(44px,8vw,80px)/1 "Cormorant SC","Cormorant Garamond",serif;letter-spacing:.12em;margin:0}
.front .sub{font-style:italic;color:var(--mute);margin:18px 0 0}
.front .by{font:500 18px "Cormorant SC",serif;letter-spacing:.3em;margin-top:40px}
.toc{max-width:560px;margin:0 auto;padding:6vh 24px 14vh}
.toc h2{font:600 30px "Cormorant SC",serif;letter-spacing:.15em;text-align:center;margin:0 0 28px}
.toc ol{list-style:none;padding:0;margin:0}.toc li{border-top:1px solid var(--line)}.toc li:last-child{border-bottom:1px solid var(--line)}
.toc a{display:flex;gap:18px;padding:14px 4px;color:inherit;text-decoration:none;font-size:22px}.toc a span{font:600 22px "Cormorant SC",serif;width:24px;color:var(--mute)}
.toc a:hover{background:#ECE9E1}
.toc .ts{list-style:none;padding:0 0 14px 42px;margin:0}.toc .ts li{border:0}.toc .ts a{font-size:17px;padding:3px 4px;color:var(--mute)}.toc .ts a:hover{color:var(--ink)}
/* capítulos */
.cap{border-top:1px solid var(--line)}
.opener{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10vh 24px;background:var(--ink);color:var(--paper)}
.opener .plate{margin:0 0 34px}.opener .plate img{display:block;max-height:60vh;max-width:min(900px,100%);width:auto;height:auto;margin:0 auto;box-shadow:0 0 0 1px #2a2a2a,0 24px 60px rgba(0,0,0,.6)}
.opener .plate figcaption{font-size:14px;color:#8F8B82;margin-top:12px;font-style:italic}
.opener:has(.plate){padding-top:7vh;padding-bottom:12vh}.opener:has(.plate) h1{margin-bottom:18px}
.opener .dom{display:flex;flex-direction:column;width:64px;height:128px;border:1px solid #4a4843;border-radius:8px;overflow:hidden;margin-bottom:34px}
.opener .dom span{flex:1;display:grid;place-items:center}.opener .dom .b{background:var(--ink)}.opener .dom .w{background:var(--paper)}
.opener .dom .b::after,.opener .dom .w::after{content:"";width:22px;height:22px;border-radius:50%}
.opener .dom .b::after{background:var(--paper)}.opener .dom .w::after{background:var(--ink)}
.opener .n{font:500 16px "Cormorant SC",serif;letter-spacing:.4em;color:#A9A59B;margin:0}
.opener h1{font:600 clamp(38px,6.5vw,68px)/1.08 "Cormorant Garamond",serif;margin:14px 0 28px;max-width:16ch}
.opener .tr{font-size:17px;margin:0;color:var(--paper)}.opener .tr .note{display:inline-block;margin-right:4px}
.opener .why{font-style:italic;color:#A9A59B;font-size:16px;margin:6px 0 0;max-width:46ch}
.txt{max-width:700px;margin:0 auto;padding:8vh 24px 12vh}
.sn{font-variant-numeric:tabular-nums;color:var(--mute);margin-right:.55em;font-weight:500}.txt h2 .sn{font-size:.8em}.tn-secs .sn{min-width:2.3em;margin-right:.3em;flex:none}.toc .ts .sn{min-width:2.4em}
.txt h2{font:600 30px/1.2 "Cormorant Garamond",serif;margin:2.2em 0 .6em}
.txt p{margin:0 0 1em;text-align:justify;hyphens:auto}
.txt blockquote{margin:1.6em 0;padding:0 0 0 1.2em;border-left:2px solid var(--ink);font-style:italic;color:#333}
.txt figure{margin:2em -40px;text-align:center}.txt img{max-width:100%;height:auto;max-height:70vh;filter:grayscale(.15)}
.txt figcaption{font-size:14px;color:var(--mute);margin-top:8px;line-height:1.4}
.txt hr{border:0;text-align:center;margin:2.4em 0}.txt hr::after{content:"● ○";letter-spacing:.6em;color:var(--mute);font-size:14px}
.txt pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;background:#ECE9E1;padding:12px 14px;border-radius:6px}.txt code{overflow-wrap:anywhere;font-size:.85em}
.txt p.credit{font-size:14px;color:var(--mute);text-align:center;font-style:italic}
@media (max-width:760px){.txt figure{margin:2em 0}.txt p{text-align:left}}
/* fim */
.back{background:#1a1a1a;padding:12vh 16px 18vh;display:grid;place-items:center}
.back .book{width:min(420px,78vw);aspect-ratio:2/3;box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden;border-radius:6px 2px 2px 6px}.back img{width:100%;height:100%;display:block}
.credits{max-width:700px;margin:0 auto;padding:10vh 24px 16vh;font-size:16px}
.why-it{margin:0 0 26px}.why-it h3{font:600 22px "Cormorant Garamond",serif;margin:0}.why-it .wt{font-style:italic;color:var(--mute);margin:2px 0 6px}.why-it p{font-size:18px;margin:0}
.credits h2{font:600 26px "Cormorant SC",serif;letter-spacing:.12em}.credits li{margin-bottom:8px}.credits li span{color:var(--mute)}.credits a{color:inherit}
/* player */
.player{position:fixed;left:50%;bottom:16px;transform:translate(-50%,140%);width:min(760px,calc(100% - 32px));background:var(--bar);color:var(--bar-ink);border-radius:16px;padding:10px 12px 10px 10px;display:flex;gap:12px;align-items:center;box-shadow:0 14px 40px rgba(0,0,0,.35);transition:transform .5s cubic-bezier(.2,.8,.2,1);z-index:10;font-family:"Cormorant Garamond",serif}
.player.on{transform:translate(-50%,0)}
.player button{background:none;border:0;color:inherit;cursor:pointer;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none}
.player button:hover{background:#222}.player .pp{background:var(--paper);color:var(--ink)}.player .pp:hover{background:#fff}
.player svg{width:20px;height:20px}
.player .meta{flex:1;min-width:0;line-height:1.25}.player .meta b{display:block;font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.player .meta span{font-size:14px;color:#A9A59B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.player input[type=range]{width:96px;accent-color:#F4F2EC}
.player .prog{position:absolute;left:14px;right:14px;top:0;height:2px;background:#2a2a2a;border-radius:2px;overflow:hidden}.player .prog i{display:block;height:100%;width:0;background:var(--paper)}
@media (max-width:560px){.player input[type=range]{display:none}}
.drawer{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;z-index:20}.drawer.on{display:block}
.drawer .dpanel{position:absolute;right:0;top:0;bottom:0;width:min(360px,88vw);background:var(--paper);padding:28px 22px;overflow:auto}
.drawer h3{font:600 22px "Cormorant SC",serif;letter-spacing:.15em;margin:0 0 16px}
.drawer a small{display:block;color:var(--mute);font-size:14px}
/* sumário */
.toc-nav{font-family:"Cormorant Garamond",serif}.toc-nav ol{list-style:none;margin:0;padding:0}
.toc-nav .tn-top{display:block;font:600 15px "Cormorant SC",serif;letter-spacing:.22em;color:var(--mute);text-decoration:none;margin:0 0 14px;text-transform:uppercase}
.tn-cap>a{display:flex;gap:10px;align-items:baseline;padding:9px 6px;border-top:1px solid var(--line);color:var(--mute);text-decoration:none;font-size:19px;font-weight:600;line-height:1.2}
.tn-cap>a span{font:600 16px "Cormorant SC",serif;width:14px;flex:none}.tn-cap>a:hover,.tn-cap.cur>a{color:var(--ink)}
.tn-secs{display:block;padding:0 0 10px 22px}
.tn-secs a{display:flex;padding:4px 8px;font-size:16px;line-height:1.3;color:var(--mute);text-decoration:none;border-left:2px solid var(--line)}
.tn-secs a:hover{color:var(--ink)}.tn-secs a.cur{color:var(--ink);border-left-color:var(--ink);font-weight:600}
.side{display:none;position:fixed;top:0;right:0;bottom:0;width:300px;overflow:auto;padding:30px 22px 130px;background:var(--paper);border-left:1px solid var(--line);z-index:5;transform:translateX(100%);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
@media (min-width:1180px){.side{display:block}body.reading{padding-right:300px}body.reading .side{transform:none}body.reading .player{left:calc(50% - 150px)}#menu{display:none}}
"""

JS = r"""
const TRACKS = __TRACKS__;
const FADE = 2400;
const $ = (s) => document.querySelector(s);
const A = [new Audio(), new Audio()]; A.forEach((a) => { a.loop = true; a.preload = 'none'; a.volume = 0; });
let cur = 0, key = null, playing = false, vol = 0.7, raf = null;
try { const v = parseFloat(localStorage.getItem('em-vol')); if (!isNaN(v)) vol = v; } catch (e) {}
$('#vol').value = vol;

function ramp(a, to, ms, done) {
  const from = a.volume, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(step); else done && done(); };
  requestAnimationFrame(step);
}
function setTrack(k) {
  if (!TRACKS[k] || k === key) return;
  const same = key && TRACKS[key].f === TRACKS[k].f; key = k; ui();
  if (same || !playing) { if (!playing) { const n = A[cur]; n.src = TRACKS[k].f; } return; }
  const old = A[cur]; cur ^= 1; const n = A[cur];
  n.src = TRACKS[k].f; n.currentTime = 0; n.volume = 0;
  n.play().then(() => ramp(n, vol, FADE)).catch(() => {});
  ramp(old, 0, FADE, () => old.pause());
}
function play() {
  playing = true; const a = A[cur]; if (!a.src && key) a.src = TRACKS[key].f;
  a.play().then(() => ramp(a, vol, 900)).catch(() => {}); ui();
}
function pause() { playing = false; const a = A[cur]; ramp(a, 0, 500, () => a.pause()); ui(); }
function ui() {
  if (!key) return; const t = TRACKS[key];
  $('#tt').textContent = t.t; $('#ta').textContent = t.a + ' · ' + (LABEL[key] || '');
  $('#pp').innerHTML = playing ? ICON.pause : ICON.play; $('#pp').setAttribute('aria-label', playing ? 'Pausar' : 'Tocar');
}
const ICON = { play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>', pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>' };
const LABEL = __LABELS__;

$('#pp').onclick = () => (playing ? pause() : play());
$('#vol').oninput = (e) => { vol = +e.target.value; A[cur].volume = playing ? vol : 0; try { localStorage.setItem('em-vol', vol); } catch (er) {} };
$('#menu').onclick = () => $('.drawer').classList.add('on');
$('.drawer').onclick = (e) => { if (e.target === e.currentTarget || e.target.closest('a')) $('.drawer').classList.remove('on'); };
$('#abrir').onclick = () => { $('.player').classList.add('on'); document.body.classList.add('reading'); setTrack('abertura'); play(); document.getElementById('rosto').scrollIntoView(); };
document.addEventListener('keydown', (e) => { if (e.key === 'm' || e.key === 'M') { playing ? pause() : play(); } if (e.key === 'Escape') $('.drawer').classList.remove('on'); });

// a música segue a seção que ocupa o meio da tela
const io = new IntersectionObserver((es) => {
  es.forEach((en) => { if (en.isIntersecting) { if (!en.target.classList.contains('cover')) { $('.player').classList.add('on'); document.body.classList.add('reading'); } setTrack(en.target.dataset.track); } });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-track]').forEach((s) => io.observe(s));
// onde estou: a última seção cujo título já passou do terço de cima da tela
const marks = [...document.querySelectorAll('section.cap, section.cap h2[id], #fim')];
let lastMark = null;
function spy() {
  let cur = null;
  for (const m of marks) { if (m.getBoundingClientRect().top <= innerHeight * .3) cur = m; else break; }
  if (cur === lastMark) return; lastMark = cur;
  const cap = cur ? (cur.closest('section.cap') || {}).id : null, sec = cur && cur.tagName === 'H2' ? cur.id : null;
  document.querySelectorAll('.tn-cap').forEach((li) => { const on = li.dataset.cap === cap; li.classList.toggle('cur', on); li.classList.toggle('open', on); });
  document.querySelectorAll('.tn-secs a').forEach((a) => a.classList.toggle('cur', a.getAttribute('href') === '#' + sec));
  const side = $('.side'), act = side.querySelector('.tn-secs a.cur') || side.querySelector('.tn-cap.cur > a');
  if (act) { const r = act.getBoundingClientRect(), sr = side.getBoundingClientRect(); if (r.top < sr.top + 60 || r.bottom > sr.bottom - 60) side.scrollTop += r.top - sr.top - sr.height / 3; }
}
let spyRaf = 0; addEventListener('scroll', () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; spy(); }); }, { passive: true }); spy();
// progresso de leitura
addEventListener('scroll', () => { const h = document.documentElement; $('.prog i').style.width = (100 * h.scrollTop / (h.scrollHeight - h.clientHeight)) + '%'; }, { passive: true });
"""

labels = {"abertura": "Abertura", "fim": "Fim"}
labels.update({c: f"Cap. {n} · {t}" for c, n, t in titles})
js = JS.replace("__TRACKS__", tracks_js).replace("__LABELS__", json.dumps(labels, ensure_ascii=False))
drawer = '<a href="#rosto" data-k="abertura">Abertura<small>' + TRACKS["abertura"]["t"] + "</small></a>" + "".join(
    f'<a href="#{c}">{n}. {t}<small>♪ {TRACKS[c]["t"]} · {TRACKS[c]["a"]}</small></a>' for c, n, t in titles) + '<a href="#fim">Fim · créditos</a>'

nav = ('<nav class="toc-nav" aria-label="Sumário"><a class="tn-top" href="#rosto">Eternos Mutáveis</a><ol>'
       + "".join(f'<li class="tn-cap" data-cap="{c}"><a href="#{c}"><span>{n}</span>{t}</a><ol class="tn-secs">'
                 + "".join(f'<li><a href="#{i}"><span class="sn">{i.split("-s")[0][3:]}.{i.split("-s")[1]}</span>{x}</a></li>' for i, x in SECS.get(c, [])) + "</ol></li>" for c, n, t in titles)
       + '<li class="tn-cap"><a href="#fim"><span>·</span>Fim e créditos</a></li></ol></nav>')
labs = {"abertura": "Abertura"}; labs.update({c: f"{n}. {t}" for c, n, t in titles})
why = "".join(f'<div class="why-it"><h3>{labs[k]}</h3><p class="wt">{TRACKS[k]["t"]} · {TRACKS[k]["a"]}</p><p>{WHY[k]}</p></div>' for k in ["abertura"] + [c for c, _, _ in titles])
plates = ("<h2>Pranchas</h2><ol>" + "".join(f"<li>{c} <span>(domínio público / CC0, Wikimedia Commons)</span></li>" for c in PLATE_CREDITS) + "</ol>") if MODE == "v2" else ""
html = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Eternos Mutáveis</title>
<meta name="description" content="Eternos Mutáveis, de Laércio Germano: o livro completo, com trilha sonora por capítulo.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Cormorant+SC:wght@500;600&family=EB+Garamond:ital@0;1&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<section class="cover" data-track="abertura"><div class="stack">
<div class="book"><img src="capa/v2/capa-d-frente.jpg" alt="Capa de Eternos Mutáveis, de Laércio Germano: peça de dominó em pé; metade de cima preta com bola branca e a palavra ETERNOS, metade de baixo branca com bola preta e a palavra MUTÁVEIS; no alto, A superação adâmica."></div>
<button class="open" id="abrir"><span aria-hidden="true">♪</span> Abrir o livro com música</button>
<p class="hint">A trilha muda a cada capítulo. Tecla M pausa ou toca.</p></div></section>
<section class="front" id="rosto" data-track="abertura"><h1>Eternos<br>Mutáveis</h1><p class="sub">A superação adâmica</p><p class="by">Laércio Germano</p></section>
<section class="toc" data-track="abertura"><h2>Sumário</h2><ol>{toc}</ol></section>
{"".join(body)}
<section class="back" id="fim" data-track="fim"><div class="book"><img src="capa/v2/capa-d-verso.jpg" alt="Contracapa: metade de cima branca com bola preta e o texto Da era adâmica à superação; metade de baixo preta com bola branca."></div></section>
<section class="credits" data-track="fim"><h2>Trilha sonora</h2><ol>{credits}</ol>
{plates}<p>Gravações do Wikimedia Commons em domínio público, CC0 ou CC BY (com o crédito do intérprete). Arquivos em <code>assets/musica/</code>.</p></section>
<div class="player" role="region" aria-label="Trilha sonora"><div class="prog"><i></i></div>
<button class="pp" id="pp" aria-label="Tocar"></button>
<div class="meta"><b id="tt">—</b><span id="ta"></span></div>
<input id="vol" type="range" min="0" max="1" step="0.05" aria-label="Volume">
<button id="menu" aria-label="Capítulos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>
<aside class="side">{nav}</aside>
<div class="drawer"><div class="dpanel"><h3>Sumário</h3>{nav}</div></div>
<script>{js}</script></body></html>"""
open(os.path.join(ROOT, f"livro-{MODE}.html" if MODE else "livro.html"), "w", encoding="utf-8").write(html)
print("ok", len(html) // 1024, "KB")
