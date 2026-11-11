# Clozzy — páginas e funcionalidades (v1)

Fonte: [`../README.md`](../README.md) (visão) + padrões observados em [`../marca/benchmarking-concorrentes/`](../marca/benchmarking-concorrentes/README.md).  
**Escopo:** o que o Clozzy **deve** ter na v1 (não inventário de concorrente).  
**Fora de escopo v1** (explícito na visão): feed social, chat, lives, tips avulsas, ranking, PPV no feed, app nativo.

Não há código de app no repo — este documento é o contrato de capacidades antes de user stories / telas.

---

## Mapa de páginas

| # | Página / superfície | Papel | Auth |
|---|---------------------|------|------|
| P01 | Landing / marketing | Explicar produto, CTA criador e fan | Público |
| P02 | Explorar / busca de perfis | Descobrir criadores | Público (preview) / logado |
| P03 | Perfil do criador (vitrine) | Bio, mídia, ofertas, CTA compra | Público |
| P04 | Checkout (assinatura / pacote / item) | Pagamento Pix + confirmação | Logado |
| P05 | Pós-compra / acesso ao conteúdo | Entregar o que foi comprado | Logado + compra válida |
| P06 | Biblioteca do fan | Assinaturas, pacotes e itens ativos | Logado (fan) |
| P07 | Conta / configurações | Dados, senha, preferências | Logado |
| P08 | Login / cadastro / recuperação | Entrar e criar conta | Público |
| P09 | Painel do criador — visão geral | Resumo vendas / conteúdo | Logado (criador) |
| P10 | Painel — perfil público | Editar bio, foto, links | Criador |
| P11 | Painel — ofertas | Preços, planos, pacotes, itens | Criador |
| P12 | Painel — conteúdos | Upload, organizar, liberar por oferta | Criador |
| P13 | Painel — financeiro | Extrato, saldo, saque | Criador |
| P14 | Institucional / legal | Termos, privacidade, 18+, ajuda | Público |
| P15 | Onboarding criador (KYC leve) | Ativar venda + verificação mínima | Criador |

Fluxo canônico: **P03 → P04 → P05 → P06**.

---

## P01 — Landing / marketing

- Headline + proposta (vitrine → compra → acesso)
- CTA “Sou criador” / “Explorar”
- Como funciona (3 passos)
- Prova social / diferencial BR (Pix) quando houver
- Links legais (P14)

## P02 — Explorar / busca

- Lista / grade de perfis públicos
- Busca por nome / nick
- Filtros mínimos (ex.: categoria) se houver dados
- Card: foto, nome, preço a partir de, CTA perfil
- Sem feed social, sem “em alta” obrigatório na v1

## P03 — Perfil do criador (vitrine)

- Foto, nome, bio curta, redes (opcional)
- Galeria / preview (teaser; conteúdo pago bloqueado)
- Ofertas visíveis:
  - Assinatura (recorrente)
  - Pacote (bundle)
  - Item avulso
- Preço, o que inclui, CTA “Assinar” / “Comprar”
- Age gate 18+ na entrada da superfície adulta
- Sem chat, tip, live ou status online na v1

## P04 — Checkout

- Resumo da oferta (tipo, preço, criador)
- Conta logada obrigatória (redirect login se anônimo)
- Método: **Pix** (primário v1); outros só se já existirem no stack
- Status: aguardando pagamento → confirmado / expirado / falhou
- Idempotência / não duplicar compra no mesmo ciclo
- Redirecionar para P05 ao confirmar

## P05 — Pós-compra / acesso

- Confirmação da compra
- Lista do conteúdo liberado (mídia / arquivos)
- Player / viewer seguro (sem download forçado se política for stream-only)
- Link permanente via Biblioteca (P06)
- Mensagem clara se pagamento ainda pendente

## P06 — Biblioteca do fan

- Abas ou seções: Assinaturas · Pacotes · Itens
- Status: ativa / expirada / cancelada
- Abrir conteúdo (volta a P05 no contexto da compra)
- Renovar / recomprar quando aplicável
- Sem inbox de mensagens

## P07 — Conta / configurações

- Nome, e-mail, foto
- Alterar senha
- Preferências de notificação (e-mail mínimo)
- Sair / encerrar sessão
- Trocar papel fan ↔ criador só se o fluxo de ativação existir (P15)

## P08 — Login / cadastro / recuperação

- Cadastro e-mail + senha
- Login e-mail + senha
- Recuperação de senha
- Confirmação de e-mail (se exigida)
- Age gate / aceite Termos + Privacidade no signup
- OAuth (Google etc.): **opcional** pós-v1 salvo decisão explícita

## P09 — Painel criador — visão geral

- Resumo: vendas recentes, assinantes ativos, saldo
- Atalhos para P10–P13
- Estado da conta (pendente KYC / ativa / bloqueada)

## P10 — Painel — perfil público

- Editar foto, capa, bio, nick, links
- Preview do que o fan vê em P03
- Publicar / despublicar perfil

## P11 — Painel — ofertas

- CRUD assinatura (preço, período, o que libera)
- CRUD pacotes
- CRUD itens avulsos
- Ativar / pausar oferta
- Vincular conteúdos (P12) a cada oferta

## P12 — Painel — conteúdos

- Upload de mídia / arquivos
- Metadados (título, tipo, ordem)
- Visibilidade: teaser vs pago
- Associar a ofertas
- Remover / arquivar
- Proteção básica (watermark / hotlink) conforme stack

## P13 — Painel — financeiro

- Extrato de vendas
- Saldo disponível / a liberar
- Solicitar saque
- Status de saques
- Taxas / repasse (regra de negócio documentada no produto)

## P14 — Institucional / legal

- Termos de uso
- Política de privacidade
- Aviso 18+ / conteúdo adulto
- Contato / ajuda mínima (FAQ curto)
- DMCA / denúncia (mínimo operacional)

## P15 — Onboarding criador

- “Quero vender” a partir da conta fan
- Dados mínimos (nome, documento, país)
- Verificação (selfie/doc) — nível definido na implementação
- Aceite de termos de criador / payout
- Liberar P09–P13 só após status ativo (ou sandbox de rascunho)

---

## Capacidades transversais

| Capacidade | Onde | Nota |
|------------|------|------|
| Auth sessão | P07–P08, gate em P04–P13 | Cookie/JWT conforme stack |
| Papéis fan / criador | Conta | Criador ⊂ fan autenticado + onboarding |
| Pagamento Pix | P04, P13 | Eixo BR da v1 |
| Entrega de conteúdo | P05, P06, P12 | Compra válida → acesso |
| Age gate 18+ | P01/P03/P08 | Obrigatório superfície adulta |
| Busca perfis | P02 | Sem ranking social |
| Notificação e-mail | P04, P06 | Confirmação compra / acesso |

---

## Não fazer na v1 (âncora)

- Feed infinito, stories, destaques tipo rede social
- Chat / DM / videochamada
- Live / streaming ao vivo
- Tips / mimos avulsos
- App nativo (só web responsivo)
- Marketplace de afiliados complexo
- Multi-moeda / multi-país além do necessário ao Pix BR

---

## Antes → depois

| Antes | Depois |
|-------|--------|
| Só visão em bullets no README | Páginas P01–P15 + capacidades por superfície |
| `functionalities.md` “A produzir” | Este arquivo |

## Rollback

```bash
git checkout -- clozzy/docs/functionalities.md clozzy/docs/README.md
# se o arquivo for novo no commit:
rm clozzy/docs/functionalities.md
```

## Próximo na esteira

[`user-stories.md`](user-stories.md) (ainda a produzir) — uma US por capacidade acima, priorizada pelo fluxo P03→P04→P05.
