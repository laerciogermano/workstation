/** `linkedin.com/in/slug` → URL canônica. */
export function normalizeLinkedInProfileUrl(raw: string): string | null {
  // Slug pode ter acento (share sheet UI); [A-Za-z0-9] cortava em "débora" → "/in/d".
  const m = String(raw || '').match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\s/?#]+)/i,
  );
  if (!m) return null;
  let slug = m[1].replace(/[.,;:!?)\]}>'"]+$/g, '');
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* keep */
  }
  if (!slug) return null;
  return `https://www.linkedin.com/in/${slug}`;
}

/** Trecho final do slug: `923870410` ou `6bb660189`. */
export function isLinkedInSlugId(part: string): boolean {
  const p = String(part || '').trim();
  if (!p) return false;
  if (/^\d{5,}$/.test(p)) return true;
  return (
    p.length >= 6 &&
    p.length <= 14 &&
    /[0-9]/.test(p) &&
    /^[a-z0-9]+$/i.test(p)
  );
}

/** slug da URL → nome provisório (hífens → Title Case; só tira id estrutural). */
export function stubNameFromLinkedInUrl(profileUrl: string): string {
  const m = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = decodeURIComponent(m?.[1] || '').replace(/\/$/, '');
  if (!slug) return 'linkedin';
  const parts = slug.split('-').filter(Boolean);
  while (parts.length && isLinkedInSlugId(parts[parts.length - 1])) {
    parts.pop();
  }
  if (parts.length >= 2) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ')
      .slice(0, 200);
  }
  return (parts[0] || slug).slice(0, 200);
}

/** Nome parece stub gerado do slug? (ex. "Bruno Toyomoto") — ok sobrescrever com OCR. */
export function looksLikeSlugStubName(nome: string, profileUrl: string | null): boolean {
  if (!profileUrl || !nome) return false;
  const stub = stubNameFromLinkedInUrl(profileUrl)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const n = String(nome)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return Boolean(stub && n && (n === stub || stub.startsWith(n) || n.startsWith(stub)));
}
