import type { Snapshot, UserDto } from "@flow/shared";

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly issues?: { path: string; message: string }[]) { super(message); }
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch("/api/v1" + url, {
    method, credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? "error", e.message ?? "Erro inesperado", e.issues);
  }
  return data as T;
}

export type Me = UserDto & { personKey?: string };
export interface MutationResult<R = unknown> { snapshot: Snapshot; result: R }
export interface ProjectListItem { id: string; name: string; updatedAt: string; functions: number }
export interface ExportResult { format: string; fileName: string; code: string; blocked: boolean; missing: { name: string; element: string }[]; orphans: { name: string; element: string }[] }
export interface ConsoleLine { kind: "cmd" | "out" | "ok" | "er" | "dim"; text: string }

export const api = {
  me: () => req<{ user: Me }>("GET", "/auth/me"),
  guest: (key?: string) => req<{ user: Me }>("POST", "/auth/guest", key ? { key } : {}),
  login: (b: { email: string; password: string }) => req<{ user: Me }>("POST", "/auth/login", b),
  register: (b: { email: string; password: string; name: string }) => req<{ user: Me }>("POST", "/auth/register", b),
  logout: () => req<void>("POST", "/auth/logout"),
  projects: () => req<{ projects: ProjectListItem[] }>("GET", "/projects"),
  createProject: (b: { name: string; demo: boolean }) => req<{ id: string }>("POST", "/projects", b),
  deleteProject: (id: string) => req<void>("DELETE", `/projects/${id}`),
  snapshot: (id: string) => req<{ snapshot: Snapshot }>("GET", `/projects/${id}`),
  post: <R = unknown>(p: string, url: string, body?: unknown) => req<MutationResult<R>>("POST", `/projects/${p}${url}`, body ?? {}),
  patch: <R = unknown>(p: string, url: string, body: unknown) => req<MutationResult<R>>("PATCH", `/projects/${p}${url}`, body),
  put: <R = unknown>(p: string, url: string, body: unknown) => req<MutationResult<R>>("PUT", `/projects/${p}${url}`, body),
  del: <R = unknown>(p: string, url: string) => req<MutationResult<R>>("DELETE", `/projects/${p}${url}`),
  run: (p: string, plan: string) => req<{ started: number; snapshot: Snapshot }>("POST", `/projects/${p}/plans/${plan}/run`, {}),
  cancel: (p: string, plan: string) => req<{ cancelled: number; snapshot: Snapshot }>("POST", `/projects/${p}/plans/${plan}/cancel`, {}),
  retry: (p: string, el: string) => req<{ snapshot: Snapshot }>("POST", `/projects/${p}/elements/${el}/retry`, {}),
  complete: (p: string, el: string) => req<{ snapshot: Snapshot }>("POST", `/projects/${p}/elements/${el}/complete`, {}),
  runMachine: (p: string, el: string, code: string) => req<{ lines: ConsoleLine[]; snapshot?: import("@flow/shared").Snapshot }>("POST", `/projects/${p}/elements/${el}/run-machine`, { code }),
  exportPlan: (p: string, plan: string, format: string) => req<ExportResult>("GET", `/projects/${p}/plans/${plan}/export?format=${format}`),
};
