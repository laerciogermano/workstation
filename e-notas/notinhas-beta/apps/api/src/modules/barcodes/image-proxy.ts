import type { RequestHandler } from 'express';
import { AppError } from '../../shared/http/problem.js';
import { isPublicHttpsUrl } from './photo-url.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function fetchImage(target: URL, referer: string | null) {
  return fetch(target, {
    signal: AbortSignal.timeout(12_000),
    headers: {
      'User-Agent': UA,
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      ...(referer ? { Referer: referer } : {}),
    },
    redirect: 'follow',
  });
}

/**
 * GET /api/v1/imagens/proxy?u=https://… — público (img não manda fingerprint).
 * Qualquer https público (SI5, OFF, Bing/Google CDNs); bloqueia IP privado.
 * URLs longas (Bing) até 8k; tenta Referer Google e depois sem Referer.
 */
export function imageProxyHandler(): RequestHandler {
  return async (req, res, next) => {
    try {
      const raw = String(req.query.u ?? '');
      if (!raw || raw.length > 8000) throw new AppError('VALIDATION_FAILED', 'URL de imagem inválida.');
      let target: URL;
      try {
        target = new URL(raw);
      } catch {
        throw new AppError('VALIDATION_FAILED', 'URL de imagem inválida.');
      }
      if (!isPublicHttpsUrl(target)) throw new AppError('VALIDATION_FAILED', 'Origem de imagem não permitida.');

      let upstream = await fetchImage(target, 'https://www.google.com/');
      if (!upstream.ok) upstream = await fetchImage(target, 'https://www.bing.com/');
      if (!upstream.ok) upstream = await fetchImage(target, null);
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
