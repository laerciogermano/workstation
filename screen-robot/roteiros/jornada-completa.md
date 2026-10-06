com base nas regras
- use apenas a lib do screen robot, 
- nao use script em js pra nada, 
- a IA deve extrair, analisar e decidir a cada iteracao
- nao tire print para analisar a imagem
- toda interacao entre o dispositivo deve ser exclusivamente feita via interface da lib
- nao explore nenhum arquivo que nao seja o readme contendo as interfaces da lib
- faca da forma mais objetiva possivel, seguindo apenas o essencial
- quando for escrever, escreva tudo de uma vez e só depois analise o resultado se está correto
- nao utilize nenhum comando adb, todos os comandos devem ser provenientes exclusivamente da interface
- nao utilize eventos de ui stable, apenas extract e espere se o extract apontar que esta carregando e tente noamente ate encontrar o proximo passo
- ao digitar: use a ação type da lib (default ADB) — proibido tap tecla a tecla via OCR do teclado
- nao altere nenhum arquivo, apenas execute o fluxo


Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo





Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People, filtrar localização Campinas, e conectar nos perfis (Skip se aparecer), scrollando até achar Connect, até fim explícito da lista ou limite do LinkedIn.



Em cada nova conexão bem-sucedida, registrar no log todas as informações do comprador disponíveis no item da lista (OCR do card), antes/no ato do Connect.

Modo de execução (obrigatório) — IA + linguagem natural





Este arquivo é a fonte da jornada em linguagem natural. A IA lê estes critérios e, a cada turno, extrai o OCR com RapidOCR (extract({ serial, engine: "rapidocr" }) / findByText(..., { engine: "rapidocr" }) → { text, x, y }) e decide o próximo passo com base neste doc + no texto da tela.



Proibido criar, manter ou executar script (.js / .mjs / one-shot Node / _run-tmp etc.) com o roteiro preso no código (máquina de estados, loops while hardcoded, fases home|typed|people, regex/lista de passos duplicando este markdown).



Permitido só chamar as interfaces pontuais do screen-robot (extract, tapElement, type, scroll, key, sleep, …) sob comando da IA — sem embutir a política da jornada no arquivo.



Antes → depois: runs via script monolítico com o fluxo embutido → IA opera lendo este roteiro + OCR a cada passo; o log .md registra Decisão + OCR; não há “runner” da jornada no repo.



Rollback: voltar a um commit anterior deste markdown; não ressuscitar runner com jornada hardcoded.

Pré-requisitos





AVD/agent online e na tela principal do LinkedIn (emulator-5554).



adb disponível e permissões concedidas.



Pasta src/screenshots/ e pasta de logs da execução (ex. src/logs/jornada-comprador/) para artefatos.

Regra de decisão (obrigatória) — execução da jornada





Engine OCR desta jornada: rapidocr (obrigatório). Não usar tesseract aqui — na lista People o pill Connect some no tesseract.js. Rollback: engine: "tesseract" / unset SCREEN_ROBOT_OCR.



Toda decisão em runtime (o que clicar, se Skip apareceu, se há Connect, se scrollar, se a tela mudou) é da IA, usando somente extract({ engine: "rapidocr" }) / findByText(..., { engine: "rapidocr" }) e o retorno de texto { text, x, y }, interpretados à luz deste roteiro.





CTA do card: jamais clicar em Message (nem Msg, Send a message). Apenas Connect (match exato ^Connect$ no OCR). Proibido tap estimado à direita do card (x: ~458) — era isso que acertava Message quando o pill não saía no OCR. Sem Connect no extract → pular/scroll; se abrir Message → KEYCODE_BACK e não contar.



A IA jamais tira print do dispositivo sozinha para olhar a imagem e decidir o próximo passo da execução.



Screenshots no fluxo feliz são só artefato opcional de log — não entram no raciocínio da IA em runtime.



Exceção (debug): se algo sair do planejado ou houver erro, aí pode tirar print e pedir análise da IA pela imagem — só nessa exceção, nunca no restante da execução.

Montagem / evolução do roteiro (fora do runtime)





Para montar ou evoluir esta jornada, a IA pode enviar imagem do dispositivo e extrair detalhes visuais (layout, pills, sheets, zonas) — somente para enriquecer o roteiro até ele ficar auto-suficiente (passos e critérios só com OCR/texto).



Objetivo desse uso de imagem: fechar lacunas do doc — não voltar a autorizar tap estimado em Message; se Connect não sai no OCR, o runtime deve scrollar, não chutar x,y.



Quando o roteiro já for auto-suficiente, voltar à regra de execução: zero decisão por imagem.

Log por execução (obrigatório)





A cada run, criar um documento explicativo Markdown: logs/jornada-comprador/YYYYMMDD-HHMMSS.md (não só .jsonl cru).



Formato de relatório legível: texto explicando a decisão separado do JSON do OCR (JSON só em bloco de código).



Por passo (1–7 e cada iteração Connect), incluir nesta ordem:





Cabeçalho ## Passo N — título (timestamp)



### Decisão — prosa: por que e o que foi feito (ex.: “achei Search com y<120; tap @180,78; ignorei search do feedback”)



### OCR usado na decisão — bloco json com a lista { text, x, y } (ou trecho) usada



### Resultado — prosa do que aconteceu depois; opcionalmente outro bloco json se o OCR seguinte importar



Por cada Connect contado (conexão nova ok): incluir também ### Comprador com todas as infos do item da lista disponíveis no OCR daquele card (não omitir campos presentes na tela). Ver passo 6.



Sem documento de passo = execução incompleta para auditoria. Decisões continuam só por OCR; o log é o registro, não a fonte da decisão.



Console (obrigatório): a cada extract() / findByText, imprimir no stdout o OCR completo retornado (text@x,y por linha ou JSON), sem filtrar — para auditoria ao vivo (ex.: pill + Connect visível na UI às vezes não sai no OCR; sem dump não dá para ver o buraco).



OCR backends: jornada usa rapidocr. Comparativo na fixture: [extract.ocr-backends.fixture.test.js](../src/lib/extract.ocr-backends.fixture.test.js). Default global do produto permanece tesseract se engine omitido; esta jornada sempre passa engine: "rapidocr".

Passos (interfaces usadas)





Capture frame + OCR





chamar: extract({ serial, engine: "rapidocr" })



saída: lista { type: "text", text, x, y }



log: OCR completo + decisão “iniciar jornada”



Clicar em Search





localizar elemento text === "Search" (case-insensitive; preferir y < 120 — não confundir com “search” do feedback)



tapElement({ serial, x, y })



esperar 1–2s (sleep)



log: hit Search + decisão tap



Digitar "comprador" — **tudo de uma vez; checar só no fim**





Alvo: a string comprador (9 caracteres). Digitar a palavra inteira de uma vez (type({ serial, text: "comprador" }) — não clicar no item comprador da lista; não tap tecla a tecla via OCR).



Proibido checar após cada tecla/tap: sem extract/screenshot/prefixo entre caracteres; digitar tudo e só então validar.



Só após terminar a digitação (obrigatório):





screenshot({ serial, path }) — artefato em src/screenshots/ (ex. type-comprador.png); não decidir olhando a imagem.



extract({ serial, engine: "rapidocr" }) — imprimir OCR completo no console.



Ler o texto do campo Search no OCR (y < 120, excluir relógio/Search placeholder) e comparar com a string completa comprador (normalizado: minúsculas, sem espaços).



OK se o campo é igual a comprador (ou começa com comprador sem lixo extra relevante) → logar passo 3 (Decisão + OCR + Resultado “ok: campo=comprador”) e seguir.



Erro se o campo divergir → limpar (KEYCODE_DEL / limpar campo), redigitar a palavra inteira de novo, novo print+OCR+checagem do valor completo. Se após 3 tentativas ainda falhar → Encerramento com motivo type_mismatch (logar OCR + print).



não clicar no item comprador (autocomplete / recent)



após valor confirmado (campo OCR = comprador), remover o teclado (key(KEYCODE_BACK) ou tap fora) para revelar Show all results



esperar 0.8–1.5s



log: digitação + checagem final + BACK teclado



Antes → depois: tecla a tecla com print+OCR+prefixo após cada tap → digitar tudo e checar o valor completo só no fim. Rollback: restaurar verificação pós-tecla (prefixo comprador.slice(0, N) após cada caractere).



Clicar em "Show all results"





após abrir os resultados (buscar "comprador"), localizar Show all results:





findByText(serial, "Show all", { engine: "rapidocr" }) → hit { x, y } ou detectar par vizinho Show + all na mesma linha via extract({ engine: "rapidocr" })



tapElement({ serial, x, y })



esperar 2–3s



log: OCR + decisão tap Show all (persistir trecho OCR no log; elements-*.json opcional)



Clicar em People





após Show all results, localizar a aba/filtro People (preferir y baixo, barra de chips — tipicamente y < 200)



extract({ engine: "rapidocr" }) ou findByText(serial, "People", { engine: "rapidocr" }) → { x, y }



tapElement({ serial, x, y })



esperar 2–3s



log: OCR + decisão tap People



5b) Filtrar cidade Campinas (obrigatório antes do primeiro Connect)





Após People, aplicar filtro de localização = Campinas. Sem esse filtro aplicado, não iniciar o passo 6.



Fluxo típico (decidir pelo OCR; textos PT/EN aceitos):





Abrir filtros: chip Locations / Location / Localização na barra (y baixo) ou ícone/All filters / Filter by / Filtros.



Entrar em localização: Locations / Location / Add a location / Adicionar local / Cities / Cidades.



Digitar Campinas de uma vez (type({ serial, text: "Campinas" })); fechar teclado se cobrir a lista.



Selecionar o resultado da sugestão que seja Campinas (ex.: Campinas, Sao Paulo / Campinas, São Paulo / Campinas, Brazil) — preferir match que contenha Campinas + Paulo/Brazil.



Aplicar: Show results / Done / Apply / Mostrar resultados / Concluído.



Validar (obrigatório): extract e confirmar chip/badge de filtro com Campinas (ou lista já restrita). Se não houver evidência → reabrir filtro e repetir (máx. 3 tentativas); falha → Encerramento filter_campinas_failed.



esperar 2–3s após aplicar



log: Decisão + OCR de cada subpasso (abrir filtro → digitar → selecionar → Show results) + Resultado com evidência Campinas



Antes → depois: People → Connect direto → People → filtro Campinas → Connect. Rollback: remover este passo 5b e a menção a Campinas no Objetivo/Critérios.





Iterar perfis e conectar (um Connect por item da lista)





Só clicar onde o OCR devolveu Connect (match exato ^Connect$, 180 < y < 850). Jamais clicar em Message / Pending / Follow / Following.



Proibido tap estimado por grau/x: ~458: se o extract não tiver a palavra Connect, não há clique nesse item — só scroll e tentar de novo. (O estimado era a causa de clicar em Message e ter que dar BACK.)



Sem teto de rounds: se a tela não tiver Connect, scrollar no centro infinitamente até aparecer algum Connect — não parar após 3 (nem N) rounds vazios.



Critérios de saída (só estes encerram o passo 6 e o processo):





Fim explícito da lista no OCR: No more results / End of results / You've reached the end / não há mais resultados. Não usar “Are these results helpful?” sozinho nem idle de N scrolls.



Limite semanal de convites LinkedIn — o toast aparece depois do Skip (não logo após o tap em Connect). Fluxo: Connect → sheet Add a note → Skip → extract → se OCR tiver a mensagem, parar imediatamente.





Frase canônica: Your invitation to {Name} was not sent because you have reached the weekly limit for connection invitations.



Fragmentos OCR observados (pós-Skip): Yourinvitationto…wasnot · sentbecauseyouhavereachedthe · weeklylimitforconnectioninvitations. · Please try again next week



Também aceitar: weekly invitation limit / weeklylimitforconnectioninvitations / Please try again next week / invitation limit / can't send invitations / limite de convites / não é possível enviar.



Evidência: print src/screenshots/linkedin-weekly-invitation-limit.png (capturado após Skip).



Ao detectar pós-Skip: esse Connect não conta; não scroll, não novo Connect — Encerramento com motivo limite_linkedin.



Não usar limite N artificial de connects nem de rounds no run.



Ao bater critério de saída: ir ao Encerramento, gravar log, parar a execução imediatamente — o AVD não deve continuar sendo manipulado.



Armadilha Message / Premium: tap errado (ou gesto curto no centro) pode abrir compose “Send a message” / InMail / paywall Premium. Nunca enviar mensagem nem clicar CTA Premium.





Detecção via OCR: textos como Message, Send a message, InMail, Premium, Upgrade, Try Premium, composer vazio + Send.



Recuperação: key(KEYCODE_BACK) (1–3×) até extract() voltar à lista People (People chip + graus 2nd/3rd+ / busca comprador) — não decidir por imagem.



Antes de cada Connect e após cada scroll: checar essa armadilha; se presente, BACK e seguir (logar OCR + decisão BACK).



Em cada tela (via extract()):





listar todos os hits text === "Connect" com 180 < y < 850 (ignorar OCR connections / Message)



se a mesma faixa y tiver Message / Pending / Follow → não tap (logar)



antes do tap: para cada Connect válido, extrair e registrar o card do comprador no log — todos os textos OCR do item da lista associados a esse Connect (faixa vertical do card: tipicamente do nome até o próximo card / mutual connections; incluir o que existir: nome, grau 2nd/3rd+, headline/cargo, localização, Current: / Past:, empresa, mutual connections, e qualquer outro texto do item). Estruturar em ### Comprador (prosa ou campos) + bloco json com os { text, x, y } do card. Sem registro do comprador = Connect incompleto (não contar).



para cada Connect válido já registrado: tapElement({ serial, x, y }) só nas coordenadas retornadas



aguardar 1–2s; se abriu Message/Premium → BACK (não contar); se fim de lista → Encerramento



sheet Add a note…: só Skip / Ignorar — jamais Add a note (detectar título pelo texto junto /add\s+a\s+note/i)



logo após o Skip: extract de novo e checar toast de limite semanal (critério 2 acima). Se presente → logar OCR + Encerramento limite_linkedin (não contar esse Connect). Sem toast → seguir.



se OCR mostrar Withdraw invitation / Withdraw + invitation: clicar Cancel (jamais confirmar Withdraw) — logar; não contar Connect



incrementar contador só se Connect + Skip ok (sem Message/Withdraw/limite) e ### Comprador gravado no .md



se zero Connect na tela: scroll centro (não inventar clique) e repetir sem limite de rounds até achar Connect ou critério de saída



depois dos Connect da tela: scroll swipe curto no centro (x: 270, y: 480, direction: "up", distance ~150–200 em 540×960 — não ≥350)



Rolagem pequena de propósito: swipe grande “pula” cards (item cego — Connect some sem passar pelo OCR). Preferir vários scrolls curtos a um longo.



após rolar: repetir; Encerramento só por fim explícito / limite LinkedIn



não clicar botões de item com y ≥ 850 (nav); só Skip do sheet pode estar nessa faixa



teclado fechado antes de qualquer scroll da lista (centro)



Encerramento





disparado por: fim explícito da lista (OCR) ou limite LinkedIn ou type_mismatch no passo 3 ou filter_campinas_failed no passo 5b ou erro fatal (tudo documentado no log)



log final no .md: totais + motivo de parada; opcionalmente índice/resumo dos compradores conectados nesta run



parar a execução de imediato — proibido continuar scroll/tap/extract após o encerramento

Critérios de aceite





A jornada: Search → digitar tudo de uma vez e checar o valor completo só no fim → fechar teclado → Show all results → People → filtro localização Campinas → Connect (e Skip); scroll infinito até achar Connect; para só em fim explícito ou limite LinkedIn.



Passo 5b: filtro Campinas aplicado e evidenciado no OCR antes do primeiro Connect; sem filtro → não conectar.



Execução por IA + este markdown: sem script com o roteiro preso; cada passo = OCR → decisão em prosa no log → interface.



Após Encerramento, o AVD deixa de ser manipulado.



Passo 3: digitar comprador inteiro sem checagem intermediária; só então screenshot + extract + checagem do valor completo no campo Search; divergência → limpar, redigitar tudo ou type_mismatch; proibido validar a cada tecla.



Passo 6: sem teto de rounds vazios; scroll só no centro; log .md com Decisão + OCR JSON por passo.



Cada Connect contado tem ### Comprador com todas as infos disponíveis no item da lista (OCR do card); Connect sem esse registro não conta.



Só clica em Connect; proibido tap estimado; jamais Message (nem Pending/Follow/Following).



Após Connect, no sheet: só Skip — jamais Add a note.



Se Withdraw invitation: só Cancel — jamais confirmar Withdraw.



Se abrir Message/Premium: BACK via OCR até a lista; nunca enviar mensagem.



Decisões só via OCR/texto; no passo 3 o print é artefato — a checagem final usa o texto OCR do campo, não análise visual da imagem. Print+análise por imagem só em erro/debug fora desse fluxo.



Notas operacionais





Timeouts: esperar 1–3s entre ações; findByText com minScore:0.75.



Scroll lista: direction: "up"; origem sempre no centro (x: 270, y: 480 em 540×960); distance ~150–200 (rolagens menores). Fechar teclado antes.



Scroll — sempre no centro, curto: jamais na zona do teclado/nav. Swipe longo demais pula Connect; gesto curto demais pode virar tap — manter swipe contínuo com distance ~150–200.



Parada: fim explícito da lista (OCR) ou limite semanal de convites detectado no OCR logo após Skip (weeklylimitforconnectioninvitations / Your invitation to … was not sent…) — não parar por “3 rounds sem Connect”; scroll até achar Connect; ao parar, encerrar a execução.



Log: um .md por execução (documento: Decisão em prosa + OCR em JSON separado).



Registro do comprador: só a partir do OCR do card na lista (não abrir o perfil para “completar” dados). Se um campo não aparecer no OCR do item, não inventar — registrar o que houver.



Antes → depois (registro): log só com Decisão/OCR genérico do passo → cada Connect contado exige ### Comprador com todos os textos do item. Rollback: remover a seção ### Comprador / critério do passo 6 item 3 deste markdown.



Se a digitação falhar, não clicar em comprador da lista — só digitar a palavra inteira via type (checagem só no fim) e depois fechar teclado → Show all results.



Passo 3 — print: um arquivo após a digitação completa em src/screenshots/ (ex. type-comprador.png); decisão pelo OCR do campo (y < 120), não pela imagem.

Como executar





Abrir AVD e navegar ao LinkedIn (manual ou npm run linkedin-login só para login/home — não é runner desta jornada).



Pedir à IA: executar este roteiro; ela lê o markdown, chama extract/ações pontuais e decide em tempo real.

```bash
cd screen-robot/src
npm run agent -- --prompt ../roteiros/jornada-completa.md --history-steps 10
# TTY → menu de modelos (1 / 1,3 / a=todos / id)
# sem menu: --model gemini-3.8-flash  |  --no-prompt  |  --all-models
```

Digitação: default ADB. Rollback OCR/tap: `AGENT_TYPE_METHOD=ocr`.



Artefato: src/logs/jornada-comprador/<stamp>.md com Decisão + OCR por passo + ### Comprador por cada Connect contado.

Responsável: IA operando sobre screen-robot/roteiros/jornada-comprador.md + interfaces em src/lib/.
