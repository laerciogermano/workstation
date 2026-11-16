import { describe, expect, it } from 'vitest';
import { parseContactsImport } from '../src/modules/lists/import-parser.ts';
import { buildMessage, htmlToText } from '../src/modules/sending/build-message.ts';
import { hashPassword, verifyPassword } from '../src/modules/auth/password.ts';

describe('parseContactsImport', () => {
  it('aceita e-mail sozinho, com nome e formato "Nome <email>"', () => {
    const r = parseContactsImport(
      ['email,nome', 'Ana@Exemplo.com, Ana Lima', 'bruno@exemplo.com', 'Carla Souza <carla@exemplo.com>', 'davi@exemplo.com\tDavi'].join('\n'),
    );
    expect(r.contacts).toEqual([
      { email: 'ana@exemplo.com', name: 'Ana Lima' },
      { email: 'bruno@exemplo.com', name: null },
      { email: 'carla@exemplo.com', name: 'Carla Souza' },
      { email: 'davi@exemplo.com', name: 'Davi' },
    ]);
    expect(r.invalid).toEqual([]);
  });

  it('separa inválidos e conta duplicados', () => {
    const r = parseContactsImport('a@x.com\nnao-e-email\n\nA@X.com\n"b@x.com";"Bê"');
    expect(r.contacts.map((c) => c.email)).toEqual(['a@x.com', 'b@x.com']);
    expect(r.contacts[1]?.name).toBe('Bê');
    expect(r.invalid).toEqual([{ line: 2, content: 'nao-e-email' }]);
    expect(r.duplicatesInInput).toBe(1);
  });
});

describe('buildMessage', () => {
  const d = { publicId: '0b9f8a6e-1111-4c4c-9a9a-123456789abc', email: 'ana@x.com', subject: 'Oi', bodyHtml: '<p>Olá</p>' };

  it('inclui rodapé e cabeçalhos de descadastro one-click', () => {
    const m = buildMessage(d, { from: 'Connect <mk@connect.com.br>', publicBaseUrl: 'https://mk.connect.com.br/' });
    const url = `https://mk.connect.com.br/u/${d.publicId}`;
    expect(m.html).toContain(url);
    expect(m.text).toContain(url);
    expect(m.headers['List-Unsubscribe']).toBe(`<${url}>`);
    expect(m.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(m.messageId).toBe(`<${d.publicId}@connect.com.br>`);
  });

  it('coloca o rodapé antes de </body> quando o HTML é documento completo', () => {
    const m = buildMessage({ ...d, bodyHtml: '<html><body><p>x</p></body></html>' }, { from: 'a@b.com', publicBaseUrl: 'http://l' });
    expect(m.html.indexOf('Não quero mais receber')).toBeLessThan(m.html.indexOf('</body>'));
  });

  it('gera versão texto legível', () => {
    expect(htmlToText('<h1>Título</h1><p>Veja <a href="https://x.com">aqui</a>&nbsp;agora</p>')).toBe(
      'Título\nVeja aqui (https://x.com) agora',
    );
  });
});

describe('password', () => {
  it('verifica a senha certa e recusa a errada', async () => {
    const hash = await hashPassword('senha-muito-forte');
    expect(await verifyPassword('senha-muito-forte', hash)).toBe(true);
    expect(await verifyPassword('outra', hash)).toBe(false);
    expect(await verifyPassword('x', 'lixo')).toBe(false);
  });
});
