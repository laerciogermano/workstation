# 022 — Identidade visual “Estrela macia”

| Campo | Valor |
|-------|--------|
| Data | 2026-11-11 |
| Origem | Chat (2 mensagens) |

## Prompt original

```text
gostei  bastante do estrela macia, crie um documento de idendiade visual contendo ele como icone e variacoes dele com circulos em volta no estilo clozzy/marca/logo-carregando o arco, mas a estrela deixe essa macia do tamanho da estrela central do logo carregando, so substitua a estrela e crie variacoes de com a estrela e sem circulo e com a estrela e com circulo, mostre a utilizacao da logo nos diferentes temas existentes, nunca mais use creme e nem aquele tom escuro substituindo o preto, use preto e branco mesmo
```

```text
e coloque um pequeno ponto na parte superior direita da estrela como se tivesse indicando o buraquinno da camera
```

## Interpretação

- Ícone = a Estrela macia (glifo 01 da rodada 15) sozinha; símbolo = a mesma estrela dentro do anel do logo-carregando, no tamanho da estrela central dele (círculo r 22). Só a estrela muda; o anel fica.
- Variações de anel no estilo do arco do carregando: carregando, três traços, arco aberto, anel cheio, segmentos, carregando grosso.
- Ponto da câmera: círculo pequeno no vão entre a ponta de cima e a da direita (−60°), separado da estrela.
- Utilização nos seis temas do protótipo mobile.
- Preto `#000` e branco `#fff` de verdade; sem creme e sem quase-preto (ink).

## Entrega

- [`marca/identidade-estrela-macia/`](../marca/identidade-estrela-macia/README.md): PDF/HTML de 11 páginas, 85 SVGs, geradores.

## Ajustes

```text
coloque o ponto um pouco mais distante da estrela
```

```text
deixe um pouc mais distante e represente isso em todas as aparicoes
```

O ponto da câmera foi de 1,06 para 1,18 e depois para **1,30 R** do centro da estrela (mesmo ângulo −60° e mesmo raio 0,14 R). A estrela vem de uma função só (`macia()` em `_marca.py`), então a mudança vale em todas as aparições: ícone, símbolo, corte pequeno, lockups, ícones de app, os seis temas, o loader e os 85 SVGs. O único lugar sem ponto é o exemplo “Tirar o ponto da câmera” em “Não fazer”.

```text
diminua so um pouco o tamanho da estrela
```

Estrela ~8% menor em todas as versões: dentro do anel, círculo r 22 → **20**; corte pequeno 23,5 → 21,6; ícone sozinho 44 → **40,5**. O ponto da câmera acompanha (continua a 1,30 R, raio 0,14 R).
