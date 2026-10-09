# Estudo — memória e custo do docker-avd

Data: **2026-10-07**. Objetivo: medir quanto RAM um AVD Docker (Google Play) consome e projetar custo por device em host com nested KVM.

Relacionado: [`README.md`](README.md) · postmortem redroid → AVD: [`../../postmortem.md`](../../postmortem.md)

---

## 1. Premissas e método

| Item | Valor |
|------|--------|
| Imagem | `us-docker.pkg.dev/android-emulator-268719/images/28-playstore-x64-no-metrics:30.1.2` |
| Guest | API 28, x86_64, Google Play (`Physical RAM size: 4096MB` no log do emulator) |
| Medida | `docker stats` (MEM USAGE) após boot; baseline `free -h` |
| Cotação usada nas projeções | ≈ **R$ 5,00 / US$** (07/10/2026) |

Comandos (host Linux + `/dev/kvm`):

```bash
docker run -d --name avd-mem-test --privileged \
  --device /dev/kvm \
  -p 127.0.0.1:5655:5555 \
  us-docker.pkg.dev/android-emulator-268719/images/28-playstore-x64-no-metrics:30.1.2

docker stats --no-stream avd-mem-test
free -h
```

---

## 2. Hosts testados

| Host | Produto | `/dev/kvm` | `vmx`/`svm` | Resultado |
|------|---------|------------|-------------|-----------|
| Contabo Cloud VPS (`vmi3645318`, ~12 GB) | Core/Performance VPS | Não | 0 | Emulator aborta: *x86_64 emulation currently requires hardware acceleration* |
| Contabo Cloud VDS (`vmi3645369`, **24 GB**, IP `185.250.37.82`) | Max Performance / VDS | Sim | 6 | Boot OK com KVM |

**Conclusão Contabo:** nested KVM só em **VDS (Max Performance)** ou **Dedicated**. Cloud VPS (Core/Performance) **não** serve para docker-avd. Doc: [Contabo nested virt](https://contabo.com/blog/kb/103000271595-can-i-setup-nested-virtualization-on-my-server/).

---

## 3. Medição (VDS 24 GB)

### Timeline

| Momento | MEM USAGE | CPU | Notas |
|---------|-----------|-----|--------|
| Logo após `docker run` | ~5,6 MiB | baixo | Container up, QEMU ainda não alocou |
| Mid-boot | ~1,7 GiB | ~450% | Ainda subindo |
| Pós-boot (apps/GMS) | **~6,5 GiB** | ~500% | `BOOT_COMPLETED` no logcat; Play/GMS ativos |

### Snapshot final anotado

```text
CONTAINER   MEM USAGE              MEM %    CPU %
avd-mem-test   6.532GiB / 23.47GiB   27.83%   497.75%

Mem host: total 23Gi  used 4.3Gi  available 19Gi  buff/cache 9.9Gi
```

- **Número de planejamento (container):** **~6,5 GiB / device**
- Host `used` pode parecer menor (cache/page); use **docker stats** para custo do AVD
- ADB `unauthorized` sem `ADBKEY` — esperado; não invalida a medida de RAM
- Guest declara 4 GB; RSS real do container (Play + GMS + 1º boot) ficou **acima** disso

### Hipóteses vs medido

| Hipótese anterior | Medido |
|-------------------|--------|
| 3 GB / device | Baixo demais |
| 4 GB / device | Ainda otimista para idle/boot com Play |
| **~6–7 GB / device** | **Alinhado ao teste** |

---

## 4. Capacidade no VDS 24 GB

Com **~6,5 GiB / device**:

| Reserva host | Devices | Observação |
|--------------|---------|------------|
| 0 | 24 ÷ 6,5 ≈ **3** | Aperto; CPU também limita |
| ~4 GB OS/Docker | (24−4) ÷ 6,5 ≈ **3** | Realista |
| Folga / LinkedIn em uso | **2** | Mais seguro |

CPU do VDS S (6 cores): 1 AVD no boot usou ~5 cores — multi-device exige olhar CPU, não só RAM.

---

## 5. Custo por device (projeções)

### 5.1 Plano usado no estudo: 24 GB / US$ 59

≈ **R$ 295 / mês**

| Premissa RAM/device | Devices | R$/device/mês |
|--------------------|---------|----------------|
| 3 GB (hipótese) | 6–8 | ~R$ 37–49 |
| 4 GB (hipótese) | 5–6 | ~R$ 49–59 |
| **~6,5 GB (medido)** | **2–3** | **~R$ 100–150** |

### 5.2 Contabo Cloud VDS (lista pública, 24 meses + VAT, ≈ US$)

| Plano | RAM | Preço/mês | Devices @6,5 GB* | R$/device/mês† |
|-------|-----|-----------|------------------|---------------|
| VDS S | 24 GB | ~$39–59 | 2–3 | ~R$ 65–150 |
| VDS M | 32 GB | ~$50 | ~4 | ~R$ 62 |
| VDS L | 48 GB | ~$70 | ~6 | ~R$ 58 |
| VDS XL | 64 GB | ~$94 | ~9 | ~R$ 52 |
| VDS XXL | 96 GB | ~$139 | ~14 | ~R$ 50 |

\* `(RAM − 4 GB) ÷ 6,5` arredondado para baixo.  
† dólar ≈ R$ 5. Preços de lista mudam; conferir [Contabo pricing](https://contabo.com/en/pricing/).

### 5.3 AWS (nested virt em EC2 virtual, 2026)

Nested KVM em famílias `c7i/c8i`, `m7i/m8i`, `r7i/r8i` (+ flex); flag `NestedVirtualization=enabled`. Sem custo extra pela flag.

| Instância | Specs | On-demand us-east-1 | ~mês | ~R$/mês | Serve 1 AVD @6,5 GB? |
|-----------|-------|---------------------|------|---------|----------------------|
| `c7i-flex.large` (menor com nested) | 2 vCPU / 4 GiB | ~$0,085/h | ~$62 | ~R$ 310 | Não |
| `m7i.large` | 2 vCPU / 8 GiB | ~$0,101/h | ~$74 | ~R$ 370 | Apertado |
| `m7i.xlarge` | 4 vCPU / 16 GiB | ~$0,202/h | ~$147 | ~R$ 735 | Sim (1 device) |

**AWS vs Contabo VDS:** por device, Contabo VDS cheio fica bem mais barato (~R$ 50–150) que 1 EC2 mínimo útil (~R$ 370+).

---

## 6. Alternativas sem KVM

| Runtime | Sem KVM? | GMS/Play | Uso no produto |
|---------|----------|----------|----------------|
| docker-avd (este POC) | Não | Sim | Alvo Linux |
| redroid | Sim | Não (útil) | Legado — UI branca em apps de loja |
| Emulador software (TCG) | Em teoria | — | Inviável / número inválido |

Ver [`../../postmortem.md`](../../postmortem.md).

---

## 7. Conclusões

1. **docker-avd exige nested KVM** — Contabo VPS comum falha; VDS/Dedicated ok.
2. **RAM real medida ≈ 6,5 GiB / AVD** (imagem Play 28, 1º boot com GMS).
3. Em **24 GB**: planejar **2–3 devices**, não 6–8.
4. Custo Contabo VDS 24 GB @ US$ 59: **~R$ 100–150 / device / mês**.
5. Hipóteses 3–4 GB/device superestimam densidade; revalidar após idle estável e com LinkedIn aberto.
6. Mac continua canônico (`kind: "avd"`); docker-avd é opcional Linux+KVM.

---

## 8. Próximos passos (medição)

1. Esperar idle (CPU < ~50%) e repetir `docker stats`.
2. Instalar LinkedIn x86_64 e medir pico.
3. Subir 2º container e ver se RAM escala linear.
4. Opcional: `ADBKEY` para `adb` autorizado (não necessário só para RAM).

**Rollback do teste:** `docker rm -f avd-mem-test`
