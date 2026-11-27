# Simulações de cor — estilo “Viva o rolê”

Os seis posts de [`../image copy.png`](<../image copy.png>) repetidos em 24 combinações. Layout e texto são os mesmos; só a cor muda. Nenhuma está aprovada.

| Arquivo | O que é |
|---|---|
| [`combinacoes-de-cores.pdf`](combinacoes-de-cores.pdf) · `.html` | 29 págs.: 4 comparativos, 1 página por combinação e 3 finalistas |
| `01-…` a `24-…` | Os posts de cada combinação, PNG 1080 × 1080 |
| `_build.py` | Gerador; as paletas estão em `USADAS` e `NOVAS` |

- **01–12:** cores já usadas nos documentos da marca (o branco e o texto escuro derivado do fundo entram como apoio).
- **13–24:** combinações com cores novas.
- Finalistas sugeridos: **13**, **01** e **10**.

Valem as pendências do [documento principal](../README.md): lettering e foto de origem a confirmar, fotos Pexels só para uso interno, eventos fictícios.

```bash
cd role-go/marca/estilo-viva-o-role/combinacoes && python3 -B _build.py          # tudo
python3 -B _build.py --so-pdf                                                    # só o documento
```
