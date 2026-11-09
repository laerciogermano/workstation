# Rastreabilidade — telas do protótipo v2 → código

Protótipo: [`../../beta-docs/prototipos/v2/`](../../beta-docs/prototipos/v2/index.html). Desktop (D-xx, REQ-057) é o mesmo componente com layout responsivo (≥ 1024 px: navegação lateral e colunas lado a lado).

| Tela | Rota | Componente | API | Regras |
|---|---|---|---|---|
| T-10 Home · Produtos | `/` | `features/produtos/HomePage` | `GET /produtos/home` | RN-05, RN-11, REQ-045/049/056 · `ProductViewToggle` compact (só ícones) ao lado da busca (`.search-row`, `nt:product-view`); chips de seção sem toggle |
| T-73 Carregando | (qualquer) | `app/Shell › PageSkeleton` | — | skeleton, sem spinner |
| T-11 Busca · T-72 sem resultado | `/busca?q=&categoria=` | `features/produtos/SearchPage` | `GET /produtos/busca` | GTIN mod-10, Q6 · tabbar some só com busca ativa (`q`/`categoria`); cache limpo ao limpar/sair (`clearSearchCache`, sem `placeholderData`) |
| T-14 Detalhe · T-13 Histórico · T-12 Registros | `/produto/:gtin` | `features/produtos/ProductPage` (`MapBanner` na seção Perto de você → mapa; Alterar código / Trocar foto) | `GET /produtos/:gtin` (+ `links[]`) | RN-05, Q3, REQ-047/058/067 · mapa sai do topo e fica junto de Perto de você |
| T-30 Onde comprar perto | `/produto/:gtin/mapa` | `features/produtos/ProductNearbyMapPage` | `GET /produtos/:gtin` | RN-09 · expansão do mapa do detalhe |
| T-15 Mapa de produtos | `/mapa` (+ faixa na home `/`) | `features/produtos/ProductsMapPage` · `MapBanner` na `HomePage` | home + ranking | RN-09 · pins ancorados na loja do melhor preço + micro-anel (~15 m) se vários na mesma loja; `MapPin.photoUrl` = foto principal |
| T-20 Scan câmera · T-21 Foto · T-70 Câmera negada | `/nota` | `features/nota/ScanPage` (+ `scanner.tsx`) | `POST /notas` | RN-01, RN-07 |
| T-23/T-24 Scan EAN + VOCR | sheet câmera / foto | `scanner.tsx` `useCameraScanner` / `decodeImageFile` | `POST /codigos-barras` (+ `vocr`) | zxing + OCR (tesseract) em paralelo; OCR sozinho aceita GTIN válido se barras falham |
| T-25 Processando · T-27 Falha | `/nota` (fases) | `ScanPage › Processing / Failure` | `POST /notas` → 400/502/504 | RN-15, fila `ingest_failures` |
| T-22 Nota recebida · T-26 Duplicada · T-55 Detalhe (+ T-41/T-42 cotação) | `/notas/:id` | `features/nota/ReceiptResultPage` + `ui/QuotePanel` | `GET /notas/:id` (+ geo · quote/credits) | RN-02, RN-03, RN-06, RN-13, REQ-046 |
| T-23 Vincular EAN | sheet | `features/nota/LinkEanSheet` | `POST /codigos-barras` (`replace?`), `GET /codigos-barras/sugestoes`, `GET /imagens/proxy` | RN-12, Q2, REQ-043/068; vínculo por cód. interno (propaga) |
| T-24 Escolher foto | sheet | `LinkEanSheet › PhotoPickerSheet` | `GET/POST /produtos/:gtin/fotos?q=` (SI5 + Google/Bing) | REQ-040/042/069; ≥30 candidatas; campo `q` editável; voto em `photo_registrations`; principal = mais votada |
| T-31 Estabelecimentos · mais baratas | `/lojas` | `features/lojas/StoresPage` (+ `MapBanner`) | `GET /lojas/ranking` | RN-09, RN-10, REQ-046 · pins = estabelecimentos |
| T-32 Mapa de estabelecimentos | `/lojas/mapa` | `features/lojas/StoresMapPage` | `GET /lojas/ranking` | RN-09 · 1 pin por loja |
| T-33 Vitrine · T-34 Item sem EAN | `/lojas/:id` | `features/lojas/StorePage` (+ `MapBanner`) | `GET /lojas/:id` | REQ-039/043/045 · mapa: só pin do estabelecimento · item sem EAN: clique abre `LinkEanSheet`; após vínculo `onLinked` → `q.refetch()` (lista atualiza sem F5). `api` fetch usa `cache: 'no-store'` p/ não reusar GET com max-age=30 da API |
| T-40 Minhas listas | `/listas` | `features/listas/ListsPage` | `GET/POST /listas` | REQ-051 |
| T-42 Uma loja · T-41 Dividir · T-54 Gate | `/listas/:id` | `features/listas/ListPage` | `GET /listas/:id`, `PUT /listas/:id/itens/:gtin` | RN-13, REQ-052 |
| (Adicionar à lista) | sheet | `features/listas/AddToListSheet` | `PUT /listas/:id/itens/:gtin` | — |
| T-50 Minhas notas | `/notas` | `features/notas/MyReceiptsPage` | `GET /notas/minhas` | RN-14, REQ-051 |
| T-52 Gastos | `/gastos` | `features/notas/SpendingPage` | `GET /gastos` | RN-14 |
| T-51 Perfil | `/perfil` | `features/conta/ProfilePage` | `GET /me`, `POST /auth/logout` | REQ-050 (fingerprint + IP) |
| T-53 Pontos | `/pontos` | `features/conta/PointsPage` | `GET /pontos` | REQ-052 |
| T-02 Criar conta · T-03 Entrar · T-04 Recuperar | `/conta/criar · entrar · recuperar · redefinir` | `features/conta/AuthPages` | `/auth/*` | REQ-050 (merge) |
| T-05 Localização | `/perfil/localizacao` | `features/conta/LocationPage` | — (fica no aparelho) | RN-09 |
| T-56 Excluir conta | `/perfil/excluir` | `features/conta/DeleteAccountPage` | `DELETE /me` | US-01.12, RN-06 |
| T-71 Sem conexão | (banner global) | `app/Shell` + service worker + `lib/offline-queue` | cache NetworkFirst | RN-15 |
| T-61 Métricas · T-62 Falhas · T-63 Moderação | `/admin` | `features/admin/AdminPage` | `/admin/*` | US-ADM.01–03 |

## Regras de negócio → código

| Regra | Onde | Teste |
|---|---|---|
| RN-01 URL canônica / anti-SSRF | `api/modules/receipts/sefaz-url.ts` | `test/sefaz.test.ts` |
| RN-03 dedupe por chave | `ingest-receipt.ts` (antes da rede + `ON CONFLICT`) | integração |
| RN-05 preço com loja e data | `ui/ProductCard`, DTO `OfferDTO` | `web/test/ui.test.tsx` |
| RN-06 índice anônimo | `v_price_observations`, `receipt_owners` | integração (“sem nada de pessoa”) |
| RN-10 ranking | `domain/pricing.ts › rankStores` | `domain.test.ts` |
| RN-11 destaque | `domain/pricing.ts › highlightOf` | `domain.test.ts` |
| RN-12 / Q2 vínculo | `barcodes.service.ts › linkBarcode` | integração |
| RN-13 cotação sem interpolar | `domain/basket.ts › quoteBasket` | `domain.test.ts`, integração |
| RN-14 privado ao titular | `shared/http/context.ts › ownerSql` | integração |
| RN-15 timeout/retry SEFAZ | `sefaz-pr.adapter.ts`, `jobs/scheduler.ts` | `sefaz.test.ts`, integração |
| REQ-050 fingerprint + merge | `identity.middleware.ts`, `identity.service.ts` | integração |
| REQ-052 pontos/crédito | `points.service.ts`, `domain/points.ts`, `lists.routes.ts` | integração |

## Fora deste corte (próximos passos)

- Google Imagens (REQ-042): candidatas em `GET /produtos/:gtin/fotos` via ean-serp `/ean/google-imagens` + Chrome CDP `:9223` (`notinhas-chrome`). Se Google `/sorry/` (IP datacenter) → Bing Images.
- Alertas de preço por e-mail (Mailcow está pronto no `Mailer`; falta a feature).
- (feito em REQ-060: os 6 temas do protótipo com seletor por bolinha)

## Sugestão de EAN (REQ-044) — feito

- `GET /codigos-barras/sugestoes?storeId&storeCode&q?` → catálogo local (pg_trgm) **+** `ean-serp` `/ean/si5` (`EanSuggestPort`); **até 50** resultados (REQ-066; antes 8)
- Sheet `LinkEanSheet`: campo de texto editável + lista (toque vincula) + câmera + digitação
- Env: `EAN_SERP_URL` (default `http://127.0.0.1:4180`); vazio = só catálogo
- Contabo: units `notinhas-chrome` (`:9223`) + `ean-serp` (`:4180`) + `EAN_SERP_URL` no `.env`
- Fotos pós-vínculo: SI5 + `GET /ean/google-imagens` (sem CDP → só SI5/OFF)

**Antes → depois:** sugestões quase sempre vazias (catálogo pequeno) → lista SI5 pela descrição da nota.  
**Rollback:** `EAN_SERP_URL=` (noop) ou `systemctl stop ean-serp notinhas-chrome`; reverter `ean-suggest.port.ts` / `LinkEanSheet`. Sem Chrome → fotos só SI5/OFF.
