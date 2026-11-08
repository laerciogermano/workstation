# PRD — Fitness

| Campo | Valor |
|---|---|
| Produto | **Fitness** — hub de treino, dieta e métricas com base metabólica |
| Código / pasta | `works/fitness` |
| Versão do documento | 1.1 (2026-11-08) |
| Release alvo | **PRD + visão alinhada** (esteira de docs / protótipo depois) |
| Fontes | [Visão](../README.md) · [Índice docs](README.md) · Prompts [`001`](../prompts/001-2026-09-04-criar-projeto.md), [`002`](../prompts/002-2026-09-07-marcar-dieta-cumprimento.md), [`003`](../prompts/003-2026-11-08-prd-funcionalidades.md), [`004`](../prompts/004-2026-11-08-vitrine-gamificacao-academias.md) |

---

## 1. Resumo

O **Fitness** é o app diário de **treino + dieta + avaliação física**, sem conta tradicional: a identidade privada é um **fingerprint do dispositivo**. Para a camada social, o usuário pode criar um **personagem público** (apelido) opcional — ainda sem e-mail/senha.

Na **primeira abertura**, o onboarding **é o cadastro metabólico e de objetivos** (idade, altura, gênero, peso e demais inputs). Com isso o app calcula **TMB**, **gasto calórico diário** e, conforme o objetivo (hipertrofia → **superávit**; perda de gordura → **déficit**; manutenção → **manutenção**), define **macros**, **projeções** e monta **dieta a partir dos ingredientes disponíveis** e **treino diário**. O usuário marca refeições e exercícios feitos, registra **medidas com fita métrica** e **fotos** numa timeline, e recebe **insights** a partir do acompanhamento.

Há ainda a **vitrine de gamificação** — um “Strava de academia”: feed de atividades/resultados, busca de personagens com valores e conquistas, e descoberta de **academias próximas** para treinar.

Não substitui médico/nutricionista; valores são estimativas de apoio.

## 2. Problema

Rotina fragmentada (treino num app, dieta em outro, medidas no papel, fotos no álbum) sem âncora metabólica nem vínculo objetivo → macros → dieta → treino → evidência corporal. Falta um fluxo único: **onboarding metabólico → estratégia → execução diária → progresso mensurável**.

## 3. Objetivos

| # | Objetivo | Como sabemos |
|---|---|---|
| O1 | Identidade sem conta | Dados persistem vinculados ao fingerprint; sem login/senha no MVP |
| O2 | Onboarding = perfil metabólico + objetivo | Sem concluir onboarding, não há meta calórica nem macros |
| O3 | Estratégia energética correta | Objetivo define déficit / manutenção / superávit e meta diária |
| O4 | Macros + projeção | Dashboard mostra macros e trajetória estimada até o objetivo |
| O5 | Dieta executável | Plano só com ingredientes disponíveis; refeições marcáveis |
| O6 | Treino acompanhável | Plano diário, check de exercícios, detalhe + visualização do movimento |
| O7 | Avaliação física | Medidas (fita) + fotos em timeline + insights de progresso |
| O8 | Vitrine “Strava de academia” | Feed de atividades/resultados compartilhados com opt-in |
| O9 | Descoberta social e local | Buscar personagens (valores/resultados) e academias próximas |

### Não-objetivos (v1)

- Conta com e-mail/senha, OAuth ou sync multi-dispositivo completo (personagem público ≠ conta clássica)
- Prescrição médica / nutricional profissional
- Wearables / Apple Health / Google Fit (pode ser v1.1+)
- Marketplace de personal/nutri com pagamento
- Rede social genérica (stories, DMs ilimitados, seguidores estilo Instagram)
- IA generativa de receitas sem vínculo a estoque/macros

## 4. Personas

| Persona | Job |
|---|---|
| **Iniciante** | Completar onboarding, ver meta do dia e marcar refeições/treino sem fricção |
| **Intermediário** | Ajustar objetivo, estoque e macros; acompanhar dashboard e medidas |
| **Avançado** | Periodizar treino, revisar projeções e timeline de fotos/medidas |
| **Personagem social** | Publica resultados na vitrine, aparece na busca, motiva por comparação saudável |
| **Frequentador local** | Encontra academia próxima e vê atividade/resultados do entorno |

## 5. Loop do produto (canônico)

```text
Abrir app → fingerprint (vínculo silencioso)
  → Onboarding metabólico + objetivo (obrigatório na 1ª vez)
  → Cálculo TMB + gasto diário + estratégia (déficit|manutenção|superávit)
  → Macros + projeção no dashboard
  → Estoque de ingredientes → plano alimentar
  → Plano de treino (exercícios do dia + detalhes/visualização)
  → Dia a dia: marcar refeições e exercícios
  → Avaliação: medidas (fita) + fotos na timeline
  → Insights a partir do cumprimento e da evolução
  → (opt-in) Personagem público → vitrine / feed · buscar personagens · academias próximas
```

## 6. Capacidades-alvo (MoSCoW)

### 6.1 Identidade sem conta — *must*

| ID | Requisito |
|---|---|
| RF-01 | Não exigir cadastro, e-mail, senha ou login social no MVP |
| RF-02 | Gerar/obter **fingerprint** do dispositivo na primeira abertura e usá-lo como chave de vínculo de todos os dados do usuário |
| RF-03 | Persistir perfil, metas, dieta, treinos, medidas e fotos sob o mesmo fingerprint |
| RF-04 | Se o fingerprint mudar (ex.: reset/novo aparelho), tratar como novo usuário local — sem “recuperar conta” no v1 (documentar limitação) |

### 6.2 Onboarding = cadastro metabólico e objetivo — *must*

| ID | Requisito |
|---|---|
| RF-05 | Na **primeira entrada**, bloquear o restante do app até concluir o onboarding |
| RF-06 | Coletar no mínimo: **idade**, **altura**, **gênero**, **peso** |
| RF-07 | Coletar demais inputs necessários ao gasto (ex.: nível de atividade) e questões de contexto que o produto definir como obrigatórias no fluxo |
| RF-08 | Coletar **objetivo** (ex.: hipertrofia / aumento de músculo, perda de gordura / definição, manutenção, e demais PDPs/objetivos suportados) |
| RF-09 | Ao concluir, calcular e persistir: TMB, gasto calórico diário estimado, estratégia energética, meta kcal/dia e macros-alvo |
| RF-10 | Permitir editar depois (perfil / re-onboarding parcial) e **recalcular** estratégia, macros e projeções |

### 6.3 Energia, objetivos e macros — *must*

| ID | Requisito |
|---|---|
| RF-11 | Calcular **TMB** a partir dos dados do perfil (fórmula documentada na implementação; ex. Mifflin–St Jeor ou equivalente escolhido) |
| RF-12 | Estimar **gasto calórico diário** (TDEE) com fator de atividade (e, quando houver, contribuição do treino do dia) |
| RF-13 | Mapear objetivo → estratégia: **aumento de músculo → superávit**; **perda de gordura / definição → déficit**; **manutenção → manutenção** |
| RF-14 | Definir magnitude padrão de déficit/superávit (faixas seguras) e permitir ajuste pelo usuário dentro de limites |
| RF-15 | Derivar **macronutrientes diários** (proteína, carboidrato, gordura) alinhados à meta kcal e ao objetivo |
| RF-16 | Exibir **dashboard de projeções**: trajetória estimada (peso/composição ou métrica proxy) no horizonte do objetivo, com premissas explícitas |

### 6.4 Dieta por ingredientes + acompanhamento — *must*

| ID | Requisito |
|---|---|
| RF-17 | Manter **estoque / ingredientes disponíveis** informados pelo usuário |
| RF-18 | Montar o plano alimentar **somente** com ingredientes do estoque (salvo override explícito) |
| RF-19 | O plano deve respeitar meta kcal e macros do dia (com alerta se inviável com o estoque atual) |
| RF-20 | Listar refeições do dia; usuário **marca** se fez / não fez (e, se aplicável, parcial) |
| RF-21 | Agregar consumido marcado vs meta (kcal e macros) e mostrar status: cumpriu / abaixo / estourou |
| RF-22 | Permitir atualizar estoque e **regenerar** plano |

### 6.5 Treinos — *must*

| ID | Requisito |
|---|---|
| RF-23 | Definir o que o usuário faz **por dia** (ficha / sessão com lista de exercícios) |
| RF-24 | Cada exercício: nome, séries/reps/carga ou duração, e metadados necessários ao acompanhamento |
| RF-25 | Usuário **marca** exercícios feitos / não feitos na sessão |
| RF-26 | Tela de detalhe do exercício: descrição, pontos de atenção e **visualização do movimento** (vídeo, animação ou sequência ilustrada) |
| RF-27 | Estimar calorias por exercício/sessão e somar ao balanço do dia quando fizer parte do modelo energético |
| RF-28 | Suportar ao menos musculação; calistenia e outras modalidades *should* no mesmo modelo |

### 6.6 Avaliação física, timeline e insights — *must*

| ID | Requisito |
|---|---|
| RF-29 | Avaliação física com **fita métrica**: registrar circunferências e demais medidas suportadas (ex.: cintura, quadril, peito, braço, coxa) + peso |
| RF-30 | Histórico de medidas em ordem cronológica (timeline / gráficos) |
| RF-31 | Tirar ou anexar **fotos de progresso** datadas (frente / lado / costas opcional) numa **timeline** visual |
| RF-32 | Comparar pontos da timeline (antes/depois) |
| RF-33 | Gerar **insights** a partir de cumprimento (dieta/treino) + tendência de medidas/fotos (ex.: ritmo vs projeção, adesão da semana) |
| RF-34 | Insights são informativos; não afirmam diagnóstico clínico |

### 6.7 Acompanhamento diário (home) — *must*

| ID | Requisito |
|---|---|
| RF-35 | Visão do dia: meta kcal/macros, refeições (status), treino do dia (status), atalho para medida/foto, vitrine e academias |
| RF-36 | Entrada rápida para marcar cumprimento sem reabrir o onboarding |

### 6.8 Vitrine de gamificação (“Strava de academia”) — *must*

| ID | Requisito |
|---|---|
| RF-37 | **Vitrine / feed** de atividades e resultados de academia (treinos concluídos, PRs, streaks, desafios, conquistas) no espírito Strava, focado em musculação/academia |
| RF-38 | Publicação na vitrine só com **opt-in** do usuário; default = privado |
| RF-39 | Cada card da vitrine mostra personagem, tipo de atividade, valores/resultados relevantes (ex.: volume, carga, kcal da sessão, streak) e timestamp |
| RF-40 | Streaks, conquistas e desafios alimentam a vitrine a partir de **ações reais** (treino feito, meta de dieta, medida registrada) — não só abrir o app |
| RF-41 | Reações simples (kudos / apoio) *should*; comentários longos e DM ficam fora do v1 |

### 6.9 Personagem público e busca — *must*

| ID | Requisito |
|---|---|
| RF-42 | Criar **personagem público** opcional (apelido + avatar simples) vinculado ao fingerprint — sem e-mail/senha |
| RF-43 | Perfil do personagem exibe **valores e resultados** que o usuário optou por compartilhar (ex.: objetivo, streaks, PRs, resumo de evolução — nunca TMB/peso/medidas privadas por default) |
| RF-44 | **Buscar personagens** por apelido e/ou filtros (objetivo, academia vinculada, conquistas) |
| RF-45 | Abrir perfil público a partir da busca ou da vitrine |
| RF-46 | Usuário controla granularmente o que entra no perfil público (toggle por tipo de dado) |

### 6.10 Academias próximas — *must*

| ID | Requisito |
|---|---|
| RF-47 | Descobrir **academias próximas** com base em localização (GPS com permissão) ou busca por bairro/cidade |
| RF-48 | Card da academia: nome, distância, endereço/região; opcionalmente horários e modalidades se houver dado |
| RF-49 | Vincular personagem a uma academia (favorita / “treino aqui”) |
| RF-50 | Ver atividade/resultados recentes da academia na vitrine (quando houver personagens públicos vinculados) |
| RF-51 | Sem marketplace de matrícula/pagamento no v1 — só descoberta e vínculo social |

## 7. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | **Sem conta clássica:** e-mail/senha/OAuth não existem no v1; o fingerprint é o vínculo dos dados privados |
| RN-01b | **Personagem ≠ conta:** apelido público é opcional e não recupera dados entre aparelhos no v1 |
| RN-02 | **Onboarding gate:** sem perfil metabólico + objetivo concluídos, o app não libera dashboard, dieta, treino nem avaliação (vitrine/busca podem ser só leitura limitada, mas publicar exige onboarding) |
| RN-03 | Dados mínimos (idade, altura, gênero, peso) são obrigatórios para calcular TMB/gasto |
| RN-04 | Objetivo de **hipertrofia / ganho muscular** → estratégia de **superávit** calórico |
| RN-05 | Objetivo de **perda de gordura / definição** → estratégia de **déficit** calórico |
| RN-06 | Objetivo de **manutenção** → meta ≈ gasto diário estimado |
| RN-07 | Mudança de objetivo, peso, altura, atividade ou gênero **recalcula** TMB, gasto, meta, macros e projeções |
| RN-08 | Macros do dia são consequência da meta kcal + objetivo; o usuário pode ajustar dentro de faixas validadas (com alerta se quebrar a meta) |
| RN-09 | Projeções são **estimativas** com premissas visíveis (adesão, déficit constante, etc.); atualizam com novos pesos/medidas |
| RN-10 | Dieta por estoque **não** inclui alimento fora da lista disponível, salvo override explícito do usuário |
| RN-11 | Cumprimento da dieta = comparação do **marcado como consumido** vs meta do dia (kcal e/ou macros) |
| RN-12 | Cumprimento do treino = exercícios marcados como feitos na sessão do dia |
| RN-13 | Medidas e fotos são **datadas**; timeline e gráficos respeitam ordem cronológica |
| RN-14 | Insights só usam dados que o usuário registrou; sem inventar evolução |
| RN-15 | O app **não** substitui orientação médica ou nutricional; textos deixam isso claro no onboarding e em telas de cálculo |
| RN-16 | Déficit/superávit fora de faixas seguras padrão deve ser bloqueado ou exigir confirmação explícita (limites definidos na implementação e documentados) |
| RN-17 | Nada entra na **vitrine** sem opt-in explícito; revogar opt-in remove futuras publicações (e pode ocultar histórico público) |
| RN-18 | Dados sensíveis (peso, medidas detalhadas, fotos de progresso, TMB) **não** vão para perfil/vitrine por default |
| RN-19 | Busca de personagens só indexa quem tem personagem público ativo |
| RN-20 | Academias próximas exigem permissão de localização ou busca manual por texto; sem permissão, só busca textual |
| RN-21 | Vínculo a academia não implica matrícula, pagamento nem endosso comercial no v1 |
| RN-22 | Gamificação da vitrine só conta ações reais já definidas (treino, dieta, métrica) |

## 8. Modelo conceitual

| Conceito | Definição |
|---|---|
| **Fingerprint** | Identificador do dispositivo que vincula todos os dados privados do usuário sem conta |
| **Personagem** | Identidade pública opcional (apelido/avatar) para vitrine e busca |
| **Perfil metabólico** | Idade, altura, gênero, peso, atividade (+ campos extras do onboarding) |
| **Objetivo / PDP** | Meta do usuário (hipertrofia, definição, manutenção, etc.) |
| **Estratégia calórica** | Déficit, manutenção ou superávit + meta kcal/dia |
| **Macros-alvo** | Proteína, carbo e gordura diários derivados da estratégia |
| **Projeção** | Trajetória estimada no dashboard até o objetivo |
| **Estoque** | Ingredientes disponíveis para montar a dieta |
| **Plano alimentar** | Refeições do dia/semana geradas a partir do estoque + macros |
| **Registro alimentar** | Marcação do que foi feito/consumido |
| **Sessão de treino** | Lista de exercícios do dia com check de cumprimento |
| **Exercício** | Unidade com detalhe + visualização do movimento |
| **Avaliação física** | Conjunto de medidas (fita) + peso num ponto no tempo |
| **Foto de progresso** | Imagem datada na timeline corporal |
| **Insight** | Mensagem gerada a partir de adesão + tendência de métricas/fotos |
| **Vitrine** | Feed estilo Strava de academia com atividades/resultados opt-in |
| **Resultado / valor** | Métrica compartilhada no perfil ou card (PR, streak, volume, etc.) |
| **Academia** | Local de treino descobribile por proximidade/busca; vínculo social opcional |

## 9. Jornadas principais

1. **Primeiro uso:** abrir → fingerprint → onboarding (dados + objetivo) → ver TMB/gasto/estratégia/macros → dashboard de projeções.
2. **Montar dieta:** informar/atualizar ingredientes → gerar plano → ver refeições do dia.
3. **Dia alimentar:** marcar refeições feitas → ver status vs meta.
4. **Dia de treino:** abrir sessão → ver exercício (detalhe + movimento) → marcar feitos.
5. **Avaliação:** medir com fita → salvar circunferências/peso → (opcional) foto → timeline.
6. **Acompanhar:** dashboard de projeções + insights de progresso/adesão.
7. **Recalibrar:** editar peso/objetivo/atividade → recálculo automático.
8. **Vitrine:** criar personagem → optar por compartilhar → ver feed / publicar treino concluído.
9. **Buscar personagens:** busca → perfil com valores/resultados públicos.
10. **Academias próximas:** permitir localização (ou buscar bairro) → lista → vincular / ver atividade local.

## 10. Requisitos não funcionais (diretrizes)

| ID | Categoria | Diretriz |
|---|---|---|
| RNF-01 | Privacidade | Dados de saúde (peso, medidas, fotos) tratados como sensíveis; retenção e exclusão local documentadas |
| RNF-02 | Identidade | Fingerprint estável o suficiente para o MVP; documentar colisão/perda de vínculo |
| RNF-03 | Plataforma | Mobile-first (app ou PWA conforme decisão técnica posterior) |
| RNF-04 | Offline | Preferir funcionamento local para marcar refeição/treino mesmo sem rede (sync depois, se houver backend) |
| RNF-05 | Transparência | Mostrar que TMB/gasto/projeções são estimativas |
| RNF-06 | Performance | Home do dia e marcação de cumprimento devem ser instantâneos no uso típico |
| RNF-07 | Localização | GPS só com permissão; fallback busca textual de academias |
| RNF-08 | Social | Vitrine e perfis públicos exigem rede; core dieta/treino/avaliação permanece usável offline |

## 11. Critérios de sucesso (MVP)

1. Usuário conclui onboarding sem criar conta e vê meta kcal + macros no mesmo fluxo.
2. Objetivo de hipertrofia gera superávit; de perda de gordura gera déficit — verificável na UI.
3. Plano alimentar usa só ingredientes do estoque e permite marcar cumprimento.
4. Treino do dia lista exercícios com detalhe/visualização e check de feitos.
5. Medidas + fotos aparecem na timeline; insight básico reflete adesão ou tendência recente.
6. Dados sobrevivem a reopen do app no mesmo fingerprint.
7. Com personagem + opt-in, treino concluído aparece na vitrine com valores/resultados.
8. Busca encontra personagem público e mostra perfil com resultados compartilhados.
9. Lista de academias próximas (GPS ou busca) e vínculo a uma academia.

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Perda de dados ao trocar de aparelho (sem conta) | Aviso no onboarding; export/backup *should* futuro; conta opcional em v2 |
| Fórmulas calóricas imprecisas | Transparência + faixas seguras + “estimativa” |
| Dieta inviável com estoque pobre | Alerta claro + sugestão de enriquecer estoque |
| Escopo de visualização de exercícios pesado | MVP com mídia estática/GIF; vídeo streaming depois |
| Overclaim de insights | Tom factual; sem diagnóstico |
| Vazamento de dados de saúde na vitrine | Default privado; toggles granulares; RN-18 |
| Catálogo de academias incompleto | Busca manual + cadastro comunitário leve *should*; parceiros depois |
| Comparação social tóxica | Tom de apoio; sem ranking humilhante no MVP |

## 13. Roadmap alto nível

| Fase | Entrega |
|---|---|
| **MVP** | Fingerprint · onboarding · TMB/gasto/estratégia/macros · projeções · estoque→dieta · checks · treino+movimento · medidas/fotos/insights · personagem · vitrine · busca de personagens · academias próximas |
| **v1.1** | Kudos · desafios avançados · mais modalidades · export/backup · wearables leves · enriquecimento do catálogo de academias |
| **v2** | Conta opcional / sync multi-dispositivo · macros avançados · comparação avançada de fotos · DM/moderação madura se fizer sentido |

## 14. Glossário

| Termo | Significado |
|---|---|
| **Fingerprint** | ID do dispositivo que vincula os dados privados sem conta |
| **Personagem** | Perfil público opcional (apelido) para vitrine e busca |
| **Vitrine** | Feed estilo Strava de academia (atividades e resultados) |
| **TMB** | Taxa metabólica basal |
| **Gasto diário / TDEE** | Estimativa de calorias gastas no dia |
| **Déficit / Superávit** | Comer abaixo / acima do gasto |
| **Macros** | Proteína, carboidrato, gordura |
| **PDP / objetivo** | Meta do usuário (hipertrofia, definição, etc.) |
| **Estoque** | Ingredientes disponíveis |
| **Timeline** | Linha do tempo de fotos e/ou medidas |
| **Academia** | Local de treino na descoberta geográfica/social |

## 15. Próximos passos

→ [`functionalities.md`](functionalities.md) (a produzir) — inventário de capacidades por seção a partir deste PRD e da [visão](../README.md)
