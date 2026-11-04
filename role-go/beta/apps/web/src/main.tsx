import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/poppins/800-italic.css';
import '@fontsource/poppins/900-italic.css';
import './app/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

/** PWA-like: sem zoom por double-tap em campos; pinch Safari bloqueado. */
function installAppGestures(): void {
  const isField = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('input, textarea, select, [contenteditable="true"]');
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
  document.addEventListener('dblclick', (e) => e.preventDefault(), { capture: true });
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
}

installAppGestures();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
