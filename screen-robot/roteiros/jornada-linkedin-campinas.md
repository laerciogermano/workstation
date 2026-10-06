Objetivo: LinkedIn → buscar "comprador" → People → filtro Campinas → tap em TODOS os "Connect" até limite semanal de convites (ou fim da lista). Uma ação por turno. NÃO done no Skip.

Regra de ouro: tap só nas coords de um texto que EXISTE no OCR. Nunca 0,0. Nunca inventar botão.

Atalho (se a tela JÁ estiver no meio do fluxo, NÃO recomece):
- "Add a location" / "Add alocation" visível e SEM teclado (sem q,w,e) → tap nesse texto. PRÓXIMO turno: type "Campinas".
- Teclado visível (q,w,e / ?123) neste filtro → type "Campinas" NA HORA. Não tap o campo. Não tap Locatior.
- Sugestão "Campinas" (Sao Paulo/Brazil) visível → tap nela. Depois Show results / Done / Apply.
- "Filter by" (All / People / Jobs / Posts / Show results) → tap People nesta lista, depois "Show results". Nunca BACK. Nunca type.
- Lista People (chips 1st/2nd/3rd+ e cards) SEM "Campinas" e SEM "Add a location" → tap Location/Locatior/Locations (só se esse texto existir no OCR). PROIBIDO tap People de novo. PROIBIDO type "comprador". PROIBIDO Search. PROIBIDO scroll/Connect. PROIBIDO BACK. Não repetir o mesmo tap se a tela não mudou.
- Mesma lista COM "Campinas" → vá aos Connect (passo 17).
- Campo y<120 já = "comprador" e "Showallresults" visível → tap Show all. Não type de novo.
- OCR só relógio (1 hit) depois de um tap → sleep 1500. Não scroll.

OCR só hora/data (ex. "8:24" + "Tuesday, Oct 6"), SEM apps SEM Search SEM Home+Network+Jobs:
→ se o último passo NÃO foi tap Search nem type "comprador": scroll down (gaveta). PROIBIDO BACK. PROIBIDO HOME. PROIBIDO type.
→ se o último passo FOI tap Search ou type: type "comprador" (teclado cobriu). Sem BACK em loop.

Passos (nessa ordem; 1 ação) — só se o atalho acima NÃO aplicar:
1) Shade (Notifications / Clear all / AndroidSetup) E SEM Search E SEM Home+Network+Jobs → KEYCODE_BACK. Sem scroll. Sem HOME.
2) Home (só hora/data, sem apps) → scroll down. Nunca scroll up. Nunca BACK.
3) Gaveta (LinkedIn + Chrome + Calendar) → tap EXATO "LinkedIn" ("Linkedln" ok). Não tap Chrome/Gmail/Calendar.
4) Pós-tap LinkedIn: ainda gaveta → sleep 1500 e tap LinkedIn de novo. Sem scroll.
5) Splash (só "in" no centro, sem Search) → sleep 2000. Sem scroll. Sem HOME.
6) LinkedIn: Search/QSearch y<120 OU tab bar Home+Network+Jobs → NUNCA HOME. Ignore Android Setup / sdk_gphone.
7) Search só se y<120. Nunca tap "Search" em y≥120 (isso é aba/chip, não o campo). Campo vazio y<120 → tap Search. PRÓXIMO turno: type "comprador".
8) Teclado (q,w,e / ?123): se o filtro de cidade está aberto (Add a location no campo) → type "Campinas". Senão, se o campo de busca está vazio → type "comprador". Nunca scroll. Não type "comprador" se a lista People já está aberta.
9) Campo y<120 com lixo (ty/tyl) → KEYCODE_DEL várias vezes, depois type "comprador".
10) Campo = "comprador" + teclado aberto → KEYCODE_BACK 1× (fecha teclado). Não tap Recent "comprador". Não ENTER. Não "Show translation".
11) "Show all results" / "Showallresults" / "Show all" (não "Show translation", não Home/Network/Post/Jobs) → tap nesse texto. Sem o texto → BACK 1× ou sleep 1500. Sem chute de x,y.
12) Aba People: texto EXATO "People" junto de Posts/Jobs e y<180. Tap 1 vez só. Não tap People y≥200. Não repetir tap People se a lista (1st/2nd/3rd+) já está visível.
13) Grow / Catch up / Invitations = Network → volte ao Search (passo 7).
14) Lista People visível SEM "Campinas" → tap Location / Locatior / Locations. Sem scroll right nas abas People/Posts.
15) Add a location / Add alocation → tap → type "Campinas" → tap sugestão Campinas (Sao Paulo/Brazil) → Show results / Done / Apply.
16) Sem Campinas no OCR → NÃO Connect. Repita 14–15 (máx. 3). Falha → done filter_campinas_failed.
17) SÓ com Campinas no OCR: text EXATO "Connect" e 180<y<850 → tap. Nunca Message / Pending / Follow. Sem Connect → scroll up curto no centro (distance ~180). Outra cidade (Belo Horizonte, etc.) sem Campinas → volte ao 14.
18) Add a note → tap Skip. NÃO done.
19) Após Skip: weekly limit / invitation+not sent / try again next week → done limite_convites. Senão outro Connect ou scroll up curto.
20) Message / InMail / Premium → KEYCODE_BACK até People. Nunca Send.
21) Withdraw invitation → tap Cancel.
22) No more results / End of results / You've reached the end → done fim_lista.
23) monthly limit for profile searches → done limite_busca.

PROIBIDO: HOME com Search ou tab bar; done no 1º Skip; tap sem o texto no OCR; scroll no splash ou com teclado; Connect/scroll/tap People de novo na lista sem Campinas; type "comprador" se a lista People já está aberta; BACK só porque Campinas não está no OCR (use Location / Filter by).

done: N Connect+Skip ok + motivo. Só então type=done.
