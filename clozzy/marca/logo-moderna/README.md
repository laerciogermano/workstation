# Clozzy — Logo moderna (rodada 14)

Evolução do [`logo-final-v3/`](../logo-final-v3/README.md) lida a partir de [`../refs/`](../refs), com **close friends** como palavra-chave e um grupo de variações de **lente**.

**A leitura das refs:** o selo verde de Close Friends do Instagram (`refs/16.00.16` e `16.00.35`) é a origem do círculo cheio com estrela branca; o `15.59.02` mostra que Disco, Crescente e Giro foram as preferidas; o `15.01.35` fixou o anel grosso com tracejado só na abertura.

**A tendência aplicada:** forma mais cheia, recorte de adesivo (vazado em vez de linha), squircle de app, menos peças e nenhuma moldura em volta de tudo. O rosa, a estrela e o anel de story continuam.

**A lente:** a abertura de 5 lâminas de um diafragma já é uma estrela de 5 pontas. A câmera (o produto é foto e vídeo) e o selo do close viram o mesmo desenho — a estrela aparece porque as lâminas param nela.

## Os 10 conceitos

| Grupo | Conceito | O que é |
|---|---|---|
| Close friends | `cf1-trio` · Trio | Anel partido em três arcos desiguais: o close é um grupo |
| | `cf2-duo` · Duo | Dois discos sobrepostos com vão de adesivo; o da frente tem a estrela vazada |
| | `cf3-disco` · Disco | O 07 Disco sem moldura: disco cheio, estrela vazada e dois traços chegando pela direita |
| **Lente** | `ln1-diafragma` · Diafragma | 5 lâminas em volta de uma abertura em estrela |
| | `ln2-lente-no-anel` · Lente no anel | **Recomendado** — o anel de story do v3 com a lente no lugar da estrela cheia |
| | `ln3-obturador` · Obturador | Lâminas giradas (−68°), abertura em pentágono e a estrela como ponto de luz |
| | `ln4-reflexo` · Reflexo | Lente cheia com reflexo em crescente; em uma cor, reflexo e estrela vazam |
| Evolução direta | `ev1-estrela-fenda` · Estrela fenda | O v3 com uma fenda de obturador cortando a estrela |
| | `ev2-squircle` · Squircle | Squircle com estrela vazada e recorte no canto para o avatar do amigo |
| | `ev3-giro` · Giro | O 06 Giro mais limpo: dois arcos longos desencontrados |

Recomendação da rodada: **`ln2-lente-no-anel`** para seguir (evolui sem recomeçar), **`ln1-diafragma`** para app e avatar, **`cf2-duo`** para campanha.

## Construção da lente (grid 100)

| Parâmetro | Valor |
|---|---|
| Lâminas | 5, até r 43, cantos macios (contorno 2,0 com junção redonda) |
| Abertura | estrela r 21,5, vale 45% |
| Fenda entre lâminas | 3,6 no raio da abertura |
| Giro | −90° (ponta para cima); obturador em −68° |
| Corte pequeno (≤ 32 px) | fenda 4,6 e abertura 23; na lente no anel, estrela cheia de volta |

## Arquivos

| Arquivo | O que é |
|---|---|
| [`logo-moderna-clozzy.pdf`](logo-moderna-clozzy.pdf) · `.html` | 10 páginas: leitura das refs, os três grupos, construção da lente, teste pequeno, cor, lockup/app e recomendação |
| `svg/` | Cada conceito em preto, rosa, cream e uma cor + corte pequeno + ícone de app + lockup; o recomendado também em horizontal/empilhado nos três fundos e favicon |
| `_moderna.py` | Geometria. `blades()` é o diafragma, `knock()` recorta por máscara, `crescent()` e `squircle()` são as formas novas. Conceito novo = função + entrada em `GRUPOS` |
| `_build.py` | Página HTML + PDF |

```bash
cd clozzy/marca/logo-moderna && python3 _moderna.py && python3 _build.py
```

Depende de `../logo-letreiro-v7/` (anel `ring_c` e lockups), `../logo-c-canto-v2/` (cores e `seg`) e `../identidade-nova/` (estrela).

## Caminho inverso

- **Antes:** símbolo = anel de story + **estrela cheia** (`logo-final-v3`, anel 9,5 / 3 traços / estrela r 19). **Depois (proposta):** mesmo anel com a **abertura da lente** no centro.
- Para voltar ao símbolo aprovado, use [`../logo-final-v3/`](../logo-final-v3/README.md) — esta rodada não altera nenhum arquivo dele.
- Para trocar o recomendado, mude `HERO` no `_moderna.py` e rode os dois scripts.

## Rollback

```bash
rm -rf clozzy/marca/logo-moderna
```
