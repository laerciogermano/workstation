import {
  DEFAULT_MENSAGEM_PROSPECCAO,
  buildProspeccaoVars,
  renderProspeccaoTemplate,
} from './prospeccao-template';

const sample = {
  nome: 'Maria Silva Santos',
  firstName: 'João',
  lastName: 'Agente',
  nomeAgente: 'fallback-agente',
  empresa: 'Acme',
  cargo: 'Comprador',
  headline: 'Buyer at Acme',
  cidade: 'São Paulo',
  email: 'maria@acme.com',
  telefone: '11999990000',
  profileUrl: 'https://www.linkedin.com/in/maria',
};

describe('prospeccao-template', () => {
  describe('buildProspeccaoVars', () => {
    it('separa cliente (primeiro_nome/sobrenome) e agente (firstname/lastname)', () => {
      const v = buildProspeccaoVars(sample);
      expect(v.primeiro_nome).toBe('Maria');
      expect(v.sobrenome).toBe('Silva Santos');
      expect(v.firstname).toBe('João');
      expect(v.lastname).toBe('Agente');
      expect(v.nome_agente).toBe('João Agente');
      expect(v.empresa).toBe('Acme');
      expect(v.profile_url).toBe('https://www.linkedin.com/in/maria');
    });

    it('fallback do agente para agentes.nome quando first/last vazios', () => {
      const v = buildProspeccaoVars({
        nome: 'Ana Costa',
        firstName: null,
        lastName: null,
        nomeAgente: 'Camila Souza',
      });
      expect(v.firstname).toBe('Camila');
      expect(v.lastname).toBe('Souza');
      expect(v.nome_agente).toBe('Camila Souza');
    });
  });

  describe('renderProspeccaoTemplate', () => {
    it('default sem template', () => {
      expect(renderProspeccaoTemplate(null, sample)).toBe(
        'Oi Maria, tudo bem?',
      );
      expect(DEFAULT_MENSAGEM_PROSPECCAO).toContain('{{primeiro_nome}}');
    });

    it('substitui {{}} e $...$ (case-insensitive)', () => {
      const tpl =
        'Oi {{primeiro_nome}}, sou {{firstname}} {{LASTNAME}} da $empresa$. Cargo: {{cargo}}. {{local}}';
      expect(renderProspeccaoTemplate(tpl, sample)).toBe(
        'Oi Maria, sou João Agente da Acme. Cargo: Comprador. São Paulo',
      );
    });

    it('placeholder desconhecido permanece', () => {
      expect(
        renderProspeccaoTemplate('Oi {{foo}} {{primeiro_nome}}', sample),
      ).toBe('Oi {{foo}} Maria');
    });

    it('legado {{nome}} / {{nome_agente}} ainda resolve', () => {
      expect(
        renderProspeccaoTemplate('{{nome}} / {{nome_agente}}', sample),
      ).toBe('Maria Silva Santos / João Agente');
    });
  });
});
