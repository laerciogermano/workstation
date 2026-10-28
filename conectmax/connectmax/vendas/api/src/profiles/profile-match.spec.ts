import {
  candidateNameSimilarity,
  connectionCandidateMatch,
  currentSimilarity,
  matchScore,
  nameSimilarity,
  nameTokens,
  normalize,
  stripNameNoise,
} from './profile-match';

describe('profile-match', () => {
  describe('normalize', () => {
    it('remove acentos e colapsa espaços', () => {
      expect(normalize('  João   Silva  ')).toBe('joao silva');
    });
  });

  describe('nameSimilarity', () => {
    it('exact igual → 1', () => {
      expect(nameSimilarity('Ana Costa', 'Ana Costa')).toBe(1);
    });

    it('João ≈ Joao (OCR acento)', () => {
      expect(nameSimilarity('João Silva', 'Joao Silva')).toBe(1);
    });
  });

  describe('currentSimilarity', () => {
    it('ambos vazios → 1', () => {
      expect(currentSimilarity(null, null)).toBe(1);
      expect(currentSimilarity('', undefined)).toBe(1);
    });

    it('um vazio → 0.5', () => {
      expect(currentSimilarity('Comprador at X', null)).toBe(0.5);
    });
  });

  describe('matchScore', () => {
    const limiar = { matchMin: 0.88, nameMin: 0.85 };

    it('exact igual → score 1 e merge', () => {
      const m = matchScore(
        { name: 'Alexandre Silva', current: 'Comprador at Grupo GPS' },
        { name: 'Alexandre Silva', current: 'Comprador at Grupo GPS' },
        limiar,
      );
      expect(m.matchScore).toBe(1);
      expect(m.shouldMerge).toBe(true);
    });

    it('João Silva ≈ Joao Silva → merge', () => {
      const m = matchScore(
        { name: 'João Silva', current: 'Comprador at A' },
        { name: 'Joao Silva', current: 'Comprador at A' },
        limiar,
      );
      expect(m.nameSimilarity).toBe(1);
      expect(m.shouldMerge).toBe(true);
    });

    it('mesmo nome, current OCR levemente diferente → merge', () => {
      const m = matchScore(
        { name: 'Damaris Souza', current: 'Comprador at Grupo GPS' },
        { name: 'Damaris Souza', current: 'Comprador at Grupo GP5' },
        limiar,
      );
      expect(m.nameSimilarity).toBe(1);
      expect(m.shouldMerge).toBe(true);
    });

    it('nomes distintos (Ana Costa vs Ana Souza) → abaixo do limiar', () => {
      const m = matchScore(
        { name: 'Ana Costa', current: 'Comprador at X' },
        { name: 'Ana Souza', current: 'Comprador at X' },
        limiar,
      );
      expect(m.shouldMerge).toBe(false);
    });
  });

  describe('connectionCandidateMatch', () => {
    const limiar = { matchMin: 0.88, nameMin: 0.85 };

    it('mesmo nome + cargo/cidade/empresa → matched', () => {
      const m = connectionCandidateMatch(
        {
          name: 'Alexandre Silva',
          title: 'Comprador',
          city: 'Belo Horizonte',
          current: 'Grupo GPS',
        },
        {
          name: 'Alexandre Silva',
          title: 'Comprador',
          city: 'Belo Horizonte, Brazil',
          current: 'Grupo GPS',
        },
        limiar,
      );
      expect(m.nameSimilarity).toBe(1);
      expect(m.matched).toBe(true);
    });

    it('slug no nome da conexão (Rafaela Ferreira 870ab9315) → matched', () => {
      expect(stripNameNoise('Rafaela Ferreira 870ab9315')).toBe(
        'rafaela ferreira',
      );
      const m = connectionCandidateMatch(
        {
          name: 'Rafaela Ferreira',
          title: 'Compradora Pleno',
          city: 'Greater Belo Horizonte',
          current: 'Educacional',
        },
        {
          name: 'Rafaela Ferreira 870ab9315',
          title: null,
          city: null,
          current: null,
        },
        limiar,
      );
      expect(m.nameSimilarity).toBeGreaterThanOrEqual(0.9);
      expect(m.matched).toBe(true);
    });

    it('meio opcional (Cristiane Simões Carvalho ≈ Cristiane Carvalho) → matched', () => {
      expect(nameTokens('Cristiane Simões Carvalho')).toEqual([
        'cristiane',
        'carvalho',
      ]);
      expect(
        candidateNameSimilarity(
          'Cristiane Simões Carvalho',
          'Cristiane Carvalho',
        ),
      ).toBeGreaterThanOrEqual(0.95);
      const m = connectionCandidateMatch(
        {
          name: 'Cristiane Simões Carvalho',
          title: 'Comprador',
          city: 'São Paulo, São Paulo, Brazil',
          current: 'Comprador at Dormer Pramet',
        },
        {
          name: 'Cristiane Carvalho',
          title: 'Compradora',
          city: 'São Paulo, Brazil',
          current: 'Dormer Pramet · Live University',
        },
        limiar,
      );
      expect(m.matched).toBe(true);
    });

    it('pronome no nome (Bárbara Oliveira Ela / Dela) → matched', () => {
      expect(
        candidateNameSimilarity(
          'Bárbara Oliveira',
          'Bárbara Oliveira Ela / Dela',
        ),
      ).toBeGreaterThanOrEqual(0.9);
      const m = connectionCandidateMatch(
        {
          name: 'Bárbara Oliveira',
          title: 'Comprador',
          city: 'São Paulo',
          current: null,
        },
        {
          name: 'Bárbara Oliveira Ela / Dela',
          title: 'Comprador | Compradora Industrial',
          city: 'São Bernardo do Campo, São Paulo, Brazil',
          current: 'Centro Universitário FEI',
        },
        limiar,
      );
      expect(m.matched).toBe(true);
    });

    it('OCR Lusi ↔ Luís Balseiro (mesmo sobrenome) → matched', () => {
      expect(
        candidateNameSimilarity('Lusi Balseiro', 'Luís Balseiro'),
      ).toBeGreaterThanOrEqual(0.9);
      const m = connectionCandidateMatch(
        { name: 'Lusi Balseiro', title: 'Comprador', city: null, current: null },
        { name: 'Luís Balseiro', title: 'Comprador', city: null, current: null },
        limiar,
      );
      expect(m.matched).toBe(true);
    });

    it('Ana Silva ≉ Karina Silva (sobrenome comum) → não matched', () => {
      expect(
        candidateNameSimilarity('Ana Silva', 'Karina Silva'),
      ).toBeLessThan(0.9);
      const m = connectionCandidateMatch(
        { name: 'Ana Silva', title: null, city: null, current: null },
        { name: 'Karina Silva', title: null, city: null, current: null },
        limiar,
      );
      expect(m.matched).toBe(false);
    });

    it('Samuel Lopes ≈ Samuelslopes (slug compact) → matched', () => {
      expect(
        candidateNameSimilarity('Samuel Lopes', 'Samuelslopes'),
      ).toBeGreaterThanOrEqual(0.95);
      const m = connectionCandidateMatch(
        {
          name: 'Samuel Lopes',
          title: 'Comprador',
          city: 'BH',
          current: 'DDS',
        },
        { name: 'Samuelslopes', title: null, city: null, current: null },
        limiar,
      );
      expect(m.matched).toBe(true);
    });

    it('espaçado vs slug bem diferente → não matched em stub', () => {
      expect(
        candidateNameSimilarity('Pedro Alves', 'Pedr0alvexxx'),
      ).toBeLessThan(0.9);
      const m = connectionCandidateMatch(
        {
          name: 'Pedro Alves',
          title: 'Comprador',
          city: 'SP',
          current: 'X',
        },
        { name: 'Pedr0alvexxx', title: null, city: null, current: null },
        limiar,
      );
      expect(m.matched).toBe(false);
    });

    it('nomes distintos → não matched', () => {
      const m = connectionCandidateMatch(
        { name: 'Ana Costa', title: 'Comprador', city: 'SP', current: 'X' },
        { name: 'Ana Souza', title: 'Comprador', city: 'SP', current: 'X' },
        limiar,
      );
      expect(m.matched).toBe(false);
    });
  });
});
