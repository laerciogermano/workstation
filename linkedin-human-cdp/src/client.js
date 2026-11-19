/**
 * Cliente LinkedIn Human CDP — uma instância por conta/CDP.
 *
 * Métodos = operações dos workers LinkedIn (connect, conexões recentes,
 * mensagem, unread, mensagens do perfil, extract leads / busca).
 *
 * Default: `notifyApi: false` (lib pura). Workers ConnectMax passam
 * `notifyApi: true` / `agentId` quando quiserem persistir.
 */
import { resolveLinkedInPage, withLinkedInPage } from "./session.js";
import { workerOps } from "./worker-bridge.js";

/**
 * @typedef {{
 *   page?: object,
 *   cdpId?: string,
 *   cdpUrl?: string,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   outDir?: string|null,
 *   dryRun?: boolean,
 *   closeBrowser?: boolean,
 *   keepBrowser?: boolean,
 * }} LinkedInHumanCdpOptions
 */

function mergeOpts(base, extra = {}) {
  const notifyApi =
    extra.notifyApi !== undefined
      ? Boolean(extra.notifyApi)
      : base.notifyApi !== undefined
        ? Boolean(base.notifyApi)
        : false;
  return {
    ...base,
    ...extra,
    notifyApi,
    cdpId: extra.cdpId ?? base.cdpId,
    cdpUrl: extra.cdpUrl ?? base.cdpUrl,
    page: extra.page ?? base.page,
    agentId: extra.agentId ?? base.agentId,
    outDir: extra.outDir !== undefined ? extra.outDir : base.outDir,
    dryRun: extra.dryRun ?? base.dryRun,
  };
}

/**
 * @param {LinkedInHumanCdpOptions} [options]
 */
export function createLinkedInHumanCdp(options = {}) {
  const base = {
    cdpId: options.cdpId || process.env.CDP_ID || undefined,
    cdpUrl: options.cdpUrl || process.env.CDP_URL || undefined,
    page: options.page,
    notifyApi: options.notifyApi === true,
    agentId: options.agentId,
    outDir: options.outDir ?? null,
    dryRun: Boolean(options.dryRun),
    closeBrowser: options.closeBrowser,
    keepBrowser: options.keepBrowser,
  };

  if (!base.page && !base.cdpId && !base.cdpUrl) {
    throw new Error(
      "LinkedIn Human CDP: passe cdpId, cdpUrl ou page (ou CDP_ID / CDP_URL)",
    );
  }

  return {
    /** Opções padrão desta instância (somente leitura). */
    get options() {
      return { ...base };
    },

    /**
     * Conectar / aceitar convite / marcar já conectado em um perfil.
     * @param {{ url: string } & LinkedInHumanCdpOptions} opts
     */
    async connect(opts) {
      const ops = await workerOps();
      return ops.connectByLinkedInUrl(mergeOpts(base, opts));
    },

    /**
     * Últimas conexões da conta (lista /mynetwork/invite-connect/connections/).
     * @param {{ n?: number, profileUrl?: string } & LinkedInHumanCdpOptions} [opts]
     */
    async recentConnections(opts = {}) {
      const ops = await workerOps();
      return ops.extractRecentConnections(mergeOpts(base, opts));
    },

    /**
     * Enviar mensagem a um perfil (composer).
     * @param {{ url: string, text: string, clienteLinkedinId?: string } & LinkedInHumanCdpOptions} opts
     */
    async sendMessage(opts) {
      const ops = await workerOps();
      return ops.sendLinkedInMessage(mergeOpts(base, opts));
    },

    /**
     * Lista conversas não lidas.
     * @param {{ maxResults?: number } & LinkedInHumanCdpOptions} [opts]
     */
    async unreadMessages(opts = {}) {
      const ops = await workerOps();
      const maxResults = opts.maxResults ?? opts.max ?? opts.n;
      return ops.listUnreadMessages(
        mergeOpts(base, { ...opts, maxResults }),
      );
    },

    /**
     * Últimas mensagens do chat com um perfil.
     * @param {{ url: string, maxResults?: number } & LinkedInHumanCdpOptions} opts
     */
    async profileMessages(opts) {
      const ops = await workerOps();
      const maxResults = opts.maxResults ?? opts.max ?? opts.n;
      return ops.listProfileMessages(
        mergeOpts(base, { ...opts, maxResults }),
      );
    },

    /**
     * Busca pessoas (People search) e extrai leads da lista.
     * @param {{ query?: string, q?: string, n?: number, maxProfiles?: number } & LinkedInHumanCdpOptions} [opts]
     */
    async searchLeads(opts = {}) {
      const ops = await workerOps();
      return ops.extractLeads(mergeOpts(base, opts));
    },

    /** Alias de `searchLeads` (nome do worker). */
    async extractLeads(opts = {}) {
      const ops = await workerOps();
      return ops.extractLeads(mergeOpts(base, opts));
    },

    /**
     * Abre sessão, roda `fn(page)` e fecha a aba (Chrome fica up).
     * @template T
     * @param {(page: object) => Promise<T>} fn
     * @param {LinkedInHumanCdpOptions} [opts]
     * @returns {Promise<T>}
     */
    async withPage(fn, opts = {}) {
      return withLinkedInPage(mergeOpts(base, opts), fn);
    },

    /**
     * Resolve página sem lifecycle (caller fecha).
     * @param {LinkedInHumanCdpOptions} [opts]
     */
    async resolvePage(opts = {}) {
      return resolveLinkedInPage(mergeOpts(base, opts));
    },
  };
}
