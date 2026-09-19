# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô, todas expostas via **código Node**.  
**Origem:** [visão](../README.md).  
**Agente LinkedIn:** [`../../linkedin-agent/`](../../linkedin-agent/README.md).  
**Negócio:** [`../../vendas/`](../../vendas/README.md).

| Funcionalidade | Descrição |
|----------------|-----------|
| Provisionar um agente | Sobe/conecta o Android (agent) e deixa o device pronto para ADB (serial online, boot completo) |
| Instalar APKs | Baixa (versão definida na config do dispositivo) e instala pacotes no agent |
| Receber eventos | Observa e espera sinais do device/UI (boot, app aberta, tela estável, mudança de dump) |
| Executar operações | Dispara gestos e comandos (abrir aplicativo, tap, type, key, scroll, screenshot) e **rescata coordenadas x,y** a partir de uma imagem de entrada |
| Extrair elementos e informações | Lê a tela e devolve a UI como **árvore de componentes** (estilo DOM): textos, ícones, imagens, fotos, **listas** e demais nós, com bounds e metadados |
| Guardar estado de sessão | Persiste e restaura contexto da sessão (device, apps, último frame, login parcial) em arquivo |

### Extrair elementos e informações

Lê a tela (dump / OCR / visão) e devolve a hierarquia da UI como **árvore de componentes**, análoga a um DOM: cada nó tem tipo, bounds, metadados e filhos.

| Tipo de nó | Conteúdo típico |
|------------|-----------------|
| Texto | String visível (OCR ou atributo de acessibilidade) |
| Ícone | Controle/pictograma reconhecido (ex.: lupa, menu, coração) |
| Imagem / foto | Região de mídia (avatar, banner, foto de perfil) |
| Lista | Coleção rolável/repetível de itens (cada item é um filho na árvore) |
| Container | Agrupador (card, toolbar, painel) com filhos |
| Outros | Botões, campos, links e nós genéricos com papel na UI |

A saída é a **árvore completa** (raiz → filhos), não só uma lista plana — quem consome navega como em um DOM. Listas entram como nós com itens filhos (e metadados de scroll quando houver).

## Cenário de aceitação (funcionalidade maior)

Login no LinkedIn orquestrando as seis fatias:  
[`bdd-linkedin-login.md`](bdd-linkedin-login.md) · script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ [`tasks.md`](tasks.md) → [`core/tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot) — árvore, Gantt e kanban  
→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
