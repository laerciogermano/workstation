Objetivo: abrir o LinkedIn → tap Search → type "comprador". 1 ação por turno. done só quando o campo de busca contém "comprador". NÃO done só porque o app abriu.

Tap: acao.element = id (e0) ou text EXATO do extract. PROIBIDO x,y.

NUNCA KEYCODE_BACK na tela inicial. BACK não abre app. Se o OCR for hora/data (Tuesday/Monday/…) SEM Chrome SEM Calendar E o histórico NÃO tem tap Search → a ação é scroll down, mesmo que o histórico esteja cheio de BACK.

Depois de tap Search: OCR só hora/data NÃO é home. É teclado cobrindo. Ação: type "comprador". PROIBIDO scroll. PROIBIDO BACK. PROIBIDO tratar como passo 2.

Passos (nessa ordem). Depois de cada ação, olhe o OCR novo. Sucesso = ir ao passo correspondente. Falha = só a recuperação abaixo (não invente BACK/HOME).

1) Shade — se Notifications / Clear all / AndroidSetup visíveis SEM tab bar (Home/Network/Jobs)
   Ação: KEYCODE_BACK. Sem scroll. Sem tap.
   Sucesso: OCR perdeu Notifications/Clear all. Vá ao passo 2, 3 ou 6 conforme a tela.
   Falha (shade ainda visível): KEYCODE_BACK de novo, no máximo 2× no total. Se continuar: KEYCODE_HOME 1×, depois passo 2. Nunca scroll no shade.

2) Home — hora e data, SEM Chrome, SEM Calendar, SEM LinkedIn/Linkedln, SEM Search, SEM Network, E histórico SEM tap Search
   Ação: scroll direction=down UMA vez. Sem tap. Sem BACK. Sem sleep. Sem scroll up.
   Sucesso: OCR tem Chrome + Calendar (gaveta). Vá ao passo 3.
   Falha (ainda só hora/data): scroll down mais 1× (máximo 2 down no total). Se ainda falhar: fail gaveta_nao_abriu. Nunca BACK. Nunca scroll up.

3) Gaveta — Chrome + Calendar + texto "LinkedIn" ou "Linkedln" NESTE extract
   Ação: tap nesse texto (id do extract). Sem scroll. Sem tap Chrome/Calendar/Settings.
   Sucesso: OCR perdeu a lista Chrome+Calendar. Splash (passo 4) ou LinkedIn aberto (passo 6).
   Falha (gaveta igual, LinkedIn ainda no extract): tap de novo no id ATUAL de LinkedIn/Linkedln (não coords antigas). 1 retentativa. Se o texto sumiu: passo 2 se home; passo 4/5 se poucos tokens; senão fail linkedin_nao_visivel.

4) Splash / loading — poucos tokens, "in" no centro, SEM Chrome
   Ação: sleep 2000. Sem BACK. Sem scroll. Sem tap.
   Sucesso: Search y<120 ou Home+Network+Jobs → passo 6. Ou ainda splash → passo 5.
   Falha (voltou home hora/data): passo 2 (scroll down). Falha (voltou gaveta): passo 3. Nunca BACK no splash.

5) Pós-tap LinkedIn — histórico já tem tap LinkedIn/Linkedln E o OCR NÃO tem Chrome+Calendar
   Ação: sleep 2000. Sem BACK. Sem retap. Sem scroll.
   Sucesso: Search ou tab bar → passo 6.
   Falha (ainda poucos tokens / "in"): sleep 2000 de novo, máximo 3 sleep seguidos. Depois disso: fail linkedin_nao_carregou. Se reapareceu gaveta: passo 3. Se home (sem tap Search no histórico): passo 2.

6) LinkedIn aberto — Search (y<120) OU Home + Network + Jobs no rodapé. Campo AINDA NÃO é busca com teclado.
   Ação: tap Search (y<120). Sem scroll. Sem type. Sem done. Sem BACK.
   Sucesso: teclado (q,w,e) OU OCR só hora/data depois deste tap → passo 7.
   Falha (Search ainda no feed, tab bar igual): tap Search de novo 1×. Se Search y<120 sumiu: scroll up 1× (não down). Sem Search: sleep 1500.

7) Type "comprador" — DEPOIS do tap Search. Teclado (q,w,e) SEM "Add a location" / Australia. OU OCR só hora/data com tap Search no histórico.
   Ação: type "comprador". Sem tap. Sem scroll. Sem BACK. Sem Campinas.
   Sucesso: OCR tem "comprador" no campo (y<120 ou lista Recent) → passo 8.
   Falha (teclado ainda aberto, sem comprador): type "comprador" de novo 1×. Falha (voltou feed Search+tab bar): passo 6. Nunca scroll down aqui.

8) Campo com comprador
   Ação: done.
   Sucesso: done (objetivo cumprido).
   Falha (sem "comprador" no OCR): não done. Classifique: shade → 1; home sem Search no histórico → 2; gaveta → 3; splash → 4/5; LinkedIn feed → 6; teclado/pós-Search → 7.

PROIBIDO: BACK porque "LinkedIn não está aberto"; copiar BACK do histórico na home; scroll down depois de tap Search; tap coords antigas; done no feed (Search+tab bar) sem ter digitado comprador; fail na primeira falha de um passo (use a recuperação).
