/** Card da vitrine (RF-39): personagem, tipo, valores, PR/conquista e apoio. */
import type { FeedPost } from '@fitness/contracts';
import { POST_KIND_LABEL } from '@fitness/domain';
import { Link } from 'react-router';
import { timeAgo } from '../../lib/date';
import { useKudo } from '../../lib/queries';
import { Icon } from '../../ui/icon';
import { Avatar, Chip } from '../../ui/kit';

export function FeedCard({ post: f, preview = false }: { post: FeedPost; preview?: boolean }) {
  const kudo = useKudo();
  return (
    <article className="fc">
      <Link to={`/p/${f.nick}`} className="fc-h" viewTransition tabIndex={preview ? -1 : 0}>
        <header>
          <Avatar nick={f.nick} color={f.color} />
          <div>
            <b>
              {f.nick}
              {f.mine && <i className="you-t">você</i>}
            </b>
            <span>
              {f.gymName ? `${f.gymName} · ` : ''}
              {preview ? 'agora' : timeAgo(f.createdAt)}
            </span>
          </div>
          <span className="sp" />
          <Chip tone="meta">{POST_KIND_LABEL[f.kind]}</Chip>
        </header>
      </Link>
      <h3>{f.title}</h3>
      <div className="fvals">
        {f.values.map(([l, v]) => (
          <div key={l}>
            <span>{l}</span>
            <b className="tnum">{v}</b>
          </div>
        ))}
      </div>
      {f.pr && (
        <p className="badge pr">
          <Icon name="trophy" />
          Recorde pessoal · {f.pr}
        </p>
      )}
      {f.achievement && (
        <p className="badge cq">
          <Icon name="spark" />
          {f.achievement}
        </p>
      )}
      <footer>
        <button
          type="button"
          className={`kudo${f.kudoed ? ' on' : ''}`}
          aria-pressed={f.kudoed}
          disabled={preview || f.mine}
          onClick={() => kudo.mutate({ id: f.id, on: !f.kudoed })}
        >
          <Icon name="heart" />
          <span className="tnum">{f.kudos}</span> apoio{f.kudos === 1 ? '' : 's'}
        </button>
      </footer>
    </article>
  );
}
