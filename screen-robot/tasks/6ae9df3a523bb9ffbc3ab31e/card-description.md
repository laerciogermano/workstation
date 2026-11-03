## Objetivo
Substituir o banner **sem logo** (`br-supply-03-logistica.jpg`) por banner **BR Supply com marca** (`br-supply-01-caixas.jpg` ou `br-supply-02-fachada.jpg`) nos mocks LinkedIn de:
- **v06 Daniela Hoffmann**
- **v12 Aline Monteiro**

## Por quê
`src/assets/banners/` manteve só 01/02 com logo; o 03 foi removido do catálogo (tema genérico, fora do aceite). Escolhidos v2 ainda atribui o 03 a Daniela e Aline.

## Fonte / base
- Escolhidos v2: https://trello.com/c/aTIPjSjZ · `tasks/6ae9dd6525adce9bc153a2b1/`
- Banners oficiais: https://trello.com/c/YKQ8HAsu · `src/assets/banners/` (`br-supply-01-caixas.jpg`, `br-supply-02-fachada.jpg`)
- Gerador: `tasks/6ae9dd6525adce9bc153a2b1/generate-escolhidos-v2.mjs` (mapa `BANNERS.v06` / `BANNERS.v12`)

## Aceite
- v06 e v12 com banner 01 ou 02 (com logo BR Supply), preferindo rotação distinta entre elas se possível
- `generate-escolhidos-v2.mjs` + `banners/README.md` + `escolhidos-v2.md` / PDF atualizados
- Sem reintroduzir o 03 no catálogo `src/assets/banners/`

## Fora de escopo
- Upload CDP em conta LinkedIn real
- Trocar banners de Juliana/Roberto/Thiago/Gabriel (já em 01/02)
