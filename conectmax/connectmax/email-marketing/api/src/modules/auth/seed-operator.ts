// Cria um operador ou troca a senha dele.
// Uso: npm run seed:operator -- operador@connect.com.br 'senha-com-12-ou-mais'
import { loadConfig } from '../../shared/config.ts';
import { createPool } from '../../shared/db.ts';
import { normalizeEmail } from '../../shared/email.ts';
import { createAuthService } from './service.ts';

const [rawEmail, password] = process.argv.slice(2);
const email = rawEmail ? normalizeEmail(rawEmail) : null;
if (!email || !password || password.length < 12) {
  console.error('Uso: npm run seed:operator -- <email> <senha com 12+ caracteres>');
  process.exit(1);
}

const db = createPool(loadConfig().DATABASE_URL);
try {
  await createAuthService(db).upsertOperator(email, password);
  console.log(`Operador ${email} pronto.`);
} finally {
  await db.end();
}
