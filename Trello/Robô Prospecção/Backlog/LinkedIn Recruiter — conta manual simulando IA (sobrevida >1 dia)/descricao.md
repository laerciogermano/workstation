## Objetivo
Criar uma conta **LinkedIn Recruiter** **manual** e operar **à mão** com o mesmo pacote de características que a automação/IA usaria — para medir se a conta **passa de 1 dia** sem restrição/ban (baseline humano vs robô).

## Contexto
Contas LI via worker/CDP (ex.: Roberto Menezes) caíram rápido após jobs de conectar. Precisamos isolar: o ban vem do **padrão de ação** (volume/ritmo/seletores) ou do **fingerprint/egress/perfil**? Um teste manual “como se fosse a IA” controla o comportamento e o stack.

## Escopo
1. **Criar conta LinkedIn Recruiter manualmente** (mesmo fluxo de lab: e-mail Clozzy/BR Supply, IP novo na lista `used-egress-ips`, Chrome CDP com fingerprint coerente — ou browser real alinhado ao catálogo).
2. **Perfil completo** no padrão dos vendedores (foto, banner, About, experiências, headline) — mesmas características que o robô aplica.
3. **Operar manual** por **>24h**, simulando a IA:
   - mesmas ações típicas do worker (`extrair_leads`, `conectar`, navegação de search/perfil)
   - ritmo humano consciente (pausas, scroll, leitura) mas **mesma sequência e densidades** que o job usaria
   - **sem** `human-cdp` / worker claimando jobs — só operador no Chrome
4. Registrar: IP(s), horário, nº de connects/views, se apareceu challenge/captcha, restrição ou ban e em quanto tempo.
5. Critério de sucesso: conta **ativa** após **>1 dia** de uso no protocolo; se banir antes, anotar gatilho aparente.

## Entrega
- Conta marcada no CSV (`contas-linkedin-clozzy.csv`) + nota no agente (se houver)
- Log curto do experimento (timeline 24h+)
- Conclusão: sobreviveu / não + hipótese (comportamento vs fingerprint/IP vs produto Recruiter)

## Fora de escopo
- Subir worker keep-alive nesta conta durante o teste
- Comparativo A/B em massa (só este piloto)

## Relacionados
- Ban Roberto Menezes (2026-11-06) — `linkedinStatus=banida`
- Workers CDP / janela 07:00–19:00
- Catálogo fingerprint / human-cdp
