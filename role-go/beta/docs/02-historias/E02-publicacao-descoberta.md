# E02 — Publicação e descoberta de eventos

Objetivo: fechar o loop **oferta → demanda**. O organizador publica em menos de **3 minutos**; o usuário encontra o que está rolando perto em **segundos**.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-02.01 | Ativar modo organizador | RF-E02-01 | M | 3 | T-40 |
| US-02.02 | Criar evento — dados básicos e capa | RF-E02-02 | M | 5 | T-41 |
| US-02.03 | Criar evento — quando e onde | RF-E02-02 | M | 5 | T-42 |
| US-02.04 | Criar evento — acesso e capacidade | RF-E02-02/05 | M | 3 | T-43 |
| US-02.05 | Criar evento — valores informativos | RF-E02-02 | M | 2 | T-44 |
| US-02.06 | Revisar e publicar / salvar rascunho | RF-E02-03/04 | M | 3 | T-45 |
| US-02.07 | Editar evento publicado | RF-E02-07 | M | 3 | T-41..45 |
| US-02.08 | Painel "Meus eventos" | RF-E02-08 | M | 3 | T-46 |
| US-02.09 | Galeria de fotos do evento | RF-E02-09 | S | 3 | T-47 |
| US-02.10 | Nova edição (série) | RF-E02-10 | S | 3 | T-46 |
| US-02.11 | Feed | RF-E02-20/27 | M | 5 | T-10 |
| US-02.12 | Swipe | RF-E02-21 | M | 5 | T-11 |
| US-02.13 | Lista | RF-E02-22 | M | 2 | T-12 |
| US-02.14 | Filtros | RF-E02-23 | M | 3 | T-13 |
| US-02.15 | Trocar origem/cidade | RF-E02-24 | M | 2 | T-14 |
| US-02.16 | Busca por texto | RF-E02-26 | S | 3 | T-15 |

---

## Oferta

### US-02.01 — Ativar modo organizador
**Como** anfitrião ou estabelecimento, **quero** ativar o modo organizador **para** publicar eventos.
```gherkin
  Cenário: Ativação
    Dado que estou logado
    Quando toco em "Quero publicar rolês" no perfil
    E preencho nome público "Bar do Zé", tipo "Bar", Instagram "@bardoze"
    Então meu perfil de organizador é criado
    E aparece a aba "Organizar" na navegação

  Cenário: Pessoa física
    Quando escolho o tipo "Pessoa física (anfitrião)"
    Então o nome público sugerido é meu primeiro nome
    E a opção padrão para novos eventos é "Privado"
```

### US-02.02 — Dados básicos e capa
**Regras:** título com 3–80 caracteres; tipo do catálogo; descrição até 2.000 caracteres; capa obrigatória para publicar (JPG/PNG/WebP até 8 MB; ao escolher, abre o editor de recorte com moldura **4:5**, zoom, arrastar e girar; gera WebP 1080×1350 + thumb 360×450); classificação etária: Livre / 16+ / 18+.
```gherkin
  Cenário: Rascunho criado no primeiro passo
    Quando preencho título "Neon Pulse Festival" e tipo "Eletrônica" e avanço
    Então um rascunho é criado e o progresso fica salvo automaticamente

  Cenário: Recortar capa
    Quando escolho uma foto para a capa
    Então vejo o editor de recorte com moldura 4:5
    E posso arrastar, ajustar o zoom e girar 90°
    Quando confirmo
    Então a prévia mostra só o recorte escolhido
```

### US-02.03 — Quando e onde
**Regras:** `startsAt` no futuro; `endsAt > startsAt` e duração ≤ 48 h; local = nome do lugar + CEP (autopreenche pelo ViaCEP) + número + complemento; as coordenadas vêm do geocoding (adapter); o organizador confirma o endereço formatado; se o geocoding falhar, pode usar "Usar minha localização atual como local".
```gherkin
  Cenário: CEP válido
    Quando informo CEP "80010-000" e número "100"
    Então rua, bairro e cidade são preenchidos
    E vejo "Confere? Rua XV de Novembro, 100 — Centro, Curitiba"

  Cenário: Data inválida
    Quando informo fim antes do início
    Então vejo "O fim precisa ser depois do início."

  Cenário: Evento atravessa a madrugada
    Quando informo início 15/11 22:00 e fim 06:00
    Então o fim é interpretado como 16/11 06:00 e mostrado "termina no dia seguinte"
```

### US-02.04 — Acesso e capacidade
```gherkin
  Cenário: Evento privado
    Quando escolho "Privado — só quem tem o link"
    Então vejo "O endereço exato só aparece para convidados aprovados"
    E escolho a aprovação "Eu aprovo cada pedido" ou "Aprovar automaticamente quem tem o link"
    E um código de acesso de 6 caracteres é gerado (ex.: "RG7K2Q")

  Cenário: Privado descobrível
    Quando ligo "Aparecer na descoberta (sem endereço)"
    Então o evento aparece no feed com bairro e distância aproximada
    E quem abrir vê "Pedir para entrar"

  Cenário: Capacidade
    Quando defino capacidade 40
    Então as confirmações param em 40 e o evento mostra "Lotado"
```

### US-02.05 — Valores informativos
**Regras:** 0..10 itens `{rótulo, preço em centavos | "grátis", observação}`, como "Pista R$ 89", "VIP R$ 189", "Open bar até 00h"; link externo opcional (`https://`, validado e mostrado como "Comprar no site do organizador"); o selo "Grátis" aparece quando não há itens ou todos custam 0.

### US-02.06 — Revisar e publicar
```gherkin
  Cenário: Publicar
    Dado que todos os passos estão válidos e meu e-mail está verificado
    Quando toco em "Publicar rolê"
    Então o estado vira PUBLISHED, recebo o link "rolego.com.br/e/neon-pulse-festival-x7k2"
    E vejo a folha de compartilhamento (WhatsApp, copiar link, Instagram story)

  Cenário: Pendências
    Dado que falta a capa
    Então "Publicar rolê" mostra "Falta: capa do evento" e leva ao passo certo
```

### US-02.07 — Editar evento publicado
```gherkin
  Cenário: Mudança relevante
    Dado que o evento tem 12 confirmados
    Quando mudo o horário de início
    Então vejo o aviso "Os 12 confirmados vão receber um e-mail sobre a mudança"
    E ao salvar os e-mails são enfileirados

  Cenário: Evento encerrado
    Dado que o evento já terminou
    Então só galeria e descrição podem ser editadas
```

### US-02.08 — Meus eventos
```gherkin
  Cenário: Painel
    Quando abro "Organizar"
    Então vejo as abas "Próximos", "Rascunhos", "Passados"
    E cada card mostra interessados, confirmados, pedidos pendentes e visualizações
```

### US-02.09 — Galeria (S)
Até 20 fotos por evento, enviadas pelo organizador antes ou depois do evento. Fotos de usuários ficam para a 1.1.

### US-02.10 — Nova edição (S)
```gherkin
  Cenário: Criar edição
    Dado um evento passado "Neon Pulse #3"
    Quando toco em "Criar nova edição"
    Então um rascunho "Neon Pulse #4" é criado com os mesmos dados (exceto datas)
    E os dois ficam na mesma série
```

---

## Demanda

### US-02.11 — Feed
**Como** explorador, **quero** ver os eventos perto de mim agrupados por quando acontecem **para** decidir rápido.
**Regras:** RN-01, RN-02, RF-E02-27 (ranking); paginação por cursor (20 por página); card = capa, tipo, título, data/hora, distância, local/bairro, faixa de preço, "♥ 34 · ✓ 12", selo "Ao vivo"/"Privado"/"Grátis"; topo com o card "Como foi?" quando há avaliação pendente.
```gherkin
  Cenário: Eventos no raio
    Dado que minha origem é o centro de Curitiba e o raio é 10 km
    E existem eventos publicados a 2 km, 8 km e 15 km
    Quando abro o feed
    Então vejo os eventos a 2 km e 8 km e não vejo o de 15 km

  Cenário: Eventos passados ou rascunhos
    Dado um evento que terminou ontem e um rascunho a 1 km
    Então nenhum dos dois aparece

  Cenário: Agrupamento
    Então vejo as seções "Hoje", "Amanhã", "Este fim de semana" e "Próximos" (só as que têm eventos)

  Cenário: Vazio
    Dado que não há eventos no raio
    Então vejo "Nada rolando em 10 km." com os botões "Ampliar para 25 km" e "Ver outros dias"
```

### US-02.12 — Swipe
```gherkin
  Cenário: Like
    Quando arrasto o card para a direita ou toco em ♥
    Então marco interesse no evento e vejo o próximo card

  Cenário: Passar
    Quando arrasto para a esquerda ou toco em ✕
    Então o evento não volta mais no meu swipe, mas continua no feed

  Cenário: Desfazer
    Quando toco em "↺ Desfazer" logo após passar
    Então o último card volta

  Cenário: Fim da pilha
    Quando não há mais eventos não avaliados
    Então vejo "Você viu tudo por aqui 🎉" e os atalhos para ampliar o raio ou ver o feed

  Cenário: Acessibilidade
    Então os botões ✕, ♥ e "Ver detalhes" funcionam sem gesto e por teclado (← → Enter)
```

### US-02.13 — Lista
Visão compacta (miniatura 64 px), ordenável por "Mais cedo" ou "Mais perto", com os mesmos filtros do feed.

### US-02.14 — Filtros
```gherkin
  Cenário: Aplicar filtros
    Quando abro "Filtros" e escolho "Shows", "Sáb" e raio 30 km
    E toco em "Ver 23 rolês"
    Então feed, swipe e lista passam a respeitar os filtros
    E vejo os chips ativos no topo com "Limpar"

  Cenário: Persistência
    Quando fecho e reabro o app
    Então os filtros continuam aplicados
```

### US-02.15 — Trocar origem/cidade
```gherkin
  Cenário: Viajando
    Dado que moro em Curitiba
    Quando toco no seletor de local e escolho "Florianópolis"
    Então a descoberta usa o centro de Florianópolis
    E vejo "Explorando Florianópolis" com opção "Voltar para minha localização"
```

### US-02.16 — Busca por texto (S)
Busca por título do evento ou nome do local (Postgres `unaccent` + trigram), restrita aos eventos futuros e respeitando o raio, com opção "em toda a cidade".
