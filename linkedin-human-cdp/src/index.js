/**
 * LinkedIn Human CDP — fachada de operações LinkedIn via human-cdp.
 *
 * @example
 * import { createLinkedInHumanCdp } from '@works/linkedin-human-cdp';
 * const li = createLinkedInHumanCdp({ cdpId: 'marina-costa' });
 * await li.recentConnections({ n: 20 });
 * await li.connect({ url: 'https://www.linkedin.com/in/…' });
 */
export { createLinkedInHumanCdp } from "./client.js";
export {
  withLinkedInPage,
  resolveLinkedInPage,
  humanCdp,
} from "./session.js";
export { workerOps } from "./worker-bridge.js";
