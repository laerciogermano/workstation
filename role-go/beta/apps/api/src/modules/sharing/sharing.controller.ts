import { Controller, Get, Header, Inject, Param, Query, Res } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { Response } from 'express';
import { Public } from '../../shared/auth/viewer';
import { DB, rows, type Db } from '../../shared/db/db';
import { organizers, shareClicks } from '../../shared/db/schema';
import { env } from '../../shared/env';
import { escapeHtml, formatWhen } from '../../shared/kernel/format';

type OgEvent = { id: string; slug: string; title: string; startsAt: Date | null; venueName: string; neighborhood: string; cityName: string; visibility: 'public' | 'private'; status: string; description: string; og: string | null };
const SOURCES = new Set(['wa', 'ig', 'copy', 'other']);

/**
 * Páginas para crawlers (WhatsApp/Instagram): HTML mínimo com Open Graph + redirect para a SPA (docs/03 §5.9).
 * Evento privado nunca mostra endereço no preview — só bairro/cidade.
 */
@Controller()
export class SharingController {
  constructor(@Inject(DB) private readonly db: Db) {}

  private page(res: Response, meta: { title: string; description: string; image: string | null; url: string; target: string }): string {
    const app = env().APP_URL;
    const img = meta.image ? `${app}${meta.image}` : `${app}/og-default.png`;
    res.setHeader('Cache-Control', 'public, max-age=300');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapeHtml(meta.title)} · RoleGo</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="RoleGo">
<meta property="og:title" content="${escapeHtml(meta.title)}"><meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:image" content="${escapeHtml(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(meta.url)}"><meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${escapeHtml(meta.target)}">
</head><body style="background:#000;color:#fff;font-family:sans-serif"><a href="${escapeHtml(meta.target)}" style="color:#00e5e5">Abrir no RoleGo</a>
<script>location.replace(${JSON.stringify(meta.target)})</script></body></html>`;
  }

  @Public()
  @Get('e/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async event(@Param('slug') slug: string, @Query('s') source: string | undefined, @Query('c') code: string | undefined, @Res({ passthrough: true }) res: Response): Promise<string> {
    const [e] = await rows<OgEvent>(
      this.db,
      sql`SELECT e.id, e.slug, e.title, e.starts_at AS "startsAt", e.venue_name AS "venueName", e.neighborhood, e.city_name AS "cityName",
            e.visibility, e.status, e.description, m.variants->>'og' AS og
          FROM events e LEFT JOIN media_assets m ON m.id = e.cover_asset_id WHERE e.slug = ${slug.slice(0, 120)}`,
    );
    const app = env().APP_URL;
    const q = code ? `?c=${encodeURIComponent(code.slice(0, 12))}` : '';
    const target = `${app}/app/e/${encodeURIComponent(slug)}${q}`;
    if (!e || e.status === 'draft' || e.status === 'removed') {
      res.status(404);
      return this.page(res, { title: 'Rolê não encontrado', description: 'Descubra o que está rolando perto de você.', image: null, url: `${app}/e/${slug}`, target: `${app}/` });
    }
    if (source && SOURCES.has(source)) await this.db.insert(shareClicks).values({ eventId: e.id, source: source as 'wa' | 'ig' | 'copy' | 'other' });
    const when = e.startsAt ? formatWhen(e.startsAt) : '';
    const place = e.visibility === 'private' ? `${e.neighborhood || e.cityName} · evento privado` : e.venueName;
    const prefix = e.status === 'cancelled' ? 'CANCELADO · ' : '';
    return this.page(res, {
      title: `${prefix}${e.title}`,
      description: `${when} · ${place}`,
      image: e.og ? `/media/${e.og}` : null,
      url: `${app}/e/${e.slug}`,
      target,
    });
  }

  @Public()
  @Get('o/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async organizer(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response): Promise<string> {
    const [o] = await this.db.select().from(organizers).where(eq(organizers.slug, slug.slice(0, 80)));
    const app = env().APP_URL;
    if (!o) {
      res.status(404);
      return this.page(res, { title: 'Organizador não encontrado', description: 'RoleGo — Viva o Rolê', image: null, url: `${app}/o/${slug}`, target: `${app}/` });
    }
    return this.page(res, { title: o.displayName, description: o.bio ?? 'Rolês no RoleGo', image: null, url: `${app}/o/${o.slug}`, target: `${app}/app/o/${o.slug}` });
  }
}
