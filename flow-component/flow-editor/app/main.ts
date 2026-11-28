// O aplicativo de teste: o editor em tela cheia, guardando o fluxo neste navegador.
import { fn, fromJson, LANGUAGES, mountFlowEditor, toJson } from '../src/index.ts';
import type { FnNode } from '../src/index.ts';

const KEY = 'flow-editor:tree';
const THEME = 'flow-editor:theme';
const LANGUAGE = 'flow-editor:language';
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sem armazenamento: o fluxo vale só enquanto a página estiver aberta
  }
};

function saved(): FnNode {
  const text = read(KEY);
  if (text) {
    try {
      return fromJson(text);
    } catch (error) {
      console.warn('Fluxo guardado ignorado:', error);
    }
  }
  return fn('main', {
    children: [
      fn('receber', { out: [{ name: 'pedido', type: 'abstract' }] }),
      fn('cobrar', { in: [{ name: 'pedido', type: 'abstract' }], out: [{ name: 'pagamento', type: 'abstract' }] }),
    ],
  });
}

const theme = (new URLSearchParams(location.search).get('tema') === 'claro' || read(THEME) === 'light') ? 'light' : 'dark';
Object.assign(window, {
  app: mountFlowEditor(document.getElementById('host')!, {
    tree: saved(),
    theme,
    onChange: (tree) => write(KEY, toJson(tree)),
    onThemeChange: (next) => write(THEME, next),
    language: LANGUAGES.find(([value]) => value === read(LANGUAGE))?.[0],
    onLanguageChange: (next) => write(LANGUAGE, next),
  }),
});
