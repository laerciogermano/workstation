// Rota pública do pixel de abertura (CU-06). Quem identifica a entrega é o token;
// o e-mail na query (?e=) serve só para leitura humana do link e dos logs de acesso.
// Sem rate limit: proxies de imagem (Gmail etc.) concentram muitos destinatários em poucos IPs.
import { Router } from 'express';
import type { Db } from '../../shared/db.ts';
import { publicIdSchema } from '../../shared/ids.ts';

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export function trackingRouter(db: Db) {
  const router = Router();

  router.get('/o/:token.gif', async (req, res) => {
    const { token } = req.params;
    // HEAD é verificador de link, não abertura
    if (req.method === 'GET' && publicIdSchema.safeParse(token).success) {
      try {
        await db.query(
          `update deliveries
              set opened_at = coalesce(opened_at, now()), last_opened_at = now(), open_count = open_count + 1
            where public_id = $1`,
          [token],
        );
      } catch (err) {
        // o destinatário nunca vê imagem quebrada por falha nossa
        req.log.error({ err }, 'falha ao registrar abertura');
      }
    }
    // sempre a mesma resposta: não revela se o token existe
    res
      .set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        // o Helmet manda same-origin, que bloquearia a imagem dentro do webmail
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })
      .type('gif')
      .send(PIXEL);
  });

  return router;
}
