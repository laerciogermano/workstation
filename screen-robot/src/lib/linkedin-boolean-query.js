/**
 * Query booleana LinkedIn a partir de um perfil extraído (profiles.json).
 */

/** Empresa a partir de `current` ("Cargo at Empresa"). */
export function companyFromCurrent(current) {
  const s = String(current || "").trim();
  if (!s) return null;
  const m = s.match(/\bat\s+(.+)$/i);
  const company = (m ? m[1] : s).trim();
  return company || null;
}

/**
 * `"Nome" AND "Empresa"` ou só `"Nome"`.
 * @param {{ name?: string, current?: string }} profile
 */
export function booleanQueryForProfile(profile) {
  const name = String(profile?.name || "").trim();
  if (!name) throw new Error("perfil sem name");
  const company = companyFromCurrent(profile.current);
  if (company && company.toLowerCase() !== name.toLowerCase()) {
    return `"${name}" AND "${company}"`;
  }
  return `"${name}"`;
}
