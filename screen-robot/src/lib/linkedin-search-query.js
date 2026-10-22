/**
 * Termos curtos p/ busca LinkedIn (detail) a partir do card da lista.
 */

export function sanitizeSearchText(raw) {
  return String(raw || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/%[0-9A-Fa-f]{2}/g, " ")
    .replace(/%/g, " ")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstWords(text, n = 1) {
  const parts = sanitizeSearchText(text).split(/\s+/).filter(Boolean);
  return parts.slice(0, n).join(" ");
}

/**
 * searchQuery persistido no card: 1ª palavra do title, senão cargo de current.
 */
export function searchQueryFromCard(fields) {
  const direct = firstWords(fields?.title, 1);
  if (direct) return direct;
  const current = String(fields?.current || "").trim();
  if (!current) return "";
  return firstWords(current.split(/\s+(?:at|@)\s+/i)[0], 1);
}

/** 1ª palavra da cidade. */
export function cityFirstWord(city) {
  return firstWords(city, 1);
}

/**
 * Query digitada no detail: nome + searchQuery + 1ª palavra cidade.
 * Fallback: 1ª palavra do title/current se searchQuery vazio.
 */
export function typeQueryFromProfile(profile) {
  const name = sanitizeSearchText(profile?.name);
  if (!name) throw new Error("perfil sem name");
  const term =
    firstWords(profile?.searchQuery, 1) || searchQueryFromCard(profile);
  let city = cityFirstWord(profile?.city);
  if (city && term && city.toLowerCase() === term.toLowerCase()) city = "";
  return [name, term, city]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
