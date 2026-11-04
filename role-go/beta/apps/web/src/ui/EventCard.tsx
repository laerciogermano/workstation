import type { EventCard as Card, RsvpStatus } from '@rolego/contracts';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { dayLabel, distanceLabel, endsIn, hhmm, priceLabel, whenLabel } from '../lib/format';
import { t } from '../lib/i18n/pt-BR';
import { CoverBadges, EventCover } from './EventCover';
import { Icon } from './Icon';
import { AvatarStack, Badge, cx } from './primitives';
import s from './event-card.module.css';
import u from './ui.module.css';

export const eventPath = (e: { slug: string }): string => `/app/e/${e.slug}`;

export function HeartButton({ on, onToggle, size = 44, title }: { on: boolean; onToggle: () => void; size?: number; title: string }): JSX.Element {
  return (
    <button
      type="button"
      className={cx(s.heart, on && s.heartOn)}
      style={{ width: size, height: size }}
      aria-pressed={on}
      aria-label={on ? `Remover interesse em ${title}` : `Tenho interesse em ${title}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      <Icon name="heart" size={size > 44 ? 'l' : 'm'} />
    </button>
  );
}

function CardBadges({ e }: { e: Card }): JSX.Element {
  return (
    <CoverBadges>
      {e.scheduled && e.phase === 'live' && e.status === 'published' ? (
        <Badge tone="dark" live>
          {t.live}
        </Badge>
      ) : null}
      {e.visibility === 'private' ? (
        <Badge tone="dark">
          <Icon name="lock" size="s" className={u.yl} />
          <span className={u.yl}>{t.private}</span>
        </Badge>
      ) : (
        <Badge tone="dark">{e.type.label}</Badge>
      )}
      {e.ageRating !== 'free' ? <Badge tone="dark">{t.ageRatings[e.ageRating]}</Badge> : null}
      {e.isFree ? <Badge tone="dark">{t.free}</Badge> : null}
    </CoverBadges>
  );
}

/** Card do feed (T-10): data, distância, preço e prova social visíveis sem abrir o evento. */
export function EventCardFeed({ e, onToggleInterest, eager }: { e: Card; onToggleInterest?: (on: boolean) => void; eager?: boolean }): JSX.Element {
  const price = priceLabel(e);
  const live = e.phase === 'live';
  return (
    <Link to={eventPath(e)} className={cx(s.ecard, e.status === 'cancelled' && s.cancelled)}>
      <EventCover coverUrl={e.coverUrl} thumbUrl={e.coverThumbUrl} height={190} eager={eager}>
        {e.status === 'cancelled' ? <div className={s.strip}>{t.cancelled}</div> : <CardBadges e={e} />}
        <p className={s.pt}>{e.title}</p>
      </EventCover>
      <div className={s.info}>
        <p className={s.tt}>{e.title}</p>
        <p className={s.ln}>
          <Icon name={live ? 'clock' : 'cal'} size="s" />
          {!e.scheduled ? 'Sem data definida' : live ? `Agora · ${hhmm(e.startsAt)}–${hhmm(e.endsAt)} · ${endsIn(e.endsAt)}` : whenLabel(e.startsAt, e.endsAt)}
        </p>
        <p className={s.ln}>
          <Icon name="pin" size="s" />
          <span className={u.ell}>
            {e.visibility === 'private' ? e.venue.neighborhood || e.venue.city : e.venue.name}
            {e.distanceKm !== null ? ` · ${distanceLabel(e.distanceKm, e.visibility)}` : ''}
            {price && !e.isFree ? (
              <>
                {' · '}
                <b className={u.b} style={{ color: 'var(--rg-text)' }}>
                  {price}
                </b>
              </>
            ) : null}
          </span>
        </p>
        <div className={s.soc}>
          <div className={u.row}>
            {e.peoplePreview.length ? <AvatarStack people={e.peoplePreview} /> : null}
            <div className={s.counts}>
              <span>
                <b>{e.counts.going}</b> {t.going}
              </span>
              <span>
                <b>{e.counts.interested}</b> ♥
              </span>
            </div>
          </div>
          {onToggleInterest ? <HeartButton on={e.viewer.interested} title={e.title} onToggle={() => onToggleInterest(!e.viewer.interested)} /> : null}
        </div>
      </div>
    </Link>
  );
}

const RSVP_BADGE: Partial<Record<RsvpStatus, { tone: 'cyan' | 'yellow' | 'magenta' | 'green'; label: string }>> = {
  confirmed: { tone: 'cyan', label: 'Vou' },
  approved: { tone: 'green', label: 'Aprovado' },
  pending: { tone: 'yellow', label: 'Pedido pendente' },
  cancelled_by_event: { tone: 'magenta', label: 'Cancelado' },
};

/** Card compacto (lista T-12, Meus rolês T-30, busca T-15). */
export function EventCardMini({ e, rsvp, right, to }: { e: Card; rsvp?: RsvpStatus | null; right?: JSX.Element; to?: string }): JSX.Element {
  const badge = rsvp ? RSVP_BADGE[rsvp] : undefined;
  return (
    <Link to={to ?? eventPath(e)} className={s.mini}>
      <EventCover coverUrl={e.coverThumbUrl} height={82} className={s.cover} />
      <div className={u.grow}>
        <p className={cx(u.b, u.ell)}>{e.title}</p>
        <p className={cx(u.small, u.soft, u.mt4)}>
          {e.phase === 'live' ? <span className={u.gr}>● {t.live} · </span> : null}
          {dayLabel(e.startsAt)} · {hhmm(e.startsAt)}
        </p>
        <p className={cx(u.small, u.muted, u.ell)}>
          {e.visibility === 'private' ? e.venue.neighborhood : e.venue.name}
          {e.distanceKm !== null ? ` · ${distanceLabel(e.distanceKm, e.visibility)}` : ''}
          {priceLabel(e) ? ` · ${priceLabel(e)}` : ''}
        </p>
        {badge ? (
          <span className={u.mt4} style={{ display: 'inline-block' }}>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </span>
        ) : null}
      </div>
      {right ?? <Icon name="chev" className={u.muted} />}
    </Link>
  );
}
