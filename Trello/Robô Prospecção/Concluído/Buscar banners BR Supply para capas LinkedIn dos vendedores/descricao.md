# Banners BR Supply (capas LinkedIn)

**Quando:** 2026-11-03 · **CDP teste:** Eduardo Vargas (`eduardo-vargas` :9242)

## Método

1. `startCdp('eduardo-vargas')` → busca people `BR Supply`
2. Abriu perfis com capa (`profile-displaybackgroundimage`)
3. Hi-res via CDP `Network.getResponseBody` (fetch na página falha CORS no CDN)

## Variantes

| # | Asset | Fonte | Notas |
|---|---|---|---|
| 01 | `src/assets/banners/br-supply-01-caixas.jpg` | [Cesar Folle](https://www.linkedin.com/in/cesarfolle/) | Marca forte: caixas Br SUPPLY + logo |
| 02 | `src/assets/banners/br-supply-02-fachada.jpg` | [Gabriela Cabral](https://www.linkedin.com/in/gabriela-cabral-b6ab34137/) | Fachada corporativa com logo |

Descartado: `br-supply-03-logistica.jpg` (Rodrigo Gallisa) — supply chain genérico sem logo BR; não atende às exigências de marca.

## Aplicação

Rotacionar 01/02 entre vendedores escolhidos (evitar capa idêntica em massa). Upload: `linkedin-update-banner-cdp.mjs --photo …`.

**Antes → depois:** só `conectmax-banner.jpg` → +2 capas BR Supply com marca. Rollback: remover `br-supply-0*.jpg` e voltar ao default ConectMax.
