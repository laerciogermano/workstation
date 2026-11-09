import type { RequestHandler } from 'express';
import { AppError } from '../../shared/http/problem.js';

/** Hosts de imagem que o browser bloqueia (hotlink CF) — servimos via mesma origem. */
const ALLOW = [/(^|\.)si5\.com\.br$/i, /(^|\.)openfoodfacts\.org$/i, /(^|\.)openfoodfacts\.net$/i];

function allowed(url: URL): boolean {
  return url.protocol === 'https:' && ALLOW.some((re) => re.test(url.hostname));
}

/**
 * GET /api/v1/imagens/proxy?u=https://… — público (img não manda fingerprint).
 * Só hosts allowlist; cache curto no browser.
 */
export function imageProxyHandler(): RequestHandler {
  return async (req, res, next) => {
    try {
      const raw = String(req.query.u ?? '');
      if (!raw || raw.length > 800) throw new AppError('VALIDATION_FAILED', 'URL de imagem inválida.');
      let target: URL;
      try {
        target = new URL(raw);
      } catch {
        throw new AppError('VALIDATION_FAILED', 'URL de imagem inválida.');
      }
      if (!allowed(target)) throw new AppError('VALIDATION_FAILED', 'Origem de imagem não permitida.');

      const upstream = await fetch(target, {
        signal: AbortSignal.timeout(8_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; notinhas.shop/1.0)',
          Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
          Referer: `${target.origin}/`,
        },
      });
      if (!upstream.ok) throw new AppError('NOT_FOUND', 'Imagem indisponível.');
      const type = upstream.headers.get('content-type') || 'image/webp';
      if (!type.startsWith('image/')) throw new AppError('VALIDATION_FAILED', 'Resposta não é imagem.');
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length > 2_500_000) throw new AppError('VALIDATION_FAILED', 'Imagem grande demais.');
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.send(buf);
    } catch (err) {
      next(err);
    }
  };
}
