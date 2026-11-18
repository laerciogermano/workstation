export const slug = (t: string): string =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const slugFile = (t: string): string => slug(t).replace(/_/g, "-");
export const camel = (t: string): string => slug(t).replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
/** Nome de função = verbo no infinitivo (Comprar celular, Enviar proposta). */
export const isVerbTitle = (t: string): boolean => {
  const w = String(t).trim().split(/\s+/)[0]!.toLowerCase().replace(/-(se|lo|la|los|las)$/, "");
  return /(ar|er|ir|or|ôr)$/.test(w) && w.length > 2;
};

/** Tasks padrão por nome de lib Node (métodos). Usado no seed e como fallback se `agent.tasks` vier vazio. */
export const DEFAULT_LIB_TASKS: Record<string, string[]> = {
  "node:http": ["get", "post", "request", "createServer", "put", "patch", "delete", "head"],
  "node:fs": ["readFile", "writeFile", "copyFile", "mkdir", "readdir", "unlink", "rename", "appendFile", "stat"],
  "node:path": ["join", "resolve", "basename", "dirname", "extname", "parse", "format"],
  "node:crypto": ["randomBytes", "createHash", "createHmac", "randomUUID"],
  "node:stream": ["pipeline", "finished", "Readable", "Writable", "Transform"],
  "node:console": ["log", "info", "warn", "error", "debug", "table", "clear"],
};

export const agentTasksOf = (a: { name: string; kind: string; tasks?: string[] | null } | null | undefined): string[] => {
  if (!a) return [];
  if (a.tasks?.length) return a.tasks;
  if (a.kind === "maquina") return DEFAULT_LIB_TASKS[a.name] ?? [];
  return [];
};
