/**
 * Modo debug: cursor virtual + painel à direita com veredito ao vivo
 * (mesmo fora do bot-lab). Injetado via Runtime.evaluate com connect({ debug: true }).
 */

const FIG_MOUSE_HTML = `<div id="fig-mouse" class="fig-mouse" aria-hidden="true">
  <svg viewBox="0 0 28 40" width="28" height="40">
    <path d="M3 2 L3 30 L10 24 L15 36 L19 34 L14 22 L24 22 Z" fill="#f4f7fb" stroke="#0b1220" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M3 2 L3 30 L10 24 L24 22 Z" fill="#5eb0ff" opacity="0.35"/>
  </svg>
  <span class="fig-mouse-ripple"></span>
</div>`;

/**
 * Expressão JS (IIFE) que ativa mouse + painel fixo à direita.
 * @param {object|null|undefined} [fingerprint] meta.fingerprint (UA, lang, tz…)
 */
export function enableDebugOverlayExpression(fingerprint) {
  const fpJson = JSON.stringify(fingerprint && typeof fingerprint === 'object' ? fingerprint : null);
  return `(() => {
    const STYLE_ID = 'human-cdp-debug-style';
    const RAIL_ID = 'human-cdp-debug-rail';
    const FIG_HTML = ${JSON.stringify(FIG_MOUSE_HTML)};
    const FP = ${fpJson};

    const renderFingerprint = (rail, fp) => {
      if (!rail) return;
      let panel = rail.querySelector('#human-cdp-fp-panel');
      if (!panel) {
        const body = rail.querySelector('.rail-body') || rail;
        panel = document.createElement('section');
        panel.id = 'human-cdp-fp-panel';
        panel.className = 'panel';
        panel.innerHTML = '<h2>Fingerprint</h2><p class="hint">meta.fingerprint (CDP)</p><pre id="human-cdp-fp-pre" style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:0.72rem;line-height:1.35;color:#c5d0db;max-height:14rem;overflow:auto"></pre>';
        const score = body.querySelector('.score-card');
        if (score && score.nextSibling) body.insertBefore(panel, score.nextSibling);
        else body.insertBefore(panel, body.firstChild);
      }
      const pre = panel.querySelector('#human-cdp-fp-pre');
      if (!pre) return;
      if (!fp || typeof fp !== 'object') {
        pre.textContent = '(sem fingerprint na meta)';
        return;
      }
      const lines = [];
      const put = (k, v) => {
        if (v == null || v === '') return;
        if (typeof v === 'object') {
          try { lines.push(k + ': ' + JSON.stringify(v)); } catch { lines.push(k + ': [object]'); }
        } else lines.push(k + ': ' + String(v));
      };
      put('userAgent', fp.userAgent);
      put('platform', fp.platform);
      put('lang', fp.lang);
      put('acceptLanguage', fp.acceptLanguage);
      put('locale', fp.locale);
      put('timezone', fp.timezone);
      put('hardwareConcurrency', fp.hardwareConcurrency);
      put('deviceMemory', fp.deviceMemory);
      put('maxTouchPoints', fp.maxTouchPoints);
      put('colorScheme', fp.colorScheme);
      put('reducedMotion', fp.reducedMotion);
      put('touch', fp.touch);
      put('webrtcIpHandling', fp.webrtcIpHandling);
      if (fp.viewport) {
        put('viewport', fp.viewport.width + '×' + fp.viewport.height
          + (fp.viewport.deviceScaleFactor != null ? ' @' + fp.viewport.deviceScaleFactor : '')
          + (fp.viewport.screenWidth ? ' screen ' + fp.viewport.screenWidth + '×' + fp.viewport.screenHeight : ''));
      }
      if (fp.geolocation) {
        put('geolocation', fp.geolocation.latitude + ', ' + fp.geolocation.longitude
          + (fp.geolocation.accuracy != null ? ' ±' + fp.geolocation.accuracy + 'm' : ''));
      }
      if (fp.userAgentMetadata) {
        const m = fp.userAgentMetadata;
        put('uaMeta', (m.platform || '') + ' ' + (m.platformVersion || '')
          + (m.architecture ? ' ' + m.architecture : '')
          + (m.mobile ? ' mobile' : ''));
        if (m.brands?.length) put('brands', m.brands.map((b) => b.brand + '/' + b.version).join(', '));
      }
      if (fp.permissions?.length) {
        put('permissions', fp.permissions.map((p) => (p.permission || '') + '@' + (p.origin || '') + '=' + (p.setting || 'granted')).join('; '));
      }
      pre.textContent = lines.length ? lines.join('\\n') : JSON.stringify(fp, null, 2);
    };

    if (window.__humanCdpDebug?.enabled) {
      window.__humanCdpDebug.refresh();
      if (typeof window.__humanCdpDebug.setFingerprint === 'function') {
        window.__humanCdpDebug.setFingerprint(FP);
      }
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
        #\${RAIL_ID} .rail-toolbar { display: flex; justify-content: flex-end; gap: 0.35rem; }
        #\${RAIL_ID} .rail-toggle, #\${RAIL_ID} .rail-reset {
          min-width: 2rem; padding: 0.25rem 0.45rem; cursor: pointer;
          background: transparent; border: 1px solid #2c3846; border-radius: 8px;
          color: #e8eef4; font-size: 0.85rem; line-height: 1;
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
        #\${RAIL_ID} .score-verdict.is-ok { color: #3dba7a; }
        #\${RAIL_ID} .score-verdict.is-fail { color: #e35d6a; }
        #\${RAIL_ID} .score-verdict.is-warn { color: #e0a432; }
        #\${RAIL_ID} .score-meta { margin: 0; font-size: 0.75rem; color: #8b9aab; }
        #\${RAIL_ID} .panel {
          background: #1a222c; border: 1px solid #2c3846; border-radius: 10px;
          padding: 0.9rem 1rem; overflow: auto; flex: 1; min-height: 0;
        }
        #\${RAIL_ID} .panel h2 { margin: 0 0 0.35rem; font-size: 1.05rem; }
        #\${RAIL_ID} .hint { margin: 0 0 0.5rem; color: #8b9aab; font-size: 0.8rem; }
        #\${RAIL_ID} .meters {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.5rem;
        }
        #\${RAIL_ID} .meters div {
          padding: 0.4rem 0.5rem; border: 1px solid #2c3846; border-radius: 8px;
          display: flex; justify-content: space-between; gap: 0.35rem; font-size: 0.78rem;
        }
        #\${RAIL_ID} .meters span { color: #8b9aab; }
        #\${RAIL_ID} .checks-list { list-style: none; margin: 0; padding: 0; }
        #\${RAIL_ID} .checks-list li {
          display: flex; justify-content: space-between; gap: 0.5rem;
          padding: 0.35rem 0; border-bottom: 1px solid #2c3846; font-size: 0.78rem;
        }
        #\${RAIL_ID} .checks-list .st-pass { color: #3dba7a; }
        #\${RAIL_ID} .checks-list .st-fail { color: #e35d6a; }
        #\${RAIL_ID} .checks-list .st-warn { color: #e0a432; }
        body.human-cdp-debug-pad { padding-right: 20rem !important; }
        body.human-cdp-debug-pad.rail-minimized { padding-right: 2.75rem !important; }
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

    /** Detector portátil (comportamento) — funciona em qualquer site. */
    const createLiveVerdict = (rail) => {
      if (!rail || rail.dataset.verdictWired === '1') return;
      rail.dataset.verdictWired = '1';

      const state = {
        pointerSamples: [],
        clicks: [],
        keys: [],
        lastClickTrusted: null,
        hadMouseMoveBeforeClick: false,
        movedSinceLoad: false,
        actionsFocused: 0,
        actionsUnfocused: 0,
        backgroundTainted: false,
        backgroundLocked: false,
        _focusedSince: null,
      };

      const labels = {
        'pointer-path': 'Trajetória',
        'pre-click-move': 'Move antes do clique',
        'click-trusted': 'Click isTrusted',
        'click-timing': 'Ritmo cliques',
        'key-timing': 'Ritmo teclas',
        'page-focus': 'Tela com foco',
      };

      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

      const pathLooksHuman = (samples) => {
        if (samples.length < 8) return { status: 'warn', detail: 'poucos pts (' + samples.length + ')' };
        let teleports = 0;
        let total = 0;
        for (let i = 1; i < samples.length; i++) {
          const d = dist(samples[i - 1], samples[i]);
          const dt = Math.max(1, samples[i].t - samples[i - 1].t);
          total += d;
          if (d > 80 && dt < 8) teleports++;
          if (d > 400 && dt < 30) teleports++;
        }
        if (total < 40) return { status: 'fail', detail: 'caminho curto' };
        if (teleports >= 3) return { status: 'fail', detail: teleports + ' teleportes' };
        return { status: 'pass', detail: samples.length + ' pts · ' + total.toFixed(0) + 'px' };
      };

      const timingHuman = (events, { min = 3, softMin = 40 } = {}) => {
        if (events.length < min) return { status: 'warn', detail: 'n=' + events.length };
        const gaps = [];
        for (let i = 1; i < events.length; i++) gaps.push(events[i].t - events[i - 1].t);
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const tooFast = gaps.filter((g) => g < softMin).length;
        if (tooFast >= Math.ceil(gaps.length * 0.6)) {
          return { status: 'fail', detail: 'rápido avg=' + avg.toFixed(0) + 'ms' };
        }
        return { status: 'pass', detail: 'avg=' + avg.toFixed(0) + 'ms' };
      };

      /** Foco real da aba (sem “taint” sticky de blur transitório). */
      const rawFocused = () =>
        document.hasFocus() &&
        document.visibilityState === 'visible' &&
        !document.hidden;

      const noteActionFocus = () => {
        // só conta o estado NO momento da ação — blur antigo não condena clique focado
        if (!rawFocused()) {
          state.actionsUnfocused++;
          state.backgroundTainted = true;
          state.backgroundLocked = true;
        } else {
          state.actionsFocused++;
          if (!state.backgroundLocked) state.backgroundTainted = false;
        }
      };

      const evaluate = () => {
        const results = [];
        results.push({ id: 'pointer-path', ...pathLooksHuman(state.pointerSamples) });
        results.push({
          id: 'pre-click-move',
          status: state.clicks.length === 0 ? 'warn' : state.hadMouseMoveBeforeClick ? 'pass' : 'fail',
          detail: state.clicks.length === 0 ? 'sem cliques' : state.hadMouseMoveBeforeClick ? 'houve move' : 'sem move',
        });
        results.push({
          id: 'click-trusted',
          status: state.lastClickTrusted == null ? 'warn' : state.lastClickTrusted ? 'pass' : 'fail',
          detail: state.lastClickTrusted == null ? '—' : String(state.lastClickTrusted),
        });
        results.push({ id: 'click-timing', ...timingHuman(state.clicks, { min: 3, softMin: 50 }) });
        results.push({ id: 'key-timing', ...timingHuman(state.keys, { min: 4, softMin: 30 }) });
        const af = state.actionsFocused;
        const au = state.actionsUnfocused;
        let focusStatus = 'warn';
        let focusDetail = 'sem ações · agora ' + (rawFocused() ? 'focado' : 'sem foco');
        if (af + au > 0) {
          if (au > 0) {
            focusStatus = 'fail';
            focusDetail = 'ações sem foco ' + au + '/' + (af + au) + ' · agora ' + (rawFocused() ? 'focado' : 'sem foco');
          } else {
            focusStatus = 'pass';
            focusDetail = 'com foco (' + af + ') · agora ' + (rawFocused() ? 'focado' : 'sem foco');
          }
        }
        results.push({ id: 'page-focus', status: focusStatus, detail: focusDetail });
        return results;
      };

      const render = () => {
        const results = evaluate();
        let pass = 0, fail = 0, warn = 0;
        for (const r of results) {
          if (r.status === 'pass') pass++;
          else if (r.status === 'fail') fail++;
          else warn++;
        }
        const focusFail = results.some((x) => x.id === 'page-focus' && x.status === 'fail');
        let label = 'inconclusivo';
        let cls = 'is-warn';
        if (focusFail || state.actionsUnfocused > 0 || fail >= 2 || (fail >= 1 && pass < 3)) {
          label = 'robô / suspeito';
          cls = 'is-fail';
        } else if (fail === 0 && pass >= 3) {
          label = 'humano';
          cls = 'is-ok';
        }

        const vEl = rail.querySelector('.score-verdict');
        const mEl = rail.querySelector('.score-meta');
        if (vEl) {
          vEl.textContent = label;
          vEl.classList.remove('is-ok', 'is-fail', 'is-warn');
          vEl.classList.add(cls);
        }
        if (mEl) {
          mEl.textContent = 'comportamento ' + pass + '✓ ' + fail + '✗ ' + warn + '? · live';
        }

        const ul = rail.querySelector('.checks-list');
        if (ul) {
          ul.innerHTML = '';
          for (const r of results) {
            const li = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = labels[r.id] || r.id;
            const st = document.createElement('span');
            st.className = 'st-' + r.status;
            st.textContent = r.status + ' · ' + r.detail;
            li.append(name, st);
            ul.appendChild(li);
          }
        }

        const set = (id, val) => {
          const el = rail.querySelector('#' + id);
          if (el) el.textContent = val;
        };
        set('human-cdp-debug-points', String(state.pointerSamples.length));
        set('human-cdp-debug-clicks', String(state.clicks.length));
        set('human-cdp-debug-keys', String(state.keys.length));
        set('human-cdp-debug-trusted', state.lastClickTrusted == null ? '—' : String(state.lastClickTrusted));
        set('human-cdp-debug-focus', rawFocused() ? 'sim' : 'não');
      };

      const reset = () => {
        state.pointerSamples = [];
        state.clicks = [];
        state.keys = [];
        state.lastClickTrusted = null;
        state.hadMouseMoveBeforeClick = false;
        state.movedSinceLoad = false;
        state.actionsFocused = 0;
        state.actionsUnfocused = 0;
        state.backgroundTainted = false;
        state.backgroundLocked = false;
        state._focusedSince = document.hasFocus() ? performance.now() : null;
        render();
      };

      let lastSampleT = 0;
      const onMove = (e) => {
        if (!e.isTrusted) return;
        moveMouse(e.clientX, e.clientY);
        const xy = document.getElementById('human-cdp-debug-xy');
        if (xy) xy.textContent = Math.round(e.clientX) + ',' + Math.round(e.clientY);
        state.movedSinceLoad = true;
        const now = performance.now();
        if (now - lastSampleT < 16) return;
        lastSampleT = now;
        state.pointerSamples.push({ x: e.clientX, y: e.clientY, t: now });
        if (state.pointerSamples.length > 400) state.pointerSamples.shift();
        render();
      };

      const onClick = (e) => {
        if (!e.isTrusted) return;
        noteActionFocus();
        state.lastClickTrusted = true;
        if (state.movedSinceLoad) state.hadMouseMoveBeforeClick = true;
        state.clicks.push({ t: performance.now() });
        if (state.clicks.length > 80) state.clicks.shift();
        render();
      };

      const onKey = (e) => {
        if (!e.isTrusted) return;
        noteActionFocus();
        state.keys.push({ t: performance.now() });
        if (state.keys.length > 120) state.keys.shift();
        render();
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', () => {
        // blur transitório (activate/troca de app) — só marca taint; não trava veredito sozinho
        state.backgroundTainted = true;
        state._focusedSince = null;
        render();
      });
      window.addEventListener('focus', () => {
        // voltou o foco: limpa taint se não houve ação sem foco
        if (!state.backgroundLocked) {
          state.backgroundTainted = false;
          state._focusedSince = performance.now();
        }
        render();
      });
      document.addEventListener('visibilitychange', () => {
        if (rawFocused() && !state.backgroundLocked) state.backgroundTainted = false;
        render();
      });

      const resetBtn = rail.querySelector('.rail-reset');
      if (resetBtn && resetBtn.dataset.wired !== '1') {
        resetBtn.dataset.wired = '1';
        resetBtn.addEventListener('click', reset);
      }

      render();
      return { reset, render, state };
    };

    const ensureFallbackRail = () => {
      let rail = document.getElementById(RAIL_ID);
      if (!rail) {
        rail = document.createElement('aside');
        rail.id = RAIL_ID;
        rail.setAttribute('aria-label', 'Feedback de detecção');
        rail.innerHTML = \`
          <div class="rail-toolbar">
            <button type="button" class="rail-reset" title="Zerar comportamento">↺</button>
            <button type="button" class="rail-toggle" id="btn-rail-toggle" aria-expanded="true" title="Minimizar painel">«</button>
          </div>
          <div class="rail-body">
            <div class="score-card">
              <p class="score-label">Veredito</p>
              <p class="score-verdict is-warn">inconclusivo</p>
              <p class="score-meta">comportamento — · live</p>
            </div>
            <section class="panel" id="human-cdp-fp-panel">
              <h2>Fingerprint</h2>
              <p class="hint">meta.fingerprint (CDP)</p>
              <pre id="human-cdp-fp-pre" style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:0.72rem;line-height:1.35;color:#c5d0db;max-height:14rem;overflow:auto">(carregando…)</pre>
            </section>
            <section class="panel">
              <h2>Comportamento</h2>
              <p class="hint">Detector portátil (fora do bot-lab). Interaja na página.</p>
              <ul class="checks-list"></ul>
              <div class="meters">
                <div><span>Pontos</span><strong id="human-cdp-debug-points">0</strong></div>
                <div><span>Cliques</span><strong id="human-cdp-debug-clicks">0</strong></div>
                <div><span>Teclas</span><strong id="human-cdp-debug-keys">0</strong></div>
                <div><span>Trusted</span><strong id="human-cdp-debug-trusted">—</strong></div>
                <div><span>Foco</span><strong id="human-cdp-debug-focus">—</strong></div>
                <div><span>Cursor</span><strong id="human-cdp-debug-xy">—</strong></div>
              </div>
            </section>
          </div>
        \`;
        document.documentElement.appendChild(rail);
        document.body.classList.add('human-cdp-debug-pad');
      }
      wireMinimize(rail, rail.querySelector('.rail-toggle'));
      createLiveVerdict(rail);
      renderFingerprint(rail, FP);
      return rail;
    };

    const labRail = document.querySelector('.feedback-rail')
      || document.getElementById('feedback-rail');
    const isBotLab = !!(labRail && document.getElementById('score-verdict') && document.getElementById('behavior-list'));
    const rail = isBotLab ? ensureBotLabRail() : ensureFallbackRail();
    if (isBotLab) renderFingerprint(rail, FP);
    ensureFigMouse();
    moveMouse(40, 40);

    window.__humanCdpDebug = {
      enabled: true,
      isBotLab,
      fingerprint: FP,
      move: moveMouse,
      setFingerprint(fp) {
        this.fingerprint = fp;
        const railEl = document.querySelector('.feedback-rail')
          || document.getElementById(RAIL_ID);
        renderFingerprint(railEl, fp);
      },
      refresh() {
        const r = document.querySelector('.feedback-rail')
          || document.getElementById('feedback-rail');
        this.isBotLab = !!(r && document.getElementById('score-verdict') && document.getElementById('behavior-list'));
        if (this.isBotLab) ensureBotLabRail();
        else ensureFallbackRail();
        const railEl = document.querySelector('.feedback-rail')
          || document.getElementById(RAIL_ID);
        renderFingerprint(railEl, this.fingerprint);
        ensureFigMouse();
      },
      snapshot() {
        const fig = document.getElementById('fig-mouse');
        const railEl = document.querySelector('.feedback-rail')
          || document.getElementById(RAIL_ID);
        return {
          enabled: true,
          isBotLab: this.isBotLab,
          hasFingerprint: !!(this.fingerprint && typeof this.fingerprint === 'object'),
          mouseOn: !!(fig && fig.classList.contains('is-on')),
          railFixed: !!railEl,
          railMinimizable: !!document.getElementById('btn-rail-toggle')
            || !!document.querySelector('.rail-toggle'),
          floating: false,
          verdict: (railEl && railEl.querySelector('.score-verdict')?.textContent?.trim())
            || document.getElementById('score-verdict')?.textContent?.trim()
            || null,
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
