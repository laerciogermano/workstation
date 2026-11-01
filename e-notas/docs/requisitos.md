# e-notas — Requisitos e regras

**Por quê:** fonte canônica das regras de produto/técnicas pedidas no chat ou na esteira.  
**Importante:** todo requisito novo descrito deve entrar **aqui** no mesmo turno da implementação.  
**No fluxo:** complementar à [visão](../README.md); não substitui BDD. Regra operacional: [`../config/config-ia.md`](../config/config-ia.md) · Cursor: [`.cursor/rules/e-notas-requisitos.mdc`](../../.cursor/rules/e-notas-requisitos.mdc).

App: [`../app/README.md`](../app/README.md).

---

## Como usar este documento

1. Novo requisito / regra descrita → acrescentar seção ou item numerado abaixo (com data).
2. Implementar o comportamento.
3. Se a regra mudar, atualizar o item (não apagar histórico sem marcar *revogado*).

---

## REQ-001 — Front de scan do QR (2026-11-01)

- Existe um front com **uma única tela** que abre a câmera para escanear o QR Code da nota.
- A URL lida do QR é impressa no **console** do browser.
- O front é acessível via **web na rede local** (não só localhost do desktop).

## REQ-002 — HTTPS obrigatório (2026-11-01)

- O app deve ser servido em **HTTPS** (câmera em rede / origem segura).
- Certificado autoassinado é aceitável em lab; o usuário precisa confiar no aviso do browser.

## REQ-003 — Backend recebe URL e processa (2026-11-01)

- O backend recebe a URL escaneada (`POST /api/nota`).
- Imprime a URL (e demais resultados do processamento) no **terminal** do servidor.

## REQ-004 — Extração de itens Fazenda PR (2026-11-01)

- A URL deve ser da consulta pública NFC-e da **Fazenda PR** (`fazenda.pr.gov.br/nfce/qrcode`).
- O backend busca a DANFE no site e **extrai todos os itens** (nome, código, quantidade, unidade, valor unitário, valor total).
- Também extrai dados disponíveis da **empresa** e da **nota** (CNPJ, endereço, chave, número, série, emissão, totais, etc.).

## REQ-005 — Cadastro empresa / nota / itens com histórico (2026-11-01)

- Ao receber URL válida processada:
  1. **Cadastrar a empresa** se ainda não existir (dados do site; chave natural = CNPJ).
  2. **Cadastrar a nota** (chave de acesso; não duplicar a mesma nota).
  3. **Cadastrar cada item** da nota.
- Cada **nova nota** gera **novas tuplas de item** (histórico de preço entre notas distintas).
- *Complementado por REQ-009:* dentro da mesma nota o item não duplica.

## REQ-009 — Item único por nota (2026-11-01)

- Itens **não podem ser duplicados** na mesma nota.
- Chave natural do item: **`(nota_id, codigo)`** — só pode haver **um registro de item por código em cada nota**.
- Constraint UNIQUE no Postgres; insert com `ON CONFLICT DO NOTHING`; dedupe na ingestão.
- O mesmo código em **notas diferentes** continua permitido (histórico).

## REQ-006 — Persistência Postgres Contabo (2026-11-01)

- Usar o **Postgres da Contabo** (credenciais em `credenciais.md` / `.env` do app).
- Schema dedicado: **`enotas`** (tabelas `empresas`, `notas`, `itens`) no banco `connectmax`.
- `.env` não versionado; `.env.example` sem senha.

## REQ-007 — Documento de requisitos sempre atualizado (2026-11-01)

- Existe este documento de requisitos/regras no projeto.
- **Sempre que um requisito ou regra nova for descrita**, ela deve ser **adicionada neste arquivo** no mesmo trabalho.
- A obrigação fica escrita em `config/config-ia.md` e em `.cursor/rules/e-notas-requisitos.mdc`.

## REQ-008 — Página de listagem (2026-11-01)

- Existe uma página web (`/lista.html`) que lista **todas as empresas**, **todas as notas** e **todos os itens** cadastrados.
- APIs de leitura: `GET /api/empresas`, `GET /api/notas`, `GET /api/itens`.
- Navegação entre a tela de scan (`/`) e a listagem.
- Na listagem de notas, exibir também: **data** (emissão formatada `dd/mm/aaaa às HH:mm`), **qtd. total de itens**, **valor total R$**, **descontos R$** e **outras despesas R$**.
- Notas ordenadas da **mais nova para a mais antiga** (data de emissão; empate por id).
- Na listagem de itens, existe um campo **Pesquisar** (filtro no front por código, nome, empresa e demais colunas).

---

## Próximos passos

→ Manter este arquivo alinhado a cada pedido novo · esteira de docs em [`README.md`](README.md) quando avançar funcionalidades/BDD.
