#!/usr/bin/env node
/**
 * Lista IDs de GET /profiles priorizados por riqueza de campos
 * (title/city/current pesam mais) e sem detail já salvo.
 *
 * Uso:
 *   PROFILES_API_URL=http://localhost:3000 node scripts/queue-profile-details-by-richness.js > /tmp/profile-detail-queue.txt
 */
const API = (process.env.PROFILES_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const WEIGHTS = {
  title: 3,
  city: 3,
  current: 2,
  past: 1,
  mutualConnections: 1,
  level: 1,
  connection: 1,
};

function filled(v) {
  const s = String(v ?? "").trim();
  return Boolean(s) && s !== "-";
}

function score(p) {
  let s = 0;
  for (const [f, w] of Object.entries(WEIGHTS)) {
    if (filled(p[f])) s += w;
  }
  return s;
}

async function main() {
  const [profilesRes, detailsRes] = await Promise.all([
    fetch(`${API}/profiles`),
    fetch(`${API}/profile-details`),
  ]);
  if (!profilesRes.ok) throw new Error(`GET /profiles ${profilesRes.status}`);
  if (!detailsRes.ok) throw new Error(`GET /profile-details ${detailsRes.status}`);
  const profilesBody = await profilesRes.json();
  const detailsBody = await detailsRes.json();
  const list = Array.isArray(profilesBody?.data)
    ? profilesBody.data
    : Array.isArray(profilesBody)
      ? profilesBody
      : [];
  const details = Array.isArray(detailsBody?.data)
    ? detailsBody.data
    : Array.isArray(detailsBody)
      ? detailsBody
      : [];
  const done = new Set(details.map((d) => d.profileId).filter(Boolean));

  const pending = list
    .filter((p) => p?.id && !done.has(p.id))
    .map((p) => ({ p, s: score(p) }))
    .sort(
      (a, b) =>
        b.s - a.s ||
        String(a.p.name || "").localeCompare(String(b.p.name || "")),
    );

  for (const { p, s } of pending) {
    console.log(`${p.id}\t${p.name || ""}\t${s}`);
  }
  console.error(
    `queue ${pending.length} (skip ${done.size} com detail) topScore=${pending[0]?.s ?? "-"}`,
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
