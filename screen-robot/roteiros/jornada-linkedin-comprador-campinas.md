Objetivo: do ZERO abrir o LinkedIn → Search "comprador" → People → filtro cidade Campinas → Connect+Skip até limite. 1 ação/turno. Nunca pule fase. Nunca done no Skip.

Tap: x,y = item da lista OCR com text. NUNCA 0,0. Sem o texto no OCR → não tap. elementos[].label = o text do OCR nesse x,y — PROIBIDO relabelar (ex. OCR "Comprador" → label "Connect").

Ordem obrigatória: FASE 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Sem FASE 6 concluída (chip Campinas FORA de y<120) → PROIBIDO Connect.

Interruptos (antes de qualquer fase):
- "Add a note" / Skip visível → tap Skip. Não done. Não Connect.
- Shade (Notifications / Clear all / AndroidSetup) SEM tab bar → KEYCODE_BACK. Sem tap. Sem scroll.
- weekly limit / invitation not sent / try again next week → done limite_convites.
- Message / InMail / Premium / About / Experience (perfil aberto, SEM lista 1st+Connect) → KEYCODE_BACK.
- Withdraw invitation → tap Cancel.
- OCR <15 hits, histórico já tem Search/People, SEM gaveta Chrome+Calendar → sleep 1500. Não é home. PROIBIDO scroll down. PROIBIDO tap 161,260.

FASE 0 — ABRIR LINKEDIN (primeiro passo; ANTES de Search/type/Connect)
0) Histórico recente = tap no texto LinkedIn/Linkedln → NÃO é home. OCR sem Chrome/Calendar = app abrindo ou perfil. PROIBIDO scroll down. sleep 2000 (loading) OU KEYCODE_BACK (perfil). NUNCA retap coords antigas.
1) Home = OCR só hora/data, SEM LinkedIn, SEM Chrome, SEM Calendar, SEM Search, SEM tab bar, E histórico SEM tap LinkedIn → scroll down 1×. PROIBIDO tap. PROIBIDO 0,0. PROIBIDO sleep. PROIBIDO scroll up.
2) Já na gaveta = Chrome + Calendar + "LinkedIn" ou "Linkedln" visíveis NESTE extract → tap EXATO no texto LinkedIn/Linkedln (x,y deste hit). NÃO scroll. NÃO tap Chrome/Calendar/Settings. NÃO tap coords de um passo antigo se o texto não está neste OCR.
3) Histórico tem tap LinkedIn E este OCR NÃO tem Chrome+Calendar → o app JÁ abriu ou está carregando. PROIBIDO scroll. PROIBIDO tap 471,368. Ação: sleep 2000.
4) Splash / loading ("in" no centro, poucos tokens, SEM tab bar, SEM Chrome) → sleep 2000. Sem scroll. Sem HOME. Sem tap.
5) Home + Network + Jobs (y≥850) OU ícones na faixa y≥900 = LinkedIn ABERTO → FASE 1. PROIBIDO scroll down. PROIBIDO tap "LinkedIn".
6) Perfil (About / Experience / headline SEM chips 1st/2nd y~150 SEM Search) → KEYCODE_BACK. Sem scroll. Sem Connect.

FASE 1 — SEARCH (só com LinkedIn aberto)
- Texto Search ou QSearch com y<120 → tap Search. PROIBIDO scroll. PROIBIDO type. PROIBIDO Connect.
- Tab bar SEM Search y<120 → sleep 1500. PROIBIDO scroll down.
- Show translation / Following / feed SEM Search y<120 → scroll up 1×. PROIBIDO scroll down.
- Grow / Catch up / Invitations + Search y<120 → tap Search.

FASE 2 — TYPE "comprador" (só depois do tap Search)
- Teclado (q,w,e) SEM "Add a location"/"Add alocation"/Australia/UnitedStates → type "comprador". Sem scroll. Sem tap. PROIBIDO type "Campinas".
- Campo y<120 é Campinas (ou outra cidade) SEM sheet Add location SEM chip Location da lista → busca errada: type "comprador". Não é filtro. PROIBIDO Connect.
- OCR só hora/data DEPOIS de tap Search → type "comprador" (teclado cobriu). PROIBIDO scroll.

FASE 3 — FECHAR TECLADO
- Campo y<120 = comprador + "Show all results" já visível → NÃO BACK. Vá FASE 4.
- Campo y<120 = comprador + teclado SEM Show all → KEYCODE_BACK 1×. Sem type. Sem tap.

FASE 4 — SHOW ALL
- Campo y<120 = comprador + "Show all results"/"Showallresults" (y<800, não tab bar) → tap Show all. Não Show translation. Não Post/Jobs y≥850.

FASE 5 — PEOPLE
- People + Posts + Jobs y<180 SEM chips 1st/2nd → tap People y<180. Não y≥200.
- 1st/2nd já visível (y~150) → NÃO tap People. Vá FASE 6.

FASE 6 — FILTRO CAMPINAS (próxima ação depois de People; Campinas no Search y<120 NÃO conta; cidade no card NÃO conta)
- 1st + 2nd + 3rd+ + Location/Locatior (mesmo OCR "Locatior") e SEM chip Campinas na barra (y~150, fora do campo y<120) → tap Location/Locatior @x,y desse texto. ÚNICA ação. PROIBIDO Connect. PROIBIDO tap "Comprador" (é cargo). PROIBIDO tap nome (Heitor/Sabrina/…). PROIBIDO People. Belo Horizonte nos cards = filtro AINDA NÃO aplicado.
- "Add a location"/"Add alocation" SEM teclado → tap esse texto.
- Teclado + Add location + Australia/UnitedStates → type "Campinas". Não tap. Não type "comprador".
- Campo y<120 contém Campinas + sugestão Campinas (Sao Paulo/Brazil) no sheet → tap a SUGESTÃO (não o campo).
- Sugestão destacada + "Show results" → tap Show results.
- "Filter by" + All/People/Jobs + Show results → tap People, depois Show results. Sem BACK.

FASE 7 — CONNECT (só lista People COM chip Locations/Campinas na barra y~150, NÃO no campo Search)
- Só tap se existir hit text EXATO "Connect" (não "Comprador", não "Pending", não "Message", não nome). Use x,y DESSE hit (costuma x>400). 180<y<850.
- Sem hit "Connect" → scroll up curto (~180).
- "No more results"/"End of results" → done fim_lista.

PROIBIDO: HOME com Search/tab bar; done no Skip; type "Campinas" no Search; type "comprador" no filtro de cidade; Connect sem chip Campinas na barra; tap "Comprador"/nome no lugar de Connect; tap 0,0; tap sem o texto no OCR; scroll down no LinkedIn aberto; pular FASE 0 ou FASE 6.

done: N Connect+Skip + motivo (limite_convites / fim_lista / filter_campinas_failed).
