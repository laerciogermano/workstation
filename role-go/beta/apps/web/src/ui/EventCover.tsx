import type { JSX, ReactNode } from 'react';
import { cx } from './primitives';
import s from './ui.module.css';

/** Capa do evento com srcset das variantes (card 1080×1350 / thumb 360×450). */
export function EventCover({ coverUrl, thumbUrl, height, className, children, eager }: { coverUrl: string | null; thumbUrl?: string | null; height: number | string; className?: string; children?: ReactNode; eager?: boolean }): JSX.Element {
  const srcSet = coverUrl && thumbUrl ? `${thumbUrl} 360w, ${coverUrl} 1080w` : undefined;
  return (
    <div className={cx(s.cover, className)} style={{ height }}>
      {coverUrl ? (
        <img src={coverUrl} srcSet={srcSet} sizes="(max-width: 480px) 100vw, 480px" alt="" width={1080} height={1350} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : null}
      {children}
    </div>
  );
}

export function CoverBadges({ children }: { children: ReactNode }): JSX.Element {
  return <div className={s.coverTL}>{children}</div>;
}
