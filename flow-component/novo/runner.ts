/**
 * Executar o fluxo no PRÓPRIO navegador: o JavaScript gerado roda num Web Worker (não trava a página e pode ser parado),
 * com um `console` próprio cujas mensagens aparecem no terminal.
 * As funções abaixo são autossuficientes de propósito: o texto delas é o que vai para dentro do Worker.
 */
export type LogLevel = "log" | "info" | "warn" | "error" | "debug" | "table" | "system";
export type RunEvent =
  | { type: "log"; level: LogLevel; text: string; t: number }
  | { type: "done"; ms: number }
  | { type: "error"; message: string; ms: number };

/** Um valor como o console do navegador mostra (texto puro, objetos em JSON indentado). */
export function formatValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  if (typeof v === "function") return `[Function ${v.name || "anonymous"}]`;
  if (typeof v === "bigint") return `${v}n`;
  if (v instanceof Error) return v.stack || `${v.name}: ${v.message}`;
  if (v && typeof v === "object") {
    try { return JSON.stringify(v, (_k, x) => (typeof x === "function" ? `[Function ${x.name || "anonymous"}]` : typeof x === "bigint" ? `${x}n` : x), 2) ?? String(v); } catch { return String(v); }
  }
  return String(v);
}
export function formatArgs(args: unknown[]): string { return args.map(formatValue).join(" "); }
/** `console.table`: linhas = itens (ou chaves), colunas = campos. */
export function formatTable(data: unknown): string {
  if (!data || typeof data !== "object") return formatValue(data);
  const rows = Array.isArray(data) ? data.map((v, i) => [String(i), v] as const) : Object.entries(data as Record<string, unknown>);
  const cols: string[] = []; let plain = false;
  for (const [, v] of rows) { if (v && typeof v === "object" && !Array.isArray(v)) { for (const k of Object.keys(v)) if (!cols.includes(k)) cols.push(k); } else plain = true; }
  const head = ["(index)", ...cols, ...(plain ? ["Value"] : [])];
  const body = rows.map(([k, v]) => { const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null; return [k, ...cols.map(c => (o && c in o ? formatValue(o[c]) : "")), ...(plain ? [o ? "" : formatValue(v)] : [])]; });
  const w = head.map((h, i) => Math.max(h.length, ...body.map(r => (r[i] ?? "").length)));
  const line = (r: string[]): string => `│ ${r.map((c, i) => c.padEnd(w[i]!)).join(" │ ")} │`, bar = (l: string, m: string, r: string): string => `${l}${w.map(n => "─".repeat(n + 2)).join(m)}${r}`;
  return [bar("┌", "┬", "┐"), line(head), bar("├", "┼", "┤"), ...body.map(line), bar("└", "┴", "┘")].join("\n");
}
/** Roda o código (corpo de função assíncrona) com um `console` que emite eventos; usado dentro do Worker e nos testes. */
export async function execute(code: string, emit: (e: RunEvent) => void, now: () => number = () => Date.now()): Promise<void> {
  const t0 = now(), AsyncFunction = Object.getPrototypeOf(async function () { /* só para pegar o construtor */ }).constructor as new (...a: string[]) => (...a: unknown[]) => Promise<unknown>;
  const mk = (level: LogLevel) => (...args: unknown[]): void => emit({ type: "log", level, text: formatArgs(args), t: now() - t0 });
  const con = { log: mk("log"), info: mk("info"), warn: mk("warn"), error: mk("error"), debug: mk("debug"), table: (d: unknown): void => emit({ type: "log", level: "table", text: formatTable(d), t: now() - t0 }) };
  try { await new AsyncFunction("console", code)(con); emit({ type: "done", ms: now() - t0 }); }
  catch (err) { emit({ type: "error", message: err instanceof Error ? err.stack || `${err.name}: ${err.message}` : String(err), ms: now() - t0 }); }
}

/** O programa do Worker: as funções acima + o recebimento do código. */
export const workerSource = (): string => [formatValue, formatArgs, formatTable, execute].map(f => f.toString()).join("\n") + "\nself.onmessage = e => { execute(e.data.code, ev => self.postMessage(ev)); };";

export interface Running { stop(): void }
/** Executa o JavaScript num Worker; `onEvent` recebe logs, o fim ou o erro. `stop()` encerra na hora. */
export function runInWorker(code: string, onEvent: (e: RunEvent) => void): Running {
  const url = URL.createObjectURL(new Blob([workerSource()], { type: "text/javascript" })), w = new Worker(url); let over = false; const t0 = Date.now();
  const end = (): void => { over = true; w.terminate(); URL.revokeObjectURL(url); };
  /** O que o fluxo imprime também vai para o console do DevTools da página (só o texto, como foi logado). */
  const mirror = (e: RunEvent): void => {
    if (e.type === "log") { const fn = e.level === "table" || e.level === "system" ? console.log : console[e.level]; fn.call(console, e.text); }
    else if (e.type === "error") console.error(e.message);
  };
  w.onmessage = (e: MessageEvent<RunEvent>) => { if (over) return; mirror(e.data); onEvent(e.data); if (e.data.type !== "log") end(); };
  w.onerror = (e: ErrorEvent) => { if (over) return; onEvent({ type: "error", message: e.message || "Worker error", ms: Date.now() - t0 }); end(); };
  w.postMessage({ code });
  return { stop: () => { if (over) return; end(); const ev: RunEvent = { type: "error", message: "Execution stopped", ms: Date.now() - t0 }; mirror(ev); onEvent(ev); } };
}
