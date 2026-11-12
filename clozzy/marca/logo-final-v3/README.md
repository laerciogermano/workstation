# Clozzy — Logo final v3 (compilado)

**v3:** a estrela ficou um pouco menor. O círculo central passou de r 21 para **r 19**, e a estrela continua inscrita nele: as pontas, com o canto redondo, tocam a borda e nunca passam (R 18,72 → 16,93). Para voltar: [`../logo-final-v2/`](../logo-final-v2/README.md).

**v2:** a estrela ficou um pouco menor e cabe **exatamente no círculo central (r 21)**: as 5 pontas, já com o canto redondo, tocam a borda e nunca passam. Antes → depois: R 21 com alcance de 23,6 (passava do círculo) → R 18,72 com alcance de 21,0. O corte pequeno usa a mesma estrela (antes era 8% maior). Para voltar: [`../logo-final/`](../logo-final/README.md).

Junta o melhor das rodadas 1–11 numa marca só, com as regras de uso e as peças de rede social prontas.

**De onde vem cada parte**
- **Forma:** o C da v7 (`c1-c-120`), com linha cheia em 240° e 3 traços só na abertura da direita. Vem dos prints `refs/14.03.10` e `refs/14.31.06`, este invertido para os traços ficarem à direita.
- **Traços:** cantos arredondados, como na v4. São poucos e longos para não virarem bolinhas.
- **Anel:** espessura 9,5 no grid 100 (≈ 24/256), seguindo a direção do anel de story tracejado e grosso.
- **Estrela:** a original do Círculo próximo, inscrita no círculo central r 19 (v3): as 5 pontas (com o canto redondo) tocam a borda e nunca passam (R ≈ 16,9).
- **Palavra:** Gabarito 800, sempre ao lado ou embaixo do símbolo. O C do símbolo nunca se funde com o c de clozzy.
- **Cor:** no preto, arco rosa, estrela branca e palavra branca. No rosa, no Deep e no roxo, tudo branco. No claro, palavra ink e símbolo Pink Deep. Nunca preto sobre rosa nem rosa sobre roxo.
- **Corte pequeno (≤ 32 px):** anel 13, 2 traços.

**Boas práticas (manual, págs. 05–07)**
- **Respiro:** x = ¼ do diâmetro do anel.
- **Tamanhos mínimos:** horizontal 96 px / 25 mm · empilhado 64 px / 18 mm · símbolo 24 px / 6 mm · corte pequeno de 16 a 32 px.
- **Foto de perfil:** símbolo a 58% do quadro, para sobrar folga quando a rede corta em círculo.
- **Ícone de app:** símbolo a 62%, exportado sem cantos.
- **Stories:** 250 px livres em cima e embaixo.

| Arquivo | O que é |
|---|---|
| [`logo-final-clozzy.pdf`](logo-final-clozzy.pdf) · `.html` | Manual com 16 páginas: compilado, construção, versões, cor, respiro e mínimos, escala, usos incorretos, tipografia, elemento gráfico, perfil e destaques, feed, carrossel e stories, capas, app, arquivos |
| `svg/` | Símbolo, corte pequeno e as versões horizontal, empilhada e só palavra, cada uma em 8 fundos. Também app-icon, avatar e favicon |
| `png/` | Logos em 2000 px, empilhados em 1200 px, símbolo em 1024 px, app-icon em 1024, 512 e 180 px, favicon em 16, 32 e 48 px |
| `social/` | 21 PNGs prontos: avatar (2), destaques (5), feed (4), carrossel (3), stories (3), capas YouTube/X/LinkedIn e Open Graph (4). Em `social/html/` cada peça fica editável |
| `_marca.py` · `_build.py` | Geradores. As constantes `RING`, `STAR` e `DASHES` ficam no `_marca.py` |

```bash
cd clozzy/marca/logo-final && python3 _marca.py && python3 _build.py
```

Depende de `../logo-letreiro-v7/` (símbolo e letreiro), que por sua vez usa `logo-c-canto-v2`, `identidade-nova` e `logo-2028`.

## Rollback

```bash
rm -rf clozzy/marca/logo-final-v3
```
