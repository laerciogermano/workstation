/**
 * iOS PWA (Add to Home Screen): `100dvh` / `100svh` no boot costumam ser menores
 * que a área real → faixa cinza sob a tabbar. Trava `--app-height` no visualViewport.
 */
export function installViewportHeightLock(): void {
  const root = document.documentElement;

  const apply = () => {
    const vv = window.visualViewport;
    const h = Math.round(vv?.height ?? window.innerHeight);
    if (h > 0) root.style.setProperty('--app-height', `${h}px`);
  };

  apply();
  window.visualViewport?.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('scroll', apply);
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => {
      apply();
      // iOS às vezes só corrige safe-area após o segundo frame
      setTimeout(apply, 250);
    });
  });
}
