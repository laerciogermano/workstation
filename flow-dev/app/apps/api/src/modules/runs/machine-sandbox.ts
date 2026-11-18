import vm from "node:vm";

export interface ConsoleLine { kind: "cmd" | "out" | "ok" | "er" | "dim"; text: string }

/**
 * Executa o código de uma etapa "biblioteca Node" num sandbox sem rede nem disco real:
 * módulos node:http / node:fs / node:path / node:crypto são simulados e as entradas vêm do state.
 */
export async function runMachine(opts: { title: string; code: string; inputs: Record<string, string | null>; declared: string[] }): Promise<ConsoleLine[]> {
  const lines: ConsoleLine[] = [{ kind: "cmd", text: `$ flow run "${opts.title}"` }];
  const log = (kind: ConsoleLine["kind"], text: string) => { if (lines.length < 200) lines.push({ kind, text: String(text).slice(0, 500) }); };
  const vfs = new Map<string, string>();
  const host = (u: string) => u.replace(/^https?:\/\//, "");
  const http = {
    get: async (url: string) => { log("out", `→ GET ${host(url)} 200`); return { status: 200, body: { id: "env_7f3a91", url } }; },
    post: async (url: string, body?: unknown) => { log("out", `→ POST ${host(url)} 201`); return { status: 201, body: { id: "env_7f3a91", received: typeof body } }; },
  };
  const fs = {
    write: (p: string, data: unknown) => { vfs.set(String(p), String(data)); log("out", `fs.write ${p} (${String(data).length} B)`); },
    exists: (p: string) => vfs.has(String(p)) || String(p).startsWith("out/"),
    copy: (a: string, b: string) => { log("out", `fs.copy ${a} → ${b}`); },
  };
  const path = { join: (...p: string[]) => p.join("/").replace(/\/+/g, "/"), basename: (p: string) => String(p).split("/").pop() ?? "" };
  const cryptoStub = { randomBytes: (n: number) => "x".repeat(Math.min(n, 64)), createHash: () => ({ update: () => ({ digest: () => "0".repeat(64) }) }) };
  const mods: Record<string, Record<string, unknown>> = { http, fs, path, crypto: cryptoStub, console: { log: (...a: unknown[]) => log("out", a.join(" ")) }, stream: {} };
  const binds: Record<string, unknown> = {};
  const body = opts.code.replace(/^\s*import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+["']node:(\w+)["'];?[ \t]*$/gm, (_m, named: string | undefined, def: string | undefined, mod: string) => {
    const stub = mods[mod];
    if (!stub) { log("er", `✗ módulo node:${mod} não suportado no ambiente simulado`); return ""; }
    if (def) binds[def] = stub;
    (named ?? "").split(",").map(s => s.trim()).filter(Boolean).forEach(s => { const [k, alias] = s.split(/\s+as\s+/); binds[(alias ?? k)!] = (stub as Record<string, unknown>)[k!] ?? stub; });
    return "";
  });
  const entrada = new Proxy({} as Record<string, unknown>, {
    get: (_t, k) => {
      if (typeof k !== "string") return undefined;
      if (opts.inputs[k] != null) return opts.inputs[k];
      if (opts.declared.includes(k)) throw new Error(`entrada.${k} sem valor: contexto incompleto`);
      return `<${k}>`;
    },
  });
  const saida: Record<string, unknown> = {};
  const ctx = vm.createContext({ ...binds, console: mods.console, entrada, saida, setTimeout: undefined }, { codeGeneration: { strings: false, wasm: false } });
  try {
    const script = new vm.Script(`(async () => {\n${body}\n})()`, { filename: "etapa.js" });
    const p = script.runInContext(ctx, { timeout: 1000 }) as Promise<unknown>;
    let to: NodeJS.Timeout | undefined;
    await Promise.race([p, new Promise((_, rej) => { to = setTimeout(() => rej(new Error("tempo esgotado (3 s)")), 3000); })]).finally(() => clearTimeout(to));
    Object.entries(saida).forEach(([k, v]) => log("ok", `✓ saida.${k} = ${JSON.stringify(v)}`));
    if (!Object.keys(saida).length) log("ok", "✓ concluída");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("er", `✗ ${msg}`);
    if (/sem valor/.test(msg)) log("dim", "Contexto incompleto. A tarefa não executa.");
  }
  return lines;
}
