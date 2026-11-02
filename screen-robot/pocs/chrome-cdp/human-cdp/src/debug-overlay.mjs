/**
 * Overlay de diagnóstico (bot-lab feedback-rail) flutuando junto ao mouse.
 * Injetado via Runtime.evaluate quando connect({ debug: true }).
 */

/** Expressão JS (IIFE) que ativa o overlay na página atual. */
export function enableDebugOverlayExpression() {
  return `(() => {
    const OFFSET_X = 28;
    const OFFSET_Y = 18;
    const STYLE_ID = 'human-cdp-debug-style';
    const FALLBACK_ID = 'human-cdp-debug-fallback';

    if (window.__humanCdpDebug?.enabled) {
      window.__humanCdpDebug.refresh();
      return window.__humanCdpDebug.snapshot();
    }

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = \`
        .shell.human-cdp-debug-shell {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .feedback-rail.human-cdp-debug-float {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          height: auto !important;
          max-height: min(70vh, 32rem) !important;
          width: min(18rem, calc(100vw - 1rem)) !important;
          margin: 0 !important;
          padding: 0.65rem !important;
          border: 1px solid #2c3846 !important;
          border-radius: 10px !important;
          box-shadow: 0 10px 28px rgba(0,0,0,0.45) !important;
          background: rgba(12, 16, 22, 0.94) !important;
          backdrop-filter: blur(10px) !important;
          z-index: 2147483646 !important;
          pointer-events: none !important;
          overflow: auto !important;
          will-change: transform;
        }
        #\${FALLBACK_ID} {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 2147483646;
          pointer-events: none;
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
          border: 1px solid #2c3846;
          background: rgba(12, 16, 22, 0.94);
          color: #e8eef4;
          font: 12px/1.35 ui-sans-serif, system-ui, sans-serif;
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          max-width: 16rem;
          will-change: transform;
        }
      \`;
      document.documentElement.appendChild(style);
    }

    const rail = document.querySelector('.feedback-rail');
    const isBotLab = !!(rail && document.getElementById('score-verdict'));
    let panel = null;

    if (isBotLab) {
      const shell = document.querySelector('.shell');
      if (shell) shell.classList.add('human-cdp-debug-shell');
      rail.classList.add('human-cdp-debug-float');
      panel = rail;
      const fb = document.getElementById(FALLBACK_ID);
      if (fb) fb.remove();
    } else {
      panel = document.getElementById(FALLBACK_ID);
      if (!panel) {
        panel = document.createElement('div');
        panel.id = FALLBACK_ID;
        panel.textContent = 'human-cdp debug · fora do bot-lab';
        document.documentElement.appendChild(panel);
      }
    }

    const place = (x, y) => {
      if (!panel) return;
      const w = panel.offsetWidth || 280;
      const h = panel.offsetHeight || 120;
      let left = x + OFFSET_X;
      let top = y + OFFSET_Y;
      if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - OFFSET_X);
      if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - h - 8);
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      panel.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
    };

    const onMove = (e) => {
      if (!e.isTrusted) return;
      place(e.clientX, e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });

    window.__humanCdpDebug = {
      enabled: true,
      isBotLab,
      move: place,
      refresh() {
        const r = document.querySelector('.feedback-rail');
        const lab = !!(r && document.getElementById('score-verdict'));
        this.isBotLab = lab;
        if (lab) {
          const shell = document.querySelector('.shell');
          if (shell) shell.classList.add('human-cdp-debug-shell');
          r.classList.add('human-cdp-debug-float');
          panel = r;
          const fb = document.getElementById(FALLBACK_ID);
          if (fb) fb.remove();
        }
      },
      snapshot() {
        return {
          enabled: true,
          isBotLab: this.isBotLab,
          floating: !!(panel && panel.classList?.contains('human-cdp-debug-float'))
            || panel?.id === FALLBACK_ID,
          verdict: document.getElementById('score-verdict')?.textContent?.trim() || null,
        };
      },
    };

    place(40, 40);
    return window.__humanCdpDebug.snapshot();
  })()`;
}

/** Move o painel para (x,y) se o overlay estiver ativo. */
export function moveDebugOverlayExpression(x, y) {
  return `(() => {
    const d = window.__humanCdpDebug;
    if (!d?.enabled || typeof d.move !== 'function') return false;
    d.move(${Number(x)}, ${Number(y)});
    return true;
  })()`;
}
