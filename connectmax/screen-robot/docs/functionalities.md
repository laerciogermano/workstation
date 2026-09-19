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
| Extrair elementos e informações | Lê a tela (dump/OCR) e devolve elementos com texto, bounds e metadados |
| Executar operações | Dispara gestos e comandos (launch, tap, type, key, screenshot) a partir dos elementos ou coords |
| Guardar estado de sessão | Persiste e restaura contexto da sessão (device, apps, último frame, login parcial) em arquivo |

## Cenário de aceitação (funcionalidade maior)

Login no LinkedIn orquestrando as seis fatias:  
[`bdd-linkedin-login.md`](bdd-linkedin-login.md) · script [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)

## Fora do escopo

- Cadência LinkedIn, fila de leads, faturamento, papéis de venda.
- Bypass de autenticação / scraping ilegítimo.

## Próximos passos

→ Implementação em [`../sources/android-control`](../sources/android-control/README.md)
