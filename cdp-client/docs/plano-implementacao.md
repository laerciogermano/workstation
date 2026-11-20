# Plano de implementação — Edge Client (cdp-client)

**Por quê:** quebrar o produto em fatias verificáveis (instalador → daemon → WebSocket → dispatcher de comandos → handlers → boot).  
**Visão:** [`../README.md`](../README.md) · **Índice:** [`README.md`](README.md)

**Antes → depois:** docs centrados em “só CDP” → agente instalável cross-platform com canal WebSocket + **execução de comandos** (CDP = um handler).  
**Rollback:** parar na última fase verde; apagar `daemon/` / `installer/` / `bridge/` / `handlers/` criados; manter docs; desregistrar serviço do SO se a fase de boot já tiver sido aplicada. Visão antiga “CDP-only”: recuperar commit anterior a este realinhamento.

---

## Princípio

1. **Um SO piloto primeiro** (macOS no lab) — validar lifecycle; depois Linux; depois Windows.
2. **Daemon + WebSocket + dispatcher antes de UI** — tray/status só depois do canal estável.
3. **Comando genérico primeiro; CDP como handler** — o protocolo não assume CDP; o handler CDP reutiliza o contrato do lab (Chrome debug + human-cdp).
4. **Lote:** fechar Fase N num SO → só então espelhar nos outros.

---

## Fase 0 — Bootstrap (docs) ✅

| Entrega | Critério |
|---------|----------|
| Visão + este plano + config IA + prompts | Pasta `cdp-client/` no workspace |
| Entrada no índice de projetos | Linha em [`works/README.md`](../../README.md) |
| Realinhamento executor genérico | Visão/plano/config descrevem comandos arbitrários; CDP = handler |

**Árvore:** `README`, `docs/`, `config/`, `prompts/`.

---

## Fase 1 — Decisão de runtime + PoC daemon (macOS)

| Entrega | Critério de pronto |
|---------|-------------------|
| Escolher Go *ou* Node empacotado | Decisão escrita em `docs/arquitetura.md` (criar na fase) |
| Processo long-running sem UI | Sobrevive a fechar o terminal de lançamento |
| Config mínima | Arquivo/local com `wsUrl`, `token`/`deviceId` |
| Logs | stdout/arquivo com start, config carregada, heartbeat |

**Árvore sugerida:**

```text
daemon/
  README.md
  …          # main do agente
config.example.json
```

**Riscos:** permissões macOS (Background Items / notarização depois). Documentar no README da fase.

---

## Fase 2 — WebSocket cliente (reconnect)

| Entrega | Critério |
|---------|----------|
| Conectar a `ws://` / `wss://` configurado | Handshake ok contra host de teste |
| Heartbeat / ping | Host detecta online/offline |
| Reconnect com backoff | Derrubar rede → volta sozinho |
| Auth mínima | Token ou device key no handshake |

**Fora desta fase:** protocolo rico de comandos (só ping/hello + eco).

**Árvore:** `daemon/` + `docs/protocolo-ws.md` (rascunho hello/ping).

---

## Fase 3 — Dispatcher de comandos + 1º handler (eco) + handler CDP

| Entrega | Critério |
|---------|----------|
| Envelope `command` / `result` / `error` | Spec mínima em `docs/protocolo-ws.md` (`type`, `id`, `payload`) |
| Registry de handlers | `type` desconhecido → erro tipado; eco (`ping`/`echo`) verde |
| Handler CDP: subir ou reusar Chrome com `--remote-debugging-port` | `/json/version` responde quando comando CDP exigir |
| Encaminhar 1 comando CDP de prova | Ex.: listar targets ou screenshot |
| Input humano (se gesto CDP) | click/type de prova via **human-cdp** |
| Anúncio de capabilities | Client informa ao host quais `type`s / handlers estão ativos |

**Árvore:** `daemon/` (dispatcher) + `handlers/` (ou `bridge/` para CDP) + dependência human-cdp se Node.

**Rollback:** matar só o Chrome do perfil do client; não tocar perfis do lab. Desligar handler CDP não derruba o canal WS nem outros handlers.

---

## Fase 4 — Instalação + boot (macOS piloto)

| Entrega | Critério |
|---------|----------|
| Comando `install` / primeira execução | Copia binário, grava config, registra LaunchAgent |
| Reboot (ou simulação unload/load) | Serviço sobe e reconecta WS sozinho |
| `uninstall` | Remove serviço + arquivos do client (perfil Chrome opcional) |

**Árvore:** `installer/macos/`.

---

## Fase 5 — Linux (systemd)

| Entrega | Critério |
|---------|----------|
| Unit systemd user ou system | `systemctl --user enable --now` (ou equivalente documentado) |
| Mesmo contrato WS + comandos | Paridade com macOS piloto |
| install / uninstall | Idempotente |

**Árvore:** `installer/linux/`.

---

## Fase 6 — Windows (Service / Task)

| Entrega | Critério |
|---------|----------|
| Instalador registra serviço ou tarefa no logon | Sobrevive a logoff/reboot conforme contrato escolhido |
| Binário Windows | Artefato CI ou build local documentado |
| install / uninstall | Documentado; sem leftover óbvio |

**Árvore:** `installer/windows/`.

---

## Fase 7 — Protocolo completo + host de teste + handlers extras (*should*)

| Entrega | Critério |
|---------|----------|
| Mensagens tipadas (hello, ping, command, result, event, error) | Spec em `docs/protocolo-ws.md` |
| Pelo menos 1 handler não-CDP de prova | Ex.: `echo` / `sys.info` / shell allowlisted — o host manda, client executa |
| Host mínimo de lab | Aceita N clients; lista online; envia comando CDP **e** não-CDP |
| Integração opcional | Gancho documentado para Gestão de CDPs / Agent Shop (*should*) |

---

## Fase 8 — Empacotamento e polish (*should*)

- Assinatura / notarização macOS; instalador Windows (MSI/exe); .deb/.AppImage ou tarball Linux.
- Tray ícone com status online/offline (*should*).
- Update channel (*could*).

---

## Ordem sugerida

```text
F0 docs ✅ (visão = executor genérico)
 → F1 daemon macOS + decisão runtime
 → F2 WebSocket + reconnect
 → F3 dispatcher + eco + handler CDP (+ human-cdp se gesto)
 → F4 install/boot macOS
 → F5 Linux
 → F6 Windows
 → F7 protocolo + host + handler não-CDP
 → F8 empacote / tray
```

---

## Critérios de aceite do MVP

1. Instalar no SO piloto com um comando / instalador.  
2. Após reboot, client online no host sem ação do usuário.  
3. Host consegue enviar **comando genérico** de prova (eco / capability) **e** pelo menos **uma** operação CDP.  
4. Linux e Windows com o mesmo lifecycle (pode ser logo após o piloto, mas MVP “produto” exige os três).  
5. Documentação de install / uninstall / config / rollback por SO.  
6. Protocolo documenta que novos `command.type` entram como handlers, sem client separado.

---

## Caminho inverso (desfazer)

| O quê | Como |
|-------|------|
| Remover serviço | `cdp-client uninstall` (quando existir) ou remover LaunchAgent / unit / serviço Windows manualmente |
| Parar daemon | stop do serviço do SO |
| Apagar projeto docs-only | Remover pasta `cdp-client/` e linha no `works/README.md` |
| Após código | Apagar `daemon/`, `handlers/`, `bridge/`, `installer/`; manter visão se ainda válida |
| Voltar à visão CDP-only | Reverter commit do realinhamento executor genérico |
