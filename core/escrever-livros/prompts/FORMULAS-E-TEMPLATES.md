# Fórmulas e templates de prompt

Usar com a lei do projeto (manifesto / `config-ia.md` / voz). Um pedido = uma unidade.

## A. Manifesto + público

```text
Você é editor de aquisição. A partir do material abaixo, produza:
1) promessa do livro em 1 frase
2) tese do livro em 1 frase
3) 1–3 personas (dor, crença, o que a obra entrega)
4) o que NÃO é este livro (fronteiras)
5) perguntas abertas que bloqueiam o TOC

Não rascunhe capítulos. Material:
[colar visão / notas]
```

## B. TOC com tese por capítulo

```text
Com a tese do livro e as personas abaixo, proponha 5–15 capítulos.
Para cada um: título provisório + tese (1–2 frases) + função no argumento.
Teste: ler só as teses deve formar um argumento coerente.
Sinalize fusões/splits. Não escreva prosa.
Tese: […]
Personas: […]
Restrições: […]
```

## C. Outline de um capítulo (nonfiction / ensaio)

```text
Planeje o capítulo [N] — [título].
Estado de entrada (o que o leitor já aceita): […]
Mudança de saída (o que deve ser diferente): […]
Persona em foco: […]
Canônico aprovado: […]

Entregue outline em bullets:
- gancho
- tese do capítulo
- 3–5 pontos com tipo de evidência (argumento / exemplo / citação / imagem)
- takeaway
- ponte para o próximo
Não proseie. Não invente fontes.
```

## D. Rascunho de uma seção

```text
Escreva só a seção “[nome]” do capítulo [N], em português do Brasil.
Voz: [colar trecho amostra + regras].
Tese da seção: […]
Pontos obrigatórios: […]
Não revelar ainda: […]
Pode inventar: [detalhe local / transição — ou “nada”]
Pare em: [beat de saída]
Ao final liste fatos novos introduzidos.
```

## E. Planejamento de cena (ficção ou narrativa)

```text
Cartão de cena:
POV / lugar-tempo / objetivo concreto / resistência / tentativa /
virada (valor que muda) / estado de saída / por que existe.
Não rascunhe prosa.
```

## F. Auditoria de continuidade / argumento

```text
Audite o trecho contra o canônico abaixo.
Tabela: citação do draft | conflito | fonte | severidade | menor reparo.
Separe erro definitivo vs julgamento do autor.
Não reescreva ainda.
```

## G. Revisão por passe

```text
Revise APENAS [estrutura | clareza | linha | copy] em [trecho].
Preserve: [tese, fatos, linhas a manter].
Mude: [permitido].
Devolva o trecho + 5 bullets do que mudou e por quê.
```

## H. Anti-slop / voz humana

```text
Remova tells de prosa de IA neste trecho (lede meta, “neste capítulo vamos”,
listas vazias, simetria forçada, adjetivos decorativos). Preserve tese e fatos.
Explique cada corte em 1 linha.
```

## Blocos reutilizáveis de system prompt

| Bloco | Pergunta que responde |
|---|---|
| Papel | editor / ghost / crítico |
| Lei do projeto | manifesto + voz + termos |
| Tarefa | planejar / proseiar / auditar / revisar |
| Escopo | qual capítulo/seção; onde parar |
| Estado atual | quem sabe o quê; o que já foi dito |
| Conexão | último beat aceito |
| Limite de conhecimento | o que não revelar |
| Expressão | POV/registro + amostra + faixa de comprimento |
| Invenção | o que pode / deve sugerir antes de incluir |
