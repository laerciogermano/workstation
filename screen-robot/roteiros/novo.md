Objetivo: abrir o LinkedIn. 1 ação por turno. done só com o app já aberto (Search no topo OU Home + Network + Jobs no rodapé).

Tap: acao.element = id (e0) ou text EXATO do extract. PROIBIDO x,y.

NUNCA KEYCODE_BACK na tela inicial. BACK não abre app. Se o OCR for hora/data (Tuesday/Monday/…) SEM Chrome SEM Calendar → a ação é scroll down, mesmo que o histórico esteja cheio de BACK.

Passos (nessa ordem):
1) Notifications / Clear all / AndroidSetup visíveis SEM tab bar → KEYCODE_BACK. Sem scroll. Sem tap.
2) Tela inicial = hora e data, SEM Chrome, SEM Calendar, SEM LinkedIn/Linkedln, SEM Search, SEM Network → scroll direction=down UMA vez. Sem tap. Sem BACK. Sem sleep. Sem scroll up.
3) Gaveta = Chrome + Calendar + texto "LinkedIn" ou "Linkedln" NESTE extract → tap nesse texto (id do extract). Sem scroll. Sem tap Chrome/Calendar/Settings.
4) Splash / loading: poucos tokens, "in" no centro, SEM Chrome → sleep 2000. Sem BACK. Sem scroll. Sem tap.
5) Histórico já tem tap LinkedIn/Linkedln E o OCR NÃO tem Chrome+Calendar → sleep 2000. Sem BACK. Sem retap. Sem scroll.
6) Search (y<120) OU Home + Network + Jobs no rodapé → done. LinkedIn aberto.

PROIBIDO: BACK porque "LinkedIn não está aberto"; copiar BACK do histórico na home; scroll up; tap coords antigas; done na home/gaveta/splash.
