# Clozzy — Variações do logo v2 (rodada 13 v2)

Mesmas 12 variações da [rodada 13](../logo-variacoes/README.md), com duas mudanças:

1. **07 Disco:** a estrela branca ficou menor (R × 0,74, de ≈ 18,3 para ≈ 13,5 no grid 100), então sobra mais disco em volta. A constante é `DISCO_STAR` em [`_variacoes.py`](_variacoes.py).
2. **Seção nova de utilizações (págs. 10–16)** com o **07 Disco**, o **04 Crescente** e o **06 Giro**. Cada um tem duas páginas:
   - **No app:** tela inicial, splash, notificação na tela bloqueada, favicon na aba, tiles rosa/preto/roxo, 32–16 px e o lockup.
   - **Na rede e na marca:** perfil com destaques e posts, story, um uso próprio da forma, ecobag e adesivos.

| Símbolo | Uso próprio da forma |
|---|---|
| 07 Disco | Botão “Assinar close”, selo “Close friends” e marca ao lado do nome |
| 04 Crescente | Anel de story em volta da foto: rosa = close novo, cream = visto |
| 06 Giro | Loading (gira no HTML), quadros de 0/90/180/270° e o selo “AO VIVO” |

| Arquivo | O que é |
|---|---|
| [`variacoes-logo-clozzy-v2.pdf`](variacoes-logo-clozzy-v2.pdf) · `.html` | 16 páginas: as 9 da rodada 13 e mais 7 de utilizações. No HTML, o Giro anima |
| `svg/` | Os mesmos 192 SVGs da rodada 13, agora com o disco novo |
| [`_variacoes.py`](_variacoes.py) · [`_usos.py`](_usos.py) · [`_build.py`](_build.py) | Geradores: geometria · seção de utilizações · documento |

Os nomes nos mockups (marina, joão, ana) são fictícios.

```bash
cd clozzy/marca/logo-variacoes-v2
python3 _variacoes.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-variacoes-v2
```
