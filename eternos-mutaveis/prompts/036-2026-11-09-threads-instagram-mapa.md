# 036 — Mapa dos threads do Instagram para o livro

| Campo | Valor |
|-------|--------|
| Número | 036 |
| Data | 2026-11-09 |
| Origem | Claude Code |
| Título | Identificar quais threads do Instagram servem ao livro e em que parte cada um entra |

## Prompt original

```
identifique nos threads baiados core/instagram-laerciogermano-2026-11-01-xBxLUIgl/your_instagram_activity/threads/threads_and_replies.json quais poderao ser utilizados e em qual parte do livro eternos mutaveis se encaixa melhor... crie um documento que enumere os mais importantes e que mais seconectam com o assunto d livro, identifique todos os threads que se enecaixam e podem ser utilizados
```

## Interpretação

Ler os 222 itens do export (posts e respostas, com o texto em UTF-8 corrigido do mojibake), cruzar com os capítulos e seções da v3 e com o roadmap, e entregar um documento com: os mais importantes em ordem de força, todos os aproveitáveis por capítulo/seção, como usar cada um (epígrafe, citação, ponte, argumento) e o que foi descartado.

## O que foi feito

- [`../inputs/threads-instagram-mapa.md`](../inputs/threads-instagram-mapa.md): os 25 mais importantes; o mapa completo por capítulo (148 aproveitáveis: 85 fortes e 63 de apoio); cuidados de tom e atribuição (#202, #197/#201, #101, #67…); duplicados; 74 descartados por motivo.
- Link em [`../inputs/README.md`](../inputs/README.md).
- Capítulos não alterados. Rollback: apagar o arquivo do mapa e a linha do README de inputs.
