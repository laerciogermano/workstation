/* Ícones do protótipo (sprite SVG), gerados a partir de docs/prototipos/index.html. */
// why: hex só nas marcas de terceiros (logo do Google); o resto usa currentColor.
import type { JSX } from 'react';
import s from './ui.module.css';

export const ICONS = ['back', 'heart', 'x', 'undo', 'filter', 'pin', 'cal', 'calok', 'clock', 'users', 'share', 'search', 'compass', 'plus', 'user', 'check', 'lock', 'star', 'flag', 'gear', 'camera', 'chev', 'chevd', 'bolt', 'link', 'copy', 'grid', 'list', 'cards', 'feed', 'mail', 'eye', 'more', 'nav', 'trash', 'edit', 'image', 'wa', 'ig', 'shield', 'logout', 'music', 'glass', 'party', 'home', 'mask', 'key', 'face', 'google', 'apple'] as const;
export type IconName = (typeof ICONS)[number];

export function IconSprite(): JSX.Element {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
        <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.5-9C1 8 3.2 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.5 0 5.7 3.5 4.2 7-2 4.4-9.5 9-9.5 9z"/></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
        <symbol id="i-undo" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></symbol>
        <symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 7h18M3 17h18"/><circle cx="9" cy="7" r="2.4" style={{ fill: 'var(--rg-screen)' }}/><circle cx="15" cy="17" r="2.4" style={{ fill: 'var(--rg-screen)' }}/></symbol>
        <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0113 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></symbol>
        <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></symbol>
        <symbol id="i-calok" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
        <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.6.2 4 2 4.5 4.5"/></symbol>
        <symbol id="i-share" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></symbol>
        <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></symbol>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.8 6 6.2.6-4.7 4.2 1.4 6.2L12 16.8 6.3 20l1.4-6.2L3 9.6 9.2 9z"/></symbol>
        <symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></symbol>
        <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></symbol>
        <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/></symbol>
        <symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
        <symbol id="i-chevd" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></symbol>
        <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></symbol>
        <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></symbol>
        <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><path d="M17 14v6M14 17h6"/></symbol>
        <symbol id="i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></symbol>
        <symbol id="i-cards" viewBox="0 0 24 24"><rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="M3 7.5v9M21 7.5v9"/></symbol>
        <symbol id="i-feed" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="9" rx="2"/><path d="M4 16.5h16M4 20.5h10"/></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></symbol>
        <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>
        <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></symbol>
        <symbol id="i-nav" viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8z"/></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></symbol>
        <symbol id="i-edit" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></symbol>
        <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/></symbol>
        <symbol id="i-wa" viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1z"/><path d="M9 9.5c0 2.8 2.7 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z"/></symbol>
        <symbol id="i-ig" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".8" fill="currentColor"/></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/></symbol>
        <symbol id="i-logout" viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h10"/></symbol>
        <symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></symbol>
        <symbol id="i-glass" viewBox="0 0 24 24"><path d="M5 4h14l-7 8zM12 12v8M8 20h8"/></symbol>
        <symbol id="i-party" viewBox="0 0 24 24"><path d="M4 20l5-14 9 9z"/><path d="M14 4l1 2M19 6l-2 1M20 11h-2M11 3v2"/></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z"/></symbol>
        <symbol id="i-mask" viewBox="0 0 24 24"><path d="M4 6c3 1 13 1 16 0 0 7-3 12-8 12S4 13 4 6z"/><path d="M8.5 10.5h2M13.5 10.5h2"/></symbol>
        <symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></symbol>
        <symbol id="i-face" viewBox="0 0 24 24"><path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0"/></symbol>
        <symbol id="i-google" viewBox="0 0 24 24"><path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 01-1.9 2.9v2.4h3c1.8-1.6 2.8-4 2.8-7z" fill="#4285F4" stroke="none"/><path d="M12 21.5c2.6 0 4.7-.9 6.2-2.3l-3-2.4c-.8.6-1.9 1-3.2 1-2.5 0-4.6-1.7-5.3-3.9H3.6v2.4A9.4 9.4 0 0012 21.5z" fill="#34A853" stroke="none"/><path d="M6.7 13.9a5.6 5.6 0 010-3.8V7.7H3.6a9.4 9.4 0 000 8.6z" fill="#FBBC05" stroke="none"/><path d="M12 6.2c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.4 9.4 0 003.6 7.7l3.1 2.4C7.4 7.9 9.5 6.2 12 6.2z" fill="#EA4335" stroke="none"/></symbol>
        <symbol id="i-apple" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.3z"/></symbol>
      </defs>
    </svg>
  );
}

type Size = 's' | 'm' | 'l' | 'xl';
const SIZE: Record<Size, string | undefined> = { s: s.iconS, m: undefined, l: s.iconL, xl: s.iconXL };

export function Icon({ name, size = 'm', fill = false, className, label }: { name: IconName; size?: Size; fill?: boolean; className?: string | undefined; label?: string }): JSX.Element {
  const cls = [s.icon, SIZE[size], fill ? s.iconFill : undefined, className].filter(Boolean).join(' ');
  return (
    <svg className={cls} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
