/** Args comuns dos CLIs LinkedIn CDP. */
export function parseCdpArgs(argv, { requireUrl = false } = {}) {
  let url = null;
  let text = null;
  let query = null;
  let n = null;
  let maxResults = null;
  let cdpId = process.env.CDP_ID || null;
  let cdpUrl = process.env.CDP_URL || null;
  let dryRun = false;
  let noShot = false;
  let sync = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") url = String(argv[++i] || "").trim();
    else if (a === "--text" || a === "--message") text = String(argv[++i] || "");
    else if (a === "--query" || a === "--q" || a === "--search")
      query = String(argv[++i] || "").trim();
    else if (a === "--n" || a === "-n" || a === "--limit" || a === "--max-profiles")
      n = Number(argv[++i]);
    else if (a === "--max" || a === "--maxResults" || a === "--max-results")
      maxResults = Number(argv[++i]);
    else if (a === "--cdp-id" || a === "--cdpId")
      cdpId = String(argv[++i] || "").trim();
    else if (a === "--cdp-url" || a === "--cdpUrl")
      cdpUrl = String(argv[++i] || "").trim();
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--no-shot") noShot = true;
    else if (a === "--sync") sync = true;
  }
  if (requireUrl && !url) {
    throw new Error("passe --url https://www.linkedin.com/in/…");
  }
  if (!cdpId && !cdpUrl) {
    throw new Error("passe --cdp-id / CDP_ID ou --cdp-url / CDP_URL");
  }
  return {
    url,
    text,
    query,
    n: Number.isFinite(n) ? Math.floor(n) : null,
    maxResults: Number.isFinite(maxResults) ? Math.floor(maxResults) : null,
    cdpId: cdpId || undefined,
    cdpUrl: cdpUrl || undefined,
    dryRun,
    noShot,
    sync,
  };
}
