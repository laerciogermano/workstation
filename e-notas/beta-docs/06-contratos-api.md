# Notinhas Beta — Contratos de API

Base canônica: `https://notinhas.shop/api/v1` (com suporte retrocompatível para rotas legadas v0 em `/api/*`).  
Padrão de payload: JSON em `camelCase`. Datas em formato ISO 8601 UTC (`2026-11-04T13:00:00Z`). Valores monetários retornados formatados em reais (`R$ 14,50`) e em valor numérico decimal (`14.50`) para cálculos no cliente.

---

## 1. Convenções REST

| Tema | Regra |
|---|---|
| **Autenticação** | JWT de acesso de 15 min no header `Authorization: Bearer <token>` ou no cookie `nt_at`. Refresh token rotativo no cookie seguro `nt_rt` (`HttpOnly; Secure; SameSite=Lax`). `🌐` = Rota pública; `🔒` = Exige login; `🛡` = Exige role `admin`. |
| **Proteção CSRF** | Métodos mutáveis (`POST`, `PUT`, `PATCH`, `DELETE`) exigem o header `X-Requested-With: notinhas`. |
| **Idempotência** | Ingestão de NFC-e (`POST /api/v1/notas`) é idempotente por chave de acesso de 44 dígitos; Vínculo de EAN (`POST /api/v1/codigos-barras`) opera como upsert por `(empresaId, codigoUnidade)`. |
| **Paginação** | Formato cursor ou offset: `?cursor=<id>&limit=20` ou `?page=1&limit=20` retornando `{ items, total, nextCursor }`. |
| **Erros** | RFC 9457 (Problem Details) com chave de erro `code` e lista opcional `invalidParams`. |
| **Rate Limit** | Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`. Excedido → HTTP 429 com `Retry-After`. |

---

## 2. Autenticação e Conta (`/auth` e `/me`)

| Método | Rota | Autenticação | Corpo → Resposta | US |
|---|---|---|---|---|
| `POST 🌐` | `/auth/register` | Pública | `{ email, password, nome?, acceptTerms: true }` → `201 UserSessionDTO` | US-01.01 |
| `POST 🌐` | `/auth/login` | Pública | `{ email, password }` → `200 UserSessionDTO` | US-01.02 |
| `POST 🌐` | `/auth/refresh` | Cookie `nt_rt` | `(cookie)` → `200 TokenDTO` (com rotação do cookie) | US-01.02 |
| `POST 🔒` | `/auth/logout` | Logado | `{ everywhere?: boolean }` → `204 No Content` | US-01.03 |
| `POST 🌐` | `/auth/forgot-password` | Pública | `{ email }` → `202 Accepted` | US-01.04 |
| `POST 🌐` | `/auth/reset-password` | Pública | `{ token, newPassword }` → `200 OK` | US-01.04 |
| `GET 🔒` | `/me` | Logado | → `200 UserProfileDTO` | US-01.02 |
| `PATCH 🔒` | `/me/preferences` | Logado | `{ cidadeNome?, modoOrigem?, lat?, lng?, raioKm? }` → `200 PreferencesDTO` | US-01.05 |
| `DELETE 🔒` | `/me` | Logado | `{ confirmacao: "EXCLUIR" }` → `202 Accepted` | US-01.12 |

---

## 3. Ingestão de Notas Fiscais (`/notas`)

| Método | Rota | Autenticação | Corpo → Resposta | US |
|---|---|---|---|---|
| `POST 🌐` | `/api/nota` | Pública (Legada v0) | `{ url: string }` → `200 IngestaoNotaDTO` | US-01.06 |
| `POST 🌐` | `/notas` | Pública / Opcional 🔒 | `{ url: string }` → `201 | 200 IngestaoNotaDTO` | US-01.06, 01.07, 01.08 |
| `GET 🔒` | `/notas/minhas` | Logado | `?page=1&limit=20` → `200 Page<MinhaNotaDTO>` | US-01.09 |
| `GET 🌐` | `/notas/:chaveAcesso` | Pública | → `200 DetalheNotaDTO` | US-01.08 |

---

## 4. Produtos, Descoberta e Comparação (`/produtos`)

| Método | Rota | Autenticação | Query Params → Resposta | US |
|---|---|---|---|---|
| `GET 🌐` | `/produtos/destaques` | Pública | `?cidade=&raioKm=5` → `200 DestaquesResponseDTO` | US-02.01 |
| `GET 🌐` | `/produtos/search` | Pública | `?q=leite&tipo=nome\|ean&frescorDias=30&page=1` → `200 Page<ProdutoBuscaDTO>` | US-02.02, 02.03, 02.07 |
| `GET 🌐` | `/produtos/:ean` | Pública | `?frescorDias=30&lat=&lng=` → `200 ProdutoDetalheDTO` | US-02.04, 02.06 |
| `GET 🌐` | `/produtos/:ean/historico` | Pública | `?periodo=30d\|60d\|90d\|tudo` → `200 HistoricoPrecoDTO` | US-02.05 |
| `GET 🌐` | `/produtos/:ean/imagens` | Pública | → `200 ProdutoImagensDTO` | US-01.11 |
| `POST 🔒` | `/produtos/:ean/imagens/selecionar` | Logado | `{ imagemId: number }` → `200 OK` | US-01.11 |

---

## 5. Vínculo Cooperativo de EAN (`/codigos-barras`)

| Método | Rota | Autenticação | Corpo → Resposta | US |
|---|---|---|---|---|
| `GET 🌐` | `/codigos-barras` | Pública | `?empresaId=&ean=` → `200 CodigoBarrasDTO[]` | US-01.10 |
| `POST 🌐` | `/codigos-barras` | Pública / Opcional 🔒 | `{ empresaId: number, codigoUnidade: string, codigoBarras: string, fotoUrl?: string }` → `200 VinculoEanResponseDTO` | US-01.10, 03.06 |

---

## 6. Estabelecimentos e Vitrine (`/estabelecimentos`)

| Método | Rota | Autenticação | Query / Params → Resposta | US |
|---|---|---|---|---|
| `GET 🌐` | `/estabelecimentos` | Pública | `?lat=&lng=&raioKm=10` → `200 EstabelecimentoCardDTO[]` | US-03.03 |
| `GET 🌐` | `/estabelecimentos/:id` | Pública | → `200 EstabelecimentoDetalheDTO` | US-03.04 |
| `GET 🌐` | `/estabelecimentos/:id/vitrine` | Pública | `?q=&ordenacao=recentes\|menor_preco&page=1&limit=24` → `200 VitrineLojaDTO` | US-03.04, 03.05 |

---

## 7. Geolocalização e Ranking (`/geo`)

| Método | Rota | Autenticação | Query Params → Resposta | US |
|---|---|---|---|---|
| `GET 🌐` | `/geo/produtos/perto` | Pública | `?ean=789...&lat=-25.42&lng=-49.27&raioKm=5&ordem=distancia\|preco` → `200 ProdutoPertoResponseDTO` | US-03.01 |
| `GET 🌐` | `/geo/ranking-lojas` | Pública | `?lat=-25.42&lng=-49.27&raioKm=5&visao=baratas\|caras` → `200 RankingLojasDTO` | US-03.02 |
| `GET 🌐` | `/geo/mapa` | Pública | `?sul=&oeste=&norte=&leste=` → `200 MapaEstabelecimentosDTO` | US-03.03 |

---

## 8. Cestas e Sugestão de Split (`/cestas`)

| Método | Rota | Autenticação | Corpo / Query → Resposta | US |
|---|---|---|---|---|
| `GET 🔒` | `/cestas` | Logado | → `200 CestaDTO[]` | US-04.01 |
| `POST 🔒` | `/cestas` | Logado | `{ nome: string }` → `201 CestaDTO` | US-04.01 |
| `POST 🔒` | `/cestas/:id/itens` | Logado | `{ codigoBarras: string, quantidade: number }` → `200 CestaDTO` | US-04.01 |
| `DELETE 🔒` | `/cestas/:id/itens/:codigoBarras`| Logado | → `200 CestaDTO` | US-04.01 |
| `POST 🌐` | `/cestas/cotar` | Pública | `{ itens: { codigoBarras: string, quantidade: number }[], lat?, lng?, raioKm? }` → `200 CotacaoCestaDTO` | US-04.02 |
| `POST 🌐` | `/cestas/split` | Pública | `{ itens: { codigoBarras: string, quantidade: number }[], lat?, lng?, raioKm?, maxLojas?: 2 }` → `200 SplitCestaDTO` | US-04.03 |

---

## 9. Gestão Financeira Pessoal (`/financas`)

| Método | Rota | Autenticação | Query Params → Resposta | US |
|---|---|---|---|---|
| `GET 🔒` | `/financas/extrato` | Logado | `?mes=2026-11&page=1&limit=20` → `200 ExtratoFinanceiroDTO` | US-04.04 |
| `GET 🔒` | `/financas/mensal` | Logado | `?meses=6` → `200 RelatorioMensalDTO` | US-04.05 |
| `GET 🔒` | `/financas/por-loja` | Logado | `?periodo=90d` → `200 RankingGastosLojaDTO` | US-04.06 |

---

## 10. Moderação e Backoffice (`/admin`)

| Método | Rota | Autenticação | Corpo → Resposta | US |
|---|---|---|---|---|
| `GET 🛡` | `/admin/notas-falhas` | Admin | `?status=pendente&limit=50` → `200 NotaFalhaDTO[]` | US-ADM.01 |
| `POST 🛡` | `/admin/notas-falhas/:id/reprocessar` | Admin | → `200 { sucesso: boolean, mensagem: string }` | US-ADM.01 |
| `POST 🛡` | `/admin/itens/:id/ocultar` | Admin | `{ motivo: string }` → `200 OK` | US-ADM.02 |
| `GET 🛡` | `/admin/metricas` | Admin | → `200 MetricasBetaDTO` | US-ADM.03 |

---

## 11. Definições de Tipos (TypeScript DTOs)

```ts
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  invalidParams?: { name: string; reason: string }[];
}

export interface UserSessionDTO {
  token: string;
  expiresIn: number;
  usuario: {
    id: number;
    email: string;
    nome: string | null;
    role: 'user' | 'admin';
  };
  preferencias: PreferencesDTO;
}

export interface PreferencesDTO {
  cidadeNome: string;
  modoOrigem: 'gps' | 'city' | 'override';
  lat: number | null;
  lng: number | null;
  raioKm: number;
  onboarded: boolean;
}

export interface IngestaoNotaDTO {
  ok: boolean;
  duplicada: boolean;
  empresaCriada: boolean;
  url: string;
  empresa: {
    id: number;
    cnpj: string;
    nome: string;
    endereco: string;
  };
  nota: {
    id: number;
    chaveAcesso: string;
    numero: string;
    serie: string;
    emissao: string;
    valorTotal: string;
    qtdItens: number;
  };
  itens: {
    id: number;
    codigo: string;
    nome: string;
    quantidade: string;
    unidade: string;
    valorUnitario: string;
    valorTotal: string;
    codigoBarras: string | null;
    fotoUrl: string | null;
  }[];
}

export interface ProdutoDetalheDTO {
  codigoBarras: string;
  nome: string;
  marca: string | null;
  categoria: string | null;
  fotoUrl: string | null;
  resumoPrecos: {
    menorPreco: number;
    menorPrecoFormatado: string;
    precoMedio: number;
    precoMedioFormatado: string;
    maiorPreco: number;
    totalLojas: number;
  };
  comparacaoLojas: {
    empresaId: number;
    empresaNome: string;
    bairro: string | null;
    distanciaKm: number | null;
    precoUnitario: number;
    precoUnitarioFormatado: string;
    emissaoData: string;
    isMenorPreco: boolean;
    economiaReaisVsMedia: number;
  }[];
}

export interface CotacaoCestaDTO {
  totalItensSolicitados: number;
  lojasCotadas: {
    empresaId: number;
    empresaNome: string;
    distanciaKm: number | null;
    itensEncontrados: number;
    percentualCobertura: number;
    valorTotal: number;
    valorTotalFormatado: string;
    itensFaltantes: {
      codigoBarras: string;
      nome: string;
    }[];
  }[];
}

export interface SplitCestaDTO {
  custoMelhorLojaUnica: {
    empresaId: number;
    empresaNome: string;
    valorTotal: number;
  };
  sugestaoSplit: {
    economiaTotalReais: number;
    percentualEconomia: number;
    lojas: {
      empresaId: number;
      empresaNome: string;
      subtotalLoja: number;
      itens: {
        codigoBarras: string;
        nome: string;
        quantidade: number;
        precoUnitario: number;
        subtotal: number;
      }[];
    }[];
  };
}
```

---

## 12. Tabela de Códigos de Erro Padronizados (`code`)

| Código de Erro | HTTP | Mensagem de Resolução (pt-BR) |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Confira os dados informados nos campos destacados. |
| `UNAUTHENTICATED` | 401 | Faça login para continuar. |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha incorretos. |
| `TOKEN_EXPIRED` | 401 | Sua sessão expirou. Autenticando novamente. |
| `REFRESH_REUSED` | 401 | Sessão invalidada por motivos de segurança. Faça login novamente. |
| `FORBIDDEN` | 403 | Você não possui permissão para executar esta ação. |
| `NOT_FOUND` | 404 | O recurso solicitado não foi encontrado. |
| `EMAIL_TAKEN` | 409 | Este e-mail já possui cadastro. Faça login para continuar. |
| `INVALID_SEFAZ_URL` | 400 | A URL fornecida não é um QR Code válido da SEFAZ Paraná. |
| `SEFAZ_PARSER_ERROR` | 502 | A Fazenda Estadual está indisponível ou alterou o formato da DANFE. |
| `INVALID_EAN` | 422 | O código de barras fornecido possui dígito verificador inválido. |
| `RATE_LIMIT_EXCEEDED`| 429 | Muitas solicitações em sequência. Aguarde alguns instantes. |
