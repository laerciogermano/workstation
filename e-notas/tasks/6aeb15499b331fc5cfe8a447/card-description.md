## Objetivo
Criar o pacote **Notinhas Beta** (`e-notas/beta-docs/`) no **mesmo padrão (ou melhor)** do RoleGo Beta (`role-go/beta-docs/`), para construir a 1ª versão do **notinhas.shop** com apoio de IA.

**Só documentação + interface gráfica das funcionalidades (protótipos / design system).** Sem implementar app, API ou features neste card.

Referência de qualidade: https://rolego.com.br · `role-go/beta-docs/` · card RoleGo https://trello.com/c/XIzwn6JC

---

## Por quê
Hoje o e-notas tem visão, PRD rascunho, REQs, marca e um app v0 — mas **não** tem o pacote unificado que o RoleGo tem: histórias Gherkin, ADRs, contratos, plano BETA-nnn, protótipos navegáveis T-xx e guia para IA. Sem isso, implementação vira improvisação.

---

## Escopo do Beta (produto) — o que os docs devem cobrir
Síntese do PRD / visão (ajustar MoSCoW no `01-prd.md`):

**Must**
- Depósito de NFC-e (QR ao vivo + foto) → itens / empresa
- Vínculo cooperativo EAN ↔ código interno
- Comparação de preços (loja + data + menor preço)
- Histórico de preços
- Busca geo “onde comprar perto”
- Ranking de estabelecimentos perto (mais baratas / mais caras)
- Destaques (preço abaixo da referência)

**Should (documentar; prioridade no plano)**
- Vitrine da loja (catálogo inferido das notas, sem checkout)
- Cesta / montagem apartada (split entre lojas)
- Gestão financeira pessoal (extrato das notas do usuário)
- Conta / auth / perfil (mínimo para extrato e contribuição)

**Won’t neste Beta (deixar explícito no PRD)**
- Checkout / pagamento / logística CD completo
- Marketplace com margem de canal
- App nativo (PWA / web mobile-first)

---

## Entregáveis (espelho RoleGo)

Pasta: `e-notas/beta-docs/`

| # | Artefato | Conteúdo |
|---|---|---|
| 00 | `README.md` | Índice, ordem de leitura, decisões-chave, perguntas abertas |
| 01 | `01-prd.md` | Problema, objetivos/métricas, MoSCoW, regras, riscos, Qs abertas |
| 02 | `02-historias/` | Histórias + Gherkin por épico (IDs US-E.nn) |
| 03 | `03-arquitetura.md` | C4, stack, módulos |
| 04 | `04-adrs.md` | ADRs com contexto e alternativas |
| 05 | `05-modelo-de-dados.md` | ERD, constraints, índices, SQL críticas |
| 06 | `06-contratos-api.md` | Endpoints, DTOs, erros |
| 07 | `07-diagramas.md` | Sequência, estados, navegação |
| 08 | `08-boas-praticas-codigo.md` | Regras, pastas, checklist PR |
| 09 | `09-estrategia-de-testes.md` | Pirâmide, gates, analytics |
| 10 | `10-seguranca-privacidade-lgpd.md` | Inventário dados, STRIDE, controles |
| 11 | `11-plano-de-implementacao.md` | Marcos + tasks `BETA-nnn` + DoD |
| 12 | `12-prototipos.md` | Inventário T-xx + princípios + componentes |
| — | `prototipos/index.html` | Galeria + modo navegável (design system embutido) |
| — | `prototipos/prototipos-notinhas-beta.pdf` | PDF da galeria (Chrome headless) |
| 13 | `13-guia-desenvolvimento-com-ia.md` + `ia/` | Fluxo por task, CLAUDE.md, prompts |
| 14 | `14-operacao-deploy.md` | Ambientes, Contabo, runbooks |
| 15 | `15-glossario.md` | Domínio ↔ código |

**Qualidade mínima dos protótipos (igual/melhor que RoleGo):**
- Telas mobile-first com IDs `T-xx`, agrupadas por fluxo/épico
- Modo galeria + navegação (`data-go`, atalhos, deep-link `#T-xx`)
- Notas por tela: histórias + regras
- Design system: tokens da marca notinhas.shop (cores, tipografia, botões, cards, chips, tab bar, estados vazios)
- Fidelidade média/alta; conteúdo fictício coerente (Curitiba / NFC-e PR)
- PDF anexado neste card ao concluir

---

## Insumos (já existem — reusar, não reinventar)
- Visão: `e-notas/README.md`
- PRD: `e-notas/docs/prd.md`
- REQs: `e-notas/docs/requisitos.md`
- Identidade: `e-notas/marca/identidade-visual-notinhas-v1.html` · `e-notas/identidade-visual.md`
- Design system atual: `e-notas/marca/design-system-notinhas-v1.html` · `e-notas/design-system.md`
- Apresentação: `e-notas/marca/apresentacao-notinhas-v1.html`
- App v0 (aprendizado, não copiar layout às cegas): `e-notas/app/`
- Deploy: `e-notas/deploy/`
- Padrão a espelhar: `role-go/beta-docs/`

---

## Critérios de aceite
- [ ] Pasta `e-notas/beta-docs/` completa (README + 01…15 + `ia/` + `prototipos/`)
- [ ] Qualidade e estrutura comparáveis ao RoleGo (seções, IDs, links cruzados, MoSCoW, ADRs, BETA-nnn)
- [ ] Protótipos HTML navegáveis com inventário documentado em `12-prototipos.md`
- [ ] Design system das telas alinhado à marca notinhas.shop (tokens oficiais)
- [ ] PDF gerado e **anexado** neste card
- [ ] `e-notas/docs/README.md` aponta para o pacote Beta
- [ ] Comentário no card com caminho dos artefatos + como abrir o HTML
- [ ] **Zero** implementação de feature/app neste card (só docs + UI estática de protótipo)

---

## Fora de escopo
- Codar Nest/React/refatorar `app/`
- Deploy obrigatório em produção (opcional: espelhar RoleGo e publicar galeria depois, card separado se precisar)
- Redesenhar logo / identidade do zero
- Checkout, pagamento, CD logístico

---

## Ordem sugerida de execução (quando for fazer)
1. `01-prd` + escopo MoSCoW do Beta
2. Épicos + `02-historias` (Gherkin)
3. `12-prototipos` + `prototipos/index.html` (UI) + PDF
4. Arquitetura → ADRs → dados → API → diagramas
5. Testes, LGPD, boas práticas, plano BETA-nnn, guia IA, glossário, operação
6. Anexar PDF, atualizar índices, mover card → Done

---

## Relacionados
- Identidade: https://trello.com/c/qUI3Rb9a
- Design system: https://trello.com/c/qdH95gZX
- Apresentação: https://trello.com/c/hfGuzfMs
- PRD/benchmarking: https://trello.com/c/1fMjqGdR
- RoleGo protótipos (referência): https://trello.com/c/XIzwn6JC
