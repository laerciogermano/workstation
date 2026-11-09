/**
 * iOS PWA (A2HS): `visualViewport.height` costuma PARAR acima do home indicator.
 * Se o shell usa isso como max-height, sobra uma faixa com o fundo `--nt-canvas` (cinza).
 *
 * Correção: altura = `window.innerHeight` (área coberta com viewport-fit=cover).
 * O layout visual é `position:fixed; inset:0` em `#root` (app.css) — este script
 * só sincroniza `--app-height` e marca o display-mode.
 */
export function installViewportHeightLock(): void {
  const root = document.documentElement;

  const isInstalled = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    // iOS Safari legado
    (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true);

  const apply = () => {
    // NUNCA usar só visualViewport.height — é a causa da faixa cinza no PWA instalado.
    const h = Math.round(window.innerHeight);
    if (h > 0) root.style.setProperty('--app-height', `${h}px`);
    root.dataset.pwa = isInstalled() ? '1' : '0';
  };

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => {
      apply();
      setTimeout(apply, 100);
      setTimeout(apply, 400);
    });
  });
  // Teclado / barras: atualiza sem encolher abaixo do innerHeight
  window.visualViewport?.addEventListener('resize', apply);
}
