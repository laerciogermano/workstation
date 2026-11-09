import type { ProductCardDTO } from '@notinhas/contracts';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Progress } from '../src/ui/bits';
import { ProductCard } from '../src/ui/ProductCard';

const p: ProductCardDTO = {
  gtin: '3000054721644',
  title: 'Monster Ultra Fiesta Mango Zero 473ml',
  brand: 'Monster',
  category: 'bebidas-nao-alcoolicas',
  photoUrl: null,
  best: { store: { id: 2, name: 'Stilo Atacadista', neighborhood: 'Aviação' }, priceCents: 889, observedAt: new Date().toISOString(), distanceKm: 2.14, isStale: false },
  highlight: { medianCents: 1099, ratio: -0.191 },
};

describe('ProductCard (RN-05: preço sempre com loja e data)', () => {
  it('mostra preço verde, % vs mediana, loja, data e distância', () => {
    render(<ProductCard p={p} onAdd={() => undefined} />, { wrapper: MemoryRouter });
    const price = screen.getByText('R$ 8,89');
    expect(price).toHaveClass('menor');
    expect(screen.getByText('-19%')).toBeInTheDocument();
    expect(screen.getByText(/Stilo Atacadista · hoje · 2,1 km/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/produto/3000054721644');
    expect(screen.getByRole('button', { name: /Adicionar Monster/ })).toBeInTheDocument();
  });

  it('marca preço com mais de 14 dias como desatualizado (Q3)', () => {
    render(<ProductCard p={{ ...p, highlight: null, best: { ...p.best!, isStale: true } }} />, { wrapper: MemoryRouter });
    expect(screen.getByText('desatualizado')).toBeInTheDocument();
  });
});

describe('Progress (REQ-046)', () => {
  it('é acessível e conta o que falta', () => {
    render(<Progress done={3} total={6} />);
    expect(screen.getByRole('img', { name: '3 de 6 itens com código de barras' })).toBeInTheDocument();
    expect(screen.getByText('3 faltam')).toBeInTheDocument();
  });
});
