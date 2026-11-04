## Objetivo
Corrigir falhas visuais do protótipo Beta e completar a informação de proximidade na busca.

## Ajustes
- **Ícones:** os ícones do protótipo não estão aparecendo (tab bar / ações) — corrigir para ficarem visíveis e legíveis.
- **Busca (T-11):** em cada resultado, além do preço e da loja, mostrar **distância em km** (ex.: `1,2 km` / `650 m`) — “quão perto de mim”.

## Manter (não mudar)
- **Comparação entre lojas** e **Onde comprar perto** no detalhe (T-14) — os dois ficam.
- Rolagem nos protótipos — já ok.

## Nota sobre T-12 (Comparar)
Hoje a comparação completa vive no **detalhe expandido (T-14)**. A tela standalone `T-12` ainda está no fluxo da galeria E01, mas **não há `data-go="T-12"`** a partir de home/busca/detalhe (só galeria / `#T-12`). Decidir se: (a) remove T-12 e deixa só o bloco no T-14, ou (b) liga a entrada (ex.: busca por EAN → T-12, ou atalho no detalhe).

## Escopo / entrega
- `e-notas/beta-docs/prototipos/index.html` (+ espelho publicado se aplicável)
- Fora: app real / backend

## Critérios de aceite
- [ ] Ícones da tab bar e ações visíveis
- [ ] Resultado de busca mostra distância (km/m)
- [ ] T-14 mantém comparação + perto
- [ ] Decisão documentada sobre T-12 (ligar ou aposentar)
