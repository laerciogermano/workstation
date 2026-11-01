# Padrões observados + fontes + exemplos de estrutura

Pesquisa para o card [Wklw7mNQ](https://trello.com/c/Wklw7mNQ) — perfil LinkedIn de vendedor B2B.

---

## Consenso entre fontes (o que se repete)

1. **Perfil = landing page**, não CV. Quem abre é o *prospecto* depois de um toque frio (conexão / DM / e-mail).
2. **Headline** é o alavanca nº 1: ICP + resultado (métrica quando possível); cargo da empresa só como contexto no fim.
3. **Banner** é outdoor gratuito (1584×396): oferta, prova ou CTA — quase todos deixam genérico; quem personaliza destaca.
4. **Sobre**: 1ª pessoa; primeiras linhas = hook; fechar com CTA claro (DM / agenda / “me conta o gargalo”).
5. **Featured** não pode ficar vazio: case, recurso útil, one-pager, post com prova.
6. **Experiência** com outcomes do cliente, não job description.
7. **Atividade recente** importa: feed morto = conta automatizada ou abandonada.
8. **Recomendações** são a prova social mais forte quando existem.

---

## Estruturas-modelo (copiar o molde, não o texto genérico)

### Headline

```text
Ajudo [ICP] a [resultado mensurável] | [Cargo] na [Empresa]
```

Exemplos de forma (adaptar ao ICP ConectMax):

- `Ajudo compradores e facilities a reduzir custo e lead time de suprimentos corporativos | ConectMax`
- `Suprimentos e itens corporativos para empresas que precisam comprar mais rápido e com menos fricção | ConectMax`

### Banner (conteúdo)

- Linha 1: claim curto (“Suprimentos corporativos sem fricção”)
- Linha 2: prova ou escopo (“Materiais do dia a dia → tecnologia”)
- Opcional: CTA visual (“Conversa no LinkedIn →”)
- Visual alinhado à identidade Conect (não stock)

### Sobre (3 blocos)

1. **Hook (visível sem “ver mais”):** dor do comprador + para quem  
2. **Como / diferencial:** o que a abordagem resolve de forma concreta  
3. **CTA:** próximo passo explícito  

Opcional: 3–5 bullets de outcomes / categorias atendidas.

### Featured (prioridade)

1. PDF/apresentação institucional  
2. Case ou depoimento (mesmo que curto)  
3. Post ou artigo útil ao ICP (checklist de compras, sazonalidade, etc.)  
4. Link de conversa / formulário (se existir)

---

## Referências usadas

| Fonte | URL | O que extrair |
|-------|-----|----------------|
| LinkedIn Sales Blog — 12 steps (2025) | https://www.linkedin.com/business/sales/blog/profile-best-practices/17-steps-to-a-better-linkedin-profile-in-2017 | Foto 60%, headline ≠ só cargo, Sobre como história, skills ≥5, recomendações, atividade |
| ReachRobin — checklist SDR/AE | https://reachrobin.com/articles/linkedin-profile-optimization-checklist-for-sdrs-and-aes/ | 12 elementos; About em 3 parágrafos; erros comuns; cadência de refresh |
| HubSpot — profile cheat sheet | https://blog.hubspot.com/marketing/linkedin-profile-perfection-cheat-sheet | Foto, headline formats, experiência com mídia, URL/contato |
| HubSpot — prospecting | https://blog.hubspot.com/sales/master-in-sales-linkedin-prospecting | Headline orientada a valor; mídia na experiência; Featured |
| Forbes — high-converting profile 2025 | https://www.forbes.com/sites/jodiecook/2025/03/11/the-ultimate-guide-to-a-high-converting-linkedin-profile-in-2025/ | Primeiros 45 chars da headline; banner como oferta |
| SyncGTM — SDR LinkedIn | https://syncgtm.com/blog/sales-development-representative-linkedin | Headline outcome; About sobre o buyer; Featured; post ≥2×/semana |
| SalesLabs — optimize for prospecting | https://www.saleslabs.io/how-to-optimize-your-linkedin-profile-for-prospecting/ | Banner CTA; Featured com recurso útil (não post viral) |
| Melissa Gaglione — seller checklist | https://www.linkedin.com/posts/melissagaglione_linkedinsales-sales-b2b-activity-7341871678873911296-xJ-u | Checklist rápido seller: foto, headline ICP+valor, banner, About+CTA, Featured, experience results, skills, 3+ recs |
| oHub — otimizar perfil para vendas | https://base.ohub.com.br/vendas-b2b/prospeccao/social-selling-e-linkedin/artigos/como-otimizar-o-perfil-de-linkedin-para-vendas | Sequência foto→headline→resumo→experiência→prova social (PT) |
| TryChattie — vendas B2B 2026 | https://trychattie.com/pt-br/blog/como-otimizar-perfil-linkedin-para-vendas-b2b | Sobre em 6 partes; especificidade de ICP; CTA |
| LinkedIn Help (PT) | https://www.linkedin.com/help/linkedin/answer/a554351 | Baseline oficial: foto, título, resumo, experiências, skills, recomendações |

---

## Exemplos reais (padrão a observar — não necessariamente “copiar marca”)

Buscar / auditar perfis de AE/SDR/BDR B2B com:

- Headline com *Helping / Ajudo + ICP + outcome*  
- Banner com texto legível no mobile  
- Featured com 2+ assets  
- Sobre com CTA  
- Atividade nos últimos 7–14 dias  

**Critério de seleção para nosso benchmarking interno:** perfis que um comprador de suprimentos/facilities reconheceria como “pessoa real + empresa séria”, não influencer genérico de vendas.

*(URLs de perfis públicos concretos podem ser anexadas depois neste card conforme forem validados pelo time.)*

---

## Implicação para nossos perfis (ConectMax)

Defaults atuais (`profile-defaults.json` do screen-robot) já têm empresa, cargo genérico, avatar, banner e um Sobre institucional. Gaps vs. este checklist:

| Já existe (base) | Falta / ajustar |
|------------------|-----------------|
| Empresa + cargo | Headline prospect-facing (não só cargo) |
| Banner ConectMax | Validar se o banner comunica oferta/CTA, não só logo |
| Sobre institucional curto | Reescrever com hook do comprador + CTA |
| Avatar | Manter padrão headshot realista por persona |
| — | Featured, skills top 5, URL custom, atividade mínima, recomendações |

Detalhe de textos-modelo: ver `03-defaults-conectmax-vendedor.md`.
