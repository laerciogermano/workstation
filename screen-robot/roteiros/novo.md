Objetivo: abrir o LinkedIn → tap Search → type "comprador" → tap "Show all results". 1 ação por turno. done só quando ESTA run já fez tap em Show all results (depois do type). NÃO done só porque o app abriu ou porque digitou. NÃO done só porque Recent lista "comprador".

Tap: acao.element = id (e0) ou text EXATO do extract. PROIBIDO x,y.

Olhe o ÚLTIMO passo do histórico ANTES de classificar a tela. OCR pobre (só hora / "in" / 2–9 hits) NÃO é home se já houve tap.
- último = tap LinkedIn/Linkedln → sleep 2000 (splash). NUNCA scroll. NUNCA BACK. Log: 12:02 g in O •@24 · in@476
- último = tap Search → type "comprador" (teclado cobriu). NUNCA scroll. NUNCA BACK. NUNCA passo 2. Log: MO@23 · 12:02@24 · JU@485 · «@924
- último = type comprador → tap "Show all results" (passo 8). NUNCA done ainda. Log: comprador@81 · Show all@153 · Show all results@473
- scroll down SÓ se histórico SEM tap LinkedIn E SEM tap Search E OCR home (Tuesday/Monday + sem Chrome)

NUNCA KEYCODE_BACK na tela inicial. BACK não abre app.

Passos (nessa ordem). Depois de cada ação, olhe o OCR novo. Sucesso = ir ao passo correspondente. Falha = só a recuperação abaixo (não invente BACK/HOME). Exemplos de OCR = logs reais (text,y). Bate o padrão, execute a ação.

1) Shade — Notifications / Clear all / AndroidSetup SEM tab bar (sem Home/Network/Jobs y≥850)
   OCR exemplo: 3:07@38 · Mon, 0ct 5@109 · Notifications@297 · AndroidSetup@371 · Finish setup@507 · Silent@56 · Clear all@804
   Ação: KEYCODE_BACK. Sem scroll. Sem tap.
   Sucesso: OCR perdeu Notifications/Clear all. Vá ao passo 2, 3 ou 6 conforme a tela.
   Falha (shade ainda visível): KEYCODE_BACK de novo, no máximo 2× no total. Se continuar: KEYCODE_HOME 1×, depois passo 2. Nunca scroll no shade.

2) Home — hora e data, SEM Chrome, SEM Calendar, SEM LinkedIn/Linkedln, SEM Search, SEM Network, E histórico SEM tap LinkedIn E SEM tap Search
   OCR exemplo: 12:02m@@24 · Tuesday, Oct 6@117 · OOo@713 · CEE@824 · |@924 · @®@926
   Ação: scroll direction=down UMA vez. Sem tap. Sem BACK. Sem sleep. Sem scroll up.
   Sucesso: OCR tem Chrome + Calendar (gaveta). Vá ao passo 3.
   Falha (ainda só hora/data): scroll down mais 1× (máximo 2 down no total). Se ainda falhar: fail gaveta_nao_abriu. Nunca BACK. Nunca scroll up.

3) Gaveta — Chrome + Calendar + texto "LinkedIn" ou "Linkedln" NESTE extract
   OCR exemplo: Chrome@252 · Calendar@253 · Clock@253 · LinkedIn@368 · Linkedln@369 · Files@369 · Gmail@369 · Settings@603
   Ação: tap no text LinkedIn ou Linkedln (id do extract, ex. e13). Sem scroll. Sem tap Chrome/Calendar/Settings.
   Sucesso: OCR perdeu a lista Chrome+Calendar. Splash (passo 4) ou LinkedIn aberto (passo 6).
   Falha (gaveta igual, LinkedIn ainda no extract): tap de novo no id ATUAL de LinkedIn/Linkedln (não coords antigas). 1 retentativa. Se o texto sumiu: passo 2 se home; passo 4/5 se poucos tokens; senão fail linkedin_nao_visivel.

4) Splash / loading — poucos tokens, "in" no centro (~y 476), SEM Chrome. Histórico TEM tap LinkedIn.
   OCR exemplo: 12:02 g in O •@24 · in@476   (2 hits — NÃO é home; NÃO tem Tuesday)
   Também: 11:59@24 · #目回@24 · 11:59 @ in ® •@25 · in@479
   Ação: sleep 2000. Sem BACK. Sem scroll. Sem tap. Sem passo 2.
   Sucesso: Search y<120 ou Home+Network+Jobs → passo 6. Ou ainda splash → passo 5.
   Falha (voltou home hora/data): passo 2 (scroll down). Falha (voltou gaveta): passo 3. Nunca BACK no splash.

5) Pós-tap LinkedIn — histórico já tem tap LinkedIn/Linkedln E o OCR NÃO tem Chrome+Calendar (ainda splash/loading)
   OCR exemplo: igual passo 4 (in@479, 4 hits). Também: 11:56@24 · in@488
   Ação: sleep 2000. Sem BACK. Sem retap. Sem scroll.
   Sucesso: Search ou tab bar → passo 6.
   Falha (ainda poucos tokens / "in"): sleep 2000 de novo, máximo 3 sleep seguidos. Depois disso: fail linkedin_nao_carregou. Se reapareceu gaveta: passo 3. Se home (sem tap Search no histórico): passo 2.

6) LinkedIn aberto (feed) — Search (y<120) OU Home + Network + Jobs no rodapé. Ainda NÃO é a tela de busca (sem Recent/Show all).
   OCR exemplo: 11:59@25 · Search@79 · Followed@144 · Home@872 · Network@872 · Post@872 · Jobs@872 · Notifications@862
   Ação: tap Search (y<120, id do extract). Sem scroll. Sem type. Sem done. Sem BACK.
   Sucesso: teclado (q,w,e) OU OCR só hora/data depois deste tap → passo 7.
   Falha (Search ainda no feed, tab bar igual): tap Search de novo 1×. Se Search y<120 sumiu: scroll up 1× (não down). Sem Search: sleep 1500.

7) Type "comprador" — DEPOIS do tap Search. Duas telas possíveis:
   A) Teclado cobriu (OCR pobre; último passo = tap Search). OCR exemplo: MO@23 · 12:02@24 · -@26 · JU@485 · «@924 · [|@924
      Parece home mas NÃO tem Tuesday e o histórico tem Search → type "comprador". PROIBIDO scroll. PROIBIDO BACK. PROIBIDO passo 2.
   B) Teclado visível (q/w/e / qwerty) SEM Add a location / Australia. OCR exemplo: comprador@81 · Recent@153 · Show all@153 · W@619 · qwertyuiobp@622 · ？123@848
      Se o campo y<120 já é "comprador" E o histórico TEM type → passo 8 (Show all results). Senão: type "comprador". Sem tap. Sem scroll. Sem BACK. Sem Campinas.
   Sucesso: histórico tem type "comprador" → passo 8.
   Falha (teclado ainda aberto, sem type no histórico): type "comprador" de novo 1×. Falha (voltou feed Search+Home+Jobs, sem Recent): passo 6.

8) Show all results — histórico TEM type "comprador". Ainda NÃO fez tap Show all results nesta run.
   OCR exemplo: comprador@81 · Recent@153 · Show all@153 · Showallresults@472 · Show all results@473 · Rafael@286 · qwertyuiobp@622
   Ação: tap no text EXATO "Show all results" ou "Showallresults" (y<800, não tab bar Jobs). Prefira esse, não "Show all"@153, não Show translation, não Post/Jobs y≥850.
   Se "Show all results" NÃO está no extract e só há "Show all"@152: tap "Show all".
   Se teclado aberto SEM Show all / Show all results: KEYCODE_BACK 1× (fecha teclado), depois tap no OCR novo. Sem type de novo.
   Sucesso: botão some OU lista de resultados (People/Posts) → passo 9.
   Falha (mesma tela, botão ainda visível): tap de novo no id ATUAL 1×. Sem botão e sem resultados: fail show_all_nao_visivel.

9) Já deu tap em Show all results nesta run
   Ação: done.
   Sucesso: done (objetivo cumprido).
   Falha (histórico SEM tap Show all / Show all results): não done → passo 8. SEM type: passo 7. Feed sem Recent: passo 6.

PROIBIDO: BACK porque "LinkedIn não está aberto"; copiar BACK do histórico na home; scroll down depois de tap Search; tap coords antigas; done no feed ou só depois do type (falta Show all results); done só porque Recent tem comprador; tap Show translation / Jobs y≥850 no lugar de Show all results; fail na primeira falha de um passo (use a recuperação).
