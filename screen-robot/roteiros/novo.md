Objetivo: abrir o LinkedIn. 1 ação por turno. done só com o app já aberto (Search no topo OU Home + Network + Jobs no rodapé).

Tap: acao.element = id (e0) ou text EXATO do extract. PROIBIDO x,y.

NUNCA KEYCODE_BACK na tela inicial. BACK não abre app. Se o OCR for hora/data (Tuesday/Monday/…) SEM Chrome SEM Calendar → a ação é scroll down, mesmo que o histórico esteja cheio de BACK.

Passos (nessa ordem). Depois de cada ação, olhe o OCR novo. Sucesso = ir ao passo correspondente. Falha = só a recuperação abaixo (não invente BACK/HOME).

1) Shade — se Notifications / Clear all / AndroidSetup visíveis SEM tab bar (Home/Network/Jobs)
   Ação: KEYCODE_BACK. Sem scroll. Sem tap.
   Sucesso: OCR perdeu Notifications/Clear all. Vá ao passo 2, 3 ou 6 conforme a tela.
   Falha (shade ainda visível): KEYCODE_BACK de novo, no máximo 2× no total. Se continuar: KEYCODE_HOME 1×, depois passo 2. Nunca scroll no shade.

2) Home — hora e data, SEM Chrome, SEM Calendar, SEM LinkedIn/Linkedln, SEM Search, SEM Network
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

5) Pós-tap — histórico já tem tap LinkedIn/Linkedln E o OCR NÃO tem Chrome+Calendar
   Ação: sleep 2000. Sem BACK. Sem retap. Sem scroll.
   Sucesso: Search ou tab bar → passo 6.
   Falha (ainda poucos tokens / "in"): sleep 2000 de novo, máximo 3 sleep seguidos. Depois disso: fail linkedin_nao_carregou. Se reapareceu gaveta: passo 3. Se home: passo 2.

6) LinkedIn aberto — Search (y<120) OU Home + Network + Jobs no rodapé
   Ação: done.
   Sucesso: done (objetivo cumprido).
   Falha (não é isso: sem Search e sem tab bar): não done. Classifique: shade → 1; home → 2; gaveta → 3; splash → 4/5.

PROIBIDO: BACK porque "LinkedIn não está aberto"; copiar BACK do histórico na home; scroll up; tap coords antigas; done na home/gaveta/splash; fail na primeira falha de um passo (use a recuperação).
