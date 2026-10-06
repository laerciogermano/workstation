#!/usr/bin/env node
/**
 * Smoke EP-07 — 1–2 passos no device.
 * Preferência: GEMINI_API_KEY → decide real.
 * Sem key: heurística OCR (Connect → tap; senão scroll) para validar loop+log.
 *
 *   npm run agent:smoke
 *   npm run agent:smoke -- --max-steps 2
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "../lib/agent-run.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function loadSerial() {
  return (
    argValue("--device") ||
    process.env.ANDROID_SERIAL ||
    (() => {
      try {
        const cfg = JSON.parse(
          readFileSync(join(SRC_ROOT, "device.config.json"), "utf8"),
        );
        return cfg.device || cfg.provision?.serial;
      } catch {
        return null;
      }
    })()
  );
}

function loadPrompt() {
  const raw = argValue("--prompt");
  if (raw) {
    const p = resolve(process.cwd(), raw);
    if (existsSync(p)) return readFileSync(p, "utf8");
    return raw;
  }
  const roteiro = resolve(SRC_ROOT, "../roteiros/jornada-comprador.md");
  if (existsSync(roteiro)) {
    return (
      "Execute a jornada a seguir. Em cada passo escolha UMA ação JSON.\n\n" +
      readFileSync(roteiro, "utf8").slice(0, 6000)
    );
  }
  return "Se houver Connect no OCR, tap nele; senão scroll down. Não clique Message.";
}

/** Decide offline: Connect exato → tap; senão scroll. */
async function heuristicDecide({ ocr, history }) {
  if (history?.length >= 1) {
    return {
      resumo: "smoke: um passo já executado",
      acao: { type: "done", motivo: "smoke ok" },
    };
  }
  const connect = (ocr || []).find(
    (e) => String(e.text || "").trim() === "Connect" && e.y > 180 && e.y < 850,
  );
  if (connect) {
    return {
      resumo: "smoke heurística: Connect no OCR",
      acao: {
        type: "tap",
        element: "Connect",
        motivo: "Connect",
      },
    };
  }
  return {
    resumo: "smoke heurística: sem Connect",
    acao: { type: "scroll", direction: "down", motivo: "sem Connect" },
  };
}

const serial = loadSerial();
const maxSteps = Number(argValue("--max-steps", "2"));
const useGemini = Boolean(process.env.GEMINI_API_KEY);
const prompt = loadPrompt();
const logDir = join(SRC_ROOT, "logs", "agent");
const usageDir = join(SRC_ROOT, "usage-2.0");

if (!serial) {
  console.error("falta serial");
  process.exit(2);
}

console.log(
  `smoke-agent serial=${serial} mode=${useGemini ? "gemini" : "heuristic"} maxSteps=${maxSteps}`,
);

const result = await runAgent(
  {
    serial,
    prompt,
    maxSteps,
    engine: "rapidocr",
    logDir,
    usageDir,
    stepDelayMs: 800,
  },
  useGemini ? {} : { decide: heuristicDecide },
);

const first = result.steps[0]?.acao;
const ok =
  first &&
  (first.type === "scroll" ||
    (first.type === "tap" && /connect/i.test(first.motivo || "")));

console.log(
  JSON.stringify(
    {
      status: result.status,
      mode: useGemini ? "gemini" : "heuristic",
      firstAction: first,
      steps: result.steps.length,
      logPath: result.logPath,
      usagePath: result.usagePath,
      usage: result.usage,
      accepted: Boolean(ok),
    },
    null,
    2,
  ),
);

if (!ok) process.exit(1);
process.exit(0);
