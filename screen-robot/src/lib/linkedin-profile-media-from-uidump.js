/**
 * Bounds de capa / foto do perfil a partir do uiautomator dump
 * (content-desc "Cover photo" / "Profile photo").
 */

function decodeXmlText(raw) {
  return String(raw || "")
    .replace(/&#10;/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * @param {string} nodeTag
 * @returns {{ left: number, top: number, width: number, height: number, label: string }|null}
 */
function boundsFromNode(nodeTag) {
  const n = String(nodeTag || "");
  const text = decodeXmlText((n.match(/\btext="([^"]*)"/) || [])[1] || "");
  const desc = decodeXmlText(
    (n.match(/content-desc="([^"]*)"/) || [])[1] || "",
  );
  const label = text || desc;
  const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!b || !label) return null;
  const left = Number(b[1]);
  const top = Number(b[2]);
  const right = Number(b[3]);
  const bottom = Number(b[4]);
  const width = right - left;
  const height = bottom - top;
  if (width < 8 || height < 8) return null;
  return { left, top, width, height, label };
}

/** Tamanho do hierarchy (dump) para escalar vs PNG. */
export function dumpScreenSizeFromUiXml(xml) {
  const root = String(xml || "").match(
    /<hierarchy\b[^>]*\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/,
  );
  if (root) {
    return {
      width: Number(root[3]) - Number(root[1]),
      height: Number(root[4]) - Number(root[2]),
    };
  }
  let maxR = 0;
  let maxB = 0;
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    maxR = Math.max(maxR, Number(b[3]));
    maxB = Math.max(maxB, Number(b[4]));
  }
  if (maxR > 0 && maxB > 0) return { width: maxR, height: maxB };
  return null;
}

/**
 * @param {string} xml
 * @returns {{
 *   cover: { left: number, top: number, width: number, height: number }|null,
 *   photo: { left: number, top: number, width: number, height: number }|null,
 *   dumpSize: { width: number, height: number }|null,
 * }}
 */
export function parseProfileMediaBoundsFromUiXml(xml) {
  /** @type {{ left: number, top: number, width: number, height: number }|null} */
  let cover = null;
  /** @type {{ left: number, top: number, width: number, height: number }|null} */
  let photo = null;

  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const box = boundsFromNode(n);
    if (!box) continue;
    const lab = box.label;
    if (/^cover photo$/i.test(lab) && !cover) {
      cover = {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      };
    } else if (/^profile photo$/i.test(lab) && !photo) {
      photo = {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      };
    }
  }

  return {
    cover,
    photo,
    dumpSize: dumpScreenSizeFromUiXml(xml),
  };
}
