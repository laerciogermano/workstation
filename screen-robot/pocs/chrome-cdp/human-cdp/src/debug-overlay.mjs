/**
 * Modo debug: cursor virtual (fig-mouse) + painel de comportamento fixo à direita
 * (como o bot-lab), minimizável. Injetado via Runtime.evaluate com connect({ debug: true }).
 */

const FIG_MOUSE_HTML = `<div id="fig-mouse" class="fig-mouse" aria-hidden="true">
  <svg viewBox="0 0 28 40" width="28" height="40">
    <path d="M3 2 L3 30 L10 24 L15 36 L19 34 L14 22 L24 22 Z" fill="#f4f7fb" stroke="#0b1220" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M3 2 L3 30 L10 24 L24 22 Z" fill="#5eb0ff" opacity="0.35"/>
  </svg>
  <span class="fig-mouse-ripple"></span>
</div>`;

/** Expressão JS (IIFE) que ativa mouse + painel fixo à direita. */
export function enableDebugOverlayExpression() {
  return `(() => {
    const STYLE_ID = 'human-cdp-debug-style';
    const RAIL_ID = 'human-cdp-debug-rail';
    const FIG_HTML = ${JSON.stringify(FIG_MOUSE_HTML)};

    if (window.__humanCdpDebug?.enabled) {
      window.__humanCdpDebug.refresh();
      return window.__humanCdpDebug.snapshot();
    }

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = \`
        .fig-mouse {
          position: fixed; left: 0; top: 0; z-index: 2147483646;
          width: 28px; height: 40px; pointer-events: none; opacity: 0;
          transform: translate(-100px, -100px);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55));
          transition: opacity 0.12s; will-change: transform;
        }
        .fig-mouse.is-on { opacity: 1; }
        .fig-mouse.is-press {
          filter: drop-shadow(0 0 6px #f0a020) drop-shadow(0 2px 4px rgba(0,0,0,0.55));
        }
        .fig-mouse.is-press svg { transform: scale(0.88); transform-origin: 4px 2px; }
        .fig-mouse-ripple {
          position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;
          border-radius: 50%; border: 2px solid #5eb0ff; opacity: 0; pointer-events: none;
        }
        .fig-mouse.is-click .fig-mouse-ripple { animation: human-cdp-fig-ripple 0.45s ease-out; }
        @keyframes human-cdp-fig-ripple {
          0% { transform: scale(0.4); opacity: 0.95; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        #\${RAIL_ID} {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 20rem; z-index: 2147483645;
          display: flex; flex-direction: column; gap: 0.65rem;
          padding: 1rem 1rem 1rem 0.75rem;
          border-left: 1px solid #2c3846;
          background: rgba(12, 16, 22, 0.94);
          backdrop-filter: blur(10px);
          color: #e8eef4;
          font: 13px/1.4 ui-sans-serif, system-ui, sans-serif;
          overflow: auto;
          transition: width 0.18s ease, padding 0.18s ease;
        }
        #\${RAIL_ID}.is-minimized {
          width: 2.75rem; padding: 0.55rem 0.35rem; overflow: hidden;
        }
        #\${RAIL_ID}.is-minimized .rail-body { display: none; }
        #\${RAIL_ID}.is-minimized .rail-toolbar { justify-content: center; }
        #\${RAIL_ID}.is-minimized .rail-toggle { transform: scaleX(-1); }
        #\${RAIL_ID} .rail-toolbar { display: flex; justify-content: flex-end; }
        #\${RAIL_ID} .rail-toggle {
          min-width: 2rem; padding: 0.25rem 0.45rem; cursor: pointer;
          background: transparent; border: 1px solid #2c3846; border-radius: 8px;
          color: #e8eef4; font-size: 0.95rem; line-height: 1;
        }
        #\${RAIL_ID} .rail-body { display: flex; flex-direction: column; gap: 0.65rem; flex: 1; min-height: 0; }
        #\${RAIL_ID} .score-card {
          padding: 0.9rem 1rem; border: 1px solid #2c3846; border-radius: 10px;
          text-align: right; background: #1a222c;
        }
        #\${RAIL_ID} .score-label {
          margin: 0; font-size: 0.7rem; color: #8b9aab;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        #\${RAIL_ID} .score-verdict { margin: 0.15rem 0; font-size: 1.2rem; font-weight: 700; }
        #\${RAIL_ID} .score-meta { margin: 0; font-size: 0.75rem; color: #8b9aab; }
        #\${RAIL_ID} .panel {
          background: #1a222c; border: 1px solid #2c3846; border-radius: 10px;
          padding: 0.9rem 1rem; overflow: auto;
        }
        #\${RAIL_ID} .panel h2 { margin: 0 0 0.35rem; font-size: 1.05rem; }
        #\${RAIL_ID} .hint { margin: 0 0 0.5rem; color: #8b9aab; font-size: 0.8rem; }
        #\${RAIL_ID} .meters {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;
        }
        #\${RAIL_ID} .meters div {
          padding: 0.4rem 0.5rem; border: 1px solid #2c3846; border-radius: 8px;
          display: flex; justify-content: space-between; gap: 0.35rem; font-size: 0.78rem;
        }
        #\${RAIL_ID} .meters span { color: #8b9aab; }
        body.human-cdp-debug-pad { padding-right: 20rem; }
        body.human-cdp-debug-pad.rail-minimized { padding-right: 2.75rem; }
      \`;
      document.documentElement.appendChild(style);
    }

    const ensureFigMouse = () => {
      let m = document.getElementById('fig-mouse');
      if (!m) {
        document.body.insertAdjacentHTML('beforeend', FIG_HTML);
        m = document.getElementById('fig-mouse');
      }
      return m;
    };

    const moveMouse = (x, y, { press = false } = {}) => {
      const m = ensureFigMouse();
      if (!m) return;
      m.classList.add('is-on');
      m.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
      m.classList.toggle('is-press', !!press);
    };

    const wireMinimize = (rail, btn) => {
      if (!rail || !btn || btn.dataset.humanCdpWired === '1') return;
      btn.dataset.humanCdpWired = '1';
      btn.addEventListener('click', () => {
        const min = rail.classList.toggle('is-minimized');
        document.querySelector('.shell')?.classList.toggle('rail-minimized', min);
        document.body.classList.toggle('rail-minimized', min);
        btn.setAttribute('aria-expanded', min ? 'false' : 'true');
        btn.title = min ? 'Expandir painel' : 'Minimizar painel';
      });
    };

    const ensureBotLabRail = () => {
      const rail = document.querySelector('.feedback-rail') || document.getElementById('feedback-rail');
      if (!rail) return null;
      rail.classList.remove('human-cdp-debug-float');
      rail.style.transform = '';
      document.querySelector('.shell')?.classList.remove('human-cdp-debug-shell');
      let btn = rail.querySelector('#btn-rail-toggle, .rail-toggle');
      if (!btn) {
        const toolbar = document.createElement('div');
        toolbar.className = 'rail-toolbar';
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost rail-toggle';
        btn.id = 'btn-rail-toggle';
        btn.setAttribute('aria-expanded', 'true');
        btn.title = 'Minimizar painel';
        btn.textContent = '«';
        toolbar.appendChild(btn);
        rail.insertBefore(toolbar, rail.firstChild);
      }
      wireMinimize(rail, btn);
      return rail;
    };

    const ensureFallbackRail = () => {
      let rail = document.getElementById(RAIL_ID);
      if (!rail) {
        rail = document.createElement('aside');
        rail.id = RAIL_ID;
        rail.setAttribute('aria-label', 'Feedback de detecção');
        rail.innerHTML = \`
          <div class="rail-toolbar">
            <button type="button" class="rail-toggle" id="btn-rail-toggle" aria-expanded="true" title="Minimizar painel">«</button>
          </div>
          <div class="rail-body">
            <div class="score-card">
              <p class="score-label">Veredito</p>
              <p class="score-verdict">fora do bot-lab</p>
              <p class="score-meta">painel debug · sem checks do lab</p>
            </div>
            <section class="panel">
              <h2>Comportamento</h2>
              <p class="hint">Abra o bot-lab para veredito humano/robô ao vivo.</p>
              <div class="meters">
                <div><span>Cursor</span><strong id="human-cdp-debug-xy">—</strong></div>
                <div><span>Modo</span><strong>debug</strong></div>
              </div>
            </section>
          </div>
        \`;
        document.documentElement.appendChild(rail);
        document.body.classList.add('human-cdp-debug-pad');
      }
      wireMinimize(rail, rail.querySelector('.rail-toggle'));
      return rail;
    };

    const labRail = document.querySelector('.feedback-rail')
      || document.getElementById('feedback-rail');
    const isBotLab = !!(labRail && document.getElementById('score-verdict'));
    const rail = isBotLab ? ensureBotLabRail() : ensureFallbackRail();
    ensureFigMouse();
    moveMouse(40, 40);

    const onMove = (e) => {
      if (!e.isTrusted) return;
      moveMouse(e.clientX, e.clientY);
      const xy = document.getElementById('human-cdp-debug-xy');
      if (xy) xy.textContent = Math.round(e.clientX) + ',' + Math.round(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });

    window.__humanCdpDebug = {
      enabled: true,
      isBotLab,
      move: moveMouse,
      refresh() {
        const r = document.querySelector('.feedback-rail')
          || document.getElementById('feedback-rail');
        this.isBotLab = !!(r && document.getElementById('score-verdict'));
        if (this.isBotLab) ensureBotLabRail();
        else ensureFallbackRail();
        ensureFigMouse();
      },
      snapshot() {
        const fig = document.getElementById('fig-mouse');
        const railEl = document.querySelector('.feedback-rail.is-minimized, #' + RAIL_ID)
          || document.querySelector('.feedback-rail')
          || document.getElementById(RAIL_ID);
        return {
          enabled: true,
          isBotLab: this.isBotLab,
          mouseOn: !!(fig && fig.classList.contains('is-on')),
          railFixed: !!railEl,
          railMinimizable: !!document.getElementById('btn-rail-toggle')
            || !!document.querySelector('.rail-toggle'),
          floating: false,
          verdict: document.getElementById('score-verdict')?.textContent?.trim() || null,
        };
      },
    };

    return window.__humanCdpDebug.snapshot();
  })()`;
}

/** Move o cursor virtual para (x,y) se o overlay estiver ativo. */
export function moveDebugOverlayExpression(x, y) {
  return `(() => {
    const d = window.__humanCdpDebug;
    if (!d?.enabled || typeof d.move !== 'function') return false;
    d.move(${Number(x)}, ${Number(y)});
    const xy = document.getElementById('human-cdp-debug-xy');
    if (xy) xy.textContent = ${Math.round(Number(x))} + ',' + ${Math.round(Number(y))};
    return true;
  })()`;
}
