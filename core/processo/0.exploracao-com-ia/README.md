# Exploração com IA

Loop para **definir o problema**, **pesquisar o mercado**, **gerar opções** e **escolher** antes do [discovery](../1.discovery/README.md). Serve para produto, marca, UI, arquitetura ou qualquer artefato ainda aberto.

```text
Cursor → PRD → Benchmark → Práticas → Prompt → Possibilidades → Escolha → (volta ao PRD/prompt)
```

Só depois da escolha estável: stories → epics → roadmap ([discovery](../1.discovery/README.md)).

---

## Visão geral

| # | Passo | Objetivo | Saída típica |
|---|-------|----------|--------------|
| 0 | Ter uma IA | Ambiente pronto para gerar e iterar | Cursor instalado e aberto no projeto |
| 1 | PRD | Congelar contexto, dor, objetivo e DoD | `prd.md` (ou seção no README) |
| 2 | Benchmarking | Coletar referências reais | `benchmark.md` + links/prints |
| 3 | Melhores práticas | Extrair o que o mercado já validou | `praticas.md` (checklist acionável) |
| 4 | Prompt | Empacotar 1–3 em instrução geradora | `prompt.md` |
| 5 | Possibilidades | Explorar várias direções | `possibilidades.md` (overview) |
| 6 | Escolha + loop | Selecionar o melhor e reforçar o input | PRD/prompt atualizados; opção vencedora |

Regra: **não pular** o PRD. Sem dor/objetivo/DoD, a IA inventa escopo.

---

## 0. Ter uma IA (baixar o Cursor)

**Por quê:** o loop depende de um agente que lê arquivos do repo, gera markdown e itera com contexto.

**Como**

1. Baixar o [Cursor](https://cursor.com) e instalar.
2. Abrir a pasta do projeto (ou do workspace).
3. Usar o chat/Agent no modo que edita arquivos.
4. (Opcional) Colocar regras curtas em `.cursor/rules/` e ponteiros no `README` / `AGENTS.md` — só o que a IA não descobre sozinha.

**Pronto quando:** consegue abrir o projeto e pedir para criar/editar um arquivo markdown.

---

## 1. Criar o PRD (requisitos)

**Por quê:** ancora a geração. Sem isso, benchmarking e prompts viram opinião solta.

**O que escrever (mínimo)**

| Campo | Pergunta que responde |
|-------|------------------------|
| **Contexto** | Onde isso vive? Para quem? Restrições (prazo, stack, marca, canal)? |
| **Dor** | Qual problema concreto dói hoje? Evidência (fato, citação, métrica)? |
| **Objetivo** | O que muda se der certo? (1–3 frases, observável) |
| **DoD** | Como saber que está pronto? Critérios testáveis / checklist de aceite |
| **Fora de escopo** | O que **não** entra nesta rodada |

**Como**

1. Pedir à IA: *“Escreve um PRD enxuto com Contexto, Dor, Objetivo, DoD e Fora de escopo — sem inventar solução.”*
2. Revisar: cortar solução prematura; deixar só problema e critérios.
3. Salvar em `docs/prd.md` (ou equivalente no projeto).

**Pronto quando:** alguém de fora entende o *porquê* e o *feito* sem ver nenhuma opção de design/código.

Modelo curto:

```markdown
# PRD — <nome>

## Contexto
…

## Dor
…

## Objetivo
…

## Definition of Done
- [ ] …
- [ ] …

## Fora de escopo
- …
```

---

## 2. Benchmarking (referências)

**Por quê:** evita reinventar e dá material concreto para o prompt (não só “faça bonito”).

**Como**

1. Listar 5–15 referências do mesmo problema (apps, marcas, fluxos, docs).
2. Para cada uma anotar: o que funciona, o que falha, o que copiar / evitar.
3. Guardar links, prints ou paths em `docs/benchmark.md`.

**Critérios de boa referência**

- Mesmo tipo de usuário ou dor (não só “bonito”)
- Observável (URL, print, trecho)
- Comparável (mesmo job-to-be-done)

**Pronto quando:** há tabela ou lista com “pegar / descartar” por referência.

---

## 3. Melhores práticas do mercado

**Por quê:** transforma benchmark em regras reutilizáveis (o prompt usa isso como guardrail).

**Como**

1. Pedir à IA: *“A partir do PRD + benchmark, extrai práticas do mercado em checklist acionável (fazer / não fazer). Sem fluff.”*
2. Cruzar com fontes canônicas do domínio (ex.: pacotes em [`definir-projeto-moderno/`](../../definir-projeto-moderno/README.md) quando for stack/UI/marca/segurança).
3. Salvar em `docs/praticas.md`.

**Pronto quando:** cada prática é uma regra testável (“usar X”, “evitar Y”), não slogan.

---

## 4. Criar o prompt (a IA gera)

**Por quê:** o prompt é o contrato de geração — une PRD + referências + práticas numa ordem executável.

**Como**

1. Pedir à IA: *“Com base em prd.md, benchmark.md e praticas.md, escreve um prompt gerador. Inclui: papel da saída, restrições, formato das possibilidades, critérios de qualidade, o que não fazer.”*
2. Revisar o prompt: deve citar a dor/DoD; deve pedir **várias** opções, não uma.
3. Salvar em `docs/prompt.md` (versão versionada — não só no chat).

**Estrutura útil do prompt**

```text
Contexto + dor + objetivo + DoD
Referências a imitar / evitar
Práticas obrigatórias
Pedido: N possibilidades distintas (overview)
Formato de cada possibilidade (nome, tese, prós, contras, risco)
Critérios de ranking
```

**Pronto quando:** colar o prompt numa sessão limpa produz overview comparável, sem pedir esclarecimentos básicos.

---

## 5. Gerar possibilidades (overview)

**Por quê:** explorar o espaço de solução *antes* de comprometer o discovery.

**Como**

1. Rodar o `prompt.md` no Agent (sessão preferencialmente limpa).
2. Pedir **várias** direções (ex.: 4–8), cada uma com: nome, tese em 1 frase, o que entrega, prós, contras, alinhamento ao DoD.
3. Salvar em `docs/possibilidades.md` — overview, não implementação completa.

**Regras**

- Opções devem ser **distintas** (não variação cosmética da mesma ideia)
- Nenhuma opção vira implementação ainda
- Se tudo parecer igual → reforçar o prompt (passo 4) com “divergir em eixo X”

**Pronto quando:** dá para comparar opções lado a lado contra o DoD.

---

## 6. Escolher os melhores e retroalimentar

**Por quê:** a escolha vira input melhor — fecha o loop em vez de “gerar para sempre”.

**Como**

1. Rankear contra o DoD + práticas (não contra gosto solto).
2. Escolher 1 vencedora (ou híbrido explícito: “A + trecho de C”).
3. Atualizar artefatos:
   - **PRD:** ajustar objetivo/DoD/fora de escopo se a escolha mudou o *quê*
   - **Práticas / prompt:** incorporar o que a escolha revelou (novos “fazer/não fazer”)
   - **Possibilidades:** marcar vencedora + motivo da rejeição das outras (1 linha cada)
4. Se ainda houver dúvida grande → voltar ao passo 2 ou 4 e rodar outra rodada **curta**.
5. Se está estável → seguir para [discovery](../1.discovery/README.md) (stories a partir da direção escolhida).

**Pronto quando:** existe uma direção nomeada, com DoD intacto ou revisado de propósito, e o próximo passo é especificar (US/EP), não “gerar mais ideias”.

---

## Diagrama do loop

```text
┌─────────────┐
│ 0. Cursor   │
└──────┬──────┘
       ▼
┌─────────────┐
│ 1. PRD      │◄──────────────────────────────┐
└──────┬──────┘                               │
       ▼                                      │
┌─────────────┐     ┌──────────────┐          │
│ 2. Benchmark│────►│ 3. Práticas  │          │
└─────────────┘     └──────┬───────┘          │
                           ▼                  │
                    ┌─────────────┐           │
                    │ 4. Prompt   │◄──────────┤
                    └──────┬──────┘           │
                           ▼                  │
                    ┌─────────────┐           │
                    │ 5. Opções   │           │
                    └──────┬──────┘           │
                           ▼                  │
                    ┌─────────────┐           │
                    │ 6. Escolha  │───────────┘
                    └──────┬──────┘  (retroalimentação)
                           ▼
                    Discovery (US → EP → …)
```

---

## Entradas / saídas (resumo)

**Entradas**

- Ideia, demanda ou dor bruta
- Restrições conhecidas
- (Opcional) material de marca / stack / pesquisa prévia

**Saídas**

| Arquivo | Conteúdo |
|---------|----------|
| `prd.md` | Contexto, dor, objetivo, DoD, fora de escopo |
| `benchmark.md` | Referências + pegar/descartar |
| `praticas.md` | Checklist de mercado |
| `prompt.md` | Prompt gerador versionado |
| `possibilidades.md` | Overview das opções + escolha |

**Próximo passo**

Com a direção escolhida: [1. Discovery](../1.discovery/README.md) → depois o ciclo do [processo](../README.md).

---

## Anti-padrões

| Evitar | Fazer |
|--------|--------|
| Começar pelo prompt sem PRD | Congelar dor + DoD primeiro |
| Uma única opção “definitiva” | Overview comparável, depois escolha |
| Benchmark só de estética | Comparar pelo mesmo job/dor |
| Deixar a escolha só no chat | Gravar vencedora e motivo no repo |
| Implementar antes de escolher | Discovery só após o passo 6 estável |
| Loop infinito de ideias | Limitar rodadas; cada loop deve melhorar o PRD/prompt |
