import type { Accent } from '@rolego/contracts';
import { type JSX, type ReactNode, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useMe } from '../lib/queries';
import { t } from '../lib/i18n/pt-BR';
import { Icon, type IconName } from './Icon';
import { accentStyle, cx, IconButton } from './primitives';
import s from './ui.module.css';

/** Corpo da tela. `tabs` deixa espaço para a tab bar; `foot` para o rodapé fixo de ações. */
export function Screen({ children, tabs, foot, flush, title }: { children: ReactNode; tabs?: boolean; foot?: boolean; flush?: boolean; title?: string }): JSX.Element {
  useEffect(() => {
    if (title) document.title = `${title} · RoleGo`;
  }, [title]);
  return <main className={cx(s.body, tabs && s.tb, foot && s.ft, flush && s.flush)}>{children}</main>;
}

export function TopBar({ title, back = true, right, onBack }: { title?: ReactNode; back?: boolean; right?: ReactNode; onBack?: () => void }): JSX.Element {
  const nav = useNavigate();
  return (
    <header className={s.top}>
      {back ? <IconButton icon="back" label={t.back} onClick={onBack ?? (() => (window.history.length > 1 ? nav(-1) : nav('/explorar')))} /> : null}
      {title ? <span className={cx(s.topTitle, s.grow, s.ell)}>{title}</span> : <span className={s.grow} />}
      {right}
    </header>
  );
}

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/explorar', label: t.tabs.explore, icon: 'compass' },
  { to: '/meus-roles', label: t.tabs.mine, icon: 'calok' },
  { to: '/organizar', label: t.tabs.organize, icon: 'grid' },
  { to: '/perfil', label: t.tabs.profile, icon: 'user' },
];

/** Tab bar só para quem está logado (visitante vê só Explorar, sem rodapé). */
export function TabBar(): JSX.Element | null {
  const { data: me } = useMe();
  if (!me) return null;
  return (
    <nav className={s.tabbar} aria-label="Navegação principal">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => cx(s.tab, isActive && s.tabOn)}>
          <Icon name={tab.icon} size="l" />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Footer({ children, column }: { children: ReactNode; column?: boolean }): JSX.Element {
  return <div className={cx(s.foot, column && s.footCol)}>{children}</div>;
}

/** Bottom sheet acessível: foco inicial, Esc fecha, clique no fundo fecha. */
export function Sheet({ open, onClose, accent = 'violet', label, children }: { open: boolean; onClose: () => void; accent?: Accent; label: string; children: ReactNode }): JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className={s.dim} onClick={onClose} aria-hidden />
      <div ref={ref} className={s.sheet} style={accentStyle(accent)} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className={s.grab} />
        {children}
      </div>
    </>
  );
}
