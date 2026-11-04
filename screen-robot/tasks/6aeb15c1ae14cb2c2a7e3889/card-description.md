## Objetivo
Antes de **qualquer execução** de worker/operação, comparar o IP de egress atual com o **último IP** gravado da execução anterior. Se for **igual**, **não executar**: matar/abortar na hora e marcar falha com motivo explícito de IP repetido.

## Problema
Operações consecutivas no mesmo egress aumentam risco (LinkedIn/anti-bot). Hoje não há guarda central que impeça job novo no mesmo IP do job anterior.

## Comportamento
1. **Guardar** o último IP usado (arquivo/estado compartilhado — ex. último job concluído ou abortado após checagem).
2. No **início** de cada execução (qualquer worker / qualquer operação): obter IP atual (`ipify` ou equivalente) **uma vez**.
3. Se `IP atual == último IP` → **abortar** imediatamente (não claimar/não rodar handlers); falha com mensagem clara, ex.: `falha: IP igual ao último IP (<ip>)`.
4. Se diferente → seguir execução normalmente; ao avançar, **atualizar** o último IP para o atual.
5. **Não** ficar fazendo poll contínuo de IP durante a operação — só a checagem de entrada (+ persistência do último).

## Escopo
1. Persistência do último IP (local do lab / worker host — formato simples e documentado)
2. Hook no ponto comum de start de job/operação (worker AVD e/ou CDP, o que for o entrypoint real)
3. Motivo de falha padronizado e visível no log / complete/fail da API
4. Docs: onde grava, como resetar o último IP (caminho inverso), quando a guarda dispara

## Fora de escopo
- Monitoramento contínuo / loop de IP enquanto o job roda
- Troca automática de VPN/proxy
- Histórico longo de IPs (só o **último** importa)
- Bloquear por IP já usado em contas CSV (outra regra); aqui é só **último vs atual**

## Aceite
- Job A com IP X conclui → grava X
- Job B inicia ainda com egress X → aborta sem executar; falha cita IP igual ao último
- Troca egress para Y → Job C roda; último vira Y
- Sem processo paralelo “checando IP o tempo todo”
