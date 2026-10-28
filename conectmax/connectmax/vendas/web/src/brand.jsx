import { useEffect, useState } from 'react';

const THEME_KEY = 'cx-theme';

export function readTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'dia' ? 'dia' : 'noite';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'noite';
    return readTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === 'noite' ? 'dia' : 'noite'));
  }

  return { theme, toggle };
}

function LogoMark() {
  return (
    <svg className="sym" viewBox="0 0 100 100" aria-hidden>
      <line
        x1="18"
        y1="18"
        x2="82"
        y2="82"
        stroke="currentColor"
        strokeWidth="15"
      />
      <line
        x1="82"
        y1="18"
        x2="18"
        y2="82"
        stroke="currentColor"
        strokeWidth="15"
      />
      <circle cx="16" cy="16" r="14" fill="var(--accent-soft)" />
      <circle cx="84" cy="16" r="14" fill="var(--accent-soft)" />
      <circle cx="16" cy="84" r="14" fill="var(--accent-soft)" />
      <circle cx="84" cy="84" r="14" fill="var(--accent-soft)" />
    </svg>
  );
}

/** Logo conect — usada no topo do menu esquerdo. */
export function BrandLogo({ onHome, className = 'logo' }) {
  return (
    <a
      className={className}
      href="/"
      onClick={(e) => {
        if (!onHome) return;
        e.preventDefault();
        onHome();
      }}
    >
      <LogoMark />
      conect
      <span className="tec">tec</span>
    </a>
  );
}

export function ThemeToggle({ theme, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={onToggle}
      aria-label={
        theme === 'noite' ? 'Mudar para Hero Dia' : 'Mudar para Hero Noite'
      }
    >
      {theme === 'noite' ? 'Hero Dia' : 'Hero Noite'}
    </button>
  );
}

export function BrandBar({ eyebrow }) {
  if (!eyebrow) return null;
  return (
    <div className="brand-bar">
      <span className="eyebrow">{eyebrow}</span>
    </div>
  );
}
