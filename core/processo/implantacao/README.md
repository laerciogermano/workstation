# Implantação

Publicar a versão no ambiente alvo.

## Entradas

- Build / artefato aprovado nos testes
- Notas de release e checklist de go-live
- Configuração e segredos do ambiente
- Plano de rollback

## Execução

- Gerar build e preparar release
- Aplicar migrações e configuração
- Deploy (staging → produção)
- Validar smoke pós-deploy
- Comunicar o release; acionar rollback se necessário

## Saídas

- Versão publicada no ambiente alvo
- Notas de release
- Evidência de smoke / go-live
- Próximo passo: manutenção
