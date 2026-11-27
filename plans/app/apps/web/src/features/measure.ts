// Altura real de cada cartão: mede o título num cartão invisível com o mesmo estilo (vale até para nós minimizados).
import { useEffect, useState } from 'react';
import { H } from './layout.ts';

const cache = new Map<string, number>();
let probe: { box: HTMLDivElement; title: HTMLElement } | null = null;

function createProbe() {
  const box = document.createElement('div');
  box.className = 'tnode measure';
  box.setAttribute('aria-hidden', 'true');
  const title = document.createElement('b');
  const meta = document.createElement('span');
  meta.className = 'meta';
  const state = document.createElement('span');
  state.className = 'state';
  state.textContent = 'Doing';
  meta.append(state);
  box.append(title, meta);
  document.body.append(box);
  return { box, title };
}

export function cardHeight(text: string): number {
  let h = cache.get(text);
  if (h === undefined) {
    probe ??= createProbe();
    probe.title.textContent = text;
    h = Math.max(H, probe.box.offsetHeight);
    cache.set(text, h);
  }
  return h;
}

/** Quando a fonte termina de carregar, as medidas mudam: mede tudo de novo. */
export function useFontMetrics() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const again = () => (cache.clear(), setVersion((v) => v + 1));
    void document.fonts.ready.then(again);
    document.fonts.addEventListener('loadingdone', again);
    return () => document.fonts.removeEventListener('loadingdone', again);
  }, []);
}
