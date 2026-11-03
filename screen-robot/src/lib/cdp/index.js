/**
 * LinkedIn actions via Chrome CDP (human-cdp).
 * Mesmas funções exportadas que as libs AVD em `src/lib/linkedin-*.js`,
 * com `serial` substituído por `page` | `cdpId` | `cdpUrl`.
 */
export { resolveLinkedInPage, withLinkedInPage, humanCdp } from "./session.js";
export { connectByLinkedInUrl } from "./linkedin-connect.js";
export { extractRecentConnections } from "./linkedin-extract-connections.js";
export { sendLinkedInMessage } from "./linkedin-message.js";
export { listUnreadMessages } from "./linkedin-unread-messages.js";
export { listProfileMessages } from "./linkedin-profile-messages.js";
export { extractLeads } from "./linkedin-extract-leads.js";
