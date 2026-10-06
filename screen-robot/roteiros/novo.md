Em cada ação, diga no motivo qual passo (1–12) está em curso.

Ordem obrigatória 1→12. 1 ação/turno. Text/icon do extract = clicável (copie x,y).
PROIBIDO fail se o text do passo atual estiver no OCR (ex. Search → tap; não fail).
fail só se impossível após retentativa; histórico de fail NÃO impede tap.

1. clique em Search — tap nas x,y do text "Search" (y<120). Única ação. (pode ser que nada aconteca que o teclado nao apareca, apenas prossiga para o proximo passo)
2. digite comprador — type "comprador" (após Search; teclado ou campo aberto).
3. feche o teclado — key KEYCODE_BACK 1×. EXCEÇÃO: se OCR JÁ tem "Show all results" / "Show all" / "Showall" → NÃO dê BACK (BACK fecha a busca). Vá direto ao 4 e tap nesse text (passo atual = 4).
4. clique em Show all results — tap text EXATO do OCR atual ("Show all results" ou "Show all"/"Showall"). Se sumiu do OCR (ex. após BACK indevido) → retap Search (passo 1) ou type de novo; NÃO scroll down no feed (Home/Network/Jobs). NÃO inventar coords antigas.
5. clique em People — tap "People" (aba, y baixo/topo conforme OCR).
6. clique Location — tap "Location" ou "Locatior".
7. clique em Add a location — tap "Add a location"/"Add alocation" (campo do sheet, não o chip).
8. digite campinas — type "Campinas".
9. clique na primeira opção Campinas — tap a sugestão Campinas no sheet (não o campo).
10. clique em Show results — tap "Show results".
11. Connect — tap text EXATO "Connect" se houver no extract.
12. Sem Connect → scroll down; repita desde o 11.
