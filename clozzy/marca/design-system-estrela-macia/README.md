# Clozzy — Design system · Estrela macia

Design system montado a partir do [manual v2](../uso-da-marca-estrela-macia-v2/README.md) (um rosa só, o Pink Deep `#E0005A`, e as fotos de criadoras) e da [edição criadoras](../uso-da-marca-estrela-macia-criadoras/README.md) (componentes, texto em bloco sobre foto, voz e microtextos). O manual mostra **onde** a marca aparece; este documento mostra **com o que** se constrói: tokens, componentes e padrões.

| Arquivo | O que é |
|---|---|
| [`design-system-clozzy.pdf`](design-system-clozzy.pdf) · `.html` | O documento: 26 páginas, A4 deitado |
| [`tokens.css`](tokens.css) | Variáveis: primitivas em `:root`, papéis por `[data-tema]`, tipo maior a partir de 768 px |
| [`tokens.json`](tokens.json) | Os mesmos tokens para Figma, app nativo e scripts |
| [`_build.py`](_build.py) | Gerador. Uma fonte só para o PDF e os tokens |

## Estrutura

1. **Base** — como ler (primitivas → papéis → componentes → padrões), sumário, cinco princípios
2. **Tokens** — cor (primitivas, papéis nas 4 superfícies, contraste WCAG calculado), tipografia (10 estilos, app/web), espaço, raio, borda, altura de controle, grid (app, web, área segura do 9:16), profundidade sem sombra e movimento
3. **Marca e ícones** — a marca no produto e os tamanhos mínimos, combinações, 13 ícones na grade 24
4. **Componentes** — botões (3 tipos + desabilitado × 4 superfícies, estados, alturas), chips/selos/stickers, campos e controles, avatares e cards, avisos/estados/folhas, navegação, sobre foto
5. **Padrões** — telas do app, seis temas, conteúdo e microtextos
6. **Regras** — não fazer, tokens em código, checklist

## O que é novo em relação aos manuais

- Tokens que não existiam: tipo (`--cz-tipo-*`), espaço (`--cz-esp-1…10`, base 4), raio, borda, altura de controle (32/44/52), duração e curva, véu de modal.
- Tabela de contraste medida a partir dos tokens. Pares abaixo de 4,5:1 (apoio e texto no card sobre Pink Deep, Pink Deep sobre preto) ficam marcados como “AA grande”, ou seja, só valem para texto grande.
- `tokens.css` sem o `#FF0065`. O `tokens.css` do v2 ainda traz `--cz-rosa:#FF0065` porque o gerador do v1 grava esse valor fixo. Aqui o build falha se esse rosa aparecer.
- Os nomes dos papéis continuam os do manual (`--superficie`, `--compra`, `--apoio`…), então o que já usa o `tokens.css` do v2 continua funcionando.

## Gerar de novo

```bash
cd clozzy/marca/design-system-estrela-macia && python3 _build.py      # CHECK=1 lista o que estoura a página
```

Depende de `../uso-da-marca-estrela-macia-v2/_build.py`, que puxa o v1, a identidade (`../identidade-estrela-macia/`), as fontes (`../logo-final-v3/fonts/`) e as fotos (`../fotos-criadoras/`, banco Pexels, **só para uso interno**). Se o v2 mudar, este documento muda junto.

## Caminho inverso

Apagar esta pasta. Nada fora dela depende dela.
