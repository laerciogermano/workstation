/** Componentes base: consultas por papel/rótulo (falha de role = possível falha de a11y). */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MacroBars, NumStep, Seg, Toggle } from './kit';

function StepHarness() {
  const [v, setV] = useState(89);
  return <NumStep label="idade" value={v} unit="anos" min={14} max={90} onChange={setV} />;
}

describe('kit', () => {
  it('NumStep respeita os limites do perfil (RN-03)', () => {
    render(<StepHarness />);
    const plus = screen.getByRole('button', { name: 'Mais idade' });
    fireEvent.click(plus);
    expect(screen.getByRole('group', { name: 'idade' })).toHaveTextContent('90');
    expect(plus).toBeDisabled();
  });

  it('Toggle é um switch acessível', () => {
    function H() {
      const [on, setOn] = useState(false);
      return <Toggle on={on} onChange={setOn} label="Publicar na vitrine" />;
    }
    render(<H />);
    const sw = screen.getByRole('switch', { name: 'Publicar na vitrine' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('Seg expõe radios com o selecionado marcado', () => {
    function H() {
      const [v, setV] = useState<'f' | 'm'>('f');
      return (
        <Seg
          options={
            [
              ['f', 'Feminino'],
              ['m', 'Masculino'],
            ] as const
          }
          value={v}
          onChange={setV}
        />
      );
    }
    render(<H />);
    fireEvent.click(screen.getByRole('radio', { name: 'Masculino' }));
    expect(screen.getByRole('radio', { name: 'Masculino' })).toHaveAttribute('aria-checked', 'true');
  });

  it('MacroBars mostra consumido / alvo', () => {
    render(<MacroBars c={{ kcal: 0, p: 80, c: 100, g: 30 }} e={{ protein: 158, carbs: 150, fat: 65 }} />);
    expect(screen.getByText('Proteína').parentElement).toHaveTextContent('80/158 g');
  });
});
