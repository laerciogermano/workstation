# Diferencial notinhas — preço de balcão vs delivery apps

Estudo de **posicionamento**: o notinhas.shop indexa **preço de balcão** (NFC-e). O contraste competitivo relevante aqui é com **apps de delivery / marketplace**, não com outros índices NFC-e (Busca Preço, Nota Paraná, etc. — esses também miram físico).

- Entrada: [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- Evidências: [`achados.csv`](achados.csv)
- Card: https://trello.com/c/fapxKp3l · PRD §5.9: [`../../docs/prd.md`](../../docs/prd.md)

## Quem entra no contraste

| Marca | Papel no contraste |
|-------|--------------------|
| **iFood** (restaurante + Mercado) | Líder; preço de canal com comissão/taxas |
| **99Food / 99Compras** | Guerra de preço; taxa de serviço mesmo com “frete grátis” |
| **Rappi** (+ Amazon Now onde acoplado) | Markup alto vs físico em mercearia (BH) |
| **Keeta** e similares | Mesmo modelo de marketplace de entrega |

**Fora deste estudo (mesmo eixo “balcão”):** Busca Preço, Nota Preço, Mercado Certo, GoMarket, Qual o Preço, PoupApp, Nota Paraná, MP Brasil — ver [`../benchmarking-solucoes/`](../benchmarking-solucoes/README.md).

## Evidência (ordem de grandeza)

| Fonte | Delivery app | Gap vs balcão / salão |
|-------|--------------|------------------------|
| Abrasel (2022) | iFood | **+17,5%** prato vs salão (s/ frete) |
| Abrasel / UOL TAB (2025) | iFood (estimativa) | **+20–30%** vs restaurante |
| Mercado Mineiro BH (2026) | Amazon Now / Rappi | **+21,9%** vs média física |
| Mercado Mineiro BH (2026) | digital em geral | mediana **+7,8%** (marketplaces puxam mais) |
| BXTData (2026) | iFood | **~+12%** vs “mercado” (fonte comercial) |
| InfoMoney (2026) | 99Food | taxa serviço até **~5,6%** (além do item) |

## Conclusão

1. **Delivery apps não vendem o preço de balcão** — vendem preço de canal (item + comissão + logística + taxas), tipicamente **acima** do físico (~+8% a +22% mercearia; ~+17% a +30% restaurante).
2. **notinhas.shop se diferencia dessas marcas** ao expor o **custo real de prateleira** observado na NFC-e — o que o consumidor paga no caixa, sem markup de app.
3. Esse eixo **não** diferencia o notinhas dos apps/portais de nota fiscal; o diferencial vs eles é produto (geo, vitrine, split, API, cooperativa).
4. Implicação: marketing e PRD devem contrastar explicitamente com **iFood / 99 / Rappi / Keeta**; delivery futuro (§5.9) exige preço oficial do canal, **sem misturar** na série NFC-e.

## Rollback

```bash
git checkout -- e-notas/marca/comparacao-precos-apps
```
