# MITM log — ASUS_A001D (K7AXB600T8728RG)

- mitmdump `:8080` + `adb reverse` + `settings http_proxy=127.0.0.1:8080`
- flows: `flows-20261122-104103.mitm`
- log: `mitmdump-20261122-104103.log`
- CA no device: `/sdcard/Download/mitmproxy-ca.cer` (instalar em Segurança → Credenciais)
- Parar: `./stop.sh`

Device **sem root** → só tráfego que respeita proxy do sistema.

- Ao vivo no terminal: `./watch.sh`
