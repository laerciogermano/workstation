/**
 * Raw decision via chat.completions (same contract as scripts/raw-gpt.js).
 * System/user are sent as JSON (sections = object keys).
 * Return: action with only keys present in the model response.
 */

import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";

/** Default system object (decideFromImage / decideRawAction input). */
export const DEFAULT_SYSTEM = {
  role: "Autonomous AI agent that controls an Android smartphone via the screen-robot lib",
  receives: ["journey", "ocr", "step"],
  response: {
    requiredRoot: { action: {}, nextStep: "…" },
    format: {
      action: {
        type: "tap|scroll|type|key|sleep|done|fail",
        x: null,
        y: null,
        direction: null,
        text: null,
        code: null,
        ms: null,
      },
      reason: null,
      nextStep: null,
    },
    jsonOnly: true,
    omitNull: true,
    forbidActionAtRoot: true,
    nextStepNeverEmpty: true,
  },
  types: {
    tap: "required numeric x and y from current-screen OCR (target center)",
    scroll: "direction up|down|left|right (required; omit x/y)",
    type: "text to type",
    key: "code (e.g. KEYCODE_BACK, KEYCODE_ENTER)",
    sleep: "ms",
    done: "journey finished",
    fail: "only if impossible to continue",
  },
  step: {
    type: "free text (same as nextStep)",
    examples: ["3", "connect", "type buyer", "13", "done"],
    nextStepBecomesNextTurnStep: true,
    ifCompletedAdvance: true,
    ifSleepScrollRetrySameText: true,
    forbidInventingStepOutsideJourney: true,
    afterLastStep: 'nextStep = "13" or "done" (never "")',
  },
  rules: [
    "you are on step … = execute ONLY that step; FORBIDDEN to redo completed steps",
    "nextStep of turn N = step of turn N+1 (copy the value); if completed → advance; sleep/scroll/retry → same text",
    'nextStep is REQUIRED and non-empty; FORBIDDEN "" / null',
    "tap.x / tap.y = EXCLUSIVELY from a hit in the current OCR; inventing or reusing other coords is forbidden",
    "Every OCR item (text/icon) is tappable",
    "No target for the step → sleep or scroll; avoid fail",
    "Single JSON object in the response: { action, nextStep }",
  ],
};

/** Default user rules (user.rules section). */
export const DEFAULT_USER_RULES = [
  "Choose the next action from the OCR and the journey",
  "In every action, put in reason which step (1–12) is in progress",
  "Mandatory order 1→X (X=last step). One action per turn",
  'After completing the last step, nextStep = "13" or "done" (never empty string)',
  "Tap only texts or icons present on the screen now",
  "FORBIDDEN fail if the current step text is on screen",
  "fail only if impossible after retry; past failures do NOT block a new tap",
];

/** @deprecated use DEFAULT_USER_RULES */
export const DEFAULT_USER_REGRAS = DEFAULT_USER_RULES;

/**
 * Build the user object sent to the model (sections = keys).
 * @param {{
 *   journey?: string,
 *   jornada?: string,
 *   prompt?: string,
 *   ocr?: unknown,
 *   step?: string|null,
 *   rules?: string[],
 *   regras?: string[],
 *   [key: string]: unknown,
 * }} opts
 */
export function buildUserInput(opts = {}) {
  const list = Array.isArray(opts.ocr) ? opts.ocr : [];
  const connectOrder = list
    .map((h, i) =>
      h && typeof h === "object" && String(h.text || "") === "Connect"
        ? { i, x: h.x, y: h.y }
        : null,
    )
    .filter(Boolean);

  const stepText =
    opts.step == null || opts.step === ""
      ? undefined
      : String(opts.step).trim() || undefined;

  const {
    journey: _journey,
    jornada: _jornada,
    prompt: _prompt,
    ocr: _ocr,
    step: _step,
    rules: _rules,
    regras: _regras,
    connectOrder: _connect,
    stepInstruction: _si,
    connectInstruction: _ci,
    ...extra
  } = opts;

  /** @type {Record<string, unknown>} */
  const user = {
    journey: opts.journey ?? opts.jornada ?? opts.prompt ?? "",
    ocr: opts.ocr ?? [],
    rules: opts.rules ?? opts.regras ?? DEFAULT_USER_RULES,
    ...extra,
  };
  if (stepText) {
    user.step = stepText;
    user.stepInstruction = `you are on step ${stepText}. Execute ONLY that step. FORBIDDEN to go back to earlier steps (e.g. on 2 do NOT tap Search; type instead).`;
  }
  if (connectOrder.length >= 1) {
    user.connectOrder = connectOrder;
    user.connectInstruction = `Connect buttons top to bottom. On step 11 tap ONLY the first: ${JSON.stringify(connectOrder[0])}`;
  }
  return user;
}

/** @deprecated use buildUserInput + JSON.stringify */
export function buildUserText(prompt, ocr, step) {
  return JSON.stringify(buildUserInput({ prompt, ocr, step }));
}

/** @deprecated use DEFAULT_SYSTEM + JSON.stringify */
export const SYSTEM_PROMPT = JSON.stringify(DEFAULT_SYSTEM);

/**
 * Parse action (+ nextStep at root) from model JSON: only present keys (no invented nulls).
 * Accepts nextStep; falls back to proximoPasso for older replies.
 * @param {string} content
 * @returns {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, nextStep?: string }}
 */
export function parseActionTypeXY(content) {
  const data = JSON.parse(String(content || ""));
  if (!data || typeof data !== "object" || !("action" in data)) {
    const err = new Error('raw-gpt: response must be { "action": ... }');
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  const a = data.action;
  if (!a || typeof a !== "object") {
    const err = new Error("raw-gpt: missing action");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  const type = String(a.type || "").toLowerCase();
  if (!type) {
    const err = new Error("raw-gpt: empty action.type");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  /** @type {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, nextStep?: string }} */
  const out = { type };
  if (a.x != null && a.x !== "") {
    const x = Number(a.x);
    if (Number.isFinite(x)) out.x = x;
  }
  if (a.y != null && a.y !== "") {
    const y = Number(a.y);
    if (Number.isFinite(y)) out.y = y;
  }
  if (a.direction != null && a.direction !== "") {
    out.direction = String(a.direction).toLowerCase();
  }
  if (a.text != null && a.text !== "") out.text = String(a.text);
  if (a.code != null && a.code !== "") out.code = String(a.code);
  if (a.ms != null && a.ms !== "") {
    const ms = Number(a.ms);
    if (Number.isFinite(ms)) out.ms = ms;
  }
  const nextRaw = data.nextStep ?? data.proximoPasso;
  if (nextRaw != null && nextRaw !== "") {
    const nextStep = String(nextRaw).trim();
    if (nextStep) out.nextStep = nextStep;
  }
  if (type === "scroll" && !out.direction) {
    const err = new Error("raw-gpt: scroll without direction");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  return out;
}

/**
 * @param {{
 *   system?: object,
 *   user?: object,
 *   prompt?: string,
 *   journey?: string,
 *   jornada?: string,
 *   ocr?: unknown,
 *   step?: string|null,
 *   apiKey?: string,
 *   model?: string,
 * }} opts
 */
export async function decideRawAction(opts) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("missing OPENAI_API_KEY");
    err.code = "OPENAI_NO_API_KEY";
    throw err;
  }
  const system = opts.system ?? DEFAULT_SYSTEM;
  if (!system || typeof system !== "object") {
    const err = new Error("missing system (JSON object)");
    err.code = "RAW_GPT_NO_SYSTEM";
    throw err;
  }

  const user = buildUserInput({
    ...(opts.user && typeof opts.user === "object" ? opts.user : {}),
    journey:
      opts.user?.journey ??
      opts.user?.jornada ??
      opts.user?.prompt ??
      opts.journey ??
      opts.jornada ??
      opts.prompt,
    ocr: opts.ocr ?? opts.user?.ocr,
    step: opts.step ?? opts.user?.step,
  });
  if (!String(user.journey || "").trim()) {
    const err = new Error("missing user.journey / prompt");
    err.code = "RAW_GPT_NO_PROMPT";
    throw err;
  }

  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JSON.stringify(system) },
      { role: "user", content: JSON.stringify(user) },
    ],
  };
  // gpt-5* only accepts default temperature; 0 → HTTP 400.
  if (!/^gpt-5/i.test(model)) payload.temperature = 0;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || JSON.stringify(data));
    err.code = "OPENAI_REQUEST_FAILED";
    throw err;
  }
  const raw = String(data.choices?.[0]?.message?.content ?? "");
  console.log({ raw });
  return { ...parseActionTypeXY(raw), raw, payload, system, user };
}

/**
 * extractFromImage → compactOcr → decideRawAction.
 * Input: system/user as JSON objects (sections = keys); OCR filled here.
 * @param {{
 *   imagePath: string,
 *   system?: object,
 *   user?: object,
 *   prompt?: string,
 *   journey?: string,
 *   jornada?: string,
 *   step?: string|null,
 *   apiKey?: string,
 *   model?: string,
 *   engine?: string,
 *   timeoutMs?: number,
 * }} opts
 * @returns {Promise<{
 *   action: { type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number },
 *   nextStep?: string,
 *   ocr: object[],
 *   elements: object[],
 *   raw?: string,
 *   payload?: object,
 *   system?: object,
 *   user?: object,
 * }>}
 */
export async function decideFromImage(opts) {
  const imagePath = opts.imagePath;
  if (!imagePath) {
    const err = new Error("missing imagePath");
    err.code = "RAW_GPT_NO_IMAGE";
    throw err;
  }
  const system = opts.system ?? DEFAULT_SYSTEM;
  if (!system || typeof system !== "object") {
    const err = new Error("missing system (JSON object)");
    err.code = "RAW_GPT_NO_SYSTEM";
    throw err;
  }
  const engine = opts.engine || process.env.SCREEN_ROBOT_OCR || "all";
  const timeoutMs =
    opts.timeoutMs ?? Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000);
  const elements = await extractFromImage(imagePath, { engine, timeoutMs });
  const ocr = compactOcr(elements);
  const out = await decideRawAction({
    system,
    user: opts.user,
    prompt: opts.prompt,
    journey: opts.journey ?? opts.jornada,
    ocr,
    step: opts.step,
    apiKey: opts.apiKey,
    model: opts.model,
  });
  const { raw, payload, nextStep, system: sys, user, ...action } = out;
  return {
    action,
    nextStep,
    ocr,
    elements,
    raw,
    payload,
    system: sys,
    user,
  };
}
