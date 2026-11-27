// Cliente HTTP fino. Tipos espelham as respostas da API.

export type ListSummary = {
  id: string;
  name: string;
  contactCount: number;
  suppressedCount: number;
  createdAt: string;
};

export type Contact = { id: string; email: string; name: string | null; isSuppressed: boolean; createdAt: string };
export type ContactsPage = { items: Contact[]; total: number; page: number; pageSize: number };

export type ImportResult = {
  added: number;
  alreadyInList: number;
  duplicatesInInput: number;
  invalid: { line: number; content: string }[];
  invalidCount: number;
};

export type CampaignStatus = 'draft' | 'sending' | 'sent';
export type Progress = { total: number; pending: number; sending: number; sent: number; failed: number; skipped: number; opened: number };

export type RecipientFilter = 'all' | 'opened' | 'not_opened';
export type Recipient = {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';
  sentAt: string | null;
  openedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
};
export type RecipientsPage = { items: Recipient[]; total: number; page: number; pageSize: number };

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  list: { id: string; name: string } | null;
  status: CampaignStatus;
  progress: Progress;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: { field: string; message: string }[] | undefined;

  constructor(status: number, code: string, message: string, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? 'Algo deu errado.', err?.details);
  }
  return data as T;
}

export const api = {
  me: () => request<{ email: string }>('GET', '/auth/me'),
  login: (email: string, password: string) => request<{ email: string }>('POST', '/auth/login', { email, password }),
  logout: () => request<void>('POST', '/auth/logout'),

  lists: () => request<ListSummary[]>('GET', '/lists'),
  list: (id: string) => request<ListSummary>('GET', `/lists/${id}`),
  createList: (name: string) => request<ListSummary>('POST', '/lists', { name }),
  renameList: (id: string, name: string) => request<ListSummary>('PATCH', `/lists/${id}`, { name }),
  deleteList: (id: string) => request<void>('DELETE', `/lists/${id}`),
  contacts: (id: string, page: number, search: string) =>
    request<ContactsPage>('GET', `/lists/${id}/contacts?${new URLSearchParams({ page: String(page), ...(search ? { search } : {}) })}`),
  addContact: (id: string, email: string, name: string) =>
    request<{ added: number }>('POST', `/lists/${id}/contacts`, { email, name }),
  importContacts: (id: string, text: string) => request<ImportResult>('POST', `/lists/${id}/contacts/import`, { text }),
  deleteContact: (listId: string, contactId: string) => request<void>('DELETE', `/lists/${listId}/contacts/${contactId}`),

  campaigns: () => request<Campaign[]>('GET', '/campaigns'),
  campaign: (id: string) => request<Campaign>('GET', `/campaigns/${id}`),
  recipients: (id: string, page: number, filter: RecipientFilter) =>
    request<RecipientsPage>('GET', `/campaigns/${id}/recipients?${new URLSearchParams({ page: String(page), filter })}`),
  createCampaign: (name: string) => request<Campaign>('POST', '/campaigns', { name }),
  updateCampaign: (id: string, patch: { name?: string; subject?: string; bodyHtml?: string; listId?: string | null }) =>
    request<Campaign>('PATCH', `/campaigns/${id}`, patch),
  deleteCampaign: (id: string) => request<void>('DELETE', `/campaigns/${id}`),
  sendCampaign: (id: string) => request<Campaign>('POST', `/campaigns/${id}/send`),
};
