// Ícones de traço (desenhos do Lucide, licença ISC). O nome acessível fica no botão.
const PATHS = {
  plus: 'M5 12h14M12 5v14',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4',
  minus: 'M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  fit: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2',
  collapseAll: 'm7 20 5-5 5 5M7 4l5 5 5-5',
  expandAll: 'm7 15 5 5 5-5M7 9l5-5 5 5',
  panelClose: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM15 3v18M8 9l3 3-3 3',
  panelOpen: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM15 3v18M10 15l-3-3 3-3',
} as const;

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
