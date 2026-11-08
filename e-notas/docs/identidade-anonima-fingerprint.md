# Identidade anônima por fingerprint (notinhas)

Uso do app **sem conta**. O visitante entra e opera; o identificador temporário é o **fingerprint do navegador**, enviado em toda operação e gravado na base. Ao criar conta, os dados desse fingerprint são **vinculados** ao usuário.

Relacionado: [REQ-050](requisitos.md#req-050--identidade-anônima-por-fingerprint-2026-11-08) · [REQ-034](requisitos.md) (entrada anônima) · [REQ-036](requisitos.md) (onboarding sem conta).

## Princípio

| Estado | Identificador | Onde vive o dado pessoal/de sessão |
|--------|---------------|-------------------------------------|
| Sem conta | Fingerprint do browser | Banco (`fingerprint` / visitante) — **não** depende de localStorage como fonte de verdade |
| Com conta | `usuario_id` (sessão autenticada) | Mesmas tabelas, agora ligadas ao usuário |

localStorage pode cachear UX (preferências, UI); **não** é o inventário de notas, cestas, vínculos etc. Esses registros vão para a API com o fingerprint.

## Cliente

1. Na primeira carga (ou quando ainda não houver conta), calcular fingerprint estável do navegador.
2. Em **toda** chamada de API que crie ou altere dado do visitante, enviar o fingerprint (header dedicado, ex. `X-Client-Fingerprint`, ou campo acordado no body — um contrato só).
3. Com sessão autenticada: fingerprint pode continuar sendo enviado para auditoria/anti-abuso, mas a **posse** dos dados passa a ser `usuario_id`.

## Servidor

1. Rotas de uso anônimo aceitam fingerprint válido (formato/tamanho); sem login obrigatório.
2. Persistência: colunas/`visitante_id` derivadas do fingerprint (hash do fingerprint no server, se não quiser guardar o valor cru).
3. Operações do visitante: depósito de nota (**Minhas notas**), **Minhas listas**, preferências, etc. associadas a esse id anônimo (REQ-051).
4. Índice público de preços continua anonimizado (ADR / LGPD); fingerprint identifica o **titular privado** do extrato/cestas, não vaza no catálogo público.

## Criar conta → merge

1. Usuário cria conta (e-mail/senha ou fluxo equivalente) **ainda no mesmo browser** (mesmo fingerprint).
2. Transação:
   - criar `usuarios` + sessão;
   - localizar registros com aquele fingerprint / visitante;
   - **vincular** ao `usuario_id` (setar FK; limpar ou arquivar o fingerprint como dono ativo);
   - a partir daí, APIs usam a sessão; novos dados não ficam órfãos no fingerprint.
3. Se já existir conta e o login ocorrer no mesmo fingerprint com dados anônimos pendentes: oferecer merge (default: anexar ao usuário logado, sem duplicar chaves de nota).
4. Fingerprint em outro device **não** traz o histórico anônimo automaticamente (só o que já estava naquele browser/DB daquele fingerprint).

## Modelo (esboço)

```text
visitantes (ou coluna fingerprint_hash em tabelas de posse)
  id | fingerprint_hash | created_at | merged_usuario_id | merged_at

notas / cestas / preferencias / …
  usuario_id NULL
  visitante_id NULL   -- um dos dois preenchido enquanto “dono” privado
```

Detalhe de schema fica em `beta-docs/05-modelo-de-dados.md` na implementação (BETA auth).

## Fora de escopo deste doc

- Algoritmo exato de fingerprint (biblioteca / sinais).
- Conta obrigatória para avaliação etc. (já em REQ-034).
- LGPD de exclusão de conta (BETA-505 / doc 10) — merge e exclusão precisam coexistir.

## Rollback

Remover regra REQ-050 e este doc; voltar a exigir login ou manter só localStorage sem id de servidor (comportamento pré-fingerprint).
