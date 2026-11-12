# ADR-0007 · Proximidade por Haversine em SQL e mapa estilizado

- Status: aceito · 2026-11-09 · RF-47, RN-20

## Decisão
Distância calculada em SQL (Haversine) com índice em `(lat, lng)` e raio de 25 km; sem PostGIS. O mapa é o SVG estilizado do protótipo, com pins projetados por lat/lng reais em relação à posição do usuário. Sem GPS, só busca textual.

## Consequências
+ Zero dependência externa e sem enviar a localização a terceiros.
− Sem ruas reais; migrar para PostGIS + tiles quando o catálogo passar de alguns milhares de academias.
