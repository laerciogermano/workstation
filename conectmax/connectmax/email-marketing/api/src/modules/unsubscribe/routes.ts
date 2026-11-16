// Rotas públicas (sem login) usadas pelo destinatário.
// GET mostra confirmação (scanners de link fazem GET e não podem descadastrar ninguém);
// POST efetiva — também é o alvo do One-Click do Gmail/Yahoo (RFC 8058).
import express, { Router } from 'express';
import type { Db } from '../../shared/db.ts';
import { publicIdSchema } from '../../shared/ids.ts';
import { rateLimit } from '../../shared/rate-limit.ts';

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Connect</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F5F9;color:#181818;font:16px/1.55 "Plus Jakarta Sans",system-ui,sans-serif}
  main{background:#fff;border:1px solid #DADEE7;border-radius:12px;padding:32px;max-width:420px;margin:16px}
  h1{font-size:1.25rem;margin:0 0 8px}
  p{margin:0 0 20px;color:#5A6377}
  button{font:inherit;font-weight:600;background:#0070BC;color:#fff;border:0;border-radius:8px;padding:10px 18px;cursor:pointer}
  button:hover{background:#005490}
  button:focus-visible{outline:2px solid #0070BC;outline-offset:3px}
</style></head><body><main>${body}</main></body></html>`;
}

const notFoundPage = page('Link inválido', '<h1>Link inválido</h1><p>Este link de descadastro não existe ou expirou.</p>');

export function unsubscribeRouter(db: Db) {
  const router = Router();
  router.use(rateLimit({ windowMs: 60_000, max: 30 }));

  async function findEmail(token: string): Promise<string | null> {
    if (!publicIdSchema.safeParse(token).success) return null;
    const { rows } = await db.query<{ email: string }>('select email from deliveries where public_id = $1', [token]);
    return rows[0]?.email ?? null;
  }

  router.get('/:token', async (req, res) => {
    const email = await findEmail(req.params.token);
    if (!email) return res.status(404).type('html').send(notFoundPage);
    res.type('html').send(
      page(
        'Descadastrar',
        `<h1>Parar de receber e-mails?</h1>
         <p>Você não vai mais receber campanhas da Connect neste endereço.</p>
         <form method="post"><button type="submit">Descadastrar</button></form>`,
      ),
    );
  });

  router.post('/:token', express.urlencoded({ extended: false, limit: '1kb' }), async (req, res) => {
    const email = await findEmail(req.params.token);
    if (!email) return res.status(404).type('html').send(notFoundPage);
    await db.query(
      `insert into suppressions (email, reason) values ($1, 'unsubscribe') on conflict (email) do nothing`,
      [email],
    );
    res.type('html').send(page('Descadastrado', '<h1>Pronto</h1><p>Você não vai mais receber nossas campanhas.</p>'));
  });

  return router;
}
