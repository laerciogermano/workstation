/** Logo V9 “Duas notinhas” + wordmark: notinhas (azul profundo) .shop (verde). Marca pública única. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wm ${className}`} aria-label="notinhas.shop">
      <svg className="sym" viewBox="40 34 176 188" aria-hidden="true">
        <path style={{ fill: 'var(--nt-logo-a)' }} d="M52 52 A12 12 0 0 1 64 40 L104 40 A12 12 0 0 1 116 52 L116 202 L100 216 L84 202 L68 216 L52 202 Z" />
        <path style={{ fill: 'var(--nt-logo-b)' }} d="M140 52 A12 12 0 0 1 152 40 L192 40 A12 12 0 0 1 204 52 L204 122 L188 136 L172 122 L156 136 L140 122 Z" />
      </svg>
      <b>notinhas</b>
      <i>.shop</i>
    </span>
  );
}
