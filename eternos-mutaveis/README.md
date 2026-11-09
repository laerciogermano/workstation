# Eternos Mutáveis — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* da obra antes de qualquer capítulo ou manuscrito.  
**Importante:** é a fonte de verdade da tese — sem ela, capítulos divergem e a obra perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`tese` → `estrutura` → `capitulos` → `manuscrito`). Orienta toda a esteira; não substitui o texto dos capítulos.

Derivados: [`docs/`](docs/).  
Apresentação visual do artigo: [`apresentacao.md`](apresentacao.md) · versão em bullets: [`bullets.md`](bullets.md) · PDF: [`bullets.pdf`](bullets.pdf).

Em [`bullets.md`](bullets.md): uma seção **`# Bullets`** — capítulos com **capa (banner)** + títulos em lista (categorias nos caps 0–7). Ordem = storytelling. Descrições detalhadas de imagem foram removidas; histórico em commits anteriores se precisar reverter.

**Cap. 0:** perguntas → excesso → preço → jornada → chave/ponte → objetivo no fecho.

**Cap. 1:** encarna → sentidos → além da matéria → intelecto/metafísica → crença → civilização → saída.

**Cap. 2:** busca começa → Oriente → hermético/Verbo → gregos → cristianismo/gnose → fogueira→razão → lúdico → ciência × metafísica → críticos/arquétipos → linguagem → software→ontologia → provisório.

**Cap. 3:** mazelas → máscaras/excesso → autômato → identidade → desejo/tédio → inferno cíclico → céu/dor → dor do software.

**Cap. 4:** gnose → insight (linguagem/software + sólidos×abstratos) → cadeia → caminho técnico → tratado/Flow → o que a obra oferece → frutos.

**Cap. 5:** Platão → substância/Aristóteles → correção verbo×objeto → erro da programação → ecos língua/cotidiano.

**Cap. 6:** acesso → contraste → pares → ontologia/história → Logos/Deus/matéria → mônada/cadeia.

**Cap. 7:** resolução/superação → software eterno → ator→autor → perfeição/imperfeição → conduta → prática/Flow → fecho.

**Regenerar PDF:** converter `bullets.md` → HTML (markdown) e imprimir com Chrome headless (`--print-to-pdf=bullets.pdf`). Antes → depois: só existia o `.md`; o `.pdf` é derivado. Remover `bullets.pdf` reverte ao fluxo só-markdown.  
**Cap. 1 Claude PDF:** [`novo-capitulo-1-claude.pdf`](novo-capitulo-1-claude.pdf) ← [`novo-capitulo-1-claude.md`](novo-capitulo-1-claude.md) (+ HTML intermediário `novo-capitulo-1-claude.html`). Regenerar: MD→HTML (paths `file://` das imagens) → Chrome `--print-to-pdf=novo-capitulo-1-claude.pdf`. Apagar `.pdf`/`.html` reverte ao só-markdown.  
Primeiro artigo completo: [`artigos/01-eternos-mutaveis.md`](artigos/01-eternos-mutaveis.md).  
Rascunho Cursor do cap. 1 (Era adâmica): [`capitulo1-cursor.md`](capitulo1-cursor.md) — prosa a partir dos bullets de [`f`](f); apagar o arquivo reverte.  
Novo rascunho Cursor do cap. 1 (com imagens/obras): [`novo-capitulo-1-cursor.md`](novo-capitulo-1-cursor.md) — `f` §1 + galeria; apagar o arquivo reverte.  
Novo cap. 1 Claude (guiado pelo banner e pelas obras da galeria): [`novo-capitulo-1-claude.md`](novo-capitulo-1-claude.md); apagar o arquivo reverte.  
Novo cap. 2 Claude (Busca por respostas, mesmo formato do cap. 1): [`novo-capitulo-2-claude.md`](novo-capitulo-2-claude.md) · PDF [`novo-capitulo-2-claude.pdf`](novo-capitulo-2-claude.pdf); apagar os arquivos reverte.  
Novo cap. 3 Claude (O Inferno Cíclico, mesmo formato dos caps. 1 e 2): [`novo-capitulo-3-claude.md`](novo-capitulo-3-claude.md) · PDF [`novo-capitulo-3-claude.pdf`](novo-capitulo-3-claude.pdf); apagar os arquivos reverte.  
Novo cap. 5 Claude (O Erro, mesmo formato dos caps. 1 e 2): [`novo-capitulo-5-claude.md`](novo-capitulo-5-claude.md) · PDF [`novo-capitulo-5-claude.pdf`](novo-capitulo-5-claude.pdf); apagar os arquivos reverte.  
Novo cap. 4 Claude (Existe um conhecimento que liberta, mesmo formato dos caps. 1–2): [`novo-capitulo-4-claude.md`](novo-capitulo-4-claude.md) · PDF [`novo-capitulo-4-claude.pdf`](novo-capitulo-4-claude.pdf); apagar os arquivos reverte.  
Novo cap. 7 Claude (Superação adâmica, mesmo formato dos caps. 1 e 2): [`novo-capitulo-7-claude.md`](novo-capitulo-7-claude.md) · PDF [`novo-capitulo-7-claude.pdf`](novo-capitulo-7-claude.pdf); apagar os arquivos reverte.  
Novo cap. 6 Claude (O conhecimento secreto, mesmo formato dos caps. 1 e 2): [`novo-capitulo-6-claude.md`](novo-capitulo-6-claude.md) · PDF [`novo-capitulo-6-claude.pdf`](novo-capitulo-6-claude.pdf); apagar os arquivos reverte.  
**Canônico (versão 3.0):** [`eternos-mutaveis.pdf`](eternos-mutaveis.pdf) ← [`eternos-mutaveis.html`](eternos-mutaveis.html) (espelho de [`v3/eternos-mutaveis-v3.pdf`](v3/eternos-mutaveis-v3.pdf) na raiz) · [`livro.html`](livro.html) = [`livro-v3.html`](livro-v3.html) (HTML com trilha). Antes → depois: a raiz apontava para a compilação 1.0 (`novo-capitulo-N-claude`); agora espelha a 3.0. Rollback: republicar/copiar a partir de `novo-capitulo-N` + `livro-v2.html`, ou `git checkout` desses três arquivos.  
**Capa:** [`capa/capa.jpg`](capa/capa.jpg) · [`capa/capa.pdf`](capa/capa.pdf) ← `capa/_build_capa.py` (círculo de ouro = Eterno, fio de luz = Verbo, cubo de arame que vira pó dourado = sólido → abstrato, reflexo = assim em cima como embaixo). Apagar `capa/` reverte a capa 1.0.  
**Capa v2 (opções P&B):** [`capa/v2/opcoes.pdf`](capa/v2/opcoes.pdf) ← `capa/v2/_build_capa_v2.py`, a partir do rascunho do autor (dominó, quebra-cabeça); A dominó · B quebra-cabeça · C vermelho → lilás · D dominó em pé. Apagar `capa/v2/` reverte.  
**Publicado:** https://eternos-mutaveis.laerciogermano.com/ ← [`livro-v5.html`](livro-v5.html) como `index.html` (seletor `v1`…`v5`; antes o index era a 3.0). DNS A `eternos-mutaveis` → `185.250.37.82` (Hostinger); Contabo `/opt/eternos-mutaveis` + Let’s Encrypt. Passos: [`deploy/README.md`](deploy/README.md). Rollback site: `SSHPASS=… bash deploy/publicar.sh` após apontar o index para outra versão em `deploy/_montar_site.py`, ou rsync só de `livro-v3.html` como `index.html`; rollback infra: apagar A no hPanel + site nginx/`/opt/eternos-mutaveis` + `certbot delete --cert-name eternos-mutaveis.laerciogermano.com`.  
**Livro HTML v2 (pranchas renascentistas P&B):** [`livro-v2.html`](livro-v2.html) ← `python3 livro/_build_livro.py v2`; gravuras em [`assets/gravuras/`](assets/gravuras/) (`_build_gravuras.py`: Dürer, Ghisi, Khunrath, Nau dos Insensatos, Flammarion). Apagar os dois reverte.  
**Versão 2.0 do texto:** [`v2/eternos-mutaveis-v2.pdf`](v2/eternos-mutaveis-v2.pdf) · capítulos em `v2/capitulo-1..7.md` ← `v2/_build_v2.py` (títulos A Era Adâmica · A Busca · O Inferno Cíclico · O Insight · O Erro · A Gnose · A Superação Adâmica; cada capítulo abre com uma gravura renascentista; sem imagens repetidas). Os capítulos 1.0 continuam em `novo-capitulo-N-claude.md`. Apagar `v2/` reverte.  
**Versão 3.0 (fonte):** [`v3/eternos-mutaveis-v3.pdf`](v3/eternos-mutaveis-v3.pdf) ← `v3/_build_v3.py` (texto 1.0 com as leituras dos banners; banners em gravura P&B em `assets/banners-gravura/`; sem imagens repetidas) → espelhada na raiz e em `livro.html`. Apagar `v3/`, `assets/banners-gravura/` e `livro-v3.html` reverte a fonte; a raiz volta pelo rollback acima.  
**Versão 4.0:** [`v4/eternos-mutaveis-v4.pdf`](v4/eternos-mutaveis-v4.pdf) · [`livro-v4.html`](livro-v4.html) ← `v4/_build_v4.py` (texto 3.0 + [`v4/acrescimos.py`](v4/acrescimos.py): pontos de [`fora-do-livro.md`](fora-do-livro.md), obras de [`inputs/obras-a-adicionar.md`](inputs/obras-a-adicionar.md), frases de [`inputs/threads-instagram-mapa.md`](inputs/threads-instagram-mapa.md); dedicatória, nota do autor e apêndices). No site: `/v4.html`. Apagar `v4/` e `livro-v4.html` reverte.  

**Versão 5.0 (no ar):** [`v5/eternos-mutaveis-v5.pdf`](v5/eternos-mutaveis-v5.pdf) · [`livro-v5.html`](livro-v5.html) ← `v5/_build_v5.py` (4.0 + [`v5/mudancas.py`](v5/mudancas.py): obras reais em [`assets/obras-v5/`](assets/obras-v5/) no lugar dos banners, com as leituras reescritas; frases dos threads no corpo do texto, sem citação; [`v5/estilo.py`](v5/estilo.py)). Site: index + `/v5.html`. Apagar `v5/`, `assets/obras-v5/` e `livro-v5.html` reverte; republicar com index em outra versão.
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).  
Craft de livro (público, outline, ensaio, prompts, skills): [`../core/escrever-livros/README.md`](../core/escrever-livros/README.md).

---

## Visão

**Eternos Mutáveis** é o livro de **alfabetização espiritual**: o objetivo principal é **ensinar o que é Deus e o mundo espiritual** aos homens **presos no mundo da matéria**. A partir disso, a obra ensina a ler o real como **um só** — eterno e, ao mesmo tempo, mutável — para que **todas as pessoas entendam que todos somos um**, com **projeção** no Brasil e fora dele. No caminho, **refuta Aristóteles** (a ontologia da substância separada e da essência fixa) e **aponta o maior erro da programação**: repetir essa ontologia no código, como se o mundo fosse uma coleção de objetos isolados.

## Problema

A separação é ensinada como fato. Quem busca unidade esbarra em jargão, em religião de prateleira ou em silêncio. O recorte aristotélico — coisas com essência, identidade rígida, o eu como substância — organiza a escola, o senso comum e, depois, o software.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Separação vivida como fato** | Cada pessoa se experimenta como um indivíduo isolado. “Todos somos um” soa slogan, não leitura do real. |
| **Presos na matéria** | A consciência fica colada no mundo material: Deus e o espiritual soam abstratos, distantes ou inacessíveis. |
| **Sem alfabeto espiritual** | Falta um percurso claro para ensinar o que é Deus, o mundo espiritual, unidade e mudança. Quem busca ou se perde no misticismo opaco ou desiste. |
| **Aristóteles no fundo da cultura** | Substância, essência e categorias separam o mundo em coisas-com-identidade. Essa ontologia quase não é questionada. |
| **O mesmo erro no código** | A programação modela o real como objetos, classes e identidades. O maior erro não é um bug de sintaxe: é copiar a substância aristotélica para o software. |
| **A tese não atravessa fronteira** | Sem obra publicada e traduzível, a ideia fica no caderno ou no círculo íntimo. Falta **projeção nacional e internacional**. |

As pessoas **já sentem** que a separação não fecha, mas permanecem **presas na matéria**. O que falta é um livro que **alfabetize espiritualmente** — ensine o que é Deus e o mundo espiritual —, mostre onde a herança aristotélica (e a programação que a herdou) erra, e leve a tese — **todos somos um** — a um público amplo.

## Para quem

Leitores que **já sentem** que a separação e a matéria não fecham a conta, mas não têm alfabeto para Deus, o espírito e a unidade. A obra fala a quem aceita **lógica** (mesmo quem crê) e rejeita só fé cega, misticismo opaco ou jargão de seita.

| Persona | Idade | Quem é | Características | Dor | O que a obra entrega |
|---------|-------|--------|-----------------|-----|----------------------|
| **Buscador sem mapa** | 18–45 | Preso no material; pergunta “por que estou aqui?” sem vocabulário espiritual | Curioso, ansioso ou sem sentido; informação demais, síntese de menos; já tentou religiões/autoajuda e abandonou | Vida sem norte; Deus e o pós-morte soam distantes ou infantis | Alfabetização: Deus, mundo espiritual, eternidade; alívio e bússola lógica |
| **Religioso inquieto** | 25–60 | Já crê e pratica, mas a fé sozinha não basta | Devoto e honesto; incomodado com dogmas sem explicação; quer Deus inteligível sem “trair” a crença | Religião pede fé sem base; essencial não é transmitido | Gnose que **sustenta** a fé: espírito pela lógica, sem culto novo |
| **Cético lógico / ex-ateu** | 20–50 | Só aceita o espiritual se fizer sentido | Racional, cético; pode ter sido ateu; evita fé cega e explicações lúdicas | Descarta Deus ou vive o vazio de ter desistido das perguntas eternas | Explicação coerente; libertação pelo conhecimento, não pela obediência |
| **Pensador / estudante de filosofia** | 18–55 | Herdou categorias ocidentais; lê estrutura e metafísica | Analítico; sente a metafísica em aberto ou “proibida” | Substância, identidade rígida e jogos de linguagem | Onde Aristóteles falha; eterno×mutável; linguagem isomórfica |
| **Programador / engenheiro** | 18–45 | Modela objetos/classes; sofre manutenção e OOP | Prático; intui arquitetura = filosofia; busca regras eternas no código | Software caro; OOP confusa; visão deturpada vaza no código | Erro da substância no código; abstratos, Flow, histórias > objetos |
| **Difusor** | 25–55 | Professor, criador, líder de círculo, tradutor | Articulado; quer material claro para ensinar e projetar | Espiritual opaco ou autoajuda rasa | Obra sintética/traduzível; projeção; base para palestras / Logos Academy |

**Traços comuns:** insatisfação com o “eu” isolado; cansaço de crenças sem lógica; unidade legível (não slogan); abertura a filosofia e a software como metáfora; alívio, esperança e conduta prática.

## Objetivo

- **Principal:** alfabetização espiritual — **ensinar o que é Deus e o mundo espiritual** aos homens **presos no mundo da matéria**
- Explicar o conhecimento mais importante que um homem pode alcançar em toda a eternidade: a síntese do que todos estavam buscando
- Pela **lógica**, não pela fé cega
- Responder às perguntas eternas: origem, existência, eternidade, céu e inferno
- Síntese acessível (manual lógico da existência)
- Mostrar que **todos somos um** (projeção nacional e internacional)
- Refutar a ontologia aristotélica da substância
- Apontar o maior erro da programação: repetir essa ontologia no código
- Libertação do espírito pelo conhecimento (gnose)

## Proposta de valor

Eternos Mutáveis trata espírito, filosofia e programação como **a mesma leitura**: o que parece muitos é um; o que parece fixo é mutável; o que parece eterno não é imóvel. O livro dá o alfabeto; a tese atravessa o cotidiano, o pensamento ocidental e o código.

| Necessidade | O que o livro faz |
|-------------|-------------------|
| Entender que todos somos um | Tornar a unidade legível, não só sentida |
| Sair da prisão da matéria | Ensinar **o que é Deus e o mundo espiritual** a quem só lê o material |
| Aprender o vocabulário do espírito | **Alfabetização espiritual**: nomes, distinções e percurso de leitura |
| Desmontar a substância | **Refutar Aristóteles** onde ele recorta o ser em coisas separadas de essência fixa |
| Ver o erro no software | **Apontar o maior erro da programação**: objetos/essências no lugar do fluxo uno e mutável |
| Levar a tese ao mundo | Escrever para **projeção nacional e internacional**, não para um diário privado |

### Exemplos

**Alfabeto** — Alguém chega preso no mundo da matéria e sai sabendo o que é Deus e o mundo espiritual, com palavras para eternidade, mudança e o Uno — capaz de ler a própria vida sem depender de jargão fechado.

**Aristóteles no cotidiano** — A mesa, o “eu”, o arquivo no disco parecem coisas-com-essência. O livro mostra que esse recorte é herança, não o real: o que há é eterno-mutável, não substâncias lado a lado.

**O erro no código** — `class User`, identidade, estado encapsulado. O programador reconhece a substância aristotélica disfarçada de engenharia — e vê por que esse é o **maior erro da programação**, não um detalhe de paradigma.

**Projeção** — A mesma tese alimenta conversa pública (no espírito do Canal do Metafísico) e aguenta tradução: a obra nasceu para circular, não para ficar no arquivo do autor.

## Princípios

1. **Alfabetização espiritual primeiro** — ensinar o que é Deus e o mundo espiritual a quem está preso na matéria; sem isso, a tese não chega.
2. **Todos somos um** — tese central, não apêndice espiritual no fim do livro.
3. **Alfabetizar, não ofuscar** — a obra ensina a ler; não exige iniciação prévia nem jargão de seita.
4. **Refutar a substância** — o alvo é a ontologia aristotélica que separa e fixa essências, não um ataque biográfico a um nome.
5. **O erro da programação é ontológico** — não é “qual linguagem usar”; é modelar o real como objetos separados.
6. **Eterno não é imóvel; mutável não é caos** — o real é **eterno-mutável**: permanece sendo um enquanto muda.
7. **Obra para o mundo** — clareza e estrutura pensadas para **projeção nacional e internacional**.

## Escopo da visão

### O que a obra cobre (v1)

| Área | Em escopo |
|------|-----------|
| **Tese** | Todos somos um; o real é eterno e mutável |
| **Alfabetização espiritual** | Ensinar o que é Deus e o mundo espiritual; vocabulário, imagens e percurso para quem está preso na matéria |
| **Crítica** | Refutação da ontologia da substância / essência fixa (Aristóteles) |
| **Programação** | Nomear e explicar o **maior erro da programação** como herança dessa ontologia |
| **Estrutura publicável** | Partes e capítulos pensados para leitura contínua, tradução e circulação |

### Fora de escopo (v1)

- Canal do Metafísico (mídia e acesso; obra irmã de validação e influência)
- Filme [*O Metafísico*](../filme-metafisico/README.md)
- Livro da Metodologia Flow e Plataforma Flow (método e produto; não esta tese espiritual)
- Tratado acadêmico de filologia ou doxografia aristotélica
- Manual de uma linguagem de programação específica
- Sistema religioso, ritual ou comunidade iniciática

## Modelo conceitual

### Unidade (todos somos um)

O real não é um agregado de indivíduos. Separação é recorte de leitura, não o fundo do que há. É a tese que a alfabetização espiritual torna ensinável.

### Eterno mutável

O que permanece (eterno) não é forma imóvel. O que muda (mutável) não desfaz a unidade. O título da obra é o nome desse modo de ser.

### Substância (o que se refuta)

A figura aristotélica da coisa com essência e identidade própria, distinta das outras. É o recorte que a obra desmonta — na filosofia, no cotidiano e no código.

### Alfabetização espiritual

Objetivo principal da obra: ensinar **o que é Deus e o mundo espiritual** aos homens presos no mundo da matéria. O percurso pelo qual o leitor ganha **letras** para o espírito: distinguir unidade de fusão vaga, eternidade de imobilidade, mudança de dissolução.

### Maior erro da programação

Tratar o real (e o software) como coleção de **objetos** com identidade e classe — substância aristotélica compilada. A alternativa que a obra aponta é o fluxo uno: eterno e mutável, não um inventário de coisas.

### Projeção

A obra como veículo público da tese: publicação, tradução e circulação nacional e internacional. Sem projeção, a alfabetização fica no autor.

## Critérios de sucesso

- Um leitor preso na matéria consegue **dizer com as próprias palavras** o que é Deus e o mundo espiritual — e que todos somos um — sem copiar jargão.
- A refutação de Aristóteles é **acompanhável** (substância, essência, separação), não só um recado polêmico.
- Um programador reconhece o **maior erro da programação** no próprio ofício e vê a ligação com a tese da unidade.
- A estrutura da obra aguenta **tradução** e circulação além do círculo imediato (projeção).
- Capítulos posteriores não contradizem esta visão: unidade, eterno-mutável, crítica à substância e erro ontológico no código permanecem alinhados.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Eternos mutáveis** | Modo de ser da obra: o que é uno permanece (eterno) enquanto se transforma (mutável) |
| **Alfabetização espiritual** | Objetivo principal: ensinar o que é Deus e o mundo espiritual a quem está preso na matéria; *ler* espírito, unidade e mudança como se ensina um alfabeto |
| **Mundo da matéria** | Recorte em que a consciência fica presa ao sensível/material e perde o acesso legível a Deus e ao espiritual |
| **Unidade** | Tese de que todos somos um; a separação é recorte, não o fundo do real |
| **Substância** | Coisa com essência e identidade própria (figura aristotélica que a obra refuta) |
| **Essência** | O “o que é” fixo atribuído a cada substância; trava a mutabilidade do uno |
| **Maior erro da programação** | Modelar o mundo como objetos/essências separados, herança da substância |
| **Projeção** | Alcance público da tese (nacional e internacional) |
| **Tempista / objeto** | (quando o código entrar na prosa) a unidade isolada no modelo — o que a tese recusa como fundo do real |

## Regras da obra (v1)

- Todo capítulo serve à **alfabetização espiritual** (Deus e o mundo espiritual para quem está na matéria) ou à tese **todos somos um**; trecho que só enfeita fica de fora.
- A crítica a Aristóteles mira a **ontologia da substância**, não a biografia nem um inventário erudito de tratados.
- O **maior erro da programação** é nomeado como erro **ontológico** (objeto/substância), não como dica de framework.
- Vocabulário espiritual se **define na obra**; o leitor não precisa de corpus prévio.
- Clareza para tradução: frases e argumentos devem poder circular fora do português sem perder a tese.
- Canal, filme e produtos Flow **não** substituem capítulos deste livro; são obras irmãs, não conteúdo v1.

## Próximos passos

→ [`roadmap.md`](roadmap.md) (ordem do que falar/escrever) → continuar [`artigo.md`](artigo.md) no bloco 1 → [`docs/README.md`](docs/README.md) (tese e argumentos, a produzir)
