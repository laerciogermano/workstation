/** PWA-like (RoleGo): desliga zoom (double-tap, pinch, Ctrl+scroll, Ctrl+/−). */
export function installAppGestures(): void {
  const isField = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('input, textarea, select, [contenteditable="true"]');
  const onMap = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('.leaflet-container, .mapbox');

  let lastTouch = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      if (!isField(e.target)) return;
      const now = Date.now();
      if (now - lastTouch < 350) e.preventDefault();
      lastTouch = now;
    },
    { passive: false, capture: true },
  );
  // pinch (iOS Safari ignora user-scalable=no em alguns casos); mapa Leaflet pode pinçar
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1 && !onMap(e.target)) e.preventDefault();
    },
    { passive: false, capture: true },
  );
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
    document.addEventListener(
      ev,
      (e) => {
        if (!onMap(e.target)) e.preventDefault();
      },
      { passive: false },
    );
  }
  document.addEventListener('dblclick', (e) => e.preventDefault(), { capture: true });
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false, capture: true },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0') e.preventDefault();
    },
    { capture: true },
  );
}
