# Estudo: qual IA usar para gerar a descrição dos cards

Preços e modelos consultados em 2026-11-28. Eles mudam com frequência: confira antes de decidir por custo.

## Resposta curta

**Use o Google Gemini (`gemini-3.5-flash-lite`) no plano gratuito.** É a opção mais básica que funciona hoje em português dentro do navegador, sem instalar nada e sem pagar: basta criar uma chave e colar no botão **IA** do Plans.

O porém: **no plano gratuito, o Google usa o conteúdo enviado para melhorar os produtos dele.** Para cards com dados de clientes, planilhas ou informação interna, use um plano pago (o Gemini pago não usa; para OpenAI e Anthropic, confira os termos da sua conta).

## Comparação

| Opção | Chave | Preço por 1 milhão de tokens (entrada / saída) | Estimativa por 1.000 cards ¹ | Situação |
|---|---|---|---|---|
| **Gemini 3.5 Flash-Lite** | sim | grátis; pago US$ 0,30 / 2,50 | grátis; pago ≈ US$ 1,40 | implementado (padrão) |
| OpenAI `gpt-6-luna` | sim, paga | US$ 0,10 / 0,50 | ≈ US$ 0,35 | implementado |
| Claude Haiku 5.5 | sim, paga | US$ 0,10 / 0,50 (até 100 mil tokens) | ≈ US$ 0,35 | implementado (digite no campo Modelo) |
| Claude Opus 5.5 | sim, paga | US$ 4 / 20 | ≈ US$ 14 | implementado (padrão da Anthropic) |
| Chrome com Gemini Nano (no computador) | não | grátis | grátis | não implementado ² |
| Ollama (modelo no computador) | não | grátis | grátis | não implementado ³ |
| Groq (plano gratuito) | sim | grátis, com limites | grátis | não implementado ⁴ |
| `claude -p` pelo client do Plans | não | usa a assinatura | – | não implementado ⁵ |

¹ Conta feita, não medida: 2.000 tokens de entrada (instruções e contexto) e 300 de saída por card. Card dentro de pais com anexos pode chegar a umas 4 vezes essa entrada, e o raciocínio do modelo, quando houver, é cobrado como saída.

² **Chrome:** seria a opção sem chave e sem nada sair do computador, mas a documentação oficial lista só inglês, japonês, espanhol, alemão e francês. **Português não está na lista.** Pede ainda 22 GB livres e 16 GB de RAM (ou GPU com mais de 4 GB). Neste Mac (M4, 16 GB, 26 GB livres) o requisito é atendido por pouco e o modelo não está baixado. Vale rever quando entrar o português.

³ **Ollama:** não está instalado; exige baixar alguns gigabytes, manter o serviço rodando e liberar a origem do site.

⁴ **Groq:** os limites gratuitos (cerca de 30 pedidos por minuto e 1.000 por dia) vêm de sites de terceiros, não conferidos na fonte oficial. Seria um quarto provedor com pouca vantagem sobre o Gemini.

⁵ **Client do Plans:** exigiria client pareado e comando liberado no terminal a cada projeto; pesado para uma descrição curta.

**Limites do Gemini gratuito:** a página oficial não informa os números do Flash-Lite (aparecem no AI Studio de cada projeto). Terceiros citam algo como 15 pedidos por minuto e 500 por dia, sem confirmação.

## Como ficou no Plans

1. Configure a chave no botão **IA** do topo (uma vez por navegador).
2. Crie um card com o título. O painel mostra **Gerando descrição com IA…** e, em seguida, a descrição pronta, gravada no `.md` do card.
3. **Cancelar e escrever eu mesmo** para a espera. A descrição só é preenchida se ainda estiver vazia.
4. Sem chave, criar um card funciona como antes: nada é enviado.
5. Se a IA falhar (chave recusada, limite, rede), aparece um aviso e o card fica criado, sem descrição. O botão **Regenerar descrição** tenta de novo.

Modelo usado quando o campo **Modelo** fica em branco: `gemini-3.5-flash-lite`, `claude-opus-5-5` ou `gpt-6-luna`. A pedido de "a mais básica", o caminho recomendado é o Gemini; se usar Anthropic e quiser o barato, escreva `claude-haiku-5-5`.

## O que é enviado ao provedor

Ao criar um card com chave configurada, **sem perguntar de novo**: título, status, prioridade, descrições dos cards acima, comentários e anexos em texto, planilha ou documento desses cards (e do próprio), subatividades, títulos dos cards irmãos e o system prompt. Teto de 24 mil caracteres.

A chave fica só no armazenamento do navegador, nunca na pasta do projeto. Quem conseguir rodar código na página do Plans conseguiria lê-la: use uma chave só para isso, com limite de gasto. No build, a página só pode falar com os três endereços dos provedores (além do hub).

## Código

| Arquivo (em `plans/app/apps/web/src/`) | O quê |
|---|---|
| `ai/providers.ts` | chamada a Gemini, Anthropic e OpenAI; erros em português |
| `ai/describe.ts` | instruções para o modelo e limpeza da resposta |
| `ai/context.ts` | junta o contexto do card (atividade "regenerar descrição") |
| `ai/settings.ts` | chave e modelo (atividade "chave de API") |
| `store/app.ts` | geração automática ao criar, com cancelamento |

## O que foi testado, e o que não foi

- Testes automáticos dos três provedores com respostas simuladas, no formato da documentação.
- No Chrome, com o build de produção e o Gemini **simulado**: sem chave, criação com chave, cancelar, dois cards seguidos, remover durante a geração e chave recusada.
- Os três endereços reais aceitam chamada vinda do navegador (conferido sem chave válida).
- **Não testado: nenhuma geração real**, porque não havia chave. Falta colar a sua e criar um card; é aí que se vê a qualidade do texto em português.
- A Anthropic é chamada por HTTP direto, não pelo SDK oficial: a instalação do pacote falhou (erro no cache do npm) e a alternativa foi barrada pelas permissões da sessão. Dá para trocar depois.

## Fontes

- [Gemini: preços e uso dos dados](https://aistudio.google.com/docs/pricing)
- [Gemini: modelos](https://aistudio.google.com/docs/models)
- [Gemini: Interactions API](https://aistudio.google.com/api-reference/interactions-api/create-interaction.md)
- [Gemini: limites de uso](https://aistudio.google.com/docs/rate-limits)
- [OpenAI: preços](https://developers.openai.com/api/docs/pricing) e [`gpt-6-luna`](https://developers.openai.com/api/docs/models/gpt-6-luna)
- Claude: tabela de modelos e preços da referência da API que acompanha o Claude Code (versão de 2026-11-03)
- [Chrome: Prompt API (idiomas e requisitos)](https://developer.chrome.com/docs/ai/prompt-api)
- Terceiros, não confirmados: [limites do Gemini gratuito](https://www.aifreeapi.com/en/posts/gemini-api-rate-limits-per-tier), [limites do Groq](https://opengpuradar.com/providers/groq)
