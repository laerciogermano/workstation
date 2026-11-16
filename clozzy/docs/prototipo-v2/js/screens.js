/* Clozzy · protótipo v2 — telas (C-01 … C-58). Cada render() devolve o miolo do aparelho. */
'use strict';

const C = (k) => CREATORS[k];
const sel = () => C(S.sel.c);
const subbed = (k) => S.subs.includes(k);
const tgl = (on, a) => `<button class="sw${on ? ' on' : ''}" role="switch" aria-checked="${on}" ${act(a)}><i></i></button>`;
const field = (label, val, attrs = '') => `<label class="field"><span>${label}</span><input value="${esc(val)}" ${attrs}></label>`;
const rowLink = (i, t, attrs = '', right = ico('chev', 'chv')) => `<button class="lrow" ${attrs}>${ico(i)}<span>${t}</span>${right}</button>`;
const postv1 = () => '<span class="pv1">pós-v1</span>';
const dock = (inner) => `<div class="dock">${inner}</div>`;
const steps = (n, of) => `<div class="stepper" aria-label="passo ${n} de ${of}">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;

const SCREENS = {
  /* ============ 01 chegada e conta ============ */
  'C-01': { photo: true, render: () => `
    <div class="body nopad land">
      <div class="land-hero">${ph('amigas-selfie', 'cover')}<div class="scrim"></div>
        <div class="land-top">${logo('lg-photo')}<button class="ghost-s" ${go('C-04')}>Entrar</button></div>
        <div class="land-copy">
          <h1 class="d-xxl">o que não<br>cabe no feed.</h1>
          <p>Assine o close de quem você acompanha ou compre um pack. Pagou no Pix, abriu na hora.</p>
        </div>
      </div>
      <div class="land-ctas">${btn('Ver criadoras', go('C-02'), 'w')}${btn('Quero vender', go('C-40'), 'o')}</div>
      <ol class="how">
        <li><b>1</b><div><h3>Escolha quem você quer ver de perto</h3><p>Perfil com prévia liberada e preço na cara.</p></div></li>
        <li><b>2</b><div><h3>Entre no close ou leve um pack</h3><p>Assinatura mensal, pack fechado ou um vídeo só.</p></div></li>
        <li><b>3</b><div><h3>Fica tudo na sua biblioteca</h3><p>Sem link perdido na DM. Abriu, assistiu, voltou depois.</p></div></li>
      </ol>
      <div class="land-strip">${['lara', 'bia', 'ju', 'duda'].map((k) => `<figure>${ph(C(k).foto)}<figcaption>${C(k).nome.split(' ')[0]}</figcaption></figure>`).join('')}</div>
      <p class="land-legal"><button ${go('C-36')}>Termos</button> · <button ${go('C-36')}>Privacidade</button> · <button ${go('C-36')}>18+</button> · <button ${go('C-36')}>Ajuda</button></p>
    </div>` },

  'C-02': { render: () => `
    <div class="body center gate">
      <div class="gate-mark">${mark()}</div>
      <h1 class="d-xl">Você tem<br>18 anos ou mais?</h1>
      <p class="muted">O Clozzy tem conteúdo para maiores de idade. A gente pergunta uma vez por aparelho.</p>
    </div>
    ${dock(btn('Tenho 18 ou mais', act('age:yes')) + btn('Ainda não', act('age:no'), 't'))}` },

  'C-03': { render: () => `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), `<button class="tlink" ${go('C-04')}>Entrar</button>`)}
    <div class="body">
      <h1 class="d-xl">Crie sua conta</h1>
      <p class="muted lead">Uma conta só. Se um dia quiser vender, é só ativar.</p>
      ${field('E-mail', 'rafa.carvalho@email.com', 'type="email"')}
      <label class="field"><span>Senha</span><div class="inp-w"><input type="password" value="clozzy2026"><button class="ib sm" aria-label="Mostrar senha">${ico('eye')}</button></div><small class="hint ok">${ico('check')} 8 caracteres ou mais</small></label>
      ${field('Data de nascimento', '14/03/2003', 'inputmode="numeric"')}
      <button class="checkline" ${act('toggle:terms')}><span class="cb${S.terms ? ' on' : ''}">${ico('check')}</span><span>Li e aceito os <u>Termos</u> e a <u>Privacidade</u>, e confirmo que tenho 18 anos ou mais.</span></button>
    </div>
    ${dock(btn('Criar conta', act('signup') + (S.terms ? '' : ' aria-disabled="true"')))}` },

  'C-04': { render: () => `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), `<button class="tlink" ${go('C-03')}>Criar conta</button>`)}
    <div class="body">
      <h1 class="d-xl">Que bom<br>te ver de novo</h1>
      ${S.pending ? `<p class="note">${ico('lock')}Entre para continuar a compra do <b>${esc(offerOf(S.sel.o).nome)}</b>.</p>` : ''}
      ${field('E-mail', 'rafa.carvalho@email.com', 'type="email"')}
      <label class="field"><span>Senha</span><div class="inp-w"><input type="password" value="clozzy2026"><button class="ib sm" aria-label="Mostrar senha">${ico('eye')}</button></div></label>
      <button class="tlink" ${go('C-05')}>Esqueci a senha</button>
    </div>
    ${dock(btn('Entrar', act('login')))}` },

  'C-05': { render: () => `
    ${topbar()}
    <div class="body">
      <h1 class="d-xl">Esqueceu?<br>Acontece.</h1>
      <p class="muted lead">Mande o e-mail da conta. Se ele existir aqui, chega um link que vale 30 minutos.</p>
      ${field('E-mail', 'rafa.carvalho@email.com', 'type="email"')}
      ${S.sent ? `<p class="note ok">${ico('mail')}Pronto. Se esse e-mail tem conta, o link já está na caixa de entrada.</p>` : ''}
    </div>
    ${dock(S.sent ? btn('Voltar para entrar', go('C-04')) : btn('Enviar link', act('sent')))}` },

  'C-06': { render: () => { const d = S.code.padEnd(6, ' ').split(''); return `
    ${topbar()}
    <div class="body">
      <h1 class="d-xl">Confere seu<br>e-mail</h1>
      <p class="muted lead">Mandamos 6 números para <b>rafa.carvalho@email.com</b>.</p>
      <div class="otp">${d.map((x, i) => `<span class="${x.trim() ? 'f' : ''}${i === S.code.length ? ' cur' : ''}">${x.trim()}</span>`).join('')}</div>
      <p class="small muted">Reenviar em <span class="tnum">0:42</span></p>
    </div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => k === '' ? '<span></span>' : `<button ${act('key:' + k)}>${k}</button>`).join('')}</div>`; } },

  'C-07': { render: () => `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), `<button class="tlink" ${go('C-10')}>Pular</button>`)}
    <div class="body">
      <h1 class="d-xl">Do que<br>você curte?</h1>
      <p class="muted lead">Só para arrumar o Explorar. Muda quando quiser.</p>
      <div class="tags">${CATS.slice(1).concat(['Bastidor', 'Tutorial', 'Vlog', 'Comédia', 'Fitness']).map((c) => `<button class="tagb${S.likes.includes(c) ? ' on' : ''}" ${act('like:' + c)}>${S.likes.includes(c) ? ico('check') : ''}${c}</button>`).join('')}</div>
    </div>
    ${dock(btn(S.likes.length ? `Continuar com ${S.likes.length}` : 'Continuar', go('C-10')))}` },

  /* ============ 02 descobrir ============ */
  'C-10': { render: () => { const mine = Object.keys(CREATORS).filter(subbed); const others = Object.keys(CREATORS).filter((k) => !subbed(k)); return `
    <header class="top home-top"><div class="tl">${logo('lg-sm')}</div><div class="tr">${ibtn('search', go('C-13'), 'Buscar')}<button class="ib" ${go('C-33')} aria-label="Conversas">${ico('chat')}<i class="dot"></i></button></div></header>
    <div class="body nopad">
      <div class="stories hs">${mine.map((k, i) => `<button class="sty" ${go('C-11', { c: k })}>${ring(k, 'lg', i < 2)}<span>${C(k).nome.split(' ')[0]}</span></button>`).join('')}${others.slice(0, 3).map((k) => `<button class="sty" ${go('C-20', { c: k })}>${ring(k, 'lg', false)}<span>${C(k).nome.split(' ')[0]}</span></button>`).join('')}</div>
      <section class="sec"><div class="sh"><h2>Novo no seu close</h2>${postv1()}</div>
        ${[['lara', 'ringlight-rosa', 'bastidor de hoje', '12 fotos', 'há 2 h'], ['bia', 'danca-tripe', 'coreô de sexta, antes de todo mundo', 'vídeo · 0:48', 'há 5 h']].map(([k, f, t, m, q]) => `
        <article class="drop" ${go('C-25', { c: k })}>
          <div class="drop-ph">${ph(f)}<span class="drop-m">${m}</span></div>
          <div class="drop-b">${av(k, 'sm')}<div><b>${C(k).nome}</b> ${selo()}<p>${t}</p></div><span class="q">${q}</span></div>
        </article>`).join('')}
      </section>
      <section class="sec"><div class="sh"><h2>Pra conhecer</h2><button class="tlink" ${go('C-12')}>Ver tudo</button></div>
        <div class="hs cards-sm">${others.map((k) => `<button class="pcard" ${go('C-20', { c: k })}>${ph(C(k).foto)}<span class="pc-b"><b>${C(k).nome.split(' ')[0]}</b><small>${C(k).cat} · ${brl(C(k).preco)}</small></span></button>`).join('')}</div>
      </section>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-10')}`; } },

  'C-11': { photo: true, render: () => { const k = S.sel.c || 'lara', c = C(k), locked = !subbed(k); return `
    <div class="story${locked ? ' locked' : ''}">
      ${ph(k === 'bia' ? 'danca-tripe' : 'ringlight-rosa', 'cover')}
      <div class="st-bars"><i class="done"></i><i class="play"></i><i></i><i></i></div>
      <header class="st-top">${av(k, 'sm')}<b>${c.nome}</b>${selo()}<span class="q">2 h</span><span class="sp"></span>${ibtn('x', go('back'), 'Fechar')}</header>
      <button class="st-prev" ${go('back')} aria-label="Anterior"></button><button class="st-next" ${act('story:next')} aria-label="Próximo"></button>
      ${locked ? `<div class="st-lock">${lockStar()}<h3>Esse story é do close</h3><p>Quem tá no close da ${c.nome.split(' ')[0]} vê tudo, sem borrão.</p>${btn(`Entrar no close · ${brl(c.preco)}/mês`, go('C-22', { c: k, o: 'close' }), 'w')}</div>`
        : `<p class="st-cap">bastidor de hoje: 3 takes pra acertar o glow</p><footer class="st-foot"><div class="st-reply">Responder… ${postv1()}</div><button class="ib like${S.liked ? ' on' : ''}" ${act('like-story')} aria-label="Curtir">${ico('heart')}</button></footer>`}
    </div>`; } },

  'C-12': { render: () => { const list = Object.keys(CREATORS).filter((k) => S.cat === 'Tudo' || C(k).cat === S.cat); return `
    <header class="top"><b class="d-lg">Explorar</b><div class="tr"></div></header>
    <div class="body nopad">
      <button class="search" ${go('C-13')}>${ico('search')}<span>Buscar nome ou @</span></button>
      <div class="hs chips">${CATS.map((c) => `<button class="chip${S.cat === c ? ' on' : ''}" ${act('cat:' + c)}>${c}</button>`).join('')}</div>
      <div class="grid2">${list.map((k, i) => `<button class="gcard${i % 3 === 0 ? ' tall' : ''}" ${go('C-20', { c: k })}>${ph(C(k).foto)}<span class="gc-b"><b>${C(k).nome}${C(k).verif ? verif() : ''}</b><small>${C(k).cat} · ${kfmt(C(k).close)} no close</small><em>a partir de ${brl(C(k).preco)}</em></span></button>`).join('')}</div>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-12')}`; } },

  'C-13': { render: () => { const q = S.q.toLowerCase(); const res = Object.keys(CREATORS).filter((k) => !q || (C(k).nome + C(k).nick).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes(q)); return `
    <header class="top srch-top"><div class="search on">${ico('search')}<input value="${esc(S.q)}" placeholder="Buscar nome ou @" aria-label="Buscar" data-model="q" autocomplete="off"></div><button class="tlink" ${go('back')}>Cancelar</button></header>
    <div class="body">
      ${q ? '' : `<p class="lbl">Recentes</p><div class="tags">${['lara', 'bia', 'ju mode'].map((r) => `<button class="tagb" ${act('q:' + r)}>${ico('clock')}${r}</button>`).join('')}</div>`}
      <p class="lbl">${q ? `${res.length} ${res.length === 1 ? 'perfil' : 'perfis'}` : 'Perfis'}</p>
      ${res.map((k) => `<button class="row" ${go('C-20', { c: k })}>${av(k, 'md')}<span class="rm"><b>${C(k).nome}${C(k).verif ? verif() : ''}</b><small>@${C(k).nick} · ${C(k).cat}</small></span><span class="rr small muted">${brl(C(k).preco)}</span></button>`).join('') || '<p class="muted">Ninguém com esse nome por aqui.</p>'}
    </div>` } },

  /* ============ 03 vitrine e compra ============ */
  'C-20': { render: () => { const k = S.sel.c || 'lara', c = C(k), inn = subbed(k); const packs = OFFERS.filter((o) => o.tipo === 'pack' && o.ativa), itens = OFFERS.filter((o) => o.tipo === 'item' && o.ativa); return `
    <div class="body nopad">
      <div class="prof-hero">${ph(c.capa, 'cover')}<div class="scrim"></div>
        <div class="prof-bar">${ibtn('back', go('back'), 'Voltar')}<span class="sp"></span>${ibtn('share', act('toast:Link do perfil copiado'), 'Compartilhar')}${ibtn('more', go('C-37'), 'Mais')}</div>
        <div class="prof-id">${ring(k, 'xl', inn)}<h1 class="d-xl">${c.nome}${c.verif ? verif() : ''}</h1><p>@${c.nick} · ${c.cat}</p></div>
      </div>
      <div class="pad">
        <div class="nums"><div><b class="tnum">${kfmt(c.close)}</b><span>no close</span></div><div><b class="tnum">${c.drops}</b><span>drops</span></div><div><b>${c.redes.split(' no ')[0]}</b><span>no ${c.redes.split(' no ')[1]}</span></div></div>
        <p class="bio">${c.bio}</p>
        ${inn ? `<button class="inclose" ${go('C-31', { c: k })}>${star()}<span><b>Você está no close</b><small>renova 12 dez · ver passe</small></span>${ico('chev')}</button>`
          : `<button class="btn btn-p big" ${go('C-22', { c: k, o: 'close' })}><span>Entrar no close</span><span class="tnum">${brl(c.preco)}/mês</span></button>
             <p class="small muted center">Todos os drops do mês, stories e bastidor. Cancele quando quiser.</p>`}
      </div>
      <section class="sec"><div class="sh"><h2>Packs</h2><span class="small muted">${packs.length}</span></div>
        <div class="hs packs">${packs.map((o) => `<button class="pack" ${go('C-21', { c: k, o: o.id })}><div>${ph(o.capa)}<span class="cnt">${o.itens} itens</span></div><b>${o.nome}</b><span class="tnum">${S.bought.includes(o.id) ? '<em class="have">' + ico('check') + 'comprado</em>' : brl(o.preco)}</span></button>`).join('')}</div>
      </section>
      <section class="sec"><div class="sh"><h2>Avulsos</h2></div>
        ${itens.map((o) => `<button class="row" ${go('C-22', { c: k, o: o.id })}><span class="thumb">${ph(o.capa)}${ico('play', 'pl')}</span><span class="rm"><b>${o.nome}</b><small>${o.inclui[0]}</small></span><span class="price tnum">${brl(o.preco)}</span></button>`).join('')}
      </section>
      <section class="sec"><div class="sh"><h2>Prévia</h2>${sticker('só pro close')}</div>
        <div class="mgrid">${MEDIA.map((m) => { const open = m.free || inn; return `<button class="mcell${open ? '' : ' lk'}" ${open ? go('C-25', { c: k }) : go('C-22', { c: k, o: 'close' })}>${ph(m.f)}${m.v ? `<span class="dur">${ico('play')}${m.dur}</span>` : ''}${open ? '' : lockStar()}</button>`; }).join('')}</div>
      </section>
      <p class="center small"><button class="tlink muted" ${go('C-37')}>${ico('flag')} Denunciar perfil</button></p>
      <div class="dock-space"></div>
    </div>` } },

  'C-21': { render: () => { const o = OFFERS.find((x) => x.id === S.sel.o && x.tipo === 'pack') || OFFERS[1], k = S.sel.c || 'lara', has = S.bought.includes(o.id); return `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), ibtn('share', act('toast:Link do pack copiado'), 'Compartilhar'))}
    <div class="body">
      <div class="pk-cover">${ph(o.capa)}<span class="cnt">${o.itens} itens</span></div>
      <p class="by">${av(k, 'xs')} ${C(k).nome}</p>
      <h1 class="d-xl">${o.nome}</h1>
      <p class="price-xl tnum">${brl(o.preco)} <small>pagamento único</small></p>
      <ul class="incl">${o.inclui.map((x) => `<li>${ico('check')}${x}</li>`).join('')}<li>${ico('check')}fica na sua biblioteca, sem prazo</li></ul>
      <p class="lbl">Prévia liberada</p>
      <div class="pk-prev">${['make-ringlight', 'make-sorriso', 'make-paleta', 'make-mesa'].map((f, i) => `<span class="${i > 1 && !has ? 'lk' : ''}">${ph(f)}${i > 1 && !has ? lockStar() : ''}</span>`).join('')}</div>
      <div class="dock-space"></div>
    </div>
    ${dock(has ? btn('Abrir na biblioteca', go('C-25', { c: k })) : btn(`Comprar pack · ${brl(o.preco)}`, go('C-22', { c: k, o: o.id })))}` } },

  'C-22': { render: () => { const k = S.sel.c || 'lara', o = offerOf(S.sel.o), c = C(k), sub = o.tipo === 'assinatura', preco = sub ? c.preco : o.preco, nome = sub ? `Close da ${c.nome.split(' ')[0]}` : o.nome; return `
    <div class="behind">${ph(c.capa, 'cover')}</div>
    <div class="sheet-s">
      <i class="grab"></i>
      <div class="sum-h">${av(k, 'md')}<div><small>${sub ? 'Assinatura mensal' : o.tipo === 'pack' ? 'Pack' : 'Item avulso'} · ${c.nome}</small><h2>${nome}</h2></div>${ibtn('x', go('back'), 'Fechar')}</div>
      <dl class="sum">
        <div><dt>${sub ? 'Por mês' : 'Valor'}</dt><dd class="tnum">${brl(preco)}</dd></div>
        <div><dt>${sub ? 'Renova' : 'Acesso'}</dt><dd>${sub ? 'todo dia 16 · cancele quando quiser' : 'para sempre na biblioteca'}</dd></div>
        <div><dt>Pagamento</dt><dd class="pixm">${ico('pix')} Pix</dd></div>
      </dl>
      ${sub ? `<ul class="incl sm">${o.inclui.map((x) => `<li>${ico('check')}${x}</li>`).join('')}</ul>` : ''}
      ${btn(`Pagar ${brl(preco)} no Pix`, act('checkout'))}
      <p class="small muted center">${ico('shield', 'ii')} Cobrança única por ciclo. Se você já tem esse acesso, a gente não cobra de novo.</p>
    </div>` } },

  'C-23': { render: () => { const k = S.sel.c || 'lara', o = offerOf(S.sel.o), preco = o.tipo === 'assinatura' ? C(k).preco : o.preco, mm = Math.floor(S.pixSec / 60), ss = String(S.pixSec % 60).padStart(2, '0'); return `
    ${topbar('Pix', ibtn('x', go('C-20', { c: k }), 'Cancelar'))}
    <div class="body">
      <p class="muted center">${o.tipo === 'assinatura' ? `Close da ${C(k).nome.split(' ')[0]}` : esc(o.nome)}</p>
      <p class="pix-amt tnum center">${brl(preco)}</p>
      <div class="pix-st ${S.checking ? 'chk' : ''}"><i></i>${S.checking ? 'Conferindo com o banco…' : `Aguardando pagamento · <span class="tnum" data-timer>${mm}:${ss}</span>`}</div>
      <div class="qrbox">${qr(11)}<span class="qr-mark">${star()}</span></div>
      <button class="copyrow" ${act('copy')}><span class="tnum">00020126580014br.gov.bcb.pix0136a1f4…</span><b>${ico('copy')}${S.copied ? 'Copiado' : 'Copiar'}</b></button>
      <ol class="pix-how"><li>Abra o app do seu banco e escolha Pix</li><li>Leia o QR ou cole o código</li><li>Volte aqui: a gente libera na hora</li></ol>
    </div>
    ${dock(btn(S.checking ? '<span class="spin"></span>' : 'Já paguei', act('paid')))}` } },

  'C-24': { moment: true, render: () => { const k = S.sel.c || 'lara', o = offerOf(S.sel.o), sub = o.tipo === 'assinatura'; return `
    <div class="body center ok-m">
      <div class="ok-mark">${mark()}</div>
      <h1 class="d-xxl">Liberado.</h1>
      <p class="lead">${sub ? `Você entrou no close da ${C(k).nome.split(' ')[0]}.` : `O ${esc(o.nome)} é seu.`}<br>Fica tudo na sua biblioteca.</p>
      <div class="ok-rcpt"><span>${av(k, 'sm')}</span><div><b>${sub ? `Close da ${C(k).nome.split(' ')[0]}` : esc(o.nome)}</b><small>Pix confirmado · recibo no seu e-mail</small></div></div>
    </div>
    ${dock(btn('Ver o conteúdo', go('C-25', { c: k }), 'w') + btn('Ir para a biblioteca', go('C-30'), 't'))}` } },

  'C-25': { photo: true, render: () => { const k = S.sel.c || 'lara'; return `
    <div class="viewer">
      <div class="vw-media">${ph('make-ringlight', 'cover')}<span class="wmark">@rafa.c · clozzy</span><button class="vw-play" ${act('toast:Tocando · só streaming, sem download')} aria-label="Tocar">${ico('play')}</button></div>
      <header class="vw-top">${ibtn('back', go('back'), 'Voltar')}<div><b>Glow 01 · preparação</b><small>${C(k).nome} · 1 de 20</small></div>${ibtn('sound', '', 'Som')}</header>
      <div class="vw-scrub"><span class="tnum">0:14</span><div class="bar"><i style="width:31%"></i></div><span class="tnum">0:42</span></div>
      <div class="vw-next"><p>No pack</p><div class="hs">${['make-sorriso', 'make-paleta', 'make-mesa', 'selfie-perto', 'ringlight-rosa'].map((f, i) => `<button class="vt">${ph(f)}<span>${String(i + 2).padStart(2, '0')}</span></button>`).join('')}</div>
        <p class="vw-note">${ico('shield', 'ii')} Só no Clozzy, sem download. Marca d’água com o seu @.</p></div>
    </div>` } },

  'C-26': { render: () => `
    ${topbar()}
    <div class="body center gate">
      <div class="gate-ic">${ico('clock')}</div>
      <h1 class="d-xl">O código<br>expirou</h1>
      <p class="muted">Nada foi cobrado. Gere outro e pague em até 15 minutos. É a mesma compra, sem duplicar.</p>
    </div>
    ${dock(btn('Gerar novo Pix', act('newpix')) + btn('Voltar ao perfil', go('C-20'), 't'))}` },

  /* ============ 04 área do fã ============ */
  'C-30': { render: () => { const tab = S.libtab, items = S.libEmpty ? [] : S.lib.filter((x) => x.tipo === tab); const cnt = (t) => S.libEmpty ? 0 : S.lib.filter((x) => x.tipo === t).length; return `
    <header class="top"><b class="d-lg">Biblioteca</b><div class="tr">${ibtn('search', '', 'Buscar')}</div></header>
    <div class="body">
      <div class="seg" style="--i:${['assinatura', 'pack', 'item'].indexOf(tab)}"><i></i>${[['assinatura', 'Assinaturas'], ['pack', 'Packs'], ['item', 'Itens']].map(([t, l]) => `<button class="${tab === t ? 'on' : ''}" ${act('lib:' + t)}>${l} <span class="tnum">${cnt(t)}</span></button>`).join('')}</div>
      ${!items.length ? `<div class="empty"><div class="gate-mark sm">${mark()}</div><h3>Nada por aqui ainda</h3><p class="muted">Quando você assinar um close ou comprar um pack, ele aparece aqui.</p>${btn('Explorar criadoras', go('C-12'), 's')}</div>`
        : tab === 'assinatura' ? items.map((x) => `<div class="row${x.st === 'ativa' ? ' tap' : ''}" role="button" tabindex="0" ${x.st === 'ativa' ? go('C-31', { c: x.who }) : ''}>${ring(x.who, 'md', x.st === 'ativa')}<span class="rm"><b>${x.nome}</b><small>${x.info}</small></span>${x.st === 'ativa' ? `<span class="stt on">${ico('check')}ativa</span>` : `<span class="rr"><span class="stt">${x.st}</span><button class="mini-b" ${go('C-22', { c: x.who, o: 'close' })}>Renovar</button></span>`}</div>`).join('')
        : `<div class="grid2 lib">${items.map((x) => `<button class="lcard${x.st !== 'ativa' ? ' off' : ''}" ${x.st === 'ativa' ? go('C-25', { c: x.who }) : ''}><span class="lc-ph">${ph(x.capa)}${x.st !== 'ativa' ? `<em>${x.st}</em>` : ''}</span><b>${x.nome}</b><small>${C(x.who).nome.split(' ')[0]} · ${x.info}</small></button>`).join('')}</div>`}
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-30')}`; } },

  'C-31': { render: () => { const k = S.sel.c || 'lara', c = C(k), cancel = S.cancelled.includes(k); return `
    ${topbar('Seu close')}
    <div class="body">
      <div class="pass">
        <div class="pass-top">${mark('pm')}<span>Close</span><b class="tnum">CZ-4F8K-21</b></div>
        <div class="pass-ph">${ph(c.foto)}</div>
        <h2>${c.nome}</h2><p>@${c.nick}</p>
        <div class="pass-cut"><i></i><i></i></div>
        <dl><div><dt>No close desde</dt><dd>12 mar 2026</dd></div><div><dt>${cancel ? 'Acesso até' : 'Próxima cobrança'}</dt><dd class="tnum">12 dez${cancel ? '' : ' · ' + brl(c.preco)}</dd></div></dl>
        ${cancel ? '<p class="pass-flag">cancelada · sem novas cobranças</p>' : `<div class="pass-st">${selo('ativa')}</div>`}
      </div>
      <div class="lgroup">
        ${rowLink('lib', 'Ver o que já saiu', go('C-20', { c: k }))}
        ${rowLink('wallet', 'Pagamentos · 9 Pix', act('toast:Recibos enviados para o seu e-mail'))}
        <div class="lrow">${ico('bell')}<span>Avisar quando postar</span>${tgl(S.notifyOn, 'notify')}</div>
      </div>
      ${cancel ? btn('Reativar assinatura', act('reactivate'), 's') : `<button class="tlink danger center-b" ${act('sheet:cancel')}>Cancelar assinatura</button>`}
    </div>` } },

  'C-32': { render: () => `
    <header class="top"><b class="d-lg">Avisos</b><div class="tr">${S.unread ? `<button class="tlink" ${act('readall')}>Marcar como lidas</button>` : ''}</div></header>
    <div class="body">
      ${NOTIFS.map((n, i) => `<button class="nrow" ${go(n.go, n.who ? { c: n.who } : null)}>${n.sys ? `<span class="av av-md sys">${ico(n.t.startsWith('Pix') ? 'pix' : 'clock')}</span>` : av(n.who, 'md')}<span class="rm"><b>${n.sys ? n.t : `${C(n.who).nome.split(' ')[0]} ${n.t}`}</b><small>${n.d}</small></span><span class="rr"><span class="q">${n.q}</span>${n.unread && S.unread ? '<i class="dot"></i>' : ''}</span></button>`).join('')}
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-32')}` },

  'C-33': { render: () => `
    ${topbar('Conversas', ibtn('back', go('back'), 'Voltar'), postv1())}
    <div class="body">
      <p class="note">${ico('lock')}Só com criadoras de quem você tem close.</p>
      ${CHATS.map((m) => `<button class="nrow" ${go('C-34', { c: m.who })}>${ring(m.who, 'md', m.unread > 0)}<span class="rm"><b>${C(m.who).nome}</b><small>${m.last}</small></span><span class="rr"><span class="q">${m.q}</span>${m.unread ? `<span class="badge tnum">${m.unread}</span>` : ''}</span></button>`).join('')}
    </div>` },

  'C-34': { render: () => { const k = S.sel.c || 'lara'; return `
    <header class="top">${ibtn('back', go('back'), 'Voltar')}<button class="chat-who" ${go('C-20', { c: k })}>${av(k, 'sm')}<span><b>${C(k).nome}</b><small>${selo()}</small></span></button><div class="tr">${postv1()}</div></header>
    <div class="body chat">
      <p class="day">hoje</p>
      <div class="msg them">oiii! vi que você pegou o pack glow</div>
      <div class="msg them">me conta se o passo do iluminador ficou claro</div>
      <div class="msg me">ficou sim!! fiz hoje pra sair</div>
      <div class="msg me">qual a base que você usou no vídeo 4?</div>
      ${S.sentMsg ? '<div class="msg me pop">obrigadaaa</div>' : ''}
      <div class="msg them">amei que você curtiu o glow 💗<br>a base tá na lista do pack, a de 39 reais</div>
    </div>
    <div class="composer"><div class="cmp-in">Mensagem…</div><button class="ib send" ${act('sendmsg')} aria-label="Enviar">${ico('arrow')}</button></div>`; } },

  'C-35': { render: () => `
    <header class="top"><b class="d-lg">Você</b><div class="tr">${ibtn('gear', '', 'Ajustes')}</div></header>
    <div class="body">
      <div class="me">${ph('compras-selfie', 'me-ph')}<div><b>Rafa Carvalho</b><small>@rafa.c · rafa.carvalho@email.com</small></div>${ibtn('edit', '', 'Editar')}</div>
      <button class="sell" ${go(S.creator === 'ativa' ? 'C-50' : S.creator === 'analise' ? 'C-44' : 'C-40')}>
        <span class="sell-m">${mark()}</span><span><b>${S.creator === 'ativa' ? 'Abrir o Clozzy Studio' : S.creator === 'analise' ? 'Sua conta de criadora está em análise' : 'Quero vender no Clozzy'}</b><small>${S.creator === 'ativa' ? 'resumo, ofertas e saque' : S.creator === 'analise' ? 'costuma levar até 24 h' : 'você define o preço e recebe no Pix'}</small></span>${ico('arrow')}
      </button>
      <div class="lgroup">
        ${rowLink('user', 'Dados pessoais')}
        ${rowLink('lock', 'Senha')}
        <div class="lrow">${ico('mail')}<span>Avisos por e-mail</span>${tgl(S.mailOn, 'mail')}</div>
        ${rowLink('wallet', 'Pagamentos e recibos')}
      </div>
      <div class="lgroup">
        ${rowLink('help', 'Ajuda e regras', go('C-36'))}
        ${rowLink('flag', 'Denunciar algo', go('C-37'))}
        ${rowLink('out', 'Sair', act('logout'), '')}
      </div>
      <p class="small muted center">Clozzy · v2.0 protótipo</p>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-35')}` },

  'C-36': { render: () => `
    ${topbar('Ajuda e regras')}
    <div class="body">
      <h1 class="d-lg">Dúvidas rápidas</h1>
      ${[['Quando o conteúdo libera?', 'Assim que o banco confirma o Pix, normalmente em segundos. Se demorar mais de 10 minutos, fale com a gente.'], ['Posso cancelar o close?', 'Pode, quando quiser. Você continua vendo tudo até o fim do mês que já pagou.'], ['Dá para baixar os vídeos?', 'Não. O conteúdo é só para ver no Clozzy e leva uma marca d’água com o seu @.'], ['Como viro criadora?', 'Em Você → Quero vender no Clozzy. Pedimos dados, uma selfie com documento e a chave Pix.']].map(([q, a], i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${q}${ico('plus')}</summary><p>${a}</p></details>`).join('')}
      <div class="lgroup">
        ${rowLink('doc', 'Termos de uso')}${rowLink('shield', 'Privacidade')}${rowLink('lock', 'Aviso 18+')}${rowLink('flag', 'Direitos autorais (DMCA)')}${rowLink('mail', 'Falar com a gente')}
      </div>
    </div>` },

  'C-37': { render: () => `
    ${topbar('Denunciar', ibtn('x', go('back'), 'Fechar'))}
    <div class="body">
      <h1 class="d-lg">O que está acontecendo?</h1>
      <p class="muted lead">A denúncia é anônima para a criadora.</p>
      <div class="radios">${['Parece menor de idade', 'Conteúdo roubado ou de outra pessoa', 'Golpe ou cobrança estranha', 'Assédio ou ódio', 'Outro motivo'].map((r, i) => `<button class="radio${S.reason === i ? ' on' : ''}" ${act('reason:' + i)}><i></i>${r}</button>`).join('')}</div>
      <label class="field"><span>Detalhe (opcional)</span><textarea rows="3" placeholder="Conte o que viu"></textarea></label>
    </div>
    ${dock(btn('Enviar denúncia', act('report') + (S.reason == null ? ' aria-disabled="true"' : '')))}` },

  /* ============ 05 virar criadora ============ */
  'C-40': { render: () => `
    <div class="body nopad">
      <div class="sell-hero">${ph('tripe-arara', 'cover')}<div class="scrim"></div><div class="prof-bar">${ibtn('back', go('back'), 'Voltar')}</div>
        <div class="sell-copy">${logo('lg-photo st')}<h1 class="d-xxl">venda o que<br>não cabe<br>no feed.</h1></div></div>
      <div class="pad">
        <div class="facts"><div><b class="tnum">80%</b><span>fica com você</span></div><div><b>D+1</b><span>saque no Pix</span></div><div><b>R$ 4,90</b><span>preço mínimo, o resto é com você</span></div></div>
        <ol class="how sm"><li><b>1</b><div><h3>Seus dados</h3><p>Nome, CPF e data de nascimento.</p></div></li><li><b>2</b><div><h3>Selfie com documento</h3><p>Para garantir que é você e que tem 18+.</p></div></li><li><b>3</b><div><h3>Chave Pix</h3><p>Onde cai o que você vender.</p></div></li></ol>
      </div>
      <div class="dock-space"></div>
    </div>
    ${dock(btn('Começar', go('C-41')))}` },

  'C-41': { render: () => `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), '<span class="small muted tnum">1 de 3</span>')}
    <div class="body">
      ${steps(1, 3)}
      <h1 class="d-xl">Seus dados</h1>
      <p class="muted lead">Só o necessário para pagar você e confirmar a idade. Ninguém vê isso no perfil.</p>
      ${field('Nome completo', 'Lara Mendes Oliveira')}
      ${field('CPF', '123.456.789-09', 'inputmode="numeric"')}
      ${field('Data de nascimento', '22/07/2004', 'inputmode="numeric"')}
      <label class="field"><span>País</span><div class="inp-w sel"><input value="Brasil" readonly>${ico('chev')}</div></label>
    </div>
    ${dock(btn('Continuar', go('C-42')))}` },

  'C-42': { photo: true, render: () => `
    <div class="cam">
      ${ph('selfie-perto', 'cover')}
      <div class="cam-mask"><i class="oval"></i><i class="docbox"></i></div>
      <header class="cam-top">${ibtn('back', go('back'), 'Voltar')}<span class="tnum">2 de 3</span><span class="ib"></span></header>
      <div class="cam-copy"><h2>Rosto no oval, documento no retângulo</h2><p>Luz de frente, sem óculos escuros.</p></div>
      <div class="cam-bot"><button class="ib">${ico('image')}</button><button class="shutter" ${act('selfie')} aria-label="Tirar foto"></button><button class="ib">${ico('camera')}</button></div>
    </div>` },

  'C-43': { render: () => `
    ${topbar('', ibtn('back', go('back'), 'Voltar'), '<span class="small muted tnum">3 de 3</span>')}
    <div class="body">
      ${steps(3, 3)}
      <h1 class="d-xl">Onde você<br>quer receber?</h1>
      <div class="seg" style="--i:${['CPF', 'E-mail', 'Celular', 'Aleatória'].indexOf(S.pixType)};--n:4"><i></i>${['CPF', 'E-mail', 'Celular', 'Aleatória'].map((t) => `<button class="${S.pixType === t ? 'on' : ''}" ${act('pixtype:' + t)}>${t}</button>`).join('')}</div>
      ${field('Chave Pix', S.pixType === 'CPF' ? '123.456.789-09' : S.pixType === 'E-mail' ? 'lara@email.com' : S.pixType === 'Celular' ? '(41) 99876-5432' : 'a1f4c2e8-…')}
      <div class="fee"><div><span>Fã paga</span><b class="tnum">R$ 19,90</b></div><div><span>Taxa do Clozzy · 20%</span><b class="tnum">− R$ 3,98</b></div><div class="t"><span>Você recebe</span><b class="tnum">R$ 15,92</b></div></div>
      <button class="checkline" ${act('toggle:cterms')}><span class="cb${S.cterms ? ' on' : ''}">${ico('check')}</span><span>Aceito os <u>Termos de criadora</u> e a regra de repasse.</span></button>
    </div>
    ${dock(btn('Enviar para análise', act('submitkyc') + (S.cterms ? '' : ' aria-disabled="true"')))}` },

  'C-44': { render: () => `
    ${topbar('', ibtn('x', go('C-35'), 'Fechar'))}
    <div class="body">
      <h1 class="d-xl">Recebemos.<br>Agora é com a gente.</h1>
      <p class="muted lead">Costuma levar até 24 horas. Você recebe um aviso e um e-mail.</p>
      <ol class="tl">
        <li class="done"><i>${ico('check')}</i><div><b>Dados e selfie enviados</b><small>hoje, 9:41</small></div></li>
        <li class="cur"><i></i><div><b>Em análise</b><small>conferindo documento e idade</small></div></li>
        <li><i></i><div><b>Conta ativa</b><small>perfil no ar e venda liberada</small></div></li>
      </ol>
      <p class="note">${ico('edit')}Enquanto isso, monte seu perfil e suas ofertas. Fica em rascunho até a conta ativar.</p>
    </div>
    ${dock(btn('Montar meu perfil', go('C-51')) + btn('Simular aprovação', act('approve'), 't'))}` },

  /* ============ 06 Clozzy Studio ============ */
  'C-50': { render: () => `
    <header class="top home-top"><div class="tl studio-id">${mark()}<b>Studio</b></div><div class="tr"><button class="ib" ${go('C-32')} aria-label="Avisos">${ico('bell')}<i class="dot"></i></button><button class="av-b" ${go('C-35')}>${av('lara', 'sm')}</button></div></header>
    <div class="body">
      <div class="bal"><small>Disponível para saque</small><p class="d-xxl tnum">${brl(S.saldo)}</p><div class="bal-r"><span class="small muted">+ R$ 2.140,60 a liberar</span>${btn('Sacar', go('C-58'), 's')}</div></div>
      <div class="bento">
        <div class="bx wide"><div class="bx-h"><span>Vendas · 7 dias</span><b class="tnum">${brl(WEEK.reduce((a, b) => a + b, 0), false)}</b></div>${spark(WEEK)}<div class="days">${['qua', 'qui', 'sex', 'sáb', 'dom', 'seg', 'ter'].map((d) => `<span>${d}</span>`).join('')}</div></div>
        <button class="bx" ${go('C-56')}><span>No close</span><b class="tnum">3.240</b><small class="up">+48 essa semana</small></button>
        <button class="bx" ${go('C-52')}><span>Packs vendidos</span><b class="tnum">645</b><small>2 ativos</small></button>
      </div>
      <div class="qa">${[['plus', 'Publicar', 'C-55'], ['tag', 'Ofertas', 'C-52'], ['image', 'Conteúdos', 'C-54'], ['edit', 'Perfil', 'C-51']].map(([i, l, id]) => `<button ${go(id)}>${ico(i)}<span>${l}</span></button>`).join('')}</div>
      <section class="sec in"><div class="sh"><h2>Últimas vendas</h2><button class="tlink" ${go('C-57')}>Extrato</button></div>
        ${SALES.slice(0, 4).map((s) => `<div class="row"><span class="av av-md ini">${s.n[0]}</span><span class="rm"><b>${s.n}</b><small>${s.o}</small></span><span class="rr"><b class="tnum">+ ${brl(s.v)}</b><span class="q">${s.q}</span></span></div>`).join('')}
      </section>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-50', true)}` },

  'C-51': { render: () => `
    ${topbar('Perfil', ibtn('back', go('back'), 'Voltar'), `<button class="tlink" ${act('toast:Perfil salvo')}>Salvar</button>`)}
    <div class="body">
      <div class="ed-cover">${ph('ringlight-rosa')}<button class="ib glass" aria-label="Trocar capa">${ico('camera')}</button><span class="ed-av">${ph('ringlight-sorriso')}<button class="ib glass sm" aria-label="Trocar foto">${ico('camera')}</button></span></div>
      ${field('Nome', 'Lara Mendes')}
      ${field('@', 'lara.mendes')}
      <label class="field"><span>Bio</span><textarea rows="3">make de 5 minutos, bastidor de gravação e o que não cabe no TikTok.</textarea><small class="hint tnum">68/150</small></label>
      <p class="lbl">Links</p>
      <div class="lgroup">${rowLink('link', 'tiktok.com/@lara.mendes')}${rowLink('link', 'instagram.com/lara.mendes')}${rowLink('plus', 'Adicionar link', '', '')}</div>
      <div class="lgroup"><div class="lrow">${ico('eye')}<span>Perfil publicado<small>${S.published ? 'qualquer pessoa vê sua vitrine' : 'só você vê'}</small></span>${tgl(S.published, 'publish')}</div></div>
    </div>
    ${dock(btn('Ver como fã', go('C-20', { c: 'lara' }), 's'))}` },

  'C-52': { render: () => `
    <header class="top"><b class="d-lg">Ofertas</b><div class="tr">${ibtn('plus', go('C-53', { o: 'new' }), 'Nova oferta')}</div></header>
    <div class="body">
      ${['assinatura', 'pack', 'item'].map((t) => `<p class="lbl">${{ assinatura: 'Assinatura', pack: 'Packs', item: 'Avulsos' }[t]}</p>
      <div class="lgroup">${OFFERS.filter((o) => o.tipo === t).map((o) => `<div class="orow${o.ativa ? '' : ' off'}"><button class="rm" ${go('C-53', { o: o.id })}>${o.capa ? `<span class="thumb">${ph(o.capa)}</span>` : `<span class="thumb mk">${mark()}</span>`}<span><b>${o.nome}</b><small class="tnum">${brl(o.preco)}${o.periodo ? '/' + o.periodo : ''} · ${o.vendas ? n0(o.vendas) + (t === 'assinatura' ? ' no close' : ' vendas') : 'pausada'}</small></span></button>${tgl(o.ativa, 'offer:' + o.id)}</div>`).join('')}</div>`).join('')}
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-52', true)}` },

  'C-53': { render: () => { const isNew = S.sel.o === 'new', o = isNew ? { tipo: 'pack', nome: '', preco: S.price } : offerOf(S.sel.o); const tipo = S.otype || o.tipo; return `
    ${topbar(isNew ? 'Nova oferta' : 'Editar oferta')}
    <div class="body">
      <div class="seg" style="--i:${['assinatura', 'pack', 'item'].indexOf(tipo)}"><i></i>${[['assinatura', 'Assinatura'], ['pack', 'Pack'], ['item', 'Avulso']].map(([t, l]) => `<button class="${tipo === t ? 'on' : ''}" ${act('otype:' + t)}>${l}</button>`).join('')}</div>
      ${field('Nome', isNew ? 'Pack ' : o.nome, isNew ? 'placeholder="ex.: Pack Glow de 5 minutos"' : '')}
      <p class="lbl">Preço${tipo === 'assinatura' ? ' por mês' : ''}</p>
      <div class="stepper-n"><button ${act('price:-1')} aria-label="Menos">−</button><b class="tnum">${brl(S.price)}</b><button ${act('price:1')} aria-label="Mais">+</button></div>
      <p class="small muted center">Você recebe <b class="tnum">${brl(S.price * .8)}</b> por venda · mínimo R$ 4,90</p>
      ${tipo === 'assinatura' ? `<p class="lbl">Cobrança</p><div class="tags">${['Mensal', 'Trimestral'].map((p, i) => `<button class="tagb${i === 0 ? ' on' : ''}">${p}</button>`).join('')}</div>` : ''}
      <p class="lbl">Conteúdos ligados <span class="muted">${isNew ? 0 : 4}</span></p>
      <div class="linked">${(isNew ? [] : CONTENT.slice(0, 4)).map((c) => `<span>${ph(c.f)}</span>`).join('')}<button ${go('C-55')} aria-label="Adicionar">${ico('plus')}</button></div>
    </div>
    ${dock(btn(isNew ? 'Criar oferta' : 'Salvar oferta', act('saveoffer')))}`; } },

  'C-54': { render: () => { const f = S.cfilter, list = CONTENT.filter((c) => f === 'tudo' || c.vis === f); return `
    ${topbar('Conteúdos', ibtn('back', go('back'), 'Voltar'), ibtn('plus', go('C-55'), 'Publicar'))}
    <div class="body nopad">
      <div class="hs chips">${['tudo', 'pago', 'close', 'prévia', 'rascunho'].map((c) => `<button class="chip${f === c ? ' on' : ''}" ${act('cf:' + c)}>${c[0].toUpperCase() + c.slice(1)}</button>`).join('')}</div>
      <div class="pad">${list.map((c) => `<div class="row crow"><span class="thumb">${ph(c.f)}${c.tipo === 'vídeo' ? ico('play', 'pl') : ''}</span><span class="rm"><b>${c.t}</b><small>${c.tipo} · ${c.of} · ${c.q}</small></span><span class="vis v-${c.vis.replace('é', 'e')}">${c.vis}</span>${ibtn('more', act('sheet:content'), 'Opções')}</div>`).join('')}</div>
    </div>` } },

  'C-55': { render: () => `
    ${topbar('Publicar', ibtn('x', go('back'), 'Fechar'))}
    <div class="body">
      <div class="upl">${ph('make-ringlight')}<span class="upl-b">${ico('play')}0:42 · 1080p</span><button class="ib glass" aria-label="Trocar">${ico('image')}</button></div>
      ${field('Título', 'Glow 02 · iluminador')}
      <p class="lbl">Quem vê</p>
      <div class="radios">${[['previa', 'Prévia grátis', 'aparece no perfil para todo mundo'], ['close', 'Close', 'quem assina vê; o resto vê borrado'], ['pack', 'Pack Glow de 5 minutos', 'entra no pack, 20 → 21 itens'], ['item', 'Avulso', 'vende sozinho, você define o preço']].map(([v, t, d]) => `<button class="radio card${S.pubVis === v ? ' on' : ''}" ${act('pv:' + v)}><i></i><span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div>
      <div class="lgroup"><div class="lrow">${ico('shield')}<span>Marca d’água com o @ do fã</span>${tgl(S.wm, 'wm')}</div><div class="lrow">${ico('bell')}<span>Avisar quem está no close</span>${tgl(S.pubNotify, 'pubnotify')}</div></div>
      <div class="dock-space"></div>
    </div>
    ${dock(btn('Publicar', act('post')))}` },

  'C-56': { render: () => `
    <header class="top"><b class="d-lg">Fãs</b><div class="tr">${ibtn('search', '', 'Buscar')}</div></header>
    <div class="body">
      <div class="stat3"><div><b class="tnum">3.240</b><span>no close</span></div><div><b class="tnum up">+48</b><span>7 dias</span></div><div><b class="tnum">−11</b><span>cancelaram</span></div></div>
      <p class="lbl">Quem mais apoia</p>
      ${FANS.map((f, i) => `<div class="row"><span class="rank tnum">${i + 1}</span><span class="av av-md">${ph(f.f)}</span><span class="rm"><b>${f.n}</b><small>${f.tipo} · desde ${f.desde}</small></span><b class="tnum rr">${brl(f.gasto)}</b></div>`).join('')}
      <p class="small muted center">Sem contato direto na v1. Só o @ e o que compraram.</p>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-56', true)}` },

  'C-57': { render: () => `
    <header class="top"><b class="d-lg">Grana</b><div class="tr"></div></header>
    <div class="body">
      <div class="fin">
        <div><small>Disponível</small><b class="tnum">${brl(S.saldo)}</b></div>
        <div><small>A liberar · D+14</small><b class="tnum muted">R$ 2.140,60</b></div>
      </div>
      ${btn('Sacar no Pix', go('C-58'))}
      <p class="small muted">Taxa do Clozzy: 20% por venda. O valor de cada venda fica 14 dias “a liberar” por causa de estorno.</p>
      <section class="sec in"><div class="sh"><h2>Extrato</h2><span class="small muted">novembro</span></div>
        ${SALES.map((s) => `<div class="row"><span class="av av-md ini">${s.n[0]}</span><span class="rm"><b>${s.o}</b><small>${s.n} · ${s.q}</small></span><span class="rr"><b class="tnum">+ ${brl(s.v * .8)}</b><span class="q tnum">${brl(s.v)} bruto</span></span></div>`).join('')}
      </section>
      <section class="sec in"><div class="sh"><h2>Saques</h2></div>
        ${S.payouts.map((p) => `<div class="row"><span class="av av-md sys">${ico('pix')}</span><span class="rm"><b class="tnum">${brl(p.v)}</b><small>${p.q} · chave CPF ***.456.789-**</small></span><span class="stt${p.st === 'pago' ? ' on' : ' wait'}">${p.st === 'pago' ? ico('check') : ''}${p.st}</span></div>`).join('')}
      </section>
      <div class="tb-space"></div>
    </div>
    ${tabbar('C-57', true)}` },

  'C-58': { render: () => `
    ${topbar('Sacar')}
    <div class="body center">
      <p class="muted">Quanto você quer sacar?</p>
      <p class="pix-amt big tnum">${brl(S.saque)}</p>
      <div class="tags c">${[['Tudo', S.saldo], ['R$ 500', 500], ['R$ 1.000', 1000]].map(([l, v]) => `<button class="tagb${S.saque === v ? ' on' : ''}" ${act('saque:' + v)}>${l}</button>`).join('')}</div>
      <div class="lgroup left"><div class="lrow">${ico('pix')}<span>Chave CPF<small>***.456.789-** · Nubank</small></span><button class="tlink">Trocar</button></div><div class="lrow">${ico('clock')}<span>Cai em até 1 dia útil<small>sem taxa de saque</small></span></div></div>
    </div>
    ${dock(btn(`Sacar ${brl(S.saque)}`, act('withdraw')))}` },
};

/* folhas inferiores */
function sheetHTML() {
  if (!S.sheet) return '';
  const body = {
    cancel: () => { const c = sel(); return `<h3>Cancelar o close da ${c.nome.split(' ')[0]}?</h3><p class="muted">Você continua vendo tudo até <b>12 dez</b>. Depois disso, sem cobrança nova.</p>${btn('Cancelar assinatura', act('cancel'), 'd')}${btn('Continuar no close', act('sheet:'), 't')}`; },
    content: () => `<h3>Glow 01 · preparação</h3><div class="lgroup">${rowLink('edit', 'Editar título e quem vê', act('sheet:'))}${rowLink('tag', 'Trocar oferta ligada', act('sheet:'))}${rowLink('lib', 'Arquivar', act('archive'), '')}</div>${btn('Remover', act('archive'), 'd')}`,
  }[S.sheet];
  return `<div class="veil" ${act('sheet:')}></div><div class="sheet"><i class="grab"></i>${body ? body() : ''}</div>`;
}
