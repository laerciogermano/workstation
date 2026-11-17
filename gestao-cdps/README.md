# Gestão de CDPs — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto de gestão e controle visual de CDPs humanos antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — sem ela, operação e derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → implementação.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Também chamado** Gestão de Human CDPs.  
**Não confundir com** a lib [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (API de programador, sem UI). Este projeto é a **interface gráfica** que consome essa lib: CRUD de CDPs + controle remoto via tela com eventos reproduzidos como humano.

---

## Visão

A **Gestão de CDPs** é o app com **interface gráfica** centrada numa **lista de CDPs com status**, com ações de **criar, editar e remover**, além de **executar / parar** e **controlar cada sessão pela tela**: movimento do mouse, cliques e digitação na UI são **reproduzidos no Chrome via CDP** com comportamento **humano** (trajetória, ritmo, foco) através da lib **human-cdp**.

## Problema

Hoje o CRUD e a operação de CDPs passam por código/CLI (`createCdp`, `connectCdp`, `stopCdp`, scripts). Não há um painel único com **lista + status** para gerir perfis e **dirigir** a sessão com o mouse e o teclado, com a garantia de que cada gesto vira input humano no browser.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Sem lista visual** | Não dá para ver de uma vez quais CDPs existem e se estão up/down. |
| **CRUD sem UI** | Criar/editar/remover CDP exige script ou API da lib. |
| **Formulário espalhado** | Dados de criação (nome, porta, URL, fingerprint…) sem formulário único. |
| **Start/stop manual** | Subir e parar Chrome/CDP fora de um console visual. |
| **Controle sem ponte** | Mexer o mouse na tela do operador **não** vira clique/move/type humano no CDP. |
| **Risco de teleporte** | Atalhos crus (`el.click`, press sem trajetória) quebram o padrão humano do lab. |

Já existe a lib **human-cdp**. Falta o **produto de gestão + telemetria de input** sobre ela.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Operador** | Quem sobe e usa CDPs no dia a dia | Ver a **lista com status**, criar/editar/remover, ligar/desligar e controlar pela tela |
| **Operação lab** | Quem mantém perfis Chrome / portas | Lista clara up/down, dados do formulário, remover com segurança |
| **Desenvolvedor de automações** | Quem hoje chama a lib no código | Preferir a UI para gestão e inspeção; scripts só quando necessário |

## Objetivo

Ser o **console gráfico padrão** de CDPs humanos no lab: **lista com status**, **criar / editar / remover** (formulário de criação), **executar / parar**, e **controle remoto por tela** em que **todo** movimento de mouse, clique e dígito é espelhado no CDP via **human-cdp**.

## Proposta de valor

O operador vê a **lista**, o **status** de cada CDP e **dirige** o Chrome pela UI; a lib garante que o gesto seja humano no destino — sem reinventar trajetória/foco em cada script.

| Necessidade | O que a Gestão de CDPs faz |
|-------------|----------------------------|
| Ver todos os CDPs | **Lista** com identificação e **status** (ex.: up / down) |
| Criar / editar / remover | Ações na lista + formulário com os **dados de criação** do CDP |
| Executar / parar | Start e stop do CDP a partir da UI |
| Ver a sessão | Tela (viewport / espelho) do browser ligado |
| Controlar | Mouse move, clique e digitação na UI → reprodução no CDP |
| Humano de verdade | Toda interação passa por **human-cdp** (foco lógico + trajetória + ritmo) |

### Exemplos

**Lista com status** — A tela principal mostra os CDPs e se cada um está ligado ou parado; dali o operador cria, edita ou remove.

**Novo CDP** — Operador preenche o formulário (nome, porta, URL padrão, fingerprint/obs…) e cria o perfil; ele entra na lista.

**Ligar** — Clica executar; o Chrome sobe (ou reconecta) e a tela do CDP aparece na UI.

**Dirigir** — Move o mouse e clica na área da tela; o ponteiro no Chrome percorre a trajetória e clica como humano.

**Digitar** — Digita no controle da UI; as teclas chegam ritmadas no campo focado do CDP.

**Parar** — Para o CDP pela UI sem matar o restante da operação do lab por engano (contrato alinhado à lib).

## Princípios

1. **UI sobre a lib** — gestão e controle usam `human-cdp`; não reimplementar CDP cru na UI.
2. **Todo gesto é humano** — move, clique e type **sempre** com trajetória/foco/ritmo; sem `el.click()` / press solto.
3. **Lista + status primeiro** — a gestão começa pela lista de CDPs e pelo status de cada um; criar/editar/remover partem daí.
4. **Formulário = contrato de criação** — os campos da UI refletem os dados reais de criação/edição do CDP.
5. **Executar e parar explícitos** — start/stop são ações de primeira classe na tela.
6. **Um CDP por vez no controle** — a sessão ativa sob telemetria de input é clara para o operador.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Lista** | Listar todos os CDPs com **status** (ex.: up / down) |
| **CRUD** | Criar, editar e remover CDPs a partir da lista |
| **Formulário** | Dados de criação do CDP (id/nome, porta, URL padrão, observações, fingerprint quando aplicável) |
| **Lifecycle** | Executar (start/connect) e parar (stop) |
| **Tela** | Visualizar a sessão ativa o suficiente para controlar |
| **Controle** | Mouse move, clique e digitação na UI → CDP via human-cdp |
| **Stack** | Chrome Remote Debugging + [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) |

### Fora de escopo (v1)

- Substituir a lib human-cdp (este app **consome** a lib)
- Automação de negócio (LinkedIn, OmeTV, Tinder…) — fica nos projetos consumidores
- App mobile nativo
- Orquestração multi-CDP em massa / filas de jobs
- Gravação/playback de macros (pode vir depois; v1 é controle ao vivo)

## Modelo conceitual

### CDP

Perfil Chrome gerenciado pela lib (`~/chrome-profiles/<id>/` + meta `.human-cdp.json` + porta de debug).

### Lista de CDPs

Vista principal da gestão: cada linha/item é um CDP com **status** e ações (criar, editar, remover; executar/parar).

### Status

Estado operacional do CDP na lista (no mínimo **up** / **down**; alinhado ao que a lib consegue observar — porta/processo).

### Formulário de criação / edição

Conjunto de campos que alimenta `createCdp` / `updateCdp` (nome, porta, defaultUrl, obs, fingerprint…).

### Sessão ativa

CDP em execução conectado à UI, pronto para receber controle.

### Espelho / superfície de controle

Área da interface onde o operador vê e age; cada evento de pointer/teclado vira chamada humana na sessão.

### Evento de input

Move, down/up (clique) ou tecla capturados na UI e reproduzidos no CDP.

## Critérios de sucesso (visão)

- A UI mostra uma **lista de CDPs com status**.
- Dá para **criar, editar e remover** CDPs a partir dessa lista (formulário de dados de criação).
- Dá para **executar e parar** um CDP pela UI.
- Com a sessão ativa, **mover o mouse, clicar e digitar** na tela do app reproduz o gesto no Chrome via **human-cdp**.
- Nenhum caminho de controle da UI usa clique/teleporte sem trajetória humana.

## Fora / adjacências

| Projeto | Papel |
|---------|--------|
| [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) | Lib de CRUD + click/type/drag com foco e trajetória — **dependência** |
| [`screen-robot`](../screen-robot/README.md) / chrome-cdp | Runtime Chrome com remote debugging |
| OmTV, OV, Connect, CRM… | Consumidores de CDPs — não são este console |

## Console v1 (lab)

UI local da lib human-cdp:

```bash
cd screen-robot/pocs/chrome-cdp/human-cdp && npm run camera-ui
# → http://127.0.0.1:18770/
```

- **Lista** com status up/down
- **Criar / editar / remover** + fingerprint (opções da lib + Gerar)
- **Backups** em `~/chrome-cdp-backups/<id>/` (datas + seleção); **Executar** apaga o perfil e restaura o backup selecionado
- **Controlar**: prints JPEG low-quality em `~/chrome-cdp-view/<id>/` (loop) + clique/type via human-cdp

Código: [`../screen-robot/pocs/chrome-cdp/human-cdp/camera-ui/`](../screen-robot/pocs/chrome-cdp/human-cdp/camera-ui/).

## Próximos passos

1. Validar e refinar **este** documento de visão.
2. [`docs/`](docs/README.md) → PRD / funcionalidades (lista + status, formulário, lifecycle, superfície de controle).
3. Discovery (épicos / stories) só depois da visão estável — controle por tela (espelho) ainda fora do console v1.
