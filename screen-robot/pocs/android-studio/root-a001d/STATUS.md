# Root ASUS_A001D — bloqueado

**Serial:** K7AXB600T8728RG · Android 9 · WW_Phone-16.14.2009.319

## Tentativa (2026-11-22)

| Check | Resultado |
|---|---|
| `sys.oem_unlock_allowed` | `0` |
| `fastboot getvar unlocked` | `no` |
| `fastboot flashing get_unlock_ability` | `0` |
| `fastboot oem unlock` | `FAILED (remote: unknown command)` |
| `fastboot flashing unlock` | `FAILED (remote: unknown command)` |
| Toggle OEM nas Dev Options | inexistente / busca “OEM” vazia |

## Causa

Bootloader ASUS deste modelo **não** aceita unlock AOSP via fastboot. O caminho histórico era o **Unlock Device App** da ASUS (servidor). Em ago/2023 a ASUS removeu a ferramenta/servidores — unlock oficial offline.

Sem unlock → não dá pra flashar TWRP/Magisk com segurança.

## Caminhos possíveis

1. Outro device com unlock nativo (Pixel, etc.) ou AVD `userdebug`/`Google APIs` + `adb root`
2. Se aparecer unlock community específico A001D ainda funcional (raro pós-2023) — avaliar com cuidado
3. Não force EDL/firehose sem guia confiável do modelo — alto risco de brick

## Rollback deste teste

Só rebootou em fastboot e voltou; **nenhum flash** foi feito. Dados intactos.
